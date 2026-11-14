import { specializationLevels, specializationUpgradeCosts } from './renewalSpecializationState.js';
import { signatureMenusFor } from './finalSpecializationState.js';
export function specializationUpgradeQuote(g) { const s = g.mega?.finalGrowth?.specialization, tier = s?.renewal?.stage ?? 0, next = tier && tier < 4 ? tier + 1 : 0, cost = s && next ? specializationUpgradeCosts[s.path][next - 1] : 0, level = next ? specializationLevels[next - 1] : 30; return { current: tier, next, cost, level, eligible: g.mode === 'CAFE_GROWTH' && !!g.mega?.finalGrowth?.renewal && g.status === 'RUNNING' && !!next && g.cafeLevel >= level && g.money >= cost }; }
export function upgradeRenewalSpecialization(g, expectedStage) { const q = specializationUpgradeQuote(g), s = g.mega?.finalGrowth?.specialization; if (!q.eligible || q.current !== expectedStage || !s?.renewal)
    return { ok: false, reason: q.current !== expectedStage ? '이미 처리한 강화예요.' : 'Lv.' + q.level + ' 및 ' + q.cost.toLocaleString() + '원이 필요해요.' }; g.money -= q.cost; s.renewal.stage = q.next; s.renewal.receipts.push({ id: 'specialization-' + q.next, stage: q.next, cost: q.cost }); for (const m of signatureMenusFor(g.cafeLevel, s))
    if (!g.menus.some(x => x.menuId === m.menuId))
        g.menus.push({ ...m, stock: 0, maxStock: g.warehouse.capacity }); return { ok: true, reason: '전문화 ' + q.next + '단계로 성장했어요.' }; }
