import { commonTransactionOpen } from './commonLearningTransaction.js?v=mega-5d509fb5dbfc';
import { validImpactState } from './classImpact.js?v=mega-5d509fb5dbfc';
import { createRandomClassMatch } from './sessionFactory.js?v=mega-5d509fb5dbfc';
import { classroomCafeCheckpoint, restoreCafeCheckpoint } from './classroomCheckpoint.js?v=mega-5d509fb5dbfc';
import { decodeGuestCheckpoint } from './guestCheckpoint.js?v=mega-5d509fb5dbfc';
import { LearningSession } from './learningSession.js?v=mega-5d509fb5dbfc';
import { LearningAnalyticsV1 } from './learningAnalytics.js?v=mega-5d509fb5dbfc';
import { providerForPool } from './learningIntegration.js?v=mega-5d509fb5dbfc';
import { validBranch } from './growthBranch.js?v=mega-5d509fb5dbfc';
import { validSpecialization } from './specialization.js?v=mega-5d509fb5dbfc';
import { beginMiniSession, offerMini, validMiniSession, validMiniCollection } from './miniGames.js?v=mega-5d509fb5dbfc';
import { ordinaryKinds, majorKinds } from './classRandom.js?v=mega-5d509fb5dbfc';
import { deploymentLocalStorage, deploymentPrefix } from './deploymentStorage.js?v=mega-5d509fb5dbfc';
export const classSaveKey = 'class-random-v1', classLockKey = 'class-random-lock';
export function captureClass(g, packId, engine, analytics, readVisits) { if (!g.classRandom)
    throw Error('Not random CLASS'); return { version: 1, clock: g.classClock(), duration: g.durationSeconds, packId, elapsed: g.elapsedTime, closed: g.status === 'CLOSED', state: structuredClone(g.classRandom), cafe: classroomCafeCheckpoint(g), guests: structuredClone(g.guests), workers: structuredClone(g.service.workers), purchases: structuredClone(g.telemetry.upgradePurchases), phase4: structuredClone(g.telemetry.phase4), branch: structuredClone(g.growthBranch), specialization: structuredClone(g.specialization), miniGames: structuredClone(g.miniGames), miniCollection: structuredClone(g.miniCollection), learning: { session: engine.checkpoint(), analytics: analytics.checkpoint(), readVisits } }; }
