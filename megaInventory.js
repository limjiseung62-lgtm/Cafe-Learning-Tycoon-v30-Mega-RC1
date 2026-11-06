import { validateMegaPlan } from './megaSpace.js?v=level-seats-83d02b666a1c';
import { furnitureCatalog, furnitureFor } from './furnitureCatalog.js?v=level-seats-83d02b666a1c';
import { allDecorationCatalog, decorationCatalog } from './longGrowthConfig.js?v=level-seats-83d02b666a1c';
import { tableKinds } from './freeLayoutModel.js?v=level-seats-83d02b666a1c';
export const isShopDeployment = () => typeof document !== 'undefined' && document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content')?.match(/^v30[de]-/) != null;
export const interiorCatalog = [...furnitureCatalog.map((f, i) => ({ sku: f.id, name: f.name, type: 'table', baseCost: [8000, 16000, 26000, 12000, 24000, 28000, 34000, 24000, 36000][i], seatCost: ['dessert-sofa', 'bakery-bench'].includes(f.id) ? 0 : tableKinds[f.kind].seats * 1500, cost: [8000, 16000, 26000, 12000, 24000, 28000, 34000, 24000, 36000][i] + (['dessert-sofa', 'bakery-bench'].includes(f.id) ? 0 : tableKinds[f.kind].seats * 1500), bundle: f.id === 'dessert-sofa' ? 2 : f.id === 'bakery-bench' ? 4 : 0, level: [1, 3, 5, 3, 7, 5, 7, 7, 9][i] })), { sku: 'service-prep', name: '서빙 준비대', type: 'fixture', cost: 24000, bundle: 0, level: 4 }, { sku: 'chair', name: '호환 의자·좌석 쿠션', type: 'chair', cost: 1500, bundle: 0, level: 1 }, ...decorationCatalog.map((d, i) => ({ sku: 'decor-' + d.id, name: d.name, type: 'decor', cost: [3000, 5000, 5000, 4000, 6000, 12000, 8000, 4000][i], bundle: 0, level: i < 4 ? 1 : 3 }))];
export function includedSeats(sku) { const f = furnitureCatalog.find(f => f.id === sku); return f ? tableKinds[f.kind].seats : 0; }
export function inventorySku(sku) { return interiorCatalog.find(d => d.sku === sku); }
export function tableSeatCount(t) { return t.integratedSeats ? tableKinds[t.kind].seats : t.chairs?.length ?? tableKinds[t.kind].seats; }
/** Copy-only grandfathering: preserve every existing table variant and earned decoration. No money or original-layout mutation. */
export function adoptInterior(source, starter = false) {
    const save = structuredClone(source);
    if (!save.mega)
        return save;
    if (save.mega.inventory)
        return repairInteriorSeats(save);
    const m = save.mega;
    m.paid ??= { spaceLevel: Math.max(...Object.values(m.plans).map(p => p.level)), receipts: [] };
    const inventory = { version: 1, next: 1, items: [], receipts: [] };
    const add = (id, sku) => { if (!inventory.items.some(i => i.id === id))
        inventory.items.push({ id, sku, source: starter ? 'starter' : 'legacy', cost: 0 }); };
    const ids = new Map();
    for (const p of Object.values(m.plans)) {
        p.shopLayout = true;
        if (starter)
            p.starterKitchenOnly = true;
        for (const t of p.tables) {
            const f = furnitureFor(t.kind, t.furnitureId);
            const signature = t.id + ':' + f.id;
            let id = ids.get(signature);
            if (!id) {
                id = inventory.items.some(i => i.id === t.id) ? 'owned-table-' + ids.size : t.id;
                ids.set(signature, id);
            }
            add(id, f.id);
            t.id = id;
            t.furnitureId = f.id;
            t.chairs = Array.from({ length: tableKinds[t.kind].seats }, (_, slot) => { const chair = 'owned-chair-' + inventory.items.findIndex(i => i.id === id) + '-' + slot; add(chair, 'chair'); return { id: chair, slot }; });
        }
        for (const d of p.decor) {
            const signature = 'decor:' + d.id + ':' + d.decorId;
            let id = ids.get(signature);
            if (!id) {
                id = inventory.items.some(i => i.id === d.id) ? 'owned-decor-' + ids.size : d.id;
                ids.set(signature, id);
            }
            d.id = id;
            add(id, 'decor-' + d.decorId);
        }
    }
    // Previously earned/unplaced decorations remain usable without paying again.
    for (const id of save.longTerm?.owned ?? [])
        if (!inventory.items.some(i => i.sku === 'decor-' + id))
            add('owned-decor-' + id, 'decor-' + id);
    m.inventory = inventory;
    return save;
}
export function interiorPlanOwned(m, p) { const inv = m.inventory; if (!inv)
    return !p.shopLayout; const ids = new Set(), take = (id, sku) => { if (ids.has(id) || !inv.items.some(i => i.id === id && i.sku === sku))
    return false; ids.add(id); return true; }; return !!p.shopLayout && p.tables.every(t => take(t.id, furnitureFor(t.kind, t.furnitureId).id) && Array.isArray(t.chairs) && t.chairs.every(c => take(c.id, 'chair'))) && p.decor.every(d => take(d.id, 'decor-' + d.decorId)) && (p.fixtures ?? []).every(d => take(d.id, d.sku)); }
