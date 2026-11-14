import { validRenewalRewards } from './renewalRewardState.js';
import { validRenewalFacilities } from './renewalFacilities.js';
import { validRenewalTutorials } from './renewalTutorialState.js';
import { validAppearance } from './renewalAppearanceState.js';
import { menuDefinitions } from './data.js';
/** Growth-only draft policy. CLASS and saves without renewal metadata keep v3.0 rules. */
export const legacyRenewalMenuLevels = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26, 27, 28, 30];
/** Original six menu stages, three dishes each. Floor ownership is independent. */
export const renewalMenuLevels = menuDefinitions.map(m => m.unlockCafeLevel);
export const cafeMenuStage = (level) => Math.min(6, Math.max(1, Math.floor(level)));
export const renewalSeats = [4, 4, 5, 5, 6, 6, 6, 7, 8, 10, 12, 14, 17, 20, 24, 28, 32, 37, 43, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
/** Local candidate: late qualification prices tuned against repeated-session synthetic economy. Never a real-student duration guarantee. */
export const renewalGrowthCosts = [0, 6000, 8000, 16000, 24000, 45000, 60000, 80000, 100000, 130000, 255000, 315000, 390000, 480000, 585000, 705000, 840000, 1005000, 1185000, 1395000, 1650000, 1875000, 2100000, 2325000, 2550000, 2775000, 3000000, 3225000, 3450000, 3750000];
export const renewalExperiences = ["기본 메뉴 3종·무료 2테이블·4석·필수 주방", "메뉴 2단계 3종·소품 꾸미기", "메뉴 3단계 3종·첫 직원 고용 자격", "메뉴 4단계 3종·창고 강화", "메뉴 5단계 3종·첫 유료 증축 자격", "메뉴 6단계 3종·외벽·창문·간판 구매", "가구·손님 도감 확장", "운영 7석 자격·손님 도감 확장", "직원 교육", "중형 외관·증축 자격", "전문화 선택", "운영 14석 자격·손님 도감 확장", "보조 서빙대 구매 자격", "직원 담당 구역·대기 위치", "전문화 2단계 강화", "추가 출입구 구매 자격", "운영 32석 자격", "VIP 손님·직원 채용 후보 증가", "운영 43석 자격", "대형 외관·증축·대형 주방 자격", "전문화 3단계 강화", "테라스·VIP 라운지 마감 구매 자격", "구역 책임자 지정", "브랜드 간판·운영 70석 자격", "중앙 생산 주방·직원 18명 자격", "운영 80석 자격", "전문화 4단계 강화", "운영 90석 자격", "랜드마크 외관·최종 유료 증축 자격", "100석·직원 25명·프랜차이즈"];
export function validRenewal(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return false;
    const s = v, integer = (n, max) => Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= max;
    return s.version === 1 && (s.rewards === undefined || validRenewalRewards(s.rewards)) && (s.menuPolicy === undefined || s.menuPolicy === 2) && (s.facilities === undefined || validRenewalFacilities(s.facilities)) && (s.tutorials === undefined || validRenewalTutorials(s.tutorials)) && (s.appearance === undefined || validAppearance(s.appearance)) && ['new', 'legacy'].includes(s.origin) && typeof s.adoptedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(s.adoptedAt) && Number.isFinite(Date.parse(s.adoptedAt)) && integer(s.legacyLevel, 30) && integer(s.retainedSeats, 256 * 6) && integer(s.retainedStaff, 25) && Array.isArray(s.retainedMenus) && new Set(s.retainedMenus).size === s.retainedMenus.length && s.retainedMenus.every(id => menuDefinitions.some(m => m.menuId === id && m.unlockCafeLevel <= s.legacyLevel)) && (s.origin !== 'new' || s.legacyLevel === 0 && s.retainedMenus.length === 0 && s.retainedSeats === 0 && s.retainedStaff === 0) && Object.keys(s).every(k => ['rewards', 'menuPolicy', 'facilities', 'tutorials', 'appearance', 'version', 'origin', 'adoptedAt', 'legacyLevel', 'retainedMenus', 'retainedSeats', 'retainedStaff'].includes(k));
}
export function renewalMenus(level, s) { const levels = s.menuPolicy === 2 ? renewalMenuLevels : legacyRenewalMenuLevels; return menuDefinitions.map((m, i) => ({ ...m, unlockCafeLevel: s.retainedMenus.includes(m.menuId) ? Math.min(levels[i], m.unlockCafeLevel) : levels[i] })).filter(m => m.unlockCafeLevel <= level); }
export function renewalStaffLimit(level, space, s) { const limit = level < 3 ? 0 : level < 5 ? 1 : level < 10 ? 2 : level < 15 ? 4 : level < 20 ? 7 : level < 25 ? 12 : level < 30 ? 18 : 25; const floor = space >= 30 ? 25 : space >= 20 ? 18 : space >= 10 ? 8 : 5; return Math.max(s.retainedStaff, Math.min(limit, floor)); }
export const renewalExpansionLevel = (space, s) => s?.origin === 'legacy' && s.legacyLevel >= space ? space : space === 4 ? 5 : space === 30 ? 29 : space;
export function renewalLevelRows() { return renewalSeats.map((seats, i) => ({ level: i + 1, cost: renewalGrowthCosts[i], seats, experience: renewalExperiences[i], menus: menuDefinitions.filter((_, n) => renewalMenuLevels[n] === i + 1).map(m => m.menuId), automaticFloor: 0, automaticFurniture: 0, costStatus: 'local-synthetic-economy-calibration' })); }
