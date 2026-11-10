const n = (x, max = 1e12) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max, integer = (x) => n(x) && Number.isSafeInteger(x), id = (x) => typeof x === 'string' && x.length > 0 && x.length <= 128;
export function validPayroll(v) { try {
    const p = v;
    return !!p && p.version === 1 && Array.isArray(p.completedIds) && p.completedIds.length <= 10000 && new Set(p.completedIds).size === p.completedIds.length && p.completedIds.every(id) && Array.isArray(p.history) && p.history.length <= 100 && new Set(p.history.map(r => r.id)).size === p.history.length && p.history.every(r => id(r.id) && p.completedIds.includes(r.id) && n(r.seconds, 900) && [r.due, r.paid, r.waived].every(integer) && r.paid + r.waived === r.due) && (!p.run || id(p.run.id) && n(p.run.seconds, 900) && typeof p.run.settled === 'boolean' && p.run.settled === p.completedIds.includes(p.run.id) && Array.isArray(p.run.crew) && p.run.crew.length <= 25 && new Set(p.run.crew.map(w => w.id)).size === p.run.crew.length && p.run.crew.every(w => /^staff-([1-9]|[1-4][0-9]|50)$/.test(w.id) && integer(w.salary) && w.salary <= 5000 && (w.joinedAt === undefined || n(w.joinedAt, 900) && w.joinedAt <= p.run.seconds)));
}
catch {
    return false;
} }