export function repairInteriorSeats(source) { const s = structuredClone(source); if (!s.mega?.inventory || s.campaign?.run && !s.campaign.run.closed)
    return s; for (const [key, p] of Object.entries(s.mega.plans)) {
    for (let i = 0; i < p.tables.length; i++) {
        const t = p.tables[i];
        if (t.integratedSeats || (t.chairs?.length ?? tableKinds[t.kind].seats) === tableKinds[t.kind].seats)
            continue;
        const q = structuredClone(s.mega.plans[key]);
        q.tables[i].integratedSeats = true;
        if (!validateMegaPlan(q).length)
            s.mega.plans[key] = q;
    }
} return s; }
export function validInterior(m) {
    try {
        const v = m.inventory;
        if (v === undefined)
            return Object.values(m.plans).every(p => !p.shopLayout);
        if (v.version !== 1 || !Number.isSafeInteger(v.next) || v.next < 1 || v.next > 10000 || !Array.isArray(v.items) || v.items.length > 256 || !Array.isArray(v.receipts) || v.receipts.length > 9999 || v.next !== v.receipts.length + 1)
            return false;
        const sales = v.sales ?? [];
        if (!Array.isArray(sales) || sales.length > 9999)
            return false;
        const sold = sales.flatMap(r => r.items), all = [...v.items, ...sold];
        if (new Set(all.map(i => i.id)).size !== all.length || new Set(v.receipts.map(r => r.id)).size !== v.receipts.length)
            return false;
        const skuValid = (sku) => !!inventorySku(sku) || sku.startsWith('decor-') && allDecorationCatalog.some(d => 'decor-' + d.id === sku);
        if (!all.every(i => /^[-a-zA-Z0-9_]{1,60}$/.test(i.id) && skuValid(i.sku) && ['starter', 'legacy', 'purchase'].includes(i.source) && Number.isSafeInteger(i.cost) && i.cost >= 0 && (i.source === 'purchase' ? v.receipts.some(r => r.id === i.receipt && r.items.includes(i.id)) : i.cost === 0 && !i.receipt)))
            return false;
        if (!sales.every((r, i) => r.id === 'sale-' + (i + 1) && r.items.length > 0 && r.items.length <= 256 && r.items.every(item => item.source === 'purchase' && item.cost > 0) && Number.isSafeInteger(r.refund) && r.refund === r.items.reduce((n, item) => n + Math.floor(item.cost / 2), 0) && Number.isFinite(Date.parse(r.at))))
            return false;
        return v.receipts.every((r, i) => r.id === 'furniture-' + (i + 1) && !!inventorySku(r.sku) && Number.isSafeInteger(r.cost) && r.cost > 0 && Array.isArray(r.items) && r.items.length > 0 && new Set(r.items).size === r.items.length && r.items.every(id => all.some(item => item.id === id && item.source === 'purchase' && item.receipt === r.id)) && r.items.reduce((n, id) => n + all.find(item => item.id === id).cost, 0) === r.cost && Number.isFinite(Date.parse(r.at))) && Object.values(m.plans).every(p => interiorPlanOwned(m, p));
    }
    catch {
        return false;
    }
}
