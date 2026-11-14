import { renewalPreferredRole } from './renewalRosterPolicy.js';
import { educationLevel } from './staffEducation.js';
import { finalProfile } from './recruitConfig.js';
import { finalSpecializationFor } from './finalSpecialization.js';
import { ensureMegaPlan, megaPickups, megaRoute, megaPointClear, megaAllPickups, toTile } from './megaSpace.js';
import { megaZones } from './megaZones.js';
import { newSupplyState } from './finalSupplyState.js';
export const hasFinalSupply = (g) => g.mode === 'CAFE_GROWTH' && !!g.mega?.finalGrowth;
export function supplyState(g) { return g.mega.finalGrowth.supply ??= newSupplyState(); }
const sum = (items, id) => items.filter(x => x === id).length;
export function outsideKitchenStock(g, id) { if (!hasFinalSupply(g))
    return 0; const s = g.mega.finalGrowth.supply; return s ? Object.values(s.stations).reduce((n, a) => n + (a.stock[id] ?? 0), 0) + s.jobs.filter(j => j.loaded).reduce((n, j) => n + sum(j.items, id), 0) : 0; }
export function crewAssignment(g, id) { return g.mega?.finalGrowth?.crew?.[id] ?? { role: g.mega?.finalGrowth?.renewal?.origin === 'new' ? renewalPreferredRole(id) : finalProfile(id)?.role ?? 'floor', zone: 'all' }; }
export function tableZone(g, seat) { const p = g.serviceSpace?.megaPlan, t = g.serviceSpace?.tables.find(t => t.tableId === g.serviceSpace?.seats[seat]?.tableId); if (!p || !t)
    return 'main'; const q = toTile(t); return megaZones(p).find(z => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)?.id ?? 'main'; }
export function supplyAllocations(g, guest, centralProtected = () => 0) { if (!hasFinalSupply(g) || !guest.order.length)
    return null; const p = ensureMegaPlan(g.mega, g.cafeLevel, g.branchId), state = supplyState(g), point = g.serviceSpace?.seats[guest.seat]?.servicePoint ?? { x: 0, y: 0 }, all = megaAllPickups(p), base = megaPickups(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly).length, sources = [{ id: 'central', stock: Object.fromEntries(g.menus.map(m => [m.menuId, Math.max(0, m.stock - centralProtected(m.menuId))])), points: all.slice(0, base) }, ...(p.fixtures ?? []).filter(f => !state.stations[f.id]?.recall).map((f) => ({ id: f.id, stock: { ...(state.stations[f.id]?.stock ?? {}) }, points: all.slice(base + (p.fixtures.indexOf(f)) * 2, base + (p.fixtures.indexOf(f)) * 2 + 2) }))].sort((a, b) => Math.min(...a.points.map(p => Math.hypot(p.x - point.x, (p.y - point.y) * 2 / 3))) - Math.min(...b.points.map(p => Math.hypot(p.x - point.x, (p.y - point.y) * 2 / 3)))); const totals = new Map(); for (const o of guest.order)
    totals.set(o.menuId, (totals.get(o.menuId) ?? 0) + o.quantity); const complete = sources.find(a => [...totals].every(([id, n]) => (a.stock[id] ?? 0) >= n)); if (complete)
    sources.splice(0, sources.length, complete); const bins = []; for (const o of guest.order) {
    let needed = o.quantity;
    for (const source of sources) {
        const n = Math.min(needed, source.stock[o.menuId] ?? 0);
        if (n) {
            let a = bins.find(a => a.source === source.id);
            if (!a)
                bins.push(a = { source: source.id, items: [] });
            a.items.push(...Array(n).fill(o.menuId));
            needed -= n;
            source.stock[o.menuId] = (source.stock[o.menuId] ?? 0) - n;
        }
        if (!needed)
            break;
    }
    if (needed)
        return null;
} return bins; }
export function reserveSupplyOrder(g, guest, centralProtected = () => 0) { if (guest.supplies)
    return false; const plan = supplyAllocations(g, guest, centralProtected); if (!plan)
    return false; const s = supplyState(g); for (const a of plan)
    for (const id of a.items) {
        if (a.source === 'central')
            g.menus.find(m => m.menuId === id).stock--;
        else
            s.stations[a.source].stock[id]--;
    } s.consumed += plan.reduce((n, a) => n + a.items.length, 0); guest.supplies = plan; return true; }
export function deliverySources(g, guest) { if (!guest.supplies || !g.serviceSpace?.megaPlan)
    return undefined; const p = g.serviceSpace.megaPlan, base = megaPickups(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly).length; return guest.supplies.map(a => ({ items: a.items, indices: a.source === 'central' ? Array.from({ length: base }, (_, i) => i) : [base + (p.fixtures ?? []).findIndex(f => f.id === a.source) * 2, base + (p.fixtures ?? []).findIndex(f => f.id === a.source) * 2 + 1] })); }
