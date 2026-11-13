export const rewardKinds = ['stock', 'furniture', 'training', 'kitchen', 'warehouse', 'decoration'];
export const newRenewalRewards = () => ({ version: 1, grants: [], vouchers: [], uses: [] });
export function rewardCash(level, kind, grade = 1) { const tier = Math.min(5, Math.max(0, Math.floor((level - 1) / 5))), base = (kind === 'mini' ? [1500, 6000, 18000, 45000, 110000, 280000] : [2500, 10000, 25000, 60000, 150000, 360000])[tier]; return Math.round(base * (grade === 3 ? 1.5 : grade === 2 ? 1.25 : 1)); }
export function validRenewalRewards(v) { try {
    const s = v, id = (x) => typeof x === 'string' && x.length > 0 && x.length <= 200;
    return s.version === 1 && Array.isArray(s.grants) && s.grants.length <= 2000 && new Set(s.grants.map(r => r.id)).size === s.grants.length && s.grants.every(r => id(r.id) && ['mini', 'mission'].includes(r.kind) && Number.isSafeInteger(r.level) && r.level >= 1 && r.level <= 30 && [1, 2, 3].includes(r.grade) && r.cash === rewardCash(r.level, r.kind, r.grade)) && Array.isArray(s.vouchers) && s.vouchers.length <= 4000 && new Set(s.vouchers.map(r => r.id)).size === s.vouchers.length && s.vouchers.every(r => id(r.id) && rewardKinds.includes(r.kind) && typeof r.used === 'boolean' && s.grants.some(g => r.id === g.id + ':' + r.kind)) && Array.isArray(s.uses) && s.uses.length <= 4000 && new Set(s.uses.map(r => r.voucher)).size === s.uses.length && s.uses.every((r, i) => r.id === 'reward-use-' + (i + 1) && id(r.target) && Number.isSafeInteger(r.amount) && r.amount >= 0 && s.vouchers.some(v => v.id === r.voucher && v.kind === r.kind && v.used)) && s.vouchers.every(v => v.used === s.uses.some(u => u.voucher === v.id)) && Object.keys(s).every(k => ['version', 'grants', 'vouchers', 'uses'].includes(k));
}
catch {
    return false;
} }
