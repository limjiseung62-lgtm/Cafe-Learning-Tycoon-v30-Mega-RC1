/** Release only views whose common learning archive committed successfully. */
export function releaseResultView(root) { const reports = [...root.querySelectorAll('.learning-report')]; if (reports.some(r => r.dataset.commonArchiveReady !== 'true'))
    return false; root.replaceChildren(); return true; }
