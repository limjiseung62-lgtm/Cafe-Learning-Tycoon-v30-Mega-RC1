import { validManagerActions } from './managerActionState.js?v=mega-d152ad969955';
import { legacyCrewLimit } from './finalWorkforcePolicy.js?v=mega-d152ad969955';
import { validPayroll } from './finalPayrollState.js?v=mega-d152ad969955';
import { levelOperatingSeats, levelFloorSeats } from './levelSeatPolicy.js?v=mega-d152ad969955';
import { validFinalSpecialization, signatureMenusFor } from './finalSpecializationState.js?v=mega-d152ad969955';
import { validSupply, validAssignments } from './finalSupplyState.js?v=mega-d152ad969955';
import { explicitDoors } from './finalDoors.js?v=mega-d152ad969955';
import { cafeGrowthBalance } from './modeBalance.js?v=mega-d152ad969955';
export const finalLevelSeats = levelOperatingSeats;
export const finalFloorSeats = levelFloorSeats;
export const finalLocalDeployment = () => typeof document !== 'undefined' && ['local-only', 'public-test'].includes(document.querySelector('meta[name="cafe-final-growth"]')?.getAttribute('content') ?? '');
export function validFinalGrowth(v) { const s = v; return !!s && s.version === 1 && (s.managerActions === undefined || validManagerActions(s.managerActions)) && Number.isSafeInteger(s.inheritedOperatingSeats) && s.inheritedOperatingSeats >= 0 && s.inheritedOperatingSeats <= 256 * 6 && (s.inheritedWorkingStaff === undefined || Number.isSafeInteger(s.inheritedWorkingStaff) && s.inheritedWorkingStaff >= 0 && s.inheritedWorkingStaff <= 25) && (s.payroll === undefined || validPayroll(s.payroll)) && (s.specialization === undefined || validFinalSpecialization(s.specialization)) && (s.supply === undefined || validSupply(s.supply)) && (s.crew === undefined || validAssignments(s.crew)) && Object.keys(s).every(k => ['version', 'inheritedOperatingSeats', 'supply', 'crew', 'specialization', 'payroll', 'inheritedWorkingStaff', 'managerActions'].includes(k)); }
export function adoptFinalGrowth(save) { const s = structuredClone(save); if (s.mega?.paid && !s.mega.finalGrowth) {
    const l = s.cafeLevel, f = s.mega.paid.spaceLevel, base = (x) => x > 29 ? 40 : x >= 20 ? 24 : x >= 16 ? 14 : cafeGrowthBalance.cafes[x - 1].maxCustomers;
    for (const p of Object.values(s.mega.plans))
        p.doors = explicitDoors(p);
    s.mega.finalGrowth = { version: 1, inheritedOperatingSeats: Math.min(base(l), base(f)) };
} if (s.mega?.finalGrowth && s.specialization && !s.mega.finalGrowth.specialization) {
    const legacy = s.specialization;
    s.mega.finalGrowth.specialization = { version: 1, path: legacy.selected === 'factory' ? 'mass' : 'brand', selectedAt: legacy.selectedAt, cost: 0, receipt: 'final-specialization-v1', legacyChoice: legacy.selected };
    for (const m of signatureMenusFor(s.cafeLevel, s.mega.finalGrowth.specialization)) {
        if (!s.unlockedMenuIds.includes(m.menuId))
            s.unlockedMenuIds.push(m.menuId);
        s.menuLevels[m.menuId] ??= 1;
        if (s.v26)
            (s.v26.stock ??= {})[m.menuId] ??= 0;
    }
} if (s.mega?.finalGrowth) {
    s.mega.finalGrowth.inheritedWorkingStaff ??= legacyCrewLimit(s.cafeLevel, s.mega.paid?.spaceLevel ?? 1);
    if (s.management)
        s.management.legacyArchiveOnly = true;
    if (s.village)
        s.village.legacyArchiveOnly = true;
} return s; }
export const finalActive = (g) => g.mode === 'CAFE_GROWTH' && !!g.mega?.finalGrowth;
export function operatingSeatContract(g) { const m = g.mega, p = m?.plans[(g.branchId ?? 'base') + ':' + m?.paid?.spaceLevel], installed = p?.tables.reduce((n, t) => n + (t.integratedSeats || !t.chairs ? (t.kind === 'four' ? 4 : t.kind === 'long' ? 6 : 2) : t.chairs.length), 0) ?? 0; const level = finalLevelSeats[Math.max(0, Math.min(29, g.cafeLevel - 1))], floor = finalFloorSeats[m?.paid?.spaceLevel ?? 1] ?? 4, limit = Math.max(m?.finalGrowth?.inheritedOperatingSeats ?? 0, Math.min(level, floor)); const accessible = g.serviceSpace && g.serviceSpace.megaPlan === p ? g.serviceSpace.seats.filter(s => s.entryPath.length > 0).length : installed; return { installed, accessible, levelLimit: level, floorLimit: floor, operatingLimit: limit, operating: Math.min(accessible, limit), concurrentGuestLimit: Math.min(80, accessible, limit) }; }
export const finalLevelRewards = finalLevelSeats.map((seats, i) => ({ level: i + 1, immediate: '운영 좌석 권한 최대 ' + seats + '석 (소유 공간·배치·동선 필요)', purchase: [4, 10, 20, 30].includes(i + 1) ? '다음 매장 증축 구매 자격' : '가구를 구매해 늘어난 운영 권한 활용', automaticFurniture: 0, automaticFloor: 0 }));
