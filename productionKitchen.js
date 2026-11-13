/** GROWTH-only optional investments. Amount replaces a production chance; it never creates one. */
export const kitchenStages = [
    { name: '기본 주방', amount: 1, cost: 0, level: 1, space: 1 },
    { name: '확장 주방', amount: 3, cost: 20000, level: 4, space: 4 },
    { name: '전문 주방', amount: 5, cost: 80000, level: 10, space: 10 },
    { name: '대형 주방', amount: 8, cost: 200000, level: 20, space: 20 },
    { name: '중앙 생산 주방', amount: 12, cost: 600000, level: 25, space: 20 },
    { name: '메가 생산 시설', amount: 20, cost: 1500000, level: 30, space: 30 }
];
export const bulkWarehouses = [{ capacity: 40, cost: 60000 }, { capacity: 80, cost: 150000 }, { capacity: 160, cost: 400000 }, { capacity: 320, cost: 1000000 }];
export const newProductionKitchen = () => ({ version: 1, tier: 0, storage: 0, receipts: [] });
export function validProductionKitchen(v) { if (v === undefined)
    return true; try {
    const p = v;
    if (p.version !== 1 || !Number.isInteger(p.tier) || p.tier < 0 || p.tier > 5 || !Number.isInteger(p.storage) || p.storage < 0 || p.storage > 4 || !Array.isArray(p.receipts) || p.receipts.length !== p.tier + p.storage)
        return false;
    let k = 0, s = 0;
    return p.receipts.every((r, i) => { const n = r.kind === 'kitchen' ? ++k : r.kind === 'storage' ? ++s : -1, expected = r.kind === 'kitchen' ? kitchenStages[n]?.cost : bulkWarehouses[n - 1]?.cost; return r.id === 'production-' + (i + 1) && r.tier === n && r.cost === expected; }) && k === p.tier && s === p.storage;
}
catch {
    return false;
} }
export const kitchenAmount = (g) => g.mode === 'CAFE_GROWTH' ? kitchenStages[g.mega?.production?.tier ?? 0].amount : 1;
export const kitchenFloorLabel = (level) => ({ 1: '8×6', 4: '12×10', 10: '20×16', 20: '40×30', 30: '64×48' }[level] ?? '기존');
/** First paid appliance fits the existing starter counter; later tiers retain their physical requirements. */
export function kitchenRequiredSpace(g, tier) { return g.mode === 'CAFE_GROWTH' && g.mega?.finalGrowth?.renewal?.menuPolicy === 2 && tier === 1 ? 1 : kitchenStages[tier]?.space ?? 30; }
