import { helperCatalog } from './hospitalityConfig.js?v=v31-5d872fe24674';
import { phase4Balance, specialTypes } from './phase4Config.js?v=v31-5d872fe24674';
import { customers } from './data.js?v=v31-5d872fe24674';
import { finalGuestProfiles } from './finalGuestProfiles.js?v=v31-5d872fe24674';
import { finalStaffProfiles } from './finalStaffProfiles.js?v=v31-5d872fe24674';
const guestMilestones = [[1, 8], [5, 18], [10, 32], [15, 48], [20, 65], [25, 82], [30, 100]];
const staffMilestones = [[1, 0], [3, 3], [5, 8], [10, 16], [15, 25], [20, 34], [25, 43], [30, 50]];
function count(level, points) { let previous = points[0]; for (const next of points.slice(1)) {
    if (level < next[0])
        return Math.floor(previous[1] + (next[1] - previous[1]) * (Math.max(previous[0], level) - previous[0]) / (next[0] - previous[0]));
    previous = next;
} return previous[1]; }
export const renewalStaffCount = (level) => count(level, staffMilestones);
export const renewalGuestCount = (level) => count(level, guestMilestones);
// Event actors remain event actors: this ordering never spawns decorative customers.
const extras = ['helper-tip', 'helper-florist', 'special-gourmand', 'helper-influencer', 'helper-supplier', 'special-regular', 'helper-patissier', 'helper-repair', 'special-vip', 'special-hurried', 'helper-grandma', 'helper-critic', 'special-spender', 'helper-traveler', 'helper-lucky', 'helper-judge'];
export const renewalGuestOrder = (() => { const normal = [...customers.map(c => c.customerId), ...finalGuestProfiles.map(c => c.id)], out = []; normal.forEach((id, i) => { out.push(id); if (i >= 8 && (i - 8) % 5 === 0 && extras.length > out.filter(x => extras.includes(x)).length)
    out.push(extras[out.filter(x => extras.includes(x)).length]); }); for (const id of extras)
    if (!out.includes(id))
        out.push(id); return out; })();
export function renewalGuestAllowed(id, level, state) { const index = renewalGuestOrder.indexOf(id); if (index >= 0 && index < renewalGuestCount(level))
    return true; if (state.origin !== 'legacy')
    return false; const old = customers.find(c => c.customerId === id)?.unlockCafeLevel ?? finalGuestProfiles.find(c => c.id === id)?.unlockLevel ?? (id === 'helper-judge' ? 4 : helperCatalog.find(h => 'helper-' + h.id === id)?.unlock) ?? (specialTypes.some(t => 'special-' + t === id) ? phase4Balance.rules[id.slice(8)].unlock : undefined); return old !== undefined && old <= state.legacyLevel; }
export function renewalStaffAllowed(id, level, state) { const index = Number(id.replace('staff-', '')) - 1; if (!Number.isInteger(index) || index < 0 || index >= 50)
    return false; if (index < renewalStaffCount(level))
    return true; return state.origin === 'legacy' && (index < 12 ? state.legacyLevel >= 4 : (finalStaffProfiles.find(p => p.id === id)?.unlockLevel ?? 31) <= state.legacyLevel); }
export const renewalActorUnlockRows = () => Array.from({ length: 30 }, (_, i) => ({ level: i + 1, guests: renewalGuestCount(i + 1), staffCandidates: renewalStaffCount(i + 1) }));
export function renewalPreferredRole(id) { const n = Number(id.slice(6)); return n <= 6 ? 'floor' : n <= 8 ? 'kitchen' : n <= 11 ? 'logistics' : n === 12 ? 'vip' : finalStaffProfiles.find(p => p.id === id)?.role ?? 'floor'; }
export const renewalActorLevel = (kind, id) => { const index = kind === 'guest' ? renewalGuestOrder.indexOf(id) : Number(id.slice(6)) - 1; if (index < 0)
    return null; return Array.from({ length: 30 }, (_, i) => i + 1).find(l => index < (kind === 'guest' ? renewalGuestCount(l) : renewalStaffCount(l))) ?? null; };
