import { levelOperatingSeats, levelFloorSeats } from './levelSeatPolicy.js?v=v31-final-636a93f6f215';
import { tableSeatCount } from './megaInventory.js?v=v31-final-636a93f6f215';
/** Purchased furniture, floor ownership and level permission remain independent. */
export { levelOperatingSeats, levelFloorSeats } from './levelSeatPolicy.js?v=v31-final-636a93f6f215';
export function growthSeats(level, mega, branch) { if (!mega?.extended || !mega.paid || !mega.inventory)
    return null; const plan = Object.values(mega.plans).find(p => p.level === mega.paid.spaceLevel && (p.branch ?? undefined) === branch); const installed = plan?.tables.reduce((n, t) => n + tableSeatCount(t), 0) ?? 0, permission = levelOperatingSeats[Math.max(0, Math.min(29, level - 1))], floor = levelFloorSeats[mega.paid.spaceLevel] ?? 4; return { installed, permission, floor, operating: Math.min(installed, permission, floor), concurrent: Math.min(80, installed, permission, floor), next: levelOperatingSeats[level] ?? null }; }
