export const specializationLevels = [11, 15, 21, 27];
export const specializationUpgradeCosts = { mass: [0, 400000, 900000, 1800000], brand: [0, 300000, 700000, 1400000] };
export const massRates = [.2, .35, .5, .7], brandRates = [0, .1, .2, .3];
export const newSpecializationStages = () => ({ stage: 1, legacyProductionFloor: 0, legacyPriceFloor: 0, retainedSignatureIds: [], receipts: [] });
export function validSpecializationStages(v, path) { try {
    const s = v;
    return Number.isInteger(s.stage) && s.stage >= 1 && s.stage <= 4 && [0, .4].includes(s.legacyProductionFloor) && [0, .2].includes(s.legacyPriceFloor) && (path === 'mass' ? s.legacyPriceFloor === 0 && s.retainedSignatureIds.length === 0 : s.legacyProductionFloor === 0) && Array.isArray(s.retainedSignatureIds) && new Set(s.retainedSignatureIds).size === s.retainedSignatureIds.length && s.retainedSignatureIds.every(id => ['signature-leaf-latte', 'signature-garden-tart'].includes(id)) && Array.isArray(s.receipts) && s.receipts.length === s.stage - 1 && s.receipts.every((r, i) => r.stage === i + 2 && r.id === 'specialization-' + r.stage && r.cost === specializationUpgradeCosts[path][i + 1]) && Object.keys(s).every(k => ['stage', 'legacyProductionFloor', 'legacyPriceFloor', 'retainedSignatureIds', 'receipts'].includes(k));
}
catch {
    return false;
} }
