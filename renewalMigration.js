import { newSpecializationStages } from './renewalSpecializationState.js?v=v31-5d872fe24674';
import { adoptFinalGrowth, operatingSeatContract } from './finalGrowth.js?v=v31-5d872fe24674';
import { menuDefinitions } from './data.js?v=v31-5d872fe24674';
import { crewLimit } from './staffRecruitment.js?v=v31-5d872fe24674';
import { validateGrowthSave, createGrowthSave } from './growthSave.js?v=v31-5d872fe24674';
import { newMegaState } from './megaSpace.js?v=v31-5d872fe24674';
import { adoptInterior } from './megaInventory.js?v=v31-5d872fe24674';
import { newProgressiveState } from './progressiveFeatures.js?v=v31-5d872fe24674';
/** Explicit migration API, never invoked as a side effect of preview/validation. */
export function adoptRenewal(source, now = new Date().toISOString()) {
    if (!validateGrowthSave(source))
        throw Error('리뉴얼 전 원본 저장 검증에 실패했어요. 원본은 보존됩니다.');
    if (!source.mega?.finalGrowth || !source.mega.paid)
        throw Error('메가 카페 저장만 리뉴얼할 수 있어요.');
    if (source.mega.finalGrowth.renewal)
        return structuredClone(source);
    const seats = operatingSeatContract({ mode: 'CAFE_GROWTH', mega: source.mega, cafeLevel: source.cafeLevel, branchId: source.growthBranch?.active ?? undefined }).operatingLimit;
    const renewal = { version: 1, origin: 'legacy', adoptedAt: now, legacyLevel: source.cafeLevel, retainedMenus: source.unlockedMenuIds.filter(id => menuDefinitions.some(m => m.menuId === id)), retainedSeats: seats, retainedStaff: Math.max(crewLimit(source), source.staffOwned.length) };
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
    s.mega.finalGrowth.renewal = { version: 1, origin: 'new', adoptedAt: now, legacyLevel: 0, retainedMenus: [], retainedSeats: 0, retainedStaff: 0 };
    s.mega.finalGrowth.inheritedWorkingStaff = 0;
    s.mega.finalGrowth.inheritedOperatingSeats = 0;
    s.unlockedMenuIds = [menuDefinitions[0].menuId];
    s.menuLevels = { [menuDefinitions[0].menuId]: 1 };
    if (!validateGrowthSave(s))
        throw Error('신규 리뉴얼 카페 검증 실패');
    return s;
}
