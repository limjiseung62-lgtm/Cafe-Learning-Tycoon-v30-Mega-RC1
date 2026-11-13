import { newRenewalRewards, rewardCash } from './renewalRewardState.js?v=v31-final-636a93f6f215';
import { outsideKitchenStock } from './finalSupply.js?v=v31-final-636a93f6f215';
export function rewardState(g) { const r = g.mode === 'CAFE_GROWTH' ? g.mega?.finalGrowth?.renewal : undefined; if (r?.menuPolicy !== 2)
    return; return r.rewards ??= newRenewalRewards(); }
export function grantRenewalReward(g, id, kind, grade = 1) { if (!['mini', 'mission'].includes(kind) || ![1, 2, 3].includes(grade))
    return 0; const s = rewardState(g); if (!s || s.grants.some(r => r.id === id) || s.grants.length >= 2000 || !id || id.length > 180)
    return 0; const cash = rewardCash(g.cafeLevel, kind, grade); if (!Number.isSafeInteger(g.money + cash))
    return 0; const vouchers = kind === 'mission' ? (grade === 3 ? ['stock', 'training', 'decoration'] : ['stock', 'training']) : grade === 3 ? ['furniture', 'kitchen'] : grade === 2 ? ['warehouse'] : ['stock']; if (s.vouchers.length + vouchers.length > 4000)
    return 0; s.grants.push({ id, kind, level: g.cafeLevel, grade, cash }); for (const v of vouchers)
    s.vouchers.push({ id: id + ':' + v, kind: v, used: false }); g.money += cash; return cash; }
export function useRewardVoucher(g, id, target = '') { const s = rewardState(g), v = s?.vouchers.find(v => v.id === id && !v.used); if (!s || !v || s.uses.length >= 4000 || g.status !== 'RUNNING')
    return { ok: false, reason: '사용할 보상권이 없어요.' }; if (v.kind === 'furniture' || v.kind === 'decoration')
    return { ok: false, reason: '가구 할인권은 영업 후 준비 화면의 보상함에서 사용해요.' }; let amount = 0; if (v.kind === 'stock') {
    for (const m of g.menus) {
        const n = Math.min(3, Math.max(0, m.maxStock - m.stock - outsideKitchenStock(g, m.menuId)));
        m.stock += n;
        amount += n;
    }
    if (!amount)
        return { ok: false, reason: '창고가 가득 차서 사용하지 않았어요.' };
    target = 'unlocked-stock';
}
else {
    const cost = v.kind === 'training' ? g.getStaffUpgradeCost(target) : v.kind === 'kitchen' ? ((awaitKitchen(g))?.cost ?? null) : g.nextWarehouse?.cost ?? null;
    if (cost === null)
        return { ok: false, reason: '강화할 대상을 확인해 주세요.' };
    amount = Math.floor(cost * .2);
    if (!Number.isSafeInteger(g.money + amount))
        return { ok: false, reason: '보유금 한도를 확인해 주세요.' };
    if (g.money < cost - amount)
        return { ok: false, reason: '할인 후 ' + (cost - amount).toLocaleString() + '원이 필요해요.' };
    const before = g.money;
    g.money += amount;
    const result = v.kind === 'training' ? g.upgradeStaff(target) : v.kind === 'kitchen' ? g.upgradeProduction() : g.upgradeWarehouse();
    if (!result.ok) {
        g.money = before;
        return result;
    }
    target = target || v.kind;
} v.used = true; s.uses.push({ id: 'reward-use-' + (s.uses.length + 1), voucher: id, kind: v.kind, amount, target }); return { ok: true, reason: v.kind === 'stock' ? '보급권으로 ' + amount + '개를 보관했어요. 정답 횟수는 바뀌지 않아요.' : '할인권 사용 · ' + amount.toLocaleString() + '원 할인' }; }
import { kitchenStages } from './productionKitchen.js?v=v31-final-636a93f6f215';
const awaitKitchen = (g) => kitchenStages[(g.mega?.production?.tier ?? 0) + 1];
