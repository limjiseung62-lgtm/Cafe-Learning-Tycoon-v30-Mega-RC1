import { adoptInterior, inventorySku, interiorPlanOwned } from './megaInventory.js?v=level-seats-83d02b666a1c';
import { validateMegaPlan, megaKey, validMega } from './megaSpace.js?v=level-seats-83d02b666a1c';
import { prepareFurniture, furnitureUnlocked } from './furnitureUnlocks.js?v=level-seats-83d02b666a1c';
export function buyInterior(source, sku, expectedNext, now = new Date().toISOString()) { const s = adoptInterior(source), item = inventorySku(sku), inv = s.mega?.inventory; if (!item || !inv)
    return { ok: false, reason: '가구 정보를 다시 확인해 주세요.' }; if (s.campaign?.run && !s.campaign.run.closed)
    return { ok: false, reason: '영업을 마친 뒤 구매해요.' }; if (inv.next !== expectedNext)
    return { ok: false, reason: '다른 구매가 먼저 저장됐어요. 다시 확인해 주세요.' }; prepareFurniture(s); if (s.cafeLevel < item.level || item.type === 'table' && !furnitureUnlocked(s.longTerm, item.sku))
    return { ok: false, reason: '카페 성장과 가구 해금 조건을 확인해 주세요.' }; if (s.money < item.cost)
    return { ok: false, reason: (item.cost - s.money).toLocaleString() + '원이 부족해요.' }; if (inv.next >= 10000 || inv.items.length + 1 + item.bundle > 256)
    return { ok: false, reason: '가구 보관함이 가득 찼어요.' }; const receipt = 'furniture-' + inv.next, id = 'bought-' + inv.next, items = [id, ...Array.from({ length: item.bundle }, (_, i) => id + '-c' + i)]; inv.items.push({ id, sku, source: 'purchase', cost: item.cost, receipt }, ...items.slice(1).map(id => ({ id, sku: 'chair', source: 'purchase', cost: 0, receipt }))); inv.receipts.push({ id: receipt, sku, cost: item.cost, items, at: now }); inv.next++; s.money -= item.cost; if (item.type === 'decor' && !s.longTerm.owned.includes(sku.slice(6)))
    s.longTerm.owned.push(sku.slice(6)); s.updatedAt = now; return { ok: true, save: s }; }
/** Preview and commit share ownership, collision and route validation. Preview never migrates or mutates saves. */
export function checkInteriorLayout(s, draft) { const m = s.mega; if (!m?.inventory || s.campaign?.run && !s.campaign.run.closed)
    return { ok: false, reason: '영업을 마친 뒤 배치해요.' }; if (draft.level !== m.paid?.spaceLevel || draft.branch !== (s.growthBranch?.active ?? null))
    return { ok: false, reason: '현재 소유한 매장의 배치를 선택해 주세요.' }; if (!interiorPlanOwned(m, draft))
    return { ok: false, reason: '보관함에 남은 가구가 없거나 같은 가구가 중복 배치됐어요.' }; const errors = validateMegaPlan(draft); return errors.length ? { ok: false, reason: errors[0] } : { ok: true }; }
export function saveInteriorLayout(source, draft, now = new Date().toISOString()) { const s = adoptInterior(source), r = checkInteriorLayout(s, draft); if (!r.ok)
    return r; const m = s.mega; m.plans[megaKey(draft.level, draft.branch)] = structuredClone(draft); if (!validMega(m))
    return { ok: false, reason: '최소 한 좌석과 주방 통로를 남겨 주세요.' }; s.updatedAt = now; return { ok: true, save: s }; }
