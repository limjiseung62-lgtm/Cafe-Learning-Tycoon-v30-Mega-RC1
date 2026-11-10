import { finalProfile } from './recruitConfig.js?v=mega-5d509fb5dbfc';
export const finalSalary = (id) => finalProfile(id)?.salary ?? ([60, 80, 95, 140, 90, 110, 110, 150, 150, 160, 180, 200][Number(id.split('-')[1]) - 1] ?? 0);
/** The displayed wage is paid out of this lesson's actual sales, never by retroactive debt or negative cash. */
export function startFinalPayroll(g, id) { if (g.mode !== 'CAFE_GROWTH' || !g.mega?.finalGrowth || g.status !== 'RUNNING')
    return false; const p = g.mega.finalGrowth.payroll ??= { version: 1, completedIds: [], history: [] }; if (p.run?.id === id || p.completedIds.includes(id))
    return false; p.run = { id, seconds: 0, crew: g.service.paid.map(w => ({ id: w.staffId, salary: finalSalary(w.staffId) })), settled: false }; return true; }
export function tickFinalPayroll(g, dt) { const r = g.mode === 'CAFE_GROWTH' ? g.mega?.finalGrowth?.payroll?.run : undefined; if (r && !r.settled && g.status === 'RUNNING')
    r.seconds = Math.min(900, r.seconds + dt); }
export function settleFinalPayroll(g, id) { const p = g.mode === 'CAFE_GROWTH' ? g.mega?.finalGrowth?.payroll : undefined, r = p?.run; if (!p || !r || r.id !== id || r.settled || g.status !== 'CLOSED' || p.completedIds.includes(id) || p.completedIds.length >= 10000)
    return 0; const due = Math.floor(r.crew.reduce((n, w) => n + w.salary * Math.max(0, r.seconds - (w.joinedAt ?? 0)), 0) / 900), paid = Math.max(0, Math.min(due, Math.floor(g.money), Math.floor(g.stats.revenue))); p.completedIds.push(id); r.settled = true; p.history.push({ id, seconds: r.seconds, due, paid, waived: due - paid }); p.history = p.history.slice(-100); g.money -= paid; return paid; }
