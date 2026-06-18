# MiniNotes — Projet de sécurisation (Jour 5)

Application Next.js/TypeScript volontairement vulnérable, auditée et sécurisée dans le cadre du projet final du module de Secure Coding.

## Option choisie
Option B — Application inconnue (MiniNotes)

## Stack
- Next.js 16 / TypeScript
- alasql (moteur SQL en mémoire)
- bcryptjs, Zod

## Lancer l'app
```bash
npm install
npm run dev
```
Ouvrir http://localhost:3000

## Rapport de sécurité
Voir [RAPPORT.md](./RAPPORT.md) — inventaire des 13 failles, correctifs avec preuves avant/après, durcissement CI/CD.

## CI/CD
Pipeline GitHub Actions : ESLint + npm audit + Semgrep (règle maison anti-injection SQL). Branch protection active sur `main` — merge impossible si CI rouge.