export function restoreClass(value, pool, now = Date.now()) {
    const c = value, finite = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
    if (!c || JSON.stringify(c).length > 3500000 || c.version !== 1 || ![900, 1800].includes(c.duration) || !finite(c.elapsed, 0, c.duration) || typeof c.closed !== 'boolean' || c.packId !== pool[0]?.packId || !c.state || c.state.version !== 1 || !Number.isSafeInteger(c.state.seed) || !Number.isSafeInteger(c.state.rng) || c.state.endAt - c.state.startAt !== c.duration * 1000 || !finite(c.state.startAt) || !finite(c.state.lastNow, c.state.startAt) || !Array.isArray(c.state.events) || c.state.events.length > 13 || new Set(c.state.events.map(e => e.id)).size !== c.state.events.length || c.state.events.some(e => !Number.isInteger(e.id) || !finite(e.at, 0, c.duration) || e.kind !== undefined && ![...ordinaryKinds, ...majorKinds].includes(e.kind) || !['scheduled', 'queued', 'active', 'success', 'failed', 'cancelled'].includes(e.status) || ![e.money, e.lost, e.gift].every(n => finite(n)) || !Array.isArray(e.changes)) || !Array.isArray(c.state.arrivals) || c.state.arrivals.length > 30 || !Array.isArray(c.state.miniAt) || c.state.miniAt.length > 2 || c.state.miniAt.some(t => !finite(t, 0, c.duration)) || c.state.arrivals.some(t => !['vip', 'gourmand', 'regular'].includes(t)) || !Array.isArray(c.purchases) || c.purchases.length > 5000 || c.purchases.some(p => !finite(p.cost) || !finite(p.level) || !finite(p.elapsedTime)) || !validImpactState(c.state) || !c.phase4 || !Array.isArray(c.phase4.payments) || !Array.isArray(c.phase4.visits) || !c.phase4.specialCustomerTypes || !Array.isArray(c.state.miniSettled) || c.state.miniSettled.length > 2 || !finite(c.state.miniReward) || !Number.isInteger(c.state.miniOffered) || c.state.miniOffered < 0 || c.state.miniOffered > 2 || c.branch && !validBranch(c.branch) || c.specialization && !validSpecialization(c.specialization) || c.miniGames && (!validMiniSession(c.miniGames, true) || c.miniGames.businessId !== c.state.id || c.miniGames.packId !== c.packId) || c.miniCollection && !validMiniCollection(c.miniCollection) || c.duration === 900 && (c.branch || c.specialization || c.miniGames))
        throw Error('CLASS 백업을 확인해 주세요. 기존 저장은 유지됩니다.');
    const g = createRandomClassMatch(c.duration, c.state.seed, c.state.startAt, c.state.id);
    Object.assign(g.classRandom, structuredClone(c.state));
    g.classRandom.impactVersion = c.state.impactVersion;
    g.growthBranch = structuredClone(c.branch);
    g.specialization = structuredClone(c.specialization);
    if (!restoreCafeCheckpoint(g, c.cafe))
        throw Error('카페 데이터 복원 실패');
    if (c.state.events.some(e => e.impact && !g.menus.some(m => m.menuId === e.impact.menuId)) || c.state.popularMenu !== undefined && !g.menus.some(m => m.menuId === c.state.popularMenu))
        throw Error('백업의 메뉴 연결을 확인해 주세요. 기존 저장은 유지됩니다.');
    g.enableHallGrowth();
    const guests = decodeGuestCheckpoint(c.guests, g, c.cafe.cafeLevel);
    if (!guests)
        throw Error('손님 데이터 복원 실패');
    g.restoreSavedGuests(guests);
    if (!Array.isArray(c.workers) || c.workers.length !== g.service.workers.length)
        throw Error('직원 데이터 복원 실패');
    for (let i = 0; i < c.workers.length; i++) {
        const w = c.workers[i];
        if (w.staffId !== g.service.workers[i].staffId || w.level !== g.service.workers[i].level || !finite(w.position?.x, 0, 10000) || !finite(w.position?.y, 0, 10000) || !finite(w.elapsed) || !['IDLE', 'CLAIMING_ORDER', 'MOVING_TO_PICKUP', 'PICKING_UP', 'MOVING_TO_TABLE', 'SERVING', 'RETURNING'].includes(w.state) || !Array.isArray(w.cargo) || !Array.isArray(w.remaining) || w.orderId !== null && !g.guests.some(x => x.id === w.orderId))
            throw Error('서빙 연결 복원 실패');
        Object.assign(g.service.workers[i], structuredClone(w));
    }
    for (const guest of g.guests)
        if (c.guests.find(x => x.id === guest.id)?.state === 'SERVING')
            guest.state = 'SERVING';
    const engine = new LearningSession(providerForPool(pool)), analytics = new LearningAnalyticsV1(c.packId);
    if (!engine.restoreCheckpoint(c.learning?.session) || !analytics.restore(c.learning?.analytics) || !Array.isArray(c.learning?.readVisits))
        throw Error('학습 기록 복원 실패');
    g.miniGames = structuredClone(c.miniGames);
    g.miniCollection = structuredClone(c.miniCollection);
    g.telemetry.upgradePurchases = structuredClone(c.purchases);
    Object.assign(g.telemetry.phase4, structuredClone(c.phase4));
    g.restoreSavedGuests(g.guests);
    if (c.clock && !g.restoreClassClock(c.clock))
        throw Error('이동 시계 복원 실패');
    g.telemetry.staffHireTimes = c.purchases.filter(p => p.kind === 'staff-hire').map((p, i) => ({ elapsedTime: p.elapsedTime, staffId: 'staff-' + (i + 1) }));
    g.telemetry.cafeUpgradeTimes = c.purchases.filter(p => p.kind === 'cafe').map(p => ({ elapsedTime: p.elapsedTime, level: p.level }));
    g.remainingSeconds = c.duration - c.elapsed;
    if (c.closed)
        g.leaveClassMatch();
    else {
        const elapsed = Math.min(c.duration, Math.max(c.elapsed, (Math.max(now, c.state.lastNow) - c.state.startAt) / 1000));
        g.tick(elapsed - c.elapsed);
    }
    return { g, engine, analytics, readVisits: c.learning.readVisits };
}
export class ClassRuntime {
    webOwns = false;
    webRelease = null;
    webPending = null;
    webDone = null;
    webClosing = null;
    async claim() { if (this.webClosing)
        await this.webClosing; if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.locks)
        return this.acquire(); if (this.webOwns)
        return true; if (this.webPending)
        return this.webPending; this.webPending = new Promise(resolve => { this.webDone = navigator.locks.request(deploymentPrefix() + 'class-single-writer-v1', { ifAvailable: true }, async (lock) => { if (!lock) {
        this.message = '다른 CLASS 창을 닫고 다시 시도해 주세요.';
        resolve(false);
        return;
    } this.webOwns = true; resolve(this.acquire()); await new Promise(done => this.webRelease = done); this.webOwns = false; this.webRelease = null; }); void this.webDone.catch(() => resolve(false)); }).finally(() => this.webPending = null); return this.webPending; }
    g = null;
    capture = null;
    last = '';
    owner = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Math.random());
    pending = new WeakMap();
    anchorMono = 0;
    anchorElapsed = 0;
    blocked = false;
    message = '';
    read() { try {
        const text = deploymentLocalStorage.getItem(classSaveKey);
        return text && text.length < 3500000 ? JSON.parse(text) : null;
    }
    catch {
        return null;
    } }
    acquire() { try {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.locks && !this.webOwns) {
            this.message = '다른 CLASS 창을 닫고 다시 시도해 주세요.';
            return false;
        }
        const old = JSON.parse(deploymentLocalStorage.getItem(classLockKey) ?? 'null');
        if (!this.webOwns && old && old.owner !== this.owner && old.until > Date.now()) {
            this.message = '다른 CLASS 창을 닫고 다시 시도해 주세요.';
            return false;
        }
        deploymentLocalStorage.setItem(classLockKey, JSON.stringify({ owner: this.owner, until: Date.now() + 8000 }));
        return true;
    }
    catch {
        this.message = '저장 공간을 사용할 수 없어요.';
        return false;
    } }
    release() { if (this.webRelease && !this.webClosing) {
        this.webOwns = false;
        this.webClosing = (this.webDone ?? Promise.resolve()).then(() => { }, () => { }).finally(() => this.webClosing = null);
        this.webRelease();
    } try {
        const old = JSON.parse(deploymentLocalStorage.getItem(classLockKey) ?? 'null');
        if (old?.owner === this.owner)
            deploymentLocalStorage.removeItem(classLockKey);
    }
    catch { } }
    prepare(c, pool) { const restored = restoreClass(c, pool); if (!this.acquire())
        throw Error(this.message); this.pending.set(restored.g, restored); return restored.g; }
    begin(g, engine, analytics, readVisits) { this.g = g.classRandom ? g : null; if (!this.g) {
        this.release();
        return { engine, analytics, readVisits };
    } this.anchorMono = performance.now(); this.anchorElapsed = g.elapsedTime; const pending = this.pending.get(g); this.pending.delete(g); return pending ?? { engine, analytics, readVisits }; }
    bind(g, capture) { if (!g.classRandom)
        return; this.capture = null; try {
        const old = this.read();
        if (old && old.state.id !== g.classRandom.id) {
            deploymentLocalStorage.setItem('class-random-previous', JSON.stringify(old));
            const history = JSON.parse(deploymentLocalStorage.getItem('class-random-history') ?? '[]');
            if (!history.some(h => h.id === old.state.id)) {
                history.push({ id: old.state.id, duration: old.duration, seed: old.state.seed, level: old.cafe.cafeLevel, revenue: old.cafe.stats.revenue, correct: old.cafe.stats.correct, closed: old.closed });
                deploymentLocalStorage.setItem('class-random-history', JSON.stringify(history.slice(-50)));
            }
        }
    }
    catch {
        this.message = '이전 회차 보관 공간이 부족해요. 먼저 JSON 백업해 주세요.';
        this.blocked = true;
        return;
    } this.g = g; this.capture = capture; this.last = ''; this.flush(); }
    flush() { if (commonTransactionOpen)
        return false; if (!this.g?.classRandom || !this.capture)
        return true; try {
        if (this.g.status === 'RUNNING' && !this.acquire()) {
            this.blocked = true;
            return false;
        }
        this.g.classRandom.lastNow = Math.max(this.g.classRandom.lastNow, Date.now());
        const c = this.capture(), text = JSON.stringify(c);
        if (text !== this.last) {
            deploymentLocalStorage.setItem(classSaveKey, text);
            this.last = text;
        }
        this.message = 'CLASS 저장 완료';
        this.blocked = false;
        if (this.g.status === 'CLOSED')
            this.release();
        return true;
    }
    catch {
        this.message = '저장 실패 · 초기화하지 말고 백업해 주세요.';
        this.blocked = true;
        return false;
    } }
    saveForExit() { return !!this.g?.classRandom && this.g.durationSeconds === 1800 && this.g.status === 'RUNNING' && this.flush(); }
    delta(g) { if (g !== this.g || !g.classRandom)
        return null; if (!this.acquire()) {
        this.blocked = true;
        return 0;
    } if (this.blocked)
        return 0; const t = Math.max(Date.now(), g.classRandom.lastNow), wanted = Math.max(g.elapsedTime, this.anchorElapsed + (performance.now() - this.anchorMono) / 1000, (t - g.classRandom.startAt) / 1000); return Math.max(0, wanted - g.elapsedTime); }
    poll(g) { if (!g.classRandom)
        return; if (g.durationSeconds === 1800) {
        beginMiniSession(g, g.classRandom.id, (this.capture?.().packId) ?? '');
        const i = g.classRandom.miniOffered;
        if (i < 2 && g.elapsedTime >= g.classRandom.miniAt[i]) {
            const first = ['cake', 'oven', 'sort', 'flowers', 'machine', 'tray'], native = g.branchId === 'garden' ? 'flowers' : g.branchId === 'bakery' ? 'oven' : 'cake';
            let kind = i ? native : first[g.classRandom.seed % first.length];
            if (g.miniGames?.offers.at(-1)?.kind === kind)
                kind = kind === 'oven' ? 'cake' : 'oven';
            if (offerMini(g, kind)) {
                g.classRandom.miniOffered++;
            }
        }
        for (const r of g.miniCollection?.receipts ?? []) {
            if (g.classRandom.miniSettled.includes(r.id))
                continue;
            g.classRandom.miniSettled.push(r.id);
            if (r.outcome === 'success') {
                const reward = 700;
                g.money += reward;
                g.stats.revenue += reward;
                g.classRandom.miniReward += reward;
            }
        }
    } this.flush(); }
}
export const classRuntime = new ClassRuntime();
if (typeof addEventListener === 'function') {
    addEventListener('pagehide', () => { classRuntime.flush(); classRuntime.release(); });
    addEventListener('beforeunload', () => classRuntime.flush());
}
