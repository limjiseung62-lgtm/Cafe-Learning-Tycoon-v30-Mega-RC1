import { seededStep } from './classRandom.js';
const damage = (k) => ['thief', 'big-mistake', 'small-mistake', 'stock-loss'].includes(k);
export function normalMinute(g) { const prices = g.menus.map(m => g.getPrice(m)), avg = prices.reduce((a, b) => a + b, 0) / Math.max(1, prices.length), payments = g.telemetry.phase4.payments.filter(p => p.elapsedTime >= g.elapsedTime - 120); const flow = payments.reduce((n, p) => n + p.total, 0) * 60 / Math.max(60, Math.min(120, g.elapsedTime)); return Math.round(Math.max(avg * 3, Math.min(avg * 12, flow || avg * 4))); }
export function planImpact(g, e) { const s = g.classRandom, stocks = [...g.menus].sort((a, b) => b.stock - a.stock), total = stocks.reduce((n, m) => n + m.stock, 0), target = stocks[0], rare = e.major && ['vip', 'festival', 'thief'].includes(e.kind) && seededStep(s) < .08; const minute = normalMinute(g); const cap = damage(e.kind) ? Math.min(e.major ? 12 : 2, Math.floor(total * (e.major ? .35 : .2)), e.kind === 'big-mistake' ? target.stock : Math.ceil(target.stock * (rare ? .6 : e.major ? .5 : .35))) : 0; e.impact = { version: 1, rare, minute, reward: Math.round(minute * (rare ? 1.8 : e.major ? 1.2 : .5)), lossCap: cap, menuId: target.menuId, window: Math.min(g.remainingSeconds, rare ? 120 : 90) }; return e.impact; }
function record(g, e) { const p = e.impact; p.afterMoney = g.money; p.afterStock = g.menus.reduce((n, m) => n + m.stock, 0); if (e.status !== 'active')
    e.resolvedAt = g.elapsedTime; }
export function impactChoice(g, e, choice) {
    const s = g.classRandom, p = e.impact, k = e.kind;
    e.choice = choice;
    p.beforeMoney = g.money;
    p.beforeStock = g.menus.reduce((n, m) => n + m.stock, 0);
    if (choice === 'decline') {
        e.status = 'cancelled';
        record(g, e);
        return true;
    }
    const quick = choice === 'quick';
    if (damage(k)) {
        const target = g.menus.find(m => m.menuId === p.menuId), total = p.beforeStock, cap = Math.min(p.lossCap, target.stock, Math.floor(total * (e.major ? .35 : .2)));
        p.lossCap = cap;
        p.chance = quick ? .35 : 1;
        const loss = quick ? (seededStep(s) < .35 ? 0 : cap) : Math.floor(cap * .35);
        if (loss) {
            target.stock -= loss;
            e.lost = loss;
            e.changes.push({ menuId: target.menuId, amount: -loss });
        }
        e.status = !quick || loss === 0 ? 'success' : 'failed';
        p.safe = !quick;
        if (quick && loss === 0) {
            e.money = Math.round(p.minute * .15);
            g.money += e.money;
            g.stats.revenue += e.money;
        }
        record(g, e);
        return true;
    }
    if (['gift', 'helper', 'supply'].includes(k)) {
        for (const m of g.menus) {
            const wanted = quick ? 1 + Math.floor(seededStep(s) * (k === 'supply' ? 5 : 4)) : (k === 'supply' ? 3 : 2), n = Math.min(m.maxStock - m.stock, wanted);
            m.stock += n;
            e.gift += n;
            if (n)
                e.changes.push({ menuId: m.menuId, amount: n });
        }
        if (k === 'helper') {
            s.assistUntil = g.elapsedTime + p.window;
        }
        e.status = 'success';
        record(g, e);
        return true;
    }
    if (k === 'popular') {
        s.popularMenu = quick ? g.menus[Math.floor(seededStep(s) * g.menus.length)].menuId : [...g.menus].sort((a, b) => b.stock - a.stock)[0].menuId;
        s.popularUntil = g.elapsedTime + p.window;
        s.demandQuantity = quick ? 2 : 1;
        s.priceUntil = s.popularUntil;
        s.priceFactor = quick ? 1.2 : 1.1;
        e.status = 'success';
        record(g, e);
        return true;
    }
    if (k === 'discount') {
        s.discountUntil = g.elapsedTime + p.window;
        s.discountFactor = quick ? .8 : .9;
        s.rushUntil = g.elapsedTime + p.window;
        s.rushFactor = quick ? .3 : .55;
        e.status = 'success';
        record(g, e);
        return true;
    }
    e.status = 'active';
    e.startedAt = g.elapsedTime;
    e.baseServed = g.stats.servedCustomers;
    e.baseCorrect = g.stats.correct;
    const terms = missionTerms(g, e, quick);
    e.target = terms.target;
    e.deadline = g.elapsedTime + terms.seconds;
    p.reward = Math.round(p.reward * (quick ? 1.6 : 1));
    s.rushUntil = g.elapsedTime + p.window;
    s.rushFactor = quick ? .28 : .5;
    if (['vip', 'critics', 'regular'].includes(k))
        s.arrivals.push(k === 'critics' ? 'gourmand' : k === 'regular' ? 'regular' : 'vip');
    if (k === 'festival' || k === 'urgent' || k === 'group' || k === 'birthday') {
        s.orderUntil = g.elapsedTime + p.window;
        s.orderQuantity = quick || p.rare ? 2 : 1;
    }
    record(g, e);
    return true;
}
export function impactTitle(e, base) { return e.impact?.rare ? ({ vip: '황금 VIP의 특별 초대', festival: '마을 전체가 찾아오는 대축제', thief: '창고를 지켜라! 큰 도난 위기' }[e.kind] ?? base) : base; }
export function missionTerms(g, e, quick) { let target = ['vip', 'critics', 'regular'].includes(e.kind) ? 1 : g.service.paid.length && e.major ? (e.kind === 'urgent' ? 3 : 2) : 1; if (quick && g.service.paid.length && e.kind !== 'vip')
    target++; return { target, seconds: Math.min(Math.max(10, g.remainingSeconds - 3), g.service.paid.length ? (quick ? 100 : 150) : (quick ? 160 : 210)) }; }
