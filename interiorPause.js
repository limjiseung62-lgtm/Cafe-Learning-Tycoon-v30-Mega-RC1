import { newTutorialPause, beginTutorialPause, endTutorialPause } from './tutorialPause.js?v=v31-final-636a93f6f215';
/** Reuse the persisted clock credit, so decorating does not catch up all elapsed wall time on close. */
export function beginInteriorEditing(g, save, now = Date.now()) {
    if (g.mode !== 'CAFE_GROWTH' || !g.mega?.finalGrowth?.renewal)
        return false;
    const before = g.tutorialPause && structuredClone(g.tutorialPause);
    g.tutorialPause ??= newTutorialPause();
    if (!beginTutorialPause(g.tutorialPause, 'interior-edit', now)) {
        g.tutorialPause = before;
        return false;
    }
    if (!save()) {
        g.tutorialPause = before;
        return false;
    }
    return true;
}
export function finishInteriorEditing(g, save, now = Date.now()) {
    if (!g.tutorialPause?.active?.reasons.includes('interior-edit'))
        return true;
    endTutorialPause(g.tutorialPause, 'interior-edit', now);
    return save();
}
/** A refreshed page has no surviving editor DOM; retain its earned pause credit and resume safely. */
export function recoverInteriorEditing(g, now = Date.now()) {
    if (g.mode === 'CAFE_GROWTH' && g.tutorialPause?.active?.reasons.includes('interior-edit'))
        endTutorialPause(g.tutorialPause, 'interior-edit', now);
}
