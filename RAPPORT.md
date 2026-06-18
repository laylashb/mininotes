# Rapport de sécurité — MiniNotes

## 1. Périmètre & méthode

**Application** : MiniNotes (Option B) — mini gestionnaire de notes personnelles en Next.js/TypeScript avec moteur SQL en mémoire (alasql).

**Outils utilisés** :
- ESLint + eslint-plugin-security + react/no-danger (SAST léger)
- npm audit --audit-level=high (SCA)
- Semgrep avec ruleset auto + règle maison regles/sqli.yml (SAST)
- Revue manuelle du code source
- Tests d'exploitation avec curl (attaques manuelles)

**Méthode** : audit initial (outils + lecture manuelle) → inventaire des failles → correctifs par ordre de gravité (cause racine, pas le symptôme) → preuve avant/après pour chaque faille → durcissement (CI/CD, en-têtes, secrets, deps).

**Résultat des outils automatiques** : ESLint a détecté 1 faille sur 13 (le XSS). npm audit et Semgrep "auto" n'ont rien détecté de bloquant — ce qui confirme que les injections SQL par concaténation, l'IDOR et le CSRF nécessitent une revue humaine.

## 2. Failles trouvées (inventaire)

| # | Faille | Fichier | OWASP | Gravité CVSS |
|---|--------|---------|-------|---------------|
| 1 | Injection SQL — bypass du login | app/api/login/route.ts | A03 | Critique |
| 2 | Injection SQL — via cookie de session | app/api/notes/route.ts (GET) | A03 | Critique |
| 3 | Injection SQL — création de note | app/api/notes/route.ts (POST) | A03 | Critique |
| 4 | Mots de passe en clair | lib/sqldb.ts | A02 | Élevé |
| 5 | IDOR — lecture d'une note d'un autre utilisateur | app/api/notes/[id]/route.ts | A01 | Élevé |
| 6 | XSS stocké (dangerouslySetInnerHTML) | app/commentaires/page.tsx | A03 | Élevé |
| 7 | Secret en dur dans le code | lib/config.ts | A05 | Élevé |
| 8 | Fuite de données (réponse complète avec password) | app/api/login/route.ts | A01/A02 | Moyen |
| 9 | CSRF — changement d'email sans jeton | app/api/profil/route.ts | A01 | Moyen |
| 10 | Cookie de session volable (httpOnly:false) | app/api/login/route.ts | A07 | Moyen |
| 11 | Aucune validation des entrées | app/api/notes/route.ts (POST) | A03/A04 | Moyen |
| 12 | Pas de limite de tentatives (brute force) | app/api/login/route.ts | A07 | Moyen |
| 13 | Message d'erreur trop précis (énumération) | app/api/login/route.ts | A07 | Faible |


## 3. Correctifs (cause racine + preuves)

### Failles 1, 2, 3 — Injection SQL (A03 — Critique)

**Problème** : les variables utilisateur étaient collées directement dans les requêtes SQL via des template literals (`${email}`, `${sessionId}`, `${titre}`). Un attaquant peut injecter du SQL arbitraire.

**Correctif** : requêtes paramétrées (`?`) sur toutes les routes concernées.

**Preuve AVANT** :
curl -s -X POST http://localhost:3000/api/login 

-H "Content-Type: application/json" 

 -d '{"email":"admin@mininotes.test''' --","password":"peu importe"}'

→ {"message":"Connecté","user":{"id":3,"email":"admin@mininotes.test","password":"admin","role":"admin"}}


**Preuve APRÈS** :
→ {"error":"Requête invalide"} (400) — Zod bloque avant même d'atteindre la base


### Faille 4 — Mots de passe en clair (A02 — Élevé)

**Problème** : les mots de passe étaient stockés en clair dans la base (`azerty123`, `admin`...). Si la base fuit, tous les comptes sont compromis.

**Correctif** : hachage bcrypt (salage + lenteur volontaire). Les mots de passe du seed remplacés par leurs hash (`$2b$10$...`). Vérification au login via `bcrypt.compare`.

### Faille 5 — IDOR (A01 — Élevé)

**Problème** : la route `/api/notes/[id]` renvoyait n'importe quelle note sans vérifier à qui elle appartenait.

**Correctif** : `SELECT * FROM notes WHERE id = ? AND userId = ?` — la note n'est renvoyée que si elle appartient à l'utilisateur connecté.

**Preuve AVANT** :
curl -s -b alice.txt http://localhost:3000/api/notes/3

→ {"note":{"id":3,"userId":3,"titre":"Codes admin","contenu":"le code du coffre est 4271"}}

**Preuve APRÈS** :
→ {"error":"Note introuvable"} (404)

