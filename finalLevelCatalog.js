import { studioFurniture } from './renewalFurnitureCatalog.js';
import { menuEnhancementCap } from './renewalMenuQuality.js';
import { appearanceCatalog } from './renewalAppearanceState.js';
import { specializationLevels, specializationUpgradeCosts } from './renewalSpecializationState.js';
import { renewalFacilityCatalog } from './renewalFacilities.js';
import { renewalGuestCount, renewalStaffCount } from './renewalRosterPolicy.js';
import { renewalMenus, renewalSeats, renewalGrowthCosts, renewalStaffLimit, renewalExpansionLevel } from './renewalPolicy.js';
import { finalCrewLimit } from './finalWorkforcePolicy.js';
import { menuDefinitions } from './data.js';
import { levelOperatingSeats } from './levelSeatPolicy.js';
import { expansionStages, megaExpansionCosts } from './megaExpansion.js';
import { kitchenStages } from './productionKitchen.js';
import { finalSpecializationOffers } from './finalSpecializationState.js';
/** Read-only catalog of actual entitlements. Purchase entries are never free grants. */
export function finalLevelCatalog(renewal) {
    return (renewal ? renewalSeats : levelOperatingSeats).map((operatingSeats, i) => {
        const level = i + 1, previous = (renewal ? renewalSeats : levelOperatingSeats)[i - 1] ?? 0;
        const menus = (renewal ? renewalMenus(level, renewal) : menuDefinitions).filter(m => m.unlockCafeLevel === level).map(m => ({ id: m.menuId, name: m.name }));
        const abilities = renewal ? { 3: ['직원 채용'], 4: ['창고 강화'], 9: ['직원 교육'], 14: ['직원 담당 구역·대기 위치'], 23: ['구역 책임자 지정'], 30: ['프랜차이즈 본부·기업 경영'] }[level] ?? [] : [];
        const purchases = [...renewal?.menuPolicy === 2 ? studioFurniture.filter(x => x.level === level && !x.rewardOnly).map(x => ({ kind: 'furniture', name: x.name, cost: x.cost, requiredSpace: 0 })) : [], ...renewal ? [...level === 13 ? [{ kind: 'supply', name: '보조 서빙대', cost: 24000, requiredSpace: 0 }] : [], ...level === 16 ? [{ kind: 'door', name: '추가 출입구', cost: 75000, requiredSpace: 0 }] : [], ...appearanceCatalog.filter(x => x.level === level && x.cost > 0).map(x => ({ kind: 'appearance', name: x.name, cost: x.cost, requiredSpace: 0 })), ...renewalFacilityCatalog.filter(x => x.level === level).map(x => ({ kind: 'facility', name: x.name, cost: x.cost, requiredSpace: x.space })), ...specializationLevels.flatMap((at, i) => at === level && i > 0 ? ['mass', 'brand'].map(path => ({ kind: 'specialization-stage', name: (path === 'mass' ? '대량생산' : '브랜드') + ' ' + (i + 1) + '단계', cost: specializationUpgradeCosts[path][i], requiredSpace: 10 })) : [])] : [], ...expansionStages.map(s => renewal ? { ...s, requiredLevel: renewalExpansionLevel(s.level, renewal) } : s).filter(s => s.requiredLevel === level && s.cost > 0).map(s => ({ kind: 'space', name: s.size.join('×') + ' 매장 증축', cost: megaExpansionCosts[s.level] ?? s.cost, requiredSpace: 0 })), ...kitchenStages.filter((s, n) => n > 0 && s.level === level).map(s => ({ kind: 'kitchen', name: s.name + ' · 메뉴별 +' + s.amount, cost: s.cost, requiredSpace: s.space })), ...Object.values(finalSpecializationOffers).filter(s => s.level === level).map(s => ({ kind: 'specialization', name: s.name, cost: s.cost, requiredSpace: s.space }))];
        if (renewal?.menuPolicy === 2 && [1, 6, 11, 16, 21, 26].includes(level))
            abilities.push('메뉴 강화 상한 +' + menuEnhancementCap(level));
        return { level, abilities, ...renewal ? { guestTypes: renewalGuestCount(level), staffCandidateTypes: renewalStaffCount(level) } : {}, growthCost: renewal ? renewalGrowthCosts[i] : undefined, workingStaffQualification: renewal ? renewalStaffLimit(level, 30, renewal) : finalCrewLimit(level, 30, 0), staffByPurchasedSpace: { small: (renewal ? renewalStaffLimit(level, 1, renewal) : finalCrewLimit(level, 1, 0)), medium: (renewal ? renewalStaffLimit(level, 10, renewal) : finalCrewLimit(level, 10, 0)), large: (renewal ? renewalStaffLimit(level, 20, renewal) : finalCrewLimit(level, 20, 0)), mega: renewal ? renewalStaffLimit(level, 30, renewal) : finalCrewLimit(level, 30, 0) }, operatingSeats, extraOperatingSeats: operatingSeats - previous, concurrentGuests: Math.min(80, operatingSeats), menus, purchases, automaticFurniture: 0, automaticFloor: 0 };
    });
}
export function finalLevelNotice(level, renewal) { const row = finalLevelCatalog(renewal)[level - 1]; if (!row)
    return ''; return 'Lv.' + level + ' · 운영 권한 ' + row.operatingSeats + '석 · 직원 자격 최대 ' + row.workingStaffQualification + '명(증축 조건 별도)' + (row.menus.length ? ' · 새 메뉴 ' + row.menus.map(m => m.name).join('·') : '') + (row.purchases.length ? ' · 새 구매 자격 ' + row.purchases.map(p => p.name).join('·') : '') + (row.abilities.length ? ' · 새 조작 ' + row.abilities.join('·') : '') + ' · 증축·가구는 직접 구매'; }
