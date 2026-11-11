export function chooseTrayCompanions(primary, dock, spare, orders, claimed, seats, now) { const target = seats[primary.seat]; if (!target || spare < 1 || primary.items.includes('event-signature'))
    return []; const distance = (o) => Math.hypot(seats[o.seat].x - target.x, (seats[o.seat].y - target.y) * 2 / 3); const candidates = [...orders].filter(o => o.id !== primary.id && o.ready && !claimed.has(o.id) && o.items.length > 0 && o.items.length <= spare && !o.items.includes('event-signature') && seats[o.seat] && o.pickupSources?.length === 1 && o.pickupSources[0].indices.includes(dock) && distance(o) <= 20).sort((a, b) => { const score = (o) => distance(o) - Math.min(60, Math.max(0, now - o.orderedAt)) * .15 - (o.vip ? 8 : 0) - (o.items.some(id => primary.items.includes(id)) ? 2 : 0); return score(a) - score(b) || a.id - b.id; }); const result = []; for (const o of candidates.slice(0, 8))
    if (o.items.length <= spare) {
        result.push(o);
        spare -= o.items.length;
        if (!spare)
            break;
    } return result; }
const sameItems = (a, b) => a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i]);
/** Optional worker field. Old single-order checkpoints retain their original validation path. */
export function validBatchWorkers(workers, guests, restoring = false) { try {
    if (!Array.isArray(workers) || !workers.some(w => w.bundle !== undefined))
        return true;
    if (!guests)
        return false;
    const claimed = new Set();
    for (const w of workers) {
        const ids = w.bundle === undefined ? (w.orderId === null ? [] : [w.orderId]) : w.bundle.map(x => x.id);
        if (w.bundle !== undefined) {
            if (!Array.isArray(w.bundle) || !w.bundle.length || w.bundle.length > 5 || !['MOVING_TO_TABLE', 'SERVING'].includes(w.state) || w.orderId === null || !w.bundle.some(a => a.id === w.orderId) || w.remaining.length || !sameItems(w.cargo, w.bundle.flatMap(a => a.items)) || w.cargo.length > 5)
                return false;
            for (const a of w.bundle) {
                const g = guests.find(g => g.id === a.id);
                if (!Number.isSafeInteger(a.id) || !g || !(restoring ? ['PREPARING', 'SERVING'] : ['SERVING']).includes(g.state) || !Array.isArray(a.items) || !a.items.length || a.items.length > 5 || a.items.some(id => typeof id !== 'string'))
                    return false;
                const items = g.order.flatMap(o => Array(o.quantity).fill(o.menuId));
                for (const id of new Set(a.items))
                    if (a.items.filter(x => x === id).length > items.filter(x => x === id).length)
                        return false;
                if (a.id !== w.orderId && !sameItems(a.items, items))
                    return false;
            }
        }
        for (const id of ids) {
            if (claimed.has(id))
                return false;
            claimed.add(id);
        }
    }
    return true;
}
catch {
    return false;
} }