### Faille 6 — XSS stocké (A03 — Élevé)

**Problème** : `dangerouslySetInnerHTML={{ __html: c.html }}` injectait du HTML brut dans la page, permettant l'exécution de JavaScript malveillant.

**Correctif** : remplacement par `{c.html}` — React échappe automatiquement le contenu.

**Preuve APRÈS** : le payload `<img src=x onerror=alert(1)>` s'affiche comme texte brut, aucune alerte.

### Faille 7 — Secret en dur (A05 — Élevé)

**Problème** : `SESSION_SECRET` était écrit en dur dans `lib/config.ts` et commité dans Git. Un bot peut le scanner.

**Correctif** : déplacé dans `.env.local` (gitignoré) + `process.env.SESSION_SECRET` dans le code + `.env.example` comme documentation.

### Faille 8 — Fuite de données (A01/A02 — Moyen)

**Problème** : la réponse du login contenait l'objet user complet (password + role).

**Correctif** : ne renvoyer que `{ id, email, role }`, jamais le hash.

### Faille 9 — CSRF (A01 — Moyen)

**Problème** : `/api/profil` changeait l'email avec uniquement le cookie de session — exploitable par un site pirate.

**Correctif** : double-submit cookie — un jeton aléatoire (`randomUUID`) posé en cookie et exigé en header `X-CSRF-Token`.

**Preuve AVANT** :
curl -s -b s.txt -X POST http://localhost:3000/api/profil 

-H "Content-Type: application/json" -d '{"email":"pirate@evil.test"}'

→ {"message":"Email du compte 1 changé en pirate@evil.test"}

**Preuve APRÈS** :
→ {"error":"Jeton CSRF invalide"} (403)

### Faille 10 — Cookie non sécurisé (A07 — Moyen)

**Problème** : `httpOnly: false` rendait le cookie lisible en JavaScript — volable par XSS.

**Correctif** : `httpOnly: true`, `secure: true` (prod), `sameSite: "lax"`.

### Faille 11 — Aucune validation (A03/A04 — Moyen)

**Problème** : le POST des notes acceptait n'importe quel JSON.

**Correctif** : validation Zod (`noteSchema`) avec `titre: z.string().min(1).max(120)` et `contenu: z.string().max(5000)`.

### Faille 12 — Brute force (A07 — Moyen)

**Problème** : aucune limite de tentatives de connexion.

**Correctif** : rate limiting en mémoire (5 tentatives/minute par IP+email → 429).

**Preuve APRÈS** :
[123456] -> 401

[password] -> 401

[admin] -> 200

[azerty] -> 401

[motdepasse] -> 401

[root] -> 429

[letmein] -> 429


### Faille 13 — Message bavard (A07 — Faible)

**Problème** : le message d'erreur révélait si l'email existait.

**Correctif** : message neutre "Email ou mot de passe invalide" dans tous les cas.

## 4. Durcissement

### Secrets
- `.env.local` créé et gitignoré (vérifié : `git check-ignore .env.local`)
- `.env.example` commité comme documentation
- `SESSION_SECRET` lu via `process.env.SESSION_SECRET`

### En-têtes de sécurité HTTP
Ajoutés dans `next.config.ts` :
- `Content-Security-Policy` — limite les sources autorisées
- `X-Frame-Options: DENY` — anti-clickjacking
- `X-Content-Type-Options: nosniff` — anti MIME-sniffing
- `Referrer-Policy` — limite les infos de provenance
- `Strict-Transport-Security` — force HTTPS en prod

### Pipeline CI bloquant
- Workflow `security.yml` : ESLint + npm audit + Semgrep à chaque push/PR
- Règle Semgrep maison (`regles/sqli.yml`) pour détecter les injections SQL
- Branch protection sur `main` : merge impossible si CI rouge
- **Preuve** : PR de démo avec injection réintroduite → Semgrep rouge → merge bloqué

### Dépendances
- `npm audit --audit-level=high` : aucune faille high/critical
- Dependabot configuré (npm + github-actions, hebdomadaire)

## 5. Limites & ce qui reste à faire

- **Rate limiting** : compteur en mémoire remis à zéro au redémarrage. En prod → Upstash/Redis.
- **bcrypt** : seed de démo avec hash en dur. En prod → inscription avec hash dynamique.
- **CSRF** : jeton en mémoire (pas persisté). En prod → store partagé.
- **Pas de 2FA** : un second facteur renforcerait l'authentification.
- **DOMPurify** : si des commentaires HTML riches sont nécessaires, utiliser DOMPurify au lieu de tout échapper.
- **RLS Supabase** : en prod, le contrôle d'accès (IDOR) serait renforcé au niveau de la base avec des Row Level Security policies.
