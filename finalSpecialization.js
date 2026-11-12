import { newSpecializationStages } from './renewalSpecializationState.js?v=v31-5d872fe24674';
import { finalSpecializationOffers, signatureMenusFor } from './finalSpecializationState.js?v=v31-5d872fe24674';
export function finalSpecializationFor(g) { return g.mode === 'CAFE_GROWTH' ? g.mega?.finalGrowth?.specialization : undefined; }
export function chooseFinalSpecialization(g, path, now = new Date().toISOString()) { const f = g.mega?.finalGrowth, offer = finalSpecializationOffers[path]; if (g.mode !== 'CAFE_GROWTH' || !f || !offer)
    return { ok: false, reason: 'GROWTH 최종 통합 카페 전용이에요.' }; if (f.specialization)
    return { ok: false, reason: '이미 선택한 전문화를 유지해요. 다시 결제하지 않았어요.' }; if (g.status !== 'RUNNING' || g.cafeLevel < offer.level || (g.mega?.paid?.spaceLevel ?? 1) < offer.space)
    return { ok: false, reason: 'Lv.11과 20×16 유료 매장부터 선택할 수 있어요.' }; if (g.money < offer.cost)
    return { ok: false, reason: (offer.cost - g.money).toLocaleString() + '원이 부족해요.' }; if (!Number.isFinite(Date.parse(now)))
    return { ok: false, reason: '선택 시각을 확인해 주세요.' }; g.money -= offer.cost; f.specialization = { version: 1, path, selectedAt: now, cost: offer.cost, receipt: 'final-specialization-v1', ...(f.renewal ? { renewal: newSpecializationStages() } : {}) }; for (const m of signatureMenusFor(g.cafeLevel, f.specialization))
    if (!g.menus.some(x => x.menuId === m.menuId))
        g.menus.push({ ...m, stock: 0, maxStock: g.warehouse.capacity }); return { ok: true, reason: offer.name + ' 전문화에 투자했어요.' }; }
