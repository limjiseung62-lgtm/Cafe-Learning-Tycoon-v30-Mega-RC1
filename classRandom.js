import { planImpact, impactChoice } from './classImpact.js?v=v31-final-636a93f6f215';
import { progressiveClassBalance } from './classProgressiveBalance.js?v=v31-final-636a93f6f215';
export const classRandomConfig = { version: 1, priceMultiplier: 1.65, spawnSeconds: 7, expansion: [0, 1000, 2200, 4500, 8000, 12000, 20000, 30000, 35000, 42000, 50000, 65000, 90000, 130000, 180000], lossFraction: .2, lossMaximum: 8, firstDamageAt: 180 };
export const randomClassBalance = { ...structuredClone(progressiveClassBalance), cafes: progressiveClassBalance.cafes.map((c, i) => ({ ...structuredClone(c), expansionCost: classRandomConfig.expansion[i], theme: i >= 6 ? 'classic' : c.theme })), staff: { ...structuredClone(progressiveClassBalance.staff), hireCosts: [1700, 4500, 9000, 16000, 24000] } };
export const ordinaryKinds = ['gift', 'group', 'popular', 'discount', 'helper', 'regular', 'small-mistake', 'stock-loss'];
export const majorKinds = ['vip', 'critics', 'birthday', 'festival', 'thief', 'big-mistake', 'urgent', 'supply'];
export const eventNames = { gift: '재료 선물이 도착했어요!', group: '단체 손님이 찾아와요!', popular: '오늘의 인기 메뉴!', discount: '깜짝 할인 제안', helper: '이웃의 따뜻한 도움', regular: '반가운 단골 방문', 'small-mistake': '함께 정리해요', 'stock-loss': '재료 보관 점검', vip: '황금빛 VIP의 방문', critics: '맛집 평가단이 왔어요!', birthday: '생일 파티 예약', festival: '카페 앞 작은 축제', thief: '도둑을 발견했어요!', 'big-mistake': '바쁜 순간, 함께 해결해요', urgent: '긴급 단체 주문!', supply: '특별 재료 공급' };
export const v27Deployment = () => typeof document !== 'undefined' && /^(v26-v27-class|v30[cde]-)/.test(document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '');
export function seededStep(s) { let t = s.rng += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); s.rng >>>= 0; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
export function newClassState(seconds, seed, now, id) {
    if (![900, 1800].includes(seconds) || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)
        throw Error('CLASS는 15분 또는 30분이에요.');
    const s = { impactVersion: 2, version: 1, seed, rng: seed, id, startAt: now, endAt: now + seconds * 1000, lastNow: now, events: [], arrivals: [], rushUntil: 0, popularUntil: 0, discountUntil: 0, lastBad: false, miniAt: [], miniOffered: 0, miniSettled: [], miniReward: 0 };
    const ordinary = seconds === 900 ? 3 + Math.floor(seededStep(s) * 3) : 6 + Math.floor(seededStep(s) * 4), major = seconds === 900 ? 1 + Math.floor(seededStep(s) * 2) : 2 + Math.floor(seededStep(s) * 3);
    for (let i = 0; i < ordinary; i++)
        s.events.push({ id: 0, at: 90 + (i + .2 + seededStep(s) * .6) * (seconds - 180) / ordinary, major: false, roll: seededStep(s), status: 'scheduled', money: 0, lost: 0, gift: 0, changes: [] });
    for (let i = 0; i < major; i++)
        s.events.push({ id: 0, at: 450 + (i + .2 + seededStep(s) * .6) * (seconds - 540) / major, major: true, roll: seededStep(s), status: 'scheduled', money: 0, lost: 0, gift: 0, changes: [] });
    s.events.sort((a, b) => a.at - b.at).forEach((e, i) => { e.id = i + 1; if (i)
        e.at = Math.min(seconds - 30, Math.max(e.at, s.events[i - 1].at + 25)); });
    if (seconds === 1800)
        s.miniAt = [540 + seededStep(s) * 240, 1200 + seededStep(s) * 300];
    return s;
}
const bad = (k) => ['thief', 'big-mistake', 'small-mistake', 'stock-loss'].includes(k);
export function pollClassEvents(g) {
    const s = g.classRandom;
    if (!s)
        return;
    if (g.status === 'CLOSED') {
        for (const e of s.events)
            if (['queued', 'scheduled', 'active'].includes(e.status))
                e.status = 'cancelled';
        s.arrivals = [];
        return;
    }
    for (const e of s.events) {
        if (e.status === 'scheduled' && g.elapsedTime >= e.at) {
            let pool = [...(e.major ? majorKinds : ordinaryKinds)];
            if (!g.service.paid.length)
                pool = pool.filter(k => !k.includes('mistake'));
            if (s.impactVersion === 2 && !g.menus.some(m => m.stock > 0))
                pool = pool.filter(k => !bad(k));
            if (g.elapsedTime < classRandomConfig.firstDamageAt || e.major && s.lastBad)
                pool = pool.filter(k => !bad(k));
            if (g.branchId && e.major) {
                const preferred = g.branchId === 'garden' ? 'festival' : g.branchId === 'bakery' ? 'urgent' : 'vip';
                pool.push(preferred, preferred);
            }
            if (g.specialization && e.major)
                pool.push(g.specialization.selected === 'vip' ? 'vip' : g.specialization.selected === 'factory' ? 'urgent' : 'festival');
            e.kind = pool[Math.min(pool.length - 1, Math.floor(e.roll * pool.length))];
            s.lastBad = e.major ? bad(e.kind) : s.lastBad;
            e.status = 'queued';
            if (s.impactVersion === 2)
                planImpact(g, e);
        }
        if (e.status === 'active' && e.deadline !== undefined) {
            const served = classProgress(g, e);
            if (served >= (e.target ?? 1) && (e.kind !== 'birthday' || g.stats.correct > (e.baseCorrect ?? 0))) {
                e.status = 'success';
                e.money = e.impact?.reward ?? Math.round((e.kind === 'vip' || e.kind === 'critics' ? 1000 : 700) * (1 + Math.min(10, g.cafeLevel) / 10));
                g.money += e.money;
                g.stats.revenue += e.money;
                e.resolvedAt = g.elapsedTime;
                if (e.impact) {
                    e.impact.afterMoney = g.money;
                    e.impact.afterStock = g.menus.reduce((n, m) => n + m.stock, 0);
                }
            }
            else if (g.elapsedTime >= e.deadline) {
                e.status = 'failed';
                e.resolvedAt = g.elapsedTime;
                if (e.impact) {
                    e.impact.afterMoney = g.money;
                    e.impact.afterStock = g.menus.reduce((n, m) => n + m.stock, 0);
                }
            }
        }
    }
}
export function classChoice(g, id, choice) {
    const s = g.classRandom, e = s?.events.find(e => e.id === id);
    if (!s || !e || e.status !== 'queued' || !e.kind || g.status !== 'RUNNING')
        return false;
    if (e.impact)
        return impactChoice(g, e, choice);
    e.choice = choice;
    const total = g.menus.reduce((n, m) => n + m.stock, 0);
    if (bad(e.kind)) {
        let loss = Math.min(classRandomConfig.lossMaximum, Math.floor(total * classRandomConfig.lossFraction));
        if (!e.major)
            loss = Math.min(loss, 2);
        if (choice === 'careful')
            loss = Math.floor(loss * .4);
        else if (choice === 'quick' && seededStep(s) < .45)
            loss = 0;
        for (const m of [...g.menus].sort((a, b) => b.stock - a.stock)) {
            const n = Math.min(loss, m.stock);
            if (n) {
                m.stock -= n;
                e.lost += n;
                e.changes.push({ menuId: m.menuId, amount: -n });
                loss -= n;
            }
            if (!loss)
                break;
        }
        e.status = choice === 'careful' || !e.lost ? 'success' : 'failed';
    }
    else if (['gift', 'helper', 'supply'].includes(e.kind)) {
        for (const m of g.menus) {
            const n = Math.min(m.maxStock - m.stock, e.kind === 'supply' ? 3 : 2);
            m.stock += n;
            e.gift += n;
            if (n)
                e.changes.push({ menuId: m.menuId, amount: n });
        }
        e.status = 'success';
    }
    else if (choice === 'decline') {
        e.status = 'cancelled';
    }
    else if (e.kind === 'popular') {
        s.popularMenu = g.menus[Math.floor(seededStep(s) * g.menus.length)].menuId;
        s.popularUntil = g.elapsedTime + 100;
        e.status = 'success';
    }
    else if (e.kind === 'discount') {
        s.discountUntil = g.elapsedTime + 90;
        s.rushUntil = g.elapsedTime + 90;
        e.status = 'success';
    }
    else {
        e.status = 'active';
        e.deadline = g.elapsedTime + (g.service.paid.length ? 130 : 190);
        e.baseServed = g.stats.servedCustomers;
        e.baseCorrect = g.stats.correct;
        e.startedAt = g.elapsedTime;
        e.target = ['vip', 'critics', 'regular'].includes(e.kind) ? 1 : g.service.paid.length && e.major ? (e.kind === 'urgent' ? 3 : 2) : 1;
        s.rushUntil = g.elapsedTime + 90;
        if (['vip', 'critics', 'regular'].includes(e.kind))
            s.arrivals.push(e.kind === 'critics' ? 'gourmand' : e.kind === 'regular' ? 'regular' : 'vip');
    }
    if (e.status !== 'active')
        e.resolvedAt = g.elapsedTime;
    return true;
}
export function classSpecial(g) { const s = g.classRandom; if (!s)
    return null; if (s.arrivals.length)
    return s.arrivals.shift(); return g.elapsedTime >= 450 && seededStep(s) < (g.branchId === 'garden' ? .23 : g.branchId === 'dessert' ? .21 : .18) ? ['vip', 'gourmand', 'regular'][Math.floor(seededStep(s) * 3)] : null; }
