import { adoptInterior, inventorySku } from './megaInventory.js?v=v31-5d872fe24674';
import { buyInterior } from './megaShop.js?v=v31-5d872fe24674';
import { ensureMegaPlan, validMega } from './megaSpace.js?v=v31-5d872fe24674';
import { installedIds, removeInterior } from './interiorPlacement.js?v=v31-5d872fe24674';
export function purchaseLimit(s, sku) { const d = inventorySku(sku), v = s.mega?.inventory; if (!d || !v)
    return 0; return Math.max(0, Math.min(256, Math.floor(s.money / d.cost), Math.floor((256 - v.items.length) / (1 + d.bundle)), 10000 - v.next)); }
export function buyInteriorBatch(source, sku, quantity, expectedNext, now = new Date().toISOString()) { if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 256)
    return { ok: false, reason: '수량은 1개 이상 정수로 입력해요.' }; const start = adoptInterior(source), v = start.mega?.inventory; if (!v || v.next !== expectedNext)
    return { ok: false, reason: '구매 정보가 바뀌었어요. 다시 확인해 주세요.' }; if (quantity > purchaseLimit(start, sku))
    return { ok: false, reason: '보유금 또는 보관함 한도를 확인해 주세요.' }; let s = start; for (let i = 0; i < quantity; i++) {
    const r = buyInterior(s, sku, s.mega.inventory.next, now);
    if (!r.ok)
        return r;
    s = r.save;
} return { ok: true, save: s }; }
export function saleCandidates(s, sku) { if (!s.mega?.inventory)
    return []; const p = ensureMegaPlan(s.mega, s.cafeLevel, s.growthBranch?.active ?? undefined), used = installedIds(p), v = s.mega.inventory; return v.items.filter(i => i.sku === sku && i.source === 'purchase' && i.cost > 0 && !used.has(i.id) && v.receipts.some(r => r.id === i.receipt && r.items.includes(i.id))); }
export function saleQuote(s, sku, quantity) { const items = saleCandidates(structuredClone(s), sku).slice(0, quantity); return { items, refund: items.reduce((n, i) => n + Math.floor(i.cost / 2), 0) }; }
export function sellInteriorBatch(source, sku, quantity, expectedNext, expectedSales, now = new Date().toISOString()) { const s = adoptInterior(source), v = s.mega?.inventory; if (!v || v.next !== expectedNext || (v.sales?.length ?? 0) !== expectedSales)
    return { ok: false, reason: '거래 정보가 바뀌었어요. 다시 확인해 주세요.' }; if (s.campaign?.run && !s.campaign.run.closed)
    return { ok: false, reason: '영업을 마친 뒤 판매해요.' }; if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 256 || expectedSales >= 9999)
    return { ok: false, reason: '판매 수량을 확인해 주세요.' }; const available = saleCandidates(s, sku); if (quantity > available.length)
    return { ok: false, reason: '보관 중인 유료 구매 가구만 판매할 수 있어요. 무료·이력 불명 가구는 보호해요.' }; const { items, refund } = saleQuote(s, sku, quantity); if (!Number.isSafeInteger(s.money + refund))
    return { ok: false, reason: '보유금 한도를 확인해 주세요.' }; for (const [key, p] of Object.entries(s.mega.plans)) {
    let q = p;
    for (const i of items)
        q = removeInterior(q, i.id);
    s.mega.plans[key] = q;
} const ids = new Set(items.map(i => i.id)); v.items = v.items.filter(i => !ids.has(i.id)); (v.sales ??= []).push({ id: 'sale-' + (expectedSales + 1), items: structuredClone(items), refund, at: now }); s.money += refund; s.updatedAt = now; if (!validMega(s.mega))
    return { ok: false, reason: '이전 배치의 좌석과 통로를 보존해야 해서 판매하지 않았어요.' }; return { ok: true, save: s }; }
export function validInteriorSale(before, next) { const old = before.mega?.inventory, n = next.mega?.inventory; if (!old || !n || (n.sales?.length ?? 0) !== (old.sales?.length ?? 0) + 1)
    return false; const sale = n.sales.at(-1); if (!sale.items.length || sale.items.some(i => i.sku !== sale.items[0].sku))
    return false; const r = sellInteriorBatch(before, sale.items[0].sku, sale.items.length, old.next, old.sales?.length ?? 0, sale.at); return r.ok && r.save.money === next.money && JSON.stringify(r.save.mega) === JSON.stringify(next.mega); }