export function validGuestSupply(g, p) { if (!g.supplies)
    return true; return Array.isArray(g.supplies) && g.supplies.length <= 25 && new Set(g.supplies.map(a => a.source)).size === g.supplies.length && g.supplies.every(a => !['PREPARING', 'SERVING'].includes(g.state) || a.source === 'central' || p.fixtures?.some(f => f.id === a.source)) && g.supplies.every(a => Array.isArray(a.items) && a.items.length > 0 && a.items.length <= 100 && a.items.every(id => typeof id === 'string')) && g.order.every(o => g.supplies.reduce((n, a) => n + sum(a.items, o.menuId), 0) === g.order.filter(line => line.menuId === o.menuId).reduce((n, line) => n + line.quantity, 0)) && g.supplies.reduce((n, a) => n + a.items.length, 0) === g.order.reduce((n, o) => n + o.quantity, 0) && !['ENTERING', 'MOVING_TO_SEAT', 'ORDERING', 'WAITING_FOR_FOOD'].includes(g.state); }
export function supplyLayoutChangeError(g, next) { if (!hasFinalSupply(g))
    return null; const old = g.serviceSpace?.megaPlan, s = g.mega.finalGrowth.supply; if (!old)
    return null; for (const f of old.fixtures ?? []) {
    const n = next.fixtures?.find(n => n.id === f.id);
    if (n && n.x === f.x && n.y === f.y && n.rotation === f.rotation)
        continue;
    if ((s?.stations[f.id] && Object.values(s.stations[f.id].stock).some(n => n > 0)) || s?.jobs.some(j => j.stationId === f.id) || g.guests.some(v => ['PREPARING', 'SERVING'].includes(v.state) && v.supplies?.some(a => a.source === f.id)))
        return '보급 중이거나 재고·주문 음식이 있는 서빙대예요. 재고 회수를 요청하고 서빙을 마친 뒤 옮겨 주세요.';
} return null; }
/** Actual stock moves only at pickup and unloading; planned jobs never count as cargo. */
export function configureFinalSupply(g) {
    if (!hasFinalSupply(g)) {
        g.service.support = undefined;
        return;
    }
    const state = supplyState(g), p = ensureMegaPlan(g.mega, g.cafeLevel, g.branchId), central = megaPickups(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly), all = megaAllPickups(p);
    for (const [id, a] of Object.entries(state.stations))
        if (!(p.fixtures ?? []).some(f => f.id === id) && !Object.values(a.stock).some(n => n > 0) && !state.jobs.some(j => j.stationId === id))
            delete state.stations[id];
    for (const f of p.fixtures ?? [])
        state.stations[f.id] ??= { stock: {} };
    const active = () => g.service.paid.map(w => w.staffId), seatZones = g.serviceSpace?.seats.map((_, i) => tableZone(g, i)) ?? [];
    const batch = p.level >= 30 && g.cafeLevel >= 30;
    const port = { batchServing: false, enhancedTray: batch, dockCandidates: job => { const from = job.phase === 'pickup' || job.phase === 'loading', isCentral = from ? !job.reverse : job.reverse, index = (p.fixtures ?? []).findIndex(f => f.id === job.stationId); return isCentral ? central : index < 0 ? [] : all.slice(central.length + index * 2, central.length + index * 2 + 2); }, moveFactor: w => (finalProfile(w.staffId)?.primaryTrait.moveFactor ?? 1) * (finalProfile(w.staffId)?.secondaryTrait.moveFactor ?? 1) * (finalSpecializationFor(g)?.path === 'mass' && ['logistics', 'kitchen'].includes(crewAssignment(g, w.staffId).role) ? 1 + .04 * ((finalSpecializationFor(g)?.renewal?.stage ?? 1) - 1) : 1), serveFactor: w => (finalProfile(w.staffId)?.primaryTrait.serveFactor ?? 1) * (finalProfile(w.staffId)?.secondaryTrait.serveFactor ?? 1), pickupFactor: w => finalProfile(w.staffId)?.primaryTrait.pickupFactor ?? 1, tripCapacity: w => Math.min(batch ? (w.level <= 2 ? 2 : w.level <= 4 ? 4 : 5) : 6, (batch ? [1, 2, 3, 4, 5][Math.max(0, Math.min(4, w.level - 1))] + (educationLevel(g, w.staffId) > 0 ? 1 : 0) : w.carryCapacity) + (finalSpecializationFor(g)?.path === 'mass' ? 1 : 0) + (finalProfile(w.staffId)?.secondaryTrait.carryBonus ?? 0)), assignment: w => crewAssignment(g, w.staffId), priority: (w, o) => { const a = crewAssignment(g, w.staffId); return (a.zone !== 'all' && a.zone !== seatZones[o.seat] ? 80 : 0) + (a.role === 'vip' && o.vip ? -60 : 0); }, home: w => { const h = crewAssignment(g, w.staffId).home; return h && megaPointClear(p, h) ? h : undefined; }, job: (w, orders) => { if (w.owner || w.orderId !== null)
            return undefined; let job = state.jobs.find(j => j.workerId === w.staffId); if (job)
            return job; const role = crewAssignment(g, w.staffId).role; if (!['logistics', 'kitchen', 'zone-manager'].includes(role) || !['IDLE', 'RETURNING'].includes(w.state))
            return undefined; if (role !== 'logistics' && orders.some(o => o.ready))
            return undefined; const orphan = state.jobs.find(j => !active().includes(j.workerId)); if (orphan) {
            orphan.workerId = w.staffId;
            return orphan;
        } const fixtures = (p.fixtures ?? []).map((f, i) => ({ f, point: all[central.length + i * 2], stock: state.stations[f.id] })).filter(a => !state.jobs.some(j => j.stationId === a.f.id)); fixtures.sort((a, b) => Math.hypot(w.position.x - a.point.x, (w.position.y - a.point.y) * 2 / 3) - Math.hypot(w.position.x - b.point.x, (w.position.y - b.point.y) * 2 / 3)); for (const a of fixtures) {
            const late = p.level >= 30 && g.cafeLevel >= 30, mass = finalSpecializationFor(g)?.path === 'mass', batch = Math.min(20, (late ? 20 : mass ? 12 : g.cafeLevel >= 20 ? 10 : 8) + (finalProfile(w.staffId)?.primaryTrait.logisticsBatch ?? 0)), target = late ? (mass ? 10 : 8) : mass ? 4 : g.cafeLevel >= 20 ? 3 : 2, items = [], reverse = !!a.stock.recall;
            const ids = g.menus.map(m => m.menuId), start = state.serial % Math.max(1, ids.length);
            for (let k = 0; k < ids.length && items.length < batch; k++) {
                const id = ids[(start + k) % ids.length], m = g.menus.find(m => m.menuId === id);
                const n = reverse ? Math.min(a.stock.stock[id] ?? 0, batch - items.length) : Math.min(Math.max(0, target - (a.stock.stock[id] ?? 0)), Math.max(0, m.stock - 1), batch - items.length);
                items.push(...Array(n).fill(id));
            }
            if (!items.length) {
                if (reverse)
                    a.stock.recall = false;
                continue;
            }
            const nearest = [...central].sort((a, b) => Math.hypot(a.x - w.position.x, (a.y - w.position.y) * 2 / 3) - Math.hypot(b.x - w.position.x, (b.y - w.position.y) * 2 / 3))[0], from = reverse ? a.point : nearest, to = reverse ? nearest : a.point;
            try {
                megaRoute(p, w.position, from);
                megaRoute(p, from, to);
            }
            catch {
                continue;
            }
            job = { id: 'supply-' + (++state.serial), workerId: w.staffId, stationId: a.f.id, reverse, phase: 'pickup', elapsed: 0, items, loaded: false, from: { ...from }, to: { ...to } };
            state.jobs.push(job);
            return job;
        } return undefined; }, load: job => { if (job.loaded || !state.jobs.includes(job))
            return false; const stock = state.stations[job.stationId]; if (!stock)
            return false; const available = job.items.every(id => (job.reverse ? (stock.stock[id] ?? 0) : g.menus.find(m => m.menuId === id)?.stock ?? 0) >= sum(job.items, id)); if (!available) {
            state.jobs = state.jobs.filter(j => j.id !== job.id);
            return false;
        } for (const id of job.items)
            if (job.reverse)
                stock.stock[id]--;
            else
                g.menus.find(m => m.menuId === id).stock--; job.loaded = true; return true; }, deliver: job => { if (!job.loaded || !state.jobs.includes(job))
            return false; for (const id of job.items)
            if (job.reverse)
                g.menus.find(m => m.menuId === id).stock++;
            else
                state.stations[job.stationId].stock[id] = (state.stations[job.stationId].stock[id] ?? 0) + 1; state.moved += job.items.length; state.history.push({ id: job.id, stationId: job.stationId, reverse: job.reverse, count: job.items.length }); state.history = state.history.slice(-64); state.jobs = state.jobs.filter(j => j.id !== job.id); return true; } };
    g.service.support = port;
}
/** Apply an already-approved role only after the worker's current delivery finishes. */
export function pollCrewChanges(g) { if (!hasFinalSupply(g))
    return; for (const w of g.service.paid) {
    const a = g.mega.finalGrowth.crew?.[w.staffId];
    if (a?.pending && w.orderId === null && !w.cargo.length && ['IDLE', 'RETURNING'].includes(w.state) && !g.mega.finalGrowth.supply?.jobs.some(j => j.workerId === w.staffId)) {
        const { pending, ...old } = a;
        g.mega.finalGrowth.crew[w.staffId] = { ...old, ...pending };
    }
} }
