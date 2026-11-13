import { validRenewalTutorials } from './renewalTutorialState.js?v=v31-final-636a93f6f215';
export const newTutorialPause = () => ({ version: 1, segments: [] });
export function validTutorialPause(v) { try {
    const p = v, finite = (n) => Number.isSafeInteger(n) && n >= 0;
    return p.version === 1 && (p.progress === undefined || validRenewalTutorials(p.progress)) && Array.isArray(p.segments) && p.segments.length <= 256 && p.segments.every((s, i) => finite(s.start) && finite(s.end) && s.end >= s.start && (!i || s.start >= p.segments[i - 1].end)) && (!p.active || finite(p.active.start) && p.active.start >= (p.segments.at(-1)?.end ?? 0) && Array.isArray(p.active.reasons) && p.active.reasons.length > 0 && p.active.reasons.length <= 12 && new Set(p.active.reasons).size === p.active.reasons.length && p.active.reasons.every(r => /^(tutorial-(1|3|5|6|9|11|13|14|16|20|23|30)|interior-edit)$/.test(r))) && Object.keys(p).every(k => ['version', 'progress', 'segments', 'active'].includes(k));
}
catch {
    return false;
} }
export function beginTutorialPause(p, reason, now = Date.now()) { if (!/^(tutorial-(1|3|5|6|9|11|13|14|16|20|23|30)|interior-edit)$/.test(reason) || p.segments.length >= 256)
    return false; now = Math.max(Math.floor(now), p.segments.at(-1)?.end ?? 0); if (p.active) {
    if (!p.active.reasons.includes(reason))
        p.active.reasons.push(reason);
}
else
    p.active = { start: now, reasons: [reason] }; return true; }
export function endTutorialPause(p, reason, now = Date.now()) { if (!p.active)
    return; const a = p.active; a.reasons = a.reasons.filter(r => r !== reason); if (a.reasons.length)
    return; p.segments.push({ start: a.start, end: Math.max(a.start, Math.floor(now)) }); delete p.active; }
/** Tutorial credit only; subtract overlap already paid by the existing mini-game clock. */
export function tutorialPauseCredit(p, now = Date.now(), mini) { if (!p)
    return 0; const segments = [...p.segments, ...p.active ? [{ start: p.active.start, end: Math.max(p.active.start, now) }] : []]; let total = 0; for (const s of segments) {
    const intervals = (mini?.offers ?? []).flatMap(o => o.lease ? [{ start: Math.max(s.start, o.lease.startedAt), end: Math.min(s.end, o.lease.endedAt ?? now, o.lease.deadlineAt) }] : []).filter(i => i.end > i.start).sort((a, b) => a.start - b.start);
    let overlap = 0, end = -1;
    for (const i of intervals) {
        overlap += Math.max(0, i.end - Math.max(i.start, end));
        end = Math.max(end, i.end);
    }
    total += s.end - s.start - overlap;
} return total; }
