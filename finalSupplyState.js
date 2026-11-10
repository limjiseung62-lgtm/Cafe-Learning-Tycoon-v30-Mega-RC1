export const finalRoles = ['floor', 'kitchen', 'logistics', 'vip', 'zone-manager'];
export const newSupplyState = () => ({ version: 1, serial: 0, stations: {}, jobs: [], moved: 0, consumed: 0, history: [] });
const integer = (v, max = 1e12) => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max, point = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= 512 && p.y <= 768;
const menu = (s) => typeof s === 'string' && /^[a-z][a-z0-9-]{0,60}$/.test(s), id = (s) => typeof s === 'string' && /^[-_a-zA-Z0-9]{1,60}$/.test(s);
export function validAssignments(v) { try {
    return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length <= 51 && Object.entries(v).every(([key, a]) => /^(owner|staff-[0-9]{1,3})$/.test(key) && finalRoles.includes(a.role) && ['all', 'main', 'bakery', 'kitchen', 'dessert', 'vip', 'garden', 'terrace', 'event'].includes(a.zone) && (a.home === undefined || point(a.home)) && (a.locked === undefined || typeof a.locked === 'boolean') && (a.pending === undefined || finalRoles.includes(a.pending.role) && ['all', 'main', 'bakery', 'kitchen', 'dessert', 'vip', 'garden', 'terrace', 'event'].includes(a.pending.zone) && (a.pending.home === undefined || point(a.pending.home))));
}
catch {
    return false;
} }
export function validSupply(v) { try {
    const s = v;
    return !!s && s.version === 1 && integer(s.serial) && integer(s.moved) && integer(s.consumed) && !!s.stations && typeof s.stations === 'object' && !Array.isArray(s.stations) && Object.keys(s.stations).length <= 24 && Object.entries(s.stations).every(([key, a]) => id(key) && a && typeof a.stock === 'object' && !Array.isArray(a.stock) && Object.keys(a.stock).length <= 30 && Object.entries(a.stock).every(([k, n]) => menu(k) && integer(n, 320)) && (a.recall === undefined || typeof a.recall === 'boolean')) && Array.isArray(s.jobs) && s.jobs.length <= 25 && new Set(s.jobs.map(j => j.id)).size === s.jobs.length && new Set(s.jobs.map(j => j.workerId)).size === s.jobs.length && s.jobs.every(j => id(j.id) && /^staff-[0-9]{1,3}$/.test(j.workerId) && Object.hasOwn(s.stations, j.stationId) && typeof j.reverse === 'boolean' && ['pickup', 'loading', 'delivery', 'unloading'].includes(j.phase) && typeof j.loaded === 'boolean' && j.loaded === ['delivery', 'unloading'].includes(j.phase) && Number.isFinite(j.elapsed) && j.elapsed >= 0 && Array.isArray(j.items) && j.items.length > 0 && j.items.length <= 20 && j.items.every(menu) && point(j.from) && point(j.to)) && Array.isArray(s.history) && s.history.length <= 64 && s.history.every(h => id(h.id) && id(h.stationId) && typeof h.reverse === 'boolean' && integer(h.count, 20));
}
catch {
    return false;
} }
/** Validate physical ownership and conserved per-menu warehouse totals, not just JSON shape. */
export function validSupplyContext(s, fixtures, menus, capacity) { if (!s)
    return true; if (!validSupply(s))
    return false; const ids = menus.map(m => m.id), physical = new Set(fixtures.map(f => f.id)); if (Object.entries(s.stations).some(([id, a]) => !physical.has(id) && Object.values(a.stock).some(n => n > 0) || Object.keys(a.stock).some(id => !ids.includes(id))) || s.jobs.some(j => !physical.has(j.stationId) || j.items.some(id => !ids.includes(id))))
    return false; return menus.every(m => m.stock + Object.values(s.stations).reduce((n, a) => n + (a.stock[m.id] ?? 0), 0) + s.jobs.filter(j => j.loaded).reduce((n, j) => n + j.items.filter(id => id === m.id).length, 0) <= capacity); }
