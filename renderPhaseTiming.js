/** Opt-in local QA timings; no student data or per-frame history when disabled. */
export const renderPhaseMetrics = { enabled: false, arrivals: { attempts: 0, successes: 0, blocks: {} }, phases: {}, worst: [], slow: [] };
export function enableRenderPhases(enabled) { renderPhaseMetrics.enabled = enabled; renderPhaseMetrics.arrivals = { attempts: 0, successes: 0, blocks: {} }; renderPhaseMetrics.phases = {}; renderPhaseMetrics.slow = []; renderPhaseMetrics.worst = []; }
export function renderPhaseStart() { return renderPhaseMetrics.enabled ? performance.now() : -1; }
export function renderPhaseEnd(phase, start) { if (start < 0)
    return; const ms = performance.now() - start, p = renderPhaseMetrics.phases[phase] ??= { calls: 0, total: 0, max: 0 }; p.calls++; p.total += ms; p.max = Math.max(p.max, ms); if (ms >= 20) {
    renderPhaseMetrics.slow.push({ phase, start, ms });
    renderPhaseMetrics.worst.push({ phase, start, ms, stack: new Error(phase).stack });
    renderPhaseMetrics.worst.sort((a, b) => b.ms - a.ms);
    renderPhaseMetrics.worst.length = Math.min(40, renderPhaseMetrics.worst.length);
    if (renderPhaseMetrics.slow.length > 100)
        renderPhaseMetrics.slow.shift();
} }
export function renderPhase(phase, fn) { if (!renderPhaseMetrics.enabled)
    return fn(); const start = performance.now(); try {
    return fn();
}
finally {
    renderPhaseEnd(phase, start);
} }
export function recordArrival(success, reason) { if (!renderPhaseMetrics.enabled)
    return; const a = renderPhaseMetrics.arrivals; a.attempts++; if (success)
    a.successes++;
else
    a.blocks[reason] = (a.blocks[reason] ?? 0) + 1; }
