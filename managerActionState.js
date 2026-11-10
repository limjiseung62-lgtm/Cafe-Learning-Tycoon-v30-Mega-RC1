export function validManagerActions(v) { try {
    const s = v;
    return s.version === 1 && Number.isSafeInteger(s.serial) && s.serial >= 0 && s.serial <= 10000 && Array.isArray(s.receipts) && s.receipts.length <= 100 && new Set(s.receipts.map(r => r.id)).size === s.receipts.length && s.receipts.every(r => /^manager-[0-9]+$/.test(r.id) && Number(r.id.slice(8)) <= s.serial && ['setup', 'hire', 'roles', 'kitchen', 'storage', 'training', 'logistics'].includes(r.kind) && Number.isSafeInteger(r.cost) && r.cost >= 0 && Number.isFinite(Date.parse(r.at)));
}
catch {
    return false;
} }
