import { validSpecializationStages, massRates, brandRates } from './renewalSpecializationState.js?v=v31-final-636a93f6f215';
export const finalSpecializationOffers = { mass: { name: '대량생산형', cost: 800000, level: 11, space: 10 }, brand: { name: '개성·브랜드형', cost: 350000, level: 11, space: 10 } };
export function validFinalSpecialization(v) { try {
    const s = v;
    return !!s && s.version === 1 && (s.renewal === undefined || validSpecializationStages(s.renewal, s.path)) && ['mass', 'brand'].includes(s.path) && s.receipt === 'final-specialization-v1' && typeof s.selectedAt === 'string' && Number.isFinite(Date.parse(s.selectedAt)) && (s.legacyChoice === undefined ? (s.cost === finalSpecializationOffers[s.path].cost || s.cost === (s.path === 'mass' ? 150000 : 180000)) : ['flower', 'sanctuary', 'factory', 'artisan', 'vip', 'celebration'].includes(s.legacyChoice) && s.cost === 0 && s.path === (s.legacyChoice === 'factory' ? 'mass' : 'brand')) && Object.keys(s).every(k => ['renewal', 'version', 'path', 'selectedAt', 'cost', 'receipt', 'legacyChoice'].includes(k));
}
catch {
    return false;
} }
export const finalSignatureMenus = [{ menuId: 'signature-leaf-latte', name: '나뭇잎 크림 라테', unlockCafeLevel: 11, basePrice: 1000, currentLevel: 1, maxLevel: 5, visualKey: 'signature-leaf-latte' }, { menuId: 'signature-garden-tart', name: '브랜드 정원 타르트', unlockCafeLevel: 15, basePrice: 1600, currentLevel: 1, maxLevel: 5, visualKey: 'signature-garden-tart' }];
export const renewalSignatureMenus = [...finalSignatureMenus, { menuId: 'signature-honey-millefeuille', name: '꿀배 밀푀유', unlockCafeLevel: 21, basePrice: 2200, currentLevel: 1, maxLevel: 5, visualKey: 'signature-honey-millefeuille' }, { menuId: 'signature-orchard-sundae', name: '과수원 선데', unlockCafeLevel: 27, basePrice: 3200, currentLevel: 1, maxLevel: 5, visualKey: 'signature-orchard-sundae' }];
export const signatureMenusFor = (level, s) => s?.path === 'brand' ? (s.renewal ? renewalSignatureMenus.filter((m, i) => i < s.renewal.stage || s.renewal.retainedSignatureIds.includes(m.menuId)) : finalSignatureMenus).filter(m => m.unlockCafeLevel <= level) : [];
export const finalProduction = (base, s) => s?.path === 'mass' ? (s.renewal ? Math.ceil(base * (1 + Math.max(s.renewal.legacyProductionFloor, massRates[s.renewal.stage - 1]))) : Math.min(28, base + Math.max(1, Math.ceil(base * .4)))) : base;
export const brandSignatureChance = (s) => s?.path === 'brand' ? (s.renewal ? Math.max(s.renewal.legacyPriceFloor ? .4 : 0, .25 + .05 * s.renewal.stage) : .4) : 0;
export const brandVisitBonus = (s) => s?.path === 'brand' ? (s.renewal ? Math.max(s.renewal.legacyPriceFloor ? .03 : 0, .01 + .01 * s.renewal.stage) : .03) : 0;
export const finalPriceFactor = (s, menuId) => s?.path === 'brand' ? (s.renewal ? 1 + Math.max(s.renewal.legacyPriceFloor, menuId?.startsWith('signature-') ? brandRates[s.renewal.stage - 1] : 0) : 1.2) : 1;
export const signatureImage = (key) => key === 'signature-honey-millefeuille' ? 'assets/art/renewal-v31/honey-millefeuille.png' : key === 'signature-orchard-sundae' ? 'assets/art/renewal-v31/orchard-sundae.png' : key === 'signature-leaf-latte' ? 'assets/art/final-signature/leaf-latte.png' : key === 'signature-garden-tart' ? 'assets/art/final-signature/garden-tart.png' : undefined;
