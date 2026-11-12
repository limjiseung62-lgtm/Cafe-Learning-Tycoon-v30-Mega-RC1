import { chooseTrayCompanions } from './batchServing.js?v=v31-5d872fe24674';
import { staffBalance } from './config.js?v=v31-5d872fe24674';
export const staffDefinitions = [{ staffId: 'staff-1', name: '봄이', visualKey: 'spring' }, { staffId: 'staff-2', name: '준이', visualKey: 'jun' }, { staffId: 'staff-3', name: '하루', visualKey: 'haru' }, { staffId: 'staff-4', name: '루나', visualKey: 'luna' }, { staffId: 'staff-5', name: '도담', visualKey: 'dodam' }];
export const staffVisuals = { owner: { face: '🧑‍🍳', apron: '#795f42', accessory: '☕' }, spring: { face: '👩', apron: '#d4898f', accessory: '🌸' }, jun: { face: '👨‍🦱', apron: '#7d9cc1', accessory: '🎧' }, haru: { face: '👩‍🦰', apron: '#9aaf70', accessory: '🌿' }, luna: { face: '👩‍🦳', apron: '#ac8dbb', accessory: '⭐' }, dodam: { face: '👨‍🦲', apron: '#d8a562', accessory: '🎀' } };
export class StaffSystem {
    support;
    batchMetrics = { formed: 0, extraOrders: 0, delivered: 0, discardedItems: 0, pickups: 0, peakCargo: 0 };
    ownsOrder(id) { return this.workers.some(w => w.orderId === id || w.bundle?.some(a => a.id === id)); }
    nextLoaded(w, active) { const candidates = w.bundle?.filter(a => active.has(a.id)) ?? []; if (!candidates.length) {
        delete w.bundle;
        this.release(w);
        return;
    } const distance = (id) => { const seat = this.seats[active.get(id).seat]; return Math.hypot(w.position.x - seat.x, (w.position.y - seat.y) * 2 / 3); }; candidates.sort((a, b) => distance(a.id) - distance(b.id) || active.get(a.id).orderedAt - active.get(b.id).orderedAt || a.id - b.id); w.bundle = candidates; w.orderId = candidates[0].id; w.remaining = []; w.cargo = candidates.flatMap(a => a.items); this.change(w, 'MOVING_TO_TABLE'); }
    pruneBundle(w, active) { if (!w.bundle)
        return; const previous = w.bundle; if (previous.every(a => active.has(a.id)))
        return; w.bundle = previous.filter(a => active.has(a.id)); this.batchMetrics.discardedItems += previous.filter(a => !active.has(a.id)).reduce((n, a) => n + a.items.length, 0); w.cargo = w.bundle.flatMap(a => a.items); if (!w.bundle.some(a => a.id === w.orderId))
        this.nextLoaded(w, active); }
    orderSource(w) { const order = w.orderId === null ? undefined : this.currentOrders.get(w.orderId); if (!order?.pickupSources)
        return undefined; let offset = order.items.length - w.remaining.length; for (const source of order.pickupSources) {
        if (offset < source.items.length)
            return { ...source, remaining: source.items.length - offset };
        offset -= source.items.length;
    } return undefined; }
    /** Logistics and customer pickups share the same physical dock lease. */
    supplyDock(w, job) {
        const m = this.movement, choices = this.support?.dockCandidates?.(job);
        if (!m || !choices?.length)
            return true;
        const from = job.phase === 'pickup' || job.phase === 'loading', key = from ? 'from' : 'to', occupied = new Set([...this.pickupClaims].filter(([id]) => id !== w.staffId).map(([, i]) => i));
        const options = choices.map(point => ({ point, index: m.pickups.findIndex(p => Math.hypot(p.x - point.x, p.y - point.y) < .001) })).filter(o => o.index >= 0 && !occupied.has(o.index));
        const own = this.pickupClaims.get(w.staffId), preferred = options.find(o => o.index === own), stationary = this.now - this.observe(w).movedAt;
        const chosen = preferred && stationary < 8 ? preferred : [...options].sort((a, b) => Math.hypot(w.position.x - a.point.x, (w.position.y - a.point.y) * 2 / 3) - Math.hypot(w.position.x - b.point.x, (w.position.y - b.point.y) * 2 / 3)).find(o => stationary < 8 || o.index !== own) ?? preferred;
        if (!chosen) {
            this.pickupClaims.delete(w.staffId);
            this.observe(w).path = 'waiting-for-dock';
            return false;
        }
        if (own !== chosen.index && (own !== undefined || Math.hypot(w.position.x - chosen.point.x, (w.position.y - chosen.point.y) * 2 / 3) <= 12)) {
            this.pickupClaims.set(w.staffId, chosen.index);
            this.routes.delete(w.staffId);
            this.retryAt.delete(w.staffId);
            if (stationary >= 8)
                this.report(w, 'supply-dock-reassigned');
        }
        job[key] = { ...chosen.point };
        if ((job.phase === 'loading' || job.phase === 'unloading') && Math.hypot(w.position.x - chosen.point.x, (w.position.y - chosen.point.y) * 2 / 3) > .01) {
            job.phase = from ? 'pickup' : 'delivery';
            job.elapsed = 0;
            return false;
        }
        return true;
    }
    supportTick(w, dt, orders) { const job = this.support?.job(w, orders); if (!job)
        return false; const wanted = { pickup: 'MOVING_TO_PICKUP', loading: 'PICKING_UP', delivery: 'MOVING_TO_TABLE', unloading: 'SERVING' }[job.phase]; if (w.state !== wanted)
        this.change(w, wanted); const yielding = this.yielding.get(w.staffId); if (yielding) {
        if (this.now - yielding.at > 3 && this.now - this.observe(w).movedAt > 2) {
            this.yielding.delete(w.staffId);
            this.routes.delete(w.staffId);
        }
        else {
            if (this.move(w, yielding.point, dt))
                this.yielding.delete(w.staffId);
            return true;
        }
    } if (!this.supplyDock(w, job))
        return true; w.busyTime += dt; w.elapsed += dt; job.elapsed += dt; if (job.loaded)
        w.cargo = [...job.items]; const advance = (phase) => { job.phase = phase; job.elapsed = 0; }; if (job.phase === 'pickup') {
        if (this.move(w, job.from, dt))
            advance('loading');
    }
    else if (job.phase === 'loading' && job.elapsed >= staffBalance.pickupSeconds * (this.support.assignment(w).role === 'kitchen' ? 0.7 : 1) * (this.support?.pickupFactor?.(w) ?? 1)) {
        if (this.support.load(job)) {
            w.cargo = [...job.items];
            advance('delivery');
        }
        else {
            w.cargo = [];
            this.change(w, 'RETURNING');
        }
    }
    else if (job.phase === 'delivery') {
        if (this.move(w, job.to, dt))
            advance('unloading');
    }
    else if (job.phase === 'unloading' && job.elapsed >= .4) {
        if (this.support.deliver(job)) {
            w.supplyTrips = (w.supplyTrips ?? 0) + 1;
            w.cargo = [];
            this.change(w, 'RETURNING');
        }
    } return true; }
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
    get diagnostics() { return { time: this.now, queueLength: [...this.currentOrders.values()].filter(o => o.ready).length, workers: this.workers.map(w => { const p = this.observe(w); return { id: w.staffId, state: w.state, orderId: w.orderId, bundleIds: w.bundle?.map(a => a.id) ?? [], cargo: w.cargo.length, position: { ...w.position }, stateSince: p.stateAt, lastMovedAt: p.movedAt, path: p.path }; }), recoveries: this.recoveryLog }; }
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
        if (occupied.has(i) || this.orderSource(w) && !this.orderSource(w).indices.includes(i))
            continue;
        const p = this.movement.pickups[i], d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3), c = d(w.position, p) + d(p, { x: target.x, y: target.y + 5 });
        if (c < cost) {
            best = i;
            cost = c;
        }
    } if (best < 0)
        return null; if (!this.support || Math.hypot(w.position.x - this.movement.pickups[best].x, (w.position.y - this.movement.pickups[best].y) * 2 / 3) <= 12)
        this.pickupClaims.set(w.staffId, best); return this.movement.pickups[best]; }
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
    claimOwner(order) { const w = this.workers[0]; if (!this.manualOwner || this.paid.length || w.state !== 'IDLE' || !order.ready || !order.active || this.ownsOrder(order.id))
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
        return null; if (this.movement && !this.movement.homes[this.workers.length])
        return null; const w = this.create(d.staffId, d.name, d.visualKey); w.position = this.movement ? { ...this.movement.homes[this.workers.length] } : { x: 14 + this.paid.length * 12, y: 22 }; this.workers.push(w); return w; }
    upgrade(w, now) { w.level++; Object.assign(w, staffBalance.levels[w.level - 1]); w.upgradeFeedbackUntil = now + 3; }
    setLayout(pickup, seats) { this.pickup = { ...pickup }; this.seats = seats.map(p => ({ ...p })); }
    change(w, state) { if (!['MOVING_TO_PICKUP', 'PICKING_UP'].includes(state))
        this.pickupClaims.delete(w.staffId); w.state = state; w.elapsed = 0; this.routes.delete(w.staffId); this.retryAt.delete(w.staffId); this.observe(w); }
    release(w) { delete w.bundle; w.orderId = null; w.cargo = []; w.remaining = []; this.change(w, 'RETURNING'); }
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
            let travel = w.moveSpeed * (this.support?.moveFactor?.(w) ?? 1) * dt;
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
                w.walkDistance = (w.walkDistance ?? 0) + Math.hypot(next.x - w.position.x, (next.y - w.position.y) * 2 / 3);
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
        const travel = w.moveSpeed * (this.support?.moveFactor?.(w) ?? 1) * dt;
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
        if (this.movement?.localDispatch || this.support) {
            for (const id of this.readySince.keys())
                if (!active.has(id))
                    this.readySince.delete(id);
            for (const o of active.values())
                if (o.ready && !this.readySince.has(o.id))
                    this.readySince.set(o.id, now);
        }
        for (const w of this.workers)
            this.pruneBundle(w, active);
        const owners = new Set();
        for (const w of this.workers) {
            this.observe(w);
            if (w.orderId !== null) {
                if (owners.has(w.orderId)) {
                    this.report(w, 'duplicate-claim-released');
                    this.release(w);
                }
                else {
                    owners.add(w.orderId);
                    for (const a of w.bundle ?? [])
                        if (a.id !== w.orderId) {
                            if (owners.has(a.id)) {
                                this.report(w, 'duplicate-bundle-claim-released');
                                this.release(w);
                                break;
                            }
                            owners.add(a.id);
                        }
                }
            }
        }
        // Claims are established synchronously; later workers cannot take the same order.
        const claimed = new Set(this.workers.flatMap(w => [w.orderId, ...(w.bundle ?? []).map(a => a.id)]).filter((id) => id !== null));
        for (const w of this.workers) {
            if (this.support && this.supportTick(w, dt, [...active.values()]))
                continue;
            if (w.orderId === null && !['IDLE', 'RETURNING'].includes(w.state)) {
                this.report(w, 'orphan-state-released');
                this.release(w);
            }
            if (w.orderId !== null && !active.has(w.orderId)) {
                claimed.delete(w.orderId);
                this.release(w);
            }
            if ((w.state === 'IDLE' || w.state === 'RETURNING' && (this.pickupFlow.chainOrders || this.now - this.observe(w).movedAt >= 8)) && !(w.owner && this.manualOwner && !this.paid.length)) {
                const compare = (a, b) => { if (!this.movement?.localDispatch && !this.support)
                    return a.orderedAt - b.orderedAt || a.id - b.id; const age = (o) => now - (this.readySince.get(o.id) ?? now), A = age(a), B = age(b); if (!!a.vip !== !!b.vip)
                    return a.vip ? -1 : 1; if ((A >= 45 || B >= 45) && !(this.support && this.movement?.localDispatch))
                    return B - A || a.id - b.id; if (this.support) {
                    const delta = this.support.priority(w, a) - this.support.priority(w, b);
                    if (delta)
                        return delta;
                } const d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3), cost = (o) => { const sources = this.support && this.movement?.localDispatch ? o.pickupSources?.[0]?.indices : undefined; const docks = sources?.length ? sources.map(i => this.movement.pickups[i]).filter((p) => !!p) : this.movement.pickups; if (!docks.length)
                    return Infinity; return Math.min(...docks.map(p => d(w.position, p) + d(p, { x: this.seats[o.seat].x, y: this.seats[o.seat].y + 5 }))) - age(o) * 2; }; return cost(a) - cost(b) || a.id - b.id; };
                let order;
                for (const candidate of active.values())
                    if (candidate.ready && !claimed.has(candidate.id) && (!order || compare(candidate, order) < 0))
                        order = candidate;
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
                    if (w.elapsed >= staffBalance.pickupSeconds * (this.support?.assignment(w).role === 'kitchen' ? 0.8 : 1) * (this.support?.pickupFactor?.(w) ?? 1)) {
                        w.cargo = w.remaining.splice(0, Math.min(this.support?.tripCapacity?.(w) ?? w.carryCapacity, this.orderSource(w)?.remaining ?? (this.support?.tripCapacity?.(w) ?? w.carryCapacity)));
                        this.batchMetrics.pickups++;
                        if (this.support?.batchServing && order && !w.remaining.length && this.movement) {
                            const dock = this.pickupClaims.get(w.staffId), capacity = this.support.tripCapacity?.(w) ?? w.carryCapacity, companions = dock === undefined ? [] : chooseTrayCompanions(order, dock, capacity - w.cargo.length, active.values(), claimed, this.seats, now);
                            if (companions.length) {
                                w.bundle = [{ id: order.id, items: [...w.cargo] }, ...companions.map(o => ({ id: o.id, items: [...o.items] }))];
                                w.cargo = w.bundle.flatMap(a => a.items);
                                for (const o of companions)
                                    claimed.add(o.id);
                                this.batchMetrics.formed++;
                                this.batchMetrics.extraOrders += companions.length;
                            }
                        }
                        this.batchMetrics.peakCargo = Math.max(this.batchMetrics.peakCargo, w.cargo.length);
                        this.change(w, 'MOVING_TO_TABLE');
                    }
                    break;
                case 'MOVING_TO_TABLE':
                    if (order && this.move(w, { x: (this.seats[order.seat]?.x ?? 50), y: (this.seats[order.seat]?.y ?? 60) + 5 }, dt))
                        this.change(w, 'SERVING');
                    break;
                case 'SERVING':
                    if (w.elapsed >= (this.support?.assignment(w).role === 'vip' && order?.vip ? 0.8 : 1) / (w.serveSpeed * (this.support?.serveFactor?.(w) ?? 1))) {
                        if (w.bundle && order) {
                            w.bundle = w.bundle.filter(a => a.id !== order.id);
                            this.batchMetrics.delivered++;
                            this.completedIds.add(order.id);
                            this.completedOrders++;
                            this.totalOrderWait += Math.max(0, now - order.orderedAt);
                            if (w.owner)
                                this.completedByOwner++;
                            else
                                this.completedByStaff++;
                            active.delete(order.id);
                            claimed.delete(order.id);
                            this.nextLoaded(w, active);
                            onComplete(order.id, w);
                        }
                        else {
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
                                if (this.support?.enhancedTray)
                                    active.delete(order.id);
                                onComplete(order.id, w);
                                if (!this.manualOwner)
                                    claimed.delete(order.id);
                                this.release(w);
                            }
                        }
                    }
                    break;
                case 'RETURNING':
                    if (this.move(w, this.support?.home(w) ?? this.movement?.homes[this.workers.indexOf(w)] ?? (w.owner ? { x: 78, y: 22 } : { x: 14 + this.paid.indexOf(w) * 12, y: 22 }), dt))
                        this.change(w, 'IDLE');
                    break;
            }
        }
    }
}