export function classReport(g) { const s = g.classRandom; if (!s)
    return undefined; const purchases = g.telemetry.upgradePurchases.reduce((n, p) => n + p.cost, 0); return { duration: g.durationSeconds, seed: s.seed, level: g.cafeLevel, revenue: g.stats.revenue, net: g.stats.revenue - purchases, staff: g.service.paid.length, upgrades: g.telemetry.upgradePurchases.length, specialVisitors: g.telemetry.phase4.specialCustomersSpawned, success: s.events.filter(e => e.status === 'success').length, failed: s.events.filter(e => e.status === 'failed').length, lost: s.events.reduce((n, e) => n + e.lost, 0), gift: s.events.reduce((n, e) => n + e.gift, 0), rescued: s.events.filter(e => e.choice === 'careful' && e.kind && bad(e.kind)).length, branch: g.branchId, specialization: g.specialization?.selected, mini: g.miniCollection?.receipts ?? [], miniReward: s.miniReward, events: structuredClone(s.events) }; }
export function classProgress(g, e) { const type = e.kind === 'vip' ? 'vip' : e.kind === 'critics' ? 'gourmand' : e.kind === 'regular' ? 'regular' : null; return type ? g.telemetry.phase4.payments.filter(p => p.type === type && p.elapsedTime >= (e.startedAt ?? Infinity)).length : g.stats.servedCustomers - (e.baseServed ?? 0); }
