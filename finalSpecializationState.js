export const finalSpecializationOffers = { mass: { name: '대량생산형', cost: 800000, level: 11, space: 10 }, brand: { name: '개성·브랜드형', cost: 350000, level: 11, space: 10 } };
export function validFinalSpecialization(v) { try {
    const s = v;
    return !!s && s.version === 1 && ['mass', 'brand'].includes(s.path) && s.receipt === 'final-specialization-v1' && typeof s.selectedAt === 'string' && Number.isFinite(Date.parse(s.selectedAt)) && (s.legacyChoice === undefined ? (s.cost === finalSpecializationOffers[s.path].cost || s.cost === (s.path === 'mass' ? 150000 : 180000)) : ['flower', 'sanctuary', 'factory', 'artisan', 'vip', 'celebration'].includes(s.legacyChoice) && s.cost === 0 && s.path === (s.legacyChoice === 'factory' ? 'mass' : 'brand')) && Object.keys(s).every(k => ['version', 'path', 'selectedAt', 'cost', 'receipt', 'legacyChoice'].includes(k));
}
catch {
    return false;
} }
export const finalSignatureMenus = [{ menuId: 'signature-leaf-latte', name: '나뭇잎 크림 라테', unlockCafeLevel: 11, basePrice: 1000, currentLevel: 1, maxLevel: 5, visualKey: 'signature-leaf-latte' }, { menuId: 'signature-garden-tart', name: '브랜드 정원 타르트', unlockCafeLevel: 15, basePrice: 1600, currentLevel: 1, maxLevel: 5, visualKey: 'signature-garden-tart' }];
export const signatureMenusFor = (level, s) => s?.path === 'brand' ? finalSignatureMenus.filter(m => m.unlockCafeLevel <= level) : [];
export const finalProduction = (base, s) => s?.path === 'mass' ? Math.min(28, base + Math.max(1, Math.ceil(base * .4))) : base;
export const finalPriceFactor = (s) => s?.path === 'brand' ? 1.2 : 1;
export const signatureImage = (key) => key === 'signature-leaf-latte' ? 'assets/art/final-signature/leaf-latte.png' : key === 'signature-garden-tart' ? 'assets/art/final-signature/garden-tart.png' : undefined;
