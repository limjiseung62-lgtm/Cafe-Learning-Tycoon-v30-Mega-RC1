import { tableSeatCount } from './megaInventory.js?v=level-seats-83d02b666a1c';
/** Purchased furniture, floor ownership and level permission remain independent. */
export const levelOperatingSeats = [4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 23, 26, 30, 34, 38, 42, 46, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const floorSeats = { 1: 4, 4: 15, 10: 30, 20: 75, 30: 100 };
export function growthSeats(level, mega, branch) { if (!mega?.extended || !mega.paid || !mega.inventory)
    return null; const plan = Object.values(mega.plans).find(p => p.level === mega.paid.spaceLevel && (p.branch ?? undefined) === branch); const installed = plan?.tables.reduce((n, t) => n + tableSeatCount(t), 0) ?? 0, permission = levelOperatingSeats[Math.max(0, Math.min(29, level - 1))], floor = floorSeats[mega.paid.spaceLevel] ?? 4; return { installed, permission, floor, operating: Math.min(installed, permission, floor), next: levelOperatingSeats[level] ?? null }; }
