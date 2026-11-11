/** Ephemeral service observations, no new save field or unbounded visit history. */
const observations = new WeakMap();
export function lateServiceInterval(g, seatingInterval) {
    if (g.mode !== 'CAFE_GROWTH' || !g.mega?.finalGrowth || (g.mega.paid?.spaceLevel ?? 1) < 20)
        return seatingInterval;
    let o = observations.get(g);
    if (!o) {
        o = { start: g.elapsedTime, at: g.elapsedTime, completed: g.service.completedOrders, rate: 0, phase: 'warmup', agedReady: 0, interval: seatingInterval };
        observations.set(g, o);
    }
    const elapsed = g.elapsedTime - o.at;
    if (elapsed >= 15) {
        const rate = Math.max(0, g.service.completedOrders - o.completed) / elapsed;
        o.rate = o.at === o.start ? rate : o.rate * .5 + rate * .5;
        o.at = g.elapsedTime;
        o.completed = g.service.completedOrders;
    }
    o.agedReady = g.guests.filter(v => ['PREPARING', 'SERVING'].includes(v.state) && g.elapsedTime - v.orderedAt >= 30).length;
    if (g.elapsedTime - o.start < 45) {
        o.phase = 'warmup';
        return o.interval = Math.max(1, seatingInterval);
    }
    const agedFood = g.cafeLevel >= 30 && (g.mega.paid?.spaceLevel ?? 1) >= 30 ? g.guests.filter(v => v.state === 'WAITING_FOR_FOOD' && g.elapsedTime - v.orderedAt >= 30).length : 0;
    if (agedFood >= Math.max(2, g.cafe.maxCustomers * .075)) {
        o.phase = 'stock-pressure';
        return o.interval = Math.max(seatingInterval, Math.min(8, 1 / Math.max(.125, o.rate * .9)));
    }
    if (o.agedReady < Math.max(2, g.cafe.maxCustomers * .075)) {
        o.phase = 'seating';
        return o.interval = seatingInterval;
    }
    // Even with no completions this remains a finite arrival interval, never a staff-count gate.
    // Missing ingredients (WAITING_FOR_FOOD) do not masquerade as slow delivery capacity.
    o.phase = 'ready-order-pressure';
    return o.interval = Math.max(seatingInterval, Math.min(8, 1 / Math.max(.125, o.rate * .9)));
}
export function lateServiceObservation(g) { const o = observations.get(g); return o ? { phase: o.phase, observedServingsPerMinute: o.rate * 60, agedReady: o.agedReady, interval: o.interval, sampledSince: o.start } : null; }
