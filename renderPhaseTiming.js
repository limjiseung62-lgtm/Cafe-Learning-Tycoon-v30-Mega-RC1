/** Opt-in local QA timings; no student data or per-frame history when disabled. */
export const renderPhaseMetrics = { enabled: false, phases: {}, slow: [] };
export function enableRenderPhases(enabled) { renderPhaseMetrics.enabled = enabled; renderPhaseMetrics.phases = {}; renderPhaseMetrics.slow = []; }
export function renderPhaseStart() { return renderPhaseMetrics.enabled ? performance.now() : -1; }
export function renderPhaseEnd(phase, start) { if (start < 0)
    return; const ms = performance.now() - start, p = renderPhaseMetrics.phases[phase] ??= { calls: 0, total: 0, max: 0 }; p.calls++; p.total += ms; p.max = Math.max(p.max, ms); if (ms >= 20) {
    renderPhaseMetrics.slow.push({ phase, start, ms });
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
