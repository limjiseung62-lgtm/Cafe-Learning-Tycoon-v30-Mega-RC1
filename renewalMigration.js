import { newSpecializationStages } from './renewalSpecializationState.js';
import { adoptFinalGrowth, operatingSeatContract } from './finalGrowth.js';
import { menuDefinitions } from './data.js';
import { crewLimit } from './staffRecruitment.js';
import { validateGrowthSave, createGrowthSave } from './growthSave.js';
import { newMegaState } from './megaSpace.js';
import { adoptInterior } from './megaInventory.js';
import { newProgressiveState } from './progressiveFeatures.js';
/** Explicit migration API, never invoked as a side effect of preview/validation. */
export function adoptRenewal(source, now = new Date().toISOString()) {
    if (!validateGrowthSave(source))
        throw Error('리뉴얼 전 원본 저장 검증에 실패했어요. 원본은 보존됩니다.');
    if (!source.mega?.finalGrowth || !source.mega.paid)
        throw Error('메가 카페 저장만 리뉴얼할 수 있어요.');
    if (source.mega.finalGrowth.renewal)
        return structuredClone(source);
    const seats = operatingSeatContract({ mode: 'CAFE_GROWTH', mega: source.mega, cafeLevel: source.cafeLevel, branchId: source.growthBranch?.active ?? undefined }).operatingLimit;
    const renewal = { version: 1, menuPolicy: 2, origin: 'legacy', adoptedAt: now, legacyLevel: source.cafeLevel, retainedMenus: source.unlockedMenuIds.filter(id => menuDefinitions.some(m => m.menuId === id)), retainedSeats: seats, retainedStaff: Math.max(crewLimit(source), source.staffOwned.length) };
    const s = structuredClone(source);
    s.mega.finalGrowth.renewal = renewal;
    const spec = s.mega.finalGrowth.specialization;
    if (spec && !spec.renewal) {
        spec.renewal = newSpecializationStages();
        if (spec.path === 'mass')
            spec.renewal.legacyProductionFloor = .4;
        else {
            spec.renewal.legacyPriceFloor = .2;
            spec.renewal.retainedSignatureIds = source.unlockedMenuIds.filter(id => id.startsWith('signature-'));
        }
    }
    if (!validateGrowthSave(s))
        throw Error('새 규칙으로 이관할 수 없어요. 원본은 보존됩니다.');
    return s;
}
/** Fresh v3.1 fixture/factory. Wiring to the normal start UI is a later gated step. */
export function createRenewalGrowthSave(now = new Date().toISOString()) {
    let s = createGrowthSave(now);
    s.v26 = newProgressiveState();
    s.mega = newMegaState(true);
    s.mega.extended = true;
    s = adoptFinalGrowth(adoptInterior(s, true));
    s.mega.finalGrowth.renewal = { version: 1, menuPolicy: 2, origin: 'new', adoptedAt: now, legacyLevel: 0, retainedMenus: [], retainedSeats: 0, retainedStaff: 0 };
    s.mega.finalGrowth.inheritedWorkingStaff = 0;
    s.mega.finalGrowth.inheritedOperatingSeats = 0;
    s.unlockedMenuIds = menuDefinitions.filter(m => m.unlockCafeLevel === 1).map(m => m.menuId);
    s.menuLevels = Object.fromEntries(s.unlockedMenuIds.map(id => [id, 1]));
    if (!validateGrowthSave(s))
        throw Error('신규 리뉴얼 카페 검증 실패');
    return s;
}
/** Copy-only transition at a new business boundary. An in-flight checkpoint keeps its old contract. */
export function adoptMenuStagePolicy(source) {
    if (!validateGrowthSave(source))
        throw Error('메뉴 이관 전 저장 검증에 실패했어요.');
    const r = source.mega?.finalGrowth?.renewal;
    if (!r || r.menuPolicy === 2 || source.campaign?.run && !source.campaign.run.closed)
        return structuredClone(source);
    const s = structuredClone(source);
    s.mega.finalGrowth.renewal.menuPolicy = 2;
    for (const m of menuDefinitions.filter(m => m.unlockCafeLevel <= s.cafeLevel)) {
        if (!s.unlockedMenuIds.includes(m.menuId)) {
            s.unlockedMenuIds.push(m.menuId);
            s.menuLevels[m.menuId] = 1;
            if (s.v26)
                (s.v26.stock ??= {})[m.menuId] = 0;
        }
    }
    if (!validateGrowthSave(s))
        throw Error('메뉴 단계 저장을 확인해 주세요. 원본은 보존돼요.');
    return s;
}
