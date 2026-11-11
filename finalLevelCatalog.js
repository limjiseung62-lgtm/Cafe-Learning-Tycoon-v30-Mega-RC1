import { finalCrewLimit } from './finalWorkforcePolicy.js?v=mega-d152ad969955';
import { menuDefinitions } from './data.js?v=mega-d152ad969955';
import { levelOperatingSeats } from './levelSeatPolicy.js?v=mega-d152ad969955';
import { expansionStages, megaExpansionCosts } from './megaExpansion.js?v=mega-d152ad969955';
import { kitchenStages } from './productionKitchen.js?v=mega-d152ad969955';
import { finalSpecializationOffers } from './finalSpecializationState.js?v=mega-d152ad969955';
/** Read-only catalog of actual entitlements. Purchase entries are never free grants. */
export function finalLevelCatalog() {
    return levelOperatingSeats.map((operatingSeats, i) => {
        const level = i + 1, previous = levelOperatingSeats[i - 1] ?? 0;
        const menus = menuDefinitions.filter(m => m.unlockCafeLevel === level).map(m => ({ id: m.menuId, name: m.name }));
        const purchases = [...expansionStages.filter(s => s.requiredLevel === level && s.cost > 0).map(s => ({ kind: 'space', name: s.size.join('×') + ' 매장 증축', cost: megaExpansionCosts[s.level] ?? s.cost, requiredSpace: 0 })), ...kitchenStages.filter((s, n) => n > 0 && s.level === level).map(s => ({ kind: 'kitchen', name: s.name + ' · 메뉴별 +' + s.amount, cost: s.cost, requiredSpace: s.space })), ...Object.values(finalSpecializationOffers).filter(s => s.level === level).map(s => ({ kind: 'specialization', name: s.name, cost: s.cost, requiredSpace: s.space }))];
        return { level, workingStaffQualification: finalCrewLimit(level, 30, 0), staffByPurchasedSpace: { small: finalCrewLimit(level, 1, 0), medium: finalCrewLimit(level, 10, 0), large: finalCrewLimit(level, 20, 0), mega: finalCrewLimit(level, 30, 0) }, operatingSeats, extraOperatingSeats: operatingSeats - previous, concurrentGuests: Math.min(80, operatingSeats), menus, purchases, automaticFurniture: 0, automaticFloor: 0 };
    });
}
export function finalLevelNotice(level) { const row = finalLevelCatalog()[level - 1]; if (!row)
    return ''; return 'Lv.' + level + ' · 운영 권한 ' + row.operatingSeats + '석 · 직원 자격 최대 ' + row.workingStaffQualification + '명(증축 조건 별도)' + (row.menus.length ? ' · 새 메뉴 ' + row.menus.map(m => m.name).join('·') : '') + (row.purchases.length ? ' · 새 구매 자격 ' + row.purchases.map(p => p.name).join('·') : '') + ' · 증축·가구는 직접 구매'; }
