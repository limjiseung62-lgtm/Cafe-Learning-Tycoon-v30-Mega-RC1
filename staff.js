import { staffBalance } from './config.js?v=stability-97670d28ea8d';
export const staffDefinitions = [{ staffId: 'staff-1', name: '봄이', visualKey: 'spring' }, { staffId: 'staff-2', name: '준이', visualKey: 'jun' }, { staffId: 'staff-3', name: '하루', visualKey: 'haru' }, { staffId: 'staff-4', name: '루나', visualKey: 'luna' }, { staffId: 'staff-5', name: '도담', visualKey: 'dodam' }];
export const staffVisuals = { owner: { face: '🧑‍🍳', apron: '#795f42', accessory: '☕' }, spring: { face: '👩', apron: '#d4898f', accessory: '🌸' }, jun: { face: '👨‍🦱', apron: '#7d9cc1', accessory: '🎧' }, haru: { face: '👩‍🦰', apron: '#9aaf70', accessory: '🌿' }, luna: { face: '👩‍🦳', apron: '#ac8dbb', accessory: '⭐' }, dodam: { face: '👨‍🦲', apron: '#d8a562', accessory: '🎀' } };
export class StaffSystem {
    maxPaid = 5;
    readySince = new Map();
    movement = null;
    now = 0;
    progress = new Map();
    yielding = new Map();
    retryAt = new Map();
    completedIds = new Set();
    recoveryLog = [];
    diagnosticContext;
    observe(w) { let p = this.progress.get(w.staffId); if (!p) {
        p = { state: w.state, stateAt: this.now, movedAt: this.now, point: { ...w.position }, reportedAt: -Infinity, path: 'not-requested' };
        this.progress.set(w.staffId, p);
    } if (p.state !== w.state) {
        p.state = w.state;
        p.stateAt = this.now;
        p.movedAt = this.now;
    } if (Math.hypot(p.point.x - w.position.x, (p.point.y - w.position.y) * 2 / 3) > .01) {
        p.point = { ...w.position };
        p.movedAt = this.now;
    } return p; }
    report(w, reason) { const p = this.observe(w); if (this.now - p.reportedAt < 5)
        return; p.reportedAt = this.now; this.recoveryLog.push({ time: this.now, reason, workerId: w.staffId, queueLength: [...this.currentOrders.values()].filter(o => o.ready).length, workers: this.workers.map(v => { const q = this.observe(v), o = v.orderId === null ? undefined : this.currentOrders.get(v.orderId); return { id: v.staffId, state: v.state, stateSince: q.stateAt, lastMovedAt: q.movedAt, orderId: v.orderId, vip: o?.vip ?? false, orderActive: !!o, position: { ...v.position }, path: q.path, cargo: v.cargo.length, remaining: v.remaining.length }; }), context: this.diagnosticContext?.() ?? null }); if (this.recoveryLog.length > 64)
        this.recoveryLog.shift(); }
    get diagnostics() { return { time: this.now, queueLength: [...this.currentOrders.values()].filter(o => o.ready).length, workers: this.workers.map(w => { const p = this.observe(w); return { id: w.staffId, state: w.state, orderId: w.orderId, position: { ...w.position }, stateSince: p.stateAt, lastMovedAt: p.movedAt, path: p.path }; }), recoveries: this.recoveryLog }; }
    // A worker blocking a real delivery yields along a checked floor route. Its order/cargo remain owned.
    // This is collision right-of-way, not a periodic reset or a teleport to an arbitrary home.
    requestYield(requester, blocker, to) {
        const m = this.movement;
        if (!m?.canStand || this.yielding.has(blocker.staffId) || this.yielding.has(requester.staffId))
            return;
        const lowPriority = blocker.state === 'IDLE' || blocker.state === 'RETURNING' || (this.now - this.observe(blocker).movedAt > 2 && this.workers.indexOf(blocker) > this.workers.indexOf(requester));
        if (!lowPriority)
            return;
        const gap = m.clearance ?? 4;
        const others = this.workers.filter(w => w !== blocker).map(w => w.position), distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3);
        const candidates = [...m.homes, ...[5, 10, 15, 20].flatMap(r => Array.from({ length: 8 }, (_, i) => ({ x: blocker.position.x + r * Math.cos(i * Math.PI / 4), y: blocker.position.y + r * 1.5 * Math.sin(i * Math.PI / 4) })))].filter(p => m.canStand(p) && others.every(q => distance(p, q) >= gap + .2) && distance(p, to) >= gap + .2 && m.pickups.every(q => distance(p, q) >= gap + .2)).sort((a, b) => distance(blocker.position, a) - distance(blocker.position, b));
        const clear = (a, b) => others.every(p => { const dx = b.x - a.x, dy = (b.y - a.y) * 2 / 3, px = p.x - a.x, py = (p.y - a.y) * 2 / 3, den = dx * dx + dy * dy, t = den ? Math.max(0, Math.min(1, (px * dx + py * dy) / den)) : 0; return Math.hypot(px - dx * t, py - dy * t) >= gap - 1e-8 || Math.hypot(px, py) < gap && distance(b, p) >= distance(a, p) && px * dx + py * dy <= 0; });
        for (const point of candidates) {
            try {
                const points = m.route(blocker.position, point, others);
                if (points.length < 2 || !points.slice(1).every((p, i) => clear(points[i], p)))
                    continue;
                this.yielding.set(blocker.staffId, { point, requester: requester.staffId, at: this.now });
                this.routes.delete(blocker.staffId);
                this.retryAt.delete(blocker.staffId);
                this.report(blocker, 'yield-for-' + requester.staffId);
                return;
            }
            catch { /* Try another checked waiting point. */ }
        }
    }
    pickupFlow = { sharedPickup: false, chainOrders: false };
    pickupClaims = new Map();
    pickupFor(w) { if (!this.movement)
        return this.pickup; const own = this.pickupClaims.get(w.staffId); if (own !== undefined)
        return this.movement.pickups[own]; const fallback = this.workers.indexOf(w); if (!this.pickupFlow.sharedPickup)
        return this.movement.pickups[fallback % this.movement.pickups.length] ?? null; const occupied = new Set([...this.pickupClaims].filter(([id]) => id !== w.staffId).map(([, i]) => i)), target = w.orderId === null ? this.pickup : this.seats[this.currentOrders.get(w.orderId)?.seat ?? -1] ?? this.pickup; let best = -1, cost = Infinity; for (let i = 0; i < this.movement.pickups.length; i++) {
        if (occupied.has(i))
            continue;
        const p = this.movement.pickups[i], d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3), c = d(w.position, p) + d(p, { x: target.x, y: target.y + 5 });
        if (c < cost) {
            best = i;
            cost = c;
        }
    } if (best < 0)
        return null; this.pickupClaims.set(w.staffId, best); return this.movement.pickups[best]; }
    currentOrders = new Map();
    routes = new Map();
    configureMovement(movement, orderSeats) { this.movement = movement; this.routes.clear(); this.pickupClaims.clear(); this.yielding.clear(); this.retryAt.clear(); for (const w of this.workers) {
        if (movement.preservePositions)
            continue;
        const i = this.workers.indexOf(w), seat = w.orderId === null ? undefined : this.seats[orderSeats.get(w.orderId) ?? -1];
        w.position = w.state === 'SERVING' && seat ? { x: seat.x, y: seat.y + 5 } : ['MOVING_TO_TABLE', 'PICKING_UP'].includes(w.state) ? { ...movement.pickups[i % movement.pickups.length] } : { ...movement.homes[i] };
    } }
    /** Explicit player recovery: relocate to checked waiting floor, preserving delivery ownership and cargo. */
    recoverPositions(avoid = []) {
        const m = this.movement;
        if (!m?.canStand)
            return { ok: false, moved: 0, reason: '이 매장에서는 위치 복구를 사용할 수 없어요.' };
        const gap = m.clearance ?? 4, d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3), chosen = [];
        const candidates = [...m.homes, ...m.homes.flatMap(home => [5, 10, 15, 20].flatMap(r => Array.from({ length: 8 }, (_, i) => ({ x: home.x + r * Math.cos(i * Math.PI / 4), y: home.y + r * 1.5 * Math.sin(i * Math.PI / 4) }))))];
        for (const w of this.workers) {
            const order = w.orderId === null ? undefined : this.currentOrders.get(w.orderId), seat = order ? this.seats[order.seat] : undefined;
            const targets = seat ? [{ x: seat.x, y: seat.y + 5 }, ...m.pickups] : m.pickups;
            const point = candidates.find(p => m.canStand(p) && [...avoid, ...chosen].every(q => d(p, q) >= gap + .2) && m.pickups.every(q => d(p, q) >= gap + .2) && targets.every(t => { try {
                return m.route(p, t).length > 0;
            }
            catch {
                return false;
            } }));
            if (!point)
                return { ok: false, moved: 0, reason: '안전한 복귀 공간이 부족해요. 통로를 먼저 확보해 주세요.' };
            chosen.push(point);
        }
        // No partial relocation when a safe place cannot be found for the whole crew.
        this.routes.clear();
        this.pickupClaims.clear();
        this.yielding.clear();
        this.retryAt.clear();
        this.workers.forEach((w, i) => {
            this.report(w, 'player-position-recovery');
            w.position = { ...chosen[i] };
            this.progress.delete(w.staffId);
            if (w.orderId === null) {
                w.state = 'IDLE';
                w.elapsed = 0;
            }
            else if (w.state === 'SERVING')
                this.change(w, 'MOVING_TO_TABLE');
            else if (w.state === 'PICKING_UP')
                this.change(w, 'MOVING_TO_PICKUP');
        });
        return { ok: true, moved: this.workers.length, reason: '직원이 안전한 위치에서 다시 움직여요. 진행 중인 주문과 음식은 유지했어요.' };
    }
    // Headless balance simulations retain their automatic driver. Interactive play opts in.
    manualOwner = false;
    claimOwner(order) { const w = this.workers[0]; if (!this.manualOwner || this.paid.length || w.state !== 'IDLE' || !order.ready || !order.active || this.workers.some(worker => worker.orderId === order.id))
        return false; w.orderId = order.id; w.remaining = [...order.items]; this.change(w, 'CLAIMING_ORDER'); return true; }
    workers = [this.create('owner', '사장님', 'owner', true)];
    pickup = { x: 78, y: 30 };
    seats = [];
    completedByOwner = 0;
    completedByStaff = 0;
    totalOrderWait = 0;
    completedOrders = 0;
    create(staffId, name, visualKey, owner = false) { return { staffId, name, visualKey, owner, level: 1, ...staffBalance.levels[0], state: 'IDLE', position: { x: 78, y: 22 }, orderId: null, cargo: [], remaining: [], elapsed: 0, idleTime: 0, busyTime: 0, upgradeFeedbackUntil: 0 }; }
    get paid() { return this.workers.filter(w => !w.owner); }
    claimDuration;
    hire(definition) { const d = definition ?? staffDefinitions[this.paid.length]; if (!d || this.paid.some(w => w.staffId === d.staffId) || this.paid.length >= this.maxPaid)
        return null; const w = this.create(d.staffId, d.name, d.visualKey); w.position = this.movement ? { ...this.movement.homes[this.workers.length] } : { x: 14 + this.paid.length * 12, y: 22 }; this.workers.push(w); return w; }
    upgrade(w, now) { w.level++; Object.assign(w, staffBalance.levels[w.level - 1]); w.upgradeFeedbackUntil = now + 3; }
    setLayout(pickup, seats) { this.pickup = { ...pickup }; this.seats = seats.map(p => ({ ...p })); }
    change(w, state) { if (!['MOVING_TO_PICKUP', 'PICKING_UP'].includes(state))
        this.pickupClaims.delete(w.staffId); w.state = state; w.elapsed = 0; this.routes.delete(w.staffId); this.retryAt.delete(w.staffId); this.observe(w); }
    release(w) { w.orderId = null; w.cargo = []; w.remaining = []; this.change(w, 'RETURNING'); }
    move(w, to, dt) {
        if (this.movement) {
            const status = this.observe(w), gap = this.movement.clearance ?? 4, others = this.workers.filter(other => other !== w), key = to.x + ',' + to.y;
            const blockedBy = (next) => others.filter(other => { const p = other.position, dx = next.x - w.position.x, dy = (next.y - w.position.y) * 2 / 3, px = p.x - w.position.x, py = (p.y - w.position.y) * 2 / 3, den = dx * dx + dy * dy, t = den ? Math.max(0, Math.min(1, (px * dx + py * dy) / den)) : 0; return Math.hypot(px - dx * t, py - dy * t) < gap - 1e-8 && (Math.hypot(px, py) >= gap - 1e-8 || Math.hypot(next.x - p.x, (next.y - p.y) * 2 / 3) < Math.hypot(px, py)); });
            if ((this.retryAt.get(w.staffId) ?? 0) > this.now)
                return false;
            let route = this.routes.get(w.staffId);
            if (!route || route.target !== key) {
                try {
                    route = { target: key, points: this.movement.route(w.position, to), index: 1 };
                    this.routes.set(w.staffId, route);
                    status.path = 'found';
                }
                catch {
                    status.path = 'unavailable';
                    this.retryAt.set(w.staffId, this.now + .5);
                    if (this.now - status.movedAt >= 8)
                        this.report(w, 'path-unavailable');
                    return false;
                }
            }
            if (route.points.length < 2 && Math.hypot(to.x - w.position.x, to.y - w.position.y) > .001) {
                this.routes.delete(w.staffId);
                this.retryAt.set(w.staffId, this.now + .5);
                return false;
            }
            let travel = w.moveSpeed * dt;
            while (route.index < route.points.length) {
                const p = route.points[route.index], dx = p.x - w.position.x, dy = p.y - w.position.y, distance = Math.hypot(dx, dy * 2 / 3) * this.movement.worldScale, next = distance <= travel + 1e-9 ? p : { x: w.position.x + dx * travel / distance, y: w.position.y + dy * travel / distance }, blockers = blockedBy(next);
                if (blockers.length) {
                    status.path = 'blocked';
                    for (const blocker of blockers)
                        this.requestYield(w, blocker, to);
                    try {
                        route = { target: key, points: this.movement.route(w.position, to, others.map(o => o.position)), index: 1 };
                        this.routes.set(w.staffId, route);
                        status.path = 'replanned';
                    }
                    catch {
                        this.routes.delete(w.staffId);
                        status.path = 'waiting-for-clearance';
                    }
                    this.retryAt.set(w.staffId, this.now + (this.movement.replanSeconds ?? .25) + this.workers.indexOf(w) * .025);
                    if (this.now - status.movedAt >= 8) {
                        this.report(w, 'stalled-route-retry');
                        this.routes.delete(w.staffId);
                    }
                    return false;
                }
                if (distance <= travel + 1e-9) {
                    w.position = { ...p };
                    travel -= distance;
                    route.index++;
                }
                else {
                    w.position = { ...next };
                    this.observe(w);
                    return false;
                }
            }
            this.observe(w);
            return true;
        }
        const dx = to.x - w.position.x, dy = to.y - w.position.y;
        const distance = Math.hypot(dx, dy);
        const travel = w.moveSpeed * dt;
        if (distance <= travel) {
            w.position = { ...to };
            return true;
        }
        w.position.x += dx / distance * travel;
        w.position.y += dy / distance * travel;
        return false;
    }
    tick(dt, orders, now, onComplete) {
        this.now = now;
        const active = new Map(orders.filter(o => o.active && !this.completedIds.has(o.id)).map(o => [o.id, o]));
        this.currentOrders = active;
        if (this.movement?.localDispatch) {
            for (const id of this.readySince.keys())
                if (!active.has(id))
                    this.readySince.delete(id);
            for (const o of active.values())
                if (o.ready && !this.readySince.has(o.id))
                    this.readySince.set(o.id, now);
        }
        const owners = new Set();
        for (const w of this.workers) {
            this.observe(w);
            if (w.orderId !== null) {
                if (owners.has(w.orderId)) {
                    this.report(w, 'duplicate-claim-released');
                    this.release(w);
                }
                else
                    owners.add(w.orderId);
            }
        }
        // Claims are established synchronously; later workers cannot take the same order.
        const claimed = new Set(this.workers.map(w => w.orderId).filter((id) => id !== null));
        for (const w of this.workers) {
            if (w.orderId === null && !['IDLE', 'RETURNING'].includes(w.state)) {
                this.report(w, 'orphan-state-released');
                this.release(w);
            }
            if (w.orderId !== null && !active.has(w.orderId)) {
                claimed.delete(w.orderId);
                this.release(w);
            }
            if ((w.state === 'IDLE' || w.state === 'RETURNING' && (this.pickupFlow.chainOrders || this.now - this.observe(w).movedAt >= 8)) && !(w.owner && this.manualOwner && !this.paid.length)) {
                const order = [...active.values()].filter(o => o.ready && !claimed.has(o.id)).sort((a, b) => { if (!this.movement?.localDispatch)
                    return a.orderedAt - b.orderedAt || a.id - b.id; const age = (o) => now - (this.readySince.get(o.id) ?? now), A = age(a), B = age(b); if (!!a.vip !== !!b.vip)
                    return a.vip ? -1 : 1; if (A >= 45 || B >= 45)
                    return B - A || a.id - b.id; const d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3), cost = (o) => Math.min(...this.movement.pickups.map(p => d(w.position, p) + d(p, { x: this.seats[o.seat].x, y: this.seats[o.seat].y + 5 }))) - age(o) * 2; return cost(a) - cost(b) || a.id - b.id; })[0];
                if (order) {
                    w.orderId = order.id;
                    w.remaining = [...order.items];
                    claimed.add(order.id);
                    this.change(w, 'CLAIMING_ORDER');
                }
            }
            const yieldTo = this.yielding.get(w.staffId);
            if (yieldTo) {
                if (this.now - yieldTo.at > 3 && this.now - this.observe(w).movedAt > 2) {
                    this.yielding.delete(w.staffId);
                    this.routes.delete(w.staffId);
                    this.report(w, 'yield-route-expired');
                }
                else {
                    if (this.move(w, yieldTo.point, dt))
                        this.yielding.delete(w.staffId);
                    continue;
                }
            }
            if (w.state === 'IDLE')
                w.idleTime += dt;
            else
                w.busyTime += dt;
            w.elapsed += dt;
            const order = w.orderId === null ? undefined : active.get(w.orderId);
            switch (w.state) {
                case 'IDLE': break;
                case 'CLAIMING_ORDER':
                    if (w.elapsed >= (this.claimDuration?.(w) ?? staffBalance.claimSeconds))
                        this.change(w, 'MOVING_TO_PICKUP');
                    break;
                case 'MOVING_TO_PICKUP': {
                    const point = this.pickupFor(w);
                    if (point && this.move(w, point, dt))
                        this.change(w, 'PICKING_UP');
                    break;
                }
                case 'PICKING_UP':
                    if (w.elapsed >= staffBalance.pickupSeconds) {
                        w.cargo = w.remaining.splice(0, w.carryCapacity);
                        this.change(w, 'MOVING_TO_TABLE');
                    }
                    break;
                case 'MOVING_TO_TABLE':
                    if (order && this.move(w, { x: (this.seats[order.seat]?.x ?? 50), y: (this.seats[order.seat]?.y ?? 60) + 5 }, dt))
                        this.change(w, 'SERVING');
                    break;
                case 'SERVING':
                    if (w.elapsed >= 1 / w.serveSpeed) {
                        w.cargo = [];
                        if (w.remaining.length)
                            this.change(w, 'MOVING_TO_PICKUP');
                        else if (order) {
                            this.completedIds.add(order.id);
                            this.completedOrders++;
                            this.totalOrderWait += Math.max(0, now - order.orderedAt);
                            if (w.owner)
                                this.completedByOwner++;
                            else
                                this.completedByStaff++;
                            onComplete(order.id, w);
                            if (!this.manualOwner)
                                claimed.delete(order.id);
                            this.release(w);
                        }
                    }
                    break;
                case 'RETURNING':
                    if (this.move(w, this.movement?.homes[this.workers.indexOf(w)] ?? (w.owner ? { x: 78, y: 22 } : { x: 14 + this.paid.indexOf(w) * 12, y: 22 }), dt))
                        this.change(w, 'IDLE');
                    break;
            }
        }
    }
}