export function impactOptions(g, e) { const p = e.impact; if (damage(e.kind))
    return [{ id: 'careful', name: e.kind === 'thief' ? '차분히 선반 잠그기' : e.kind?.includes('mistake') ? '함께 안전하게 정리하기' : '차분히 보관 상태 점검', detail: `확실하게 보호 · 최대 ${Math.floor(p.lossCap * .35)}개 손실` }, { id: 'quick', name: e.kind === 'thief' ? '빠르게 길목 지키기' : e.kind?.includes('mistake') ? '빠르게 트레이 받치기' : '창고를 빠르게 정리하기', detail: `35% 무피해와 작은 사례금 · 실패 시 최대 ${p.lossCap}개 손실` }]; if (['gift', 'helper', 'supply'].includes(e.kind))
    return [{ id: 'careful', name: '고르게 나누어 보관', detail: `해금 메뉴마다 +${e.kind === 'supply' ? 3 : 2} · 창고 상한까지` }, { id: 'quick', name: '깜짝 상자 열기', detail: `메뉴마다 무작위 +1~${e.kind === 'supply' ? 5 : 4} · 창고 상한까지` }]; if (e.kind === 'discount')
    return [{ id: 'careful', name: '10% 할인 · 차근차근', detail: `${Math.round(p.window)}초 · 방문 간격 55%` }, { id: 'quick', name: '20% 할인 · 바쁘게 도전', detail: `${Math.round(p.window)}초 · 방문 간격 30%, 재고가 빨리 줄어요` }]; if (e.kind === 'popular')
    return [{ id: 'careful', name: '많이 준비한 메뉴 추천', detail: `${Math.round(p.window)}초 · 1개 주문 · 판매가 +10%` }, { id: 'quick', name: '오늘의 깜짝 메뉴 추천', detail: `${Math.round(p.window)}초 · 무작위 메뉴 2개 주문 · 판매가 +20%` }]; const a = missionTerms(g, e, false), b = missionTerms(g, e, true); return [{ id: 'careful', name: '준비하고 한 팀씩 맞이하기', detail: `${a.seconds}초 · ${a.target}팀${e.kind === 'birthday' ? ' + 학습 정답1개' : ''} 성공 시 +${p.reward.toLocaleString()}원` }, { id: 'quick', name: '큰 주문에 도전하기', detail: `${b.seconds}초 · ${b.target}팀${e.kind === 'birthday' ? ' + 학습 정답1개' : ''} 성공 시 +${Math.round(p.reward * 1.6).toLocaleString()}원 · 재고를 살펴봐요` }]; }
export function validImpactState(s) { const n = (x, a = 0, b = 1e9) => typeof x === 'number' && Number.isFinite(x) && x >= a && x <= b; if (s.impactVersion !== undefined && s.impactVersion !== 2)
    return false; for (const key of ['assistUntil', 'priceUntil', 'orderUntil'])
    if (s[key] !== undefined && !n(s[key], 0, 2100))
        return false; for (const [key, lo, hi] of [['priceFactor', 1, 1.25], ['discountFactor', .5, 1], ['rushFactor', .25, 1], ['demandQuantity', 1, 2], ['orderQuantity', 1, 2]])
    if (s[key] !== undefined && !n(s[key], lo, hi))
        return false; return s.events.every(e => { if (e.introSeen !== undefined && typeof e.introSeen !== 'boolean')
    return false; const p = e.impact; if (!p)
    return true; return p.version === 1 && typeof p.rare === 'boolean' && n(p.minute) && n(p.reward) && n(p.lossCap, 0, 12) && typeof p.menuId === 'string' && p.menuId.length < 100 && n(p.window, 0, 1800) && ['beforeMoney', 'afterMoney', 'beforeStock', 'afterStock'].every(k => p[k] === undefined || n(p[k])); }); }
