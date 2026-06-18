type Entree = { count: number; resetAt: number };
const seau = new Map<string, Entree>();

const MAX = 5;
const FENETRE_MS = 60_000;

export function autoriser(cle: string): boolean {
  const maintenant = Date.now();
  const e = seau.get(cle);

  if (!e || maintenant > e.resetAt) {
    seau.set(cle, { count: 1, resetAt: maintenant + FENETRE_MS });
    return true;
  }
  if (e.count >= MAX) return false;
  e.count++;
  return true;
}
