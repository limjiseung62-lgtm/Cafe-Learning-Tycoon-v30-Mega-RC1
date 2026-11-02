import { beginManagerConstruction } from './managerState.js?v=furniture-ux-dd837b78b1a8';
import { ensureMegaPlan, megaDimensions, validMega, validateMegaPlan } from './megaSpace.js?v=furniture-ux-dd837b78b1a8';
export const expansionStages = [{ level: 1, size: [8, 6], cost: 0, requiredLevel: 1 }, { level: 4, size: [12, 10], cost: 100000, requiredLevel: 4 }, { level: 10, size: [20, 16], cost: 500000, requiredLevel: 10 }, { level: 20, size: [40, 30], cost: 3000000, requiredLevel: 20 }, { level: 30, size: [64, 48], cost: 15000000, requiredLevel: 30 }];
export function adoptPaidSpace(save) { const copy = structuredClone(save); if (copy.mega && typeof document !== 'undefined' && document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content')?.startsWith('v30e-'))
    copy.mega.extended = true; if (copy.mega && !copy.mega.paid) {
    const level = Math.max(...Object.values(copy.mega.plans).map(p => p.level));
    copy.mega.paid = { spaceLevel: level, receipts: [] };
} return copy; }
export const megaExpansionCosts = { 20: 900000, 30: 2400000 };
export function expansionQuote(source) { const save = adoptPaidSpace(source), level = save.mega?.paid?.spaceLevel ?? 1, raw = expansionStages.find(s => s.level > level), next = raw && save.mega?.extended && raw.level >= 20 ? { ...raw, cost: megaExpansionCosts[raw.level] } : raw, active = !!save.campaign?.run && !save.campaign.run.closed; return { level, size: megaDimensions[level - 1], next, shortage: Math.max(0, (next?.cost ?? 0) - save.money), eligible: !!next && next.level <= (save.mega?.extended ? 30 : 10) && save.cafeLevel >= next.requiredLevel && !active, active }; }
export function prepareExpansion(source, expectedLevel, now = new Date().toISOString()) {
    const save = adoptPaidSpace(source), quote = expansionQuote(save), next = quote.next;
    if (!save.mega || !save.mega.paid || quote.level !== expectedLevel)
        return { ok: false, reason: '매장 상태가 바뀌었어요. 다시 확인해 주세요.' };
    if (!next || !quote.eligible)
        return { ok: false, reason: quote.active ? '영업을 마친 뒤 증축할 수 있어요.' : '필요 레벨을 달성하면 증축할 수 있어요.' };
    if (quote.shortage)
        return { ok: false, reason: quote.shortage.toLocaleString() + '원이 부족해요.' };
    const receipt = 'space:' + quote.level + ':' + next.level;
    if (save.mega.paid.receipts.some(r => r.id === receipt))
        return { ok: false, reason: '이미 결제한 증축이에요.' };
    try {
        const prior = ensureMegaPlan(save.mega, save.cafeLevel, save.growthBranch?.active ?? undefined), anchor = prior.kitchenAnchorWidth ?? (quote.level >= 4 ? megaDimensions[quote.level - 1][0] : 12);
        save.mega.paid.spaceLevel = next.level;
        const p = ensureMegaPlan(save.mega, save.cafeLevel, save.growthBranch?.active ?? undefined);
        p.serviceHubs = true;
        p.kitchenAnchorWidth = anchor;
        p.prepIsland = save.mega.inventory ? !!prior.prepIsland : next.level === 10;
        if (validateMegaPlan(p).length || !validMega(save.mega))
            return { ok: false, reason: '기존 가구와 새 주방이 겹쳐요. 배치를 먼저 확인해 주세요. 기존 배치는 보존돼요.' };
        save.mega.paid.receipts.push({ id: receipt, from: quote.level, to: next.level, cost: next.cost, at: now });
        beginManagerConstruction(save.mega, receipt, Date.parse(now));
        save.money -= next.cost;
        save.updatedAt = now;
        return { ok: true, save };
    }
    catch {
        return { ok: false, reason: '기존 배치를 유지한 채 확장할 통로가 필요해요. 가구를 확인해 주세요.' };
    }
}
