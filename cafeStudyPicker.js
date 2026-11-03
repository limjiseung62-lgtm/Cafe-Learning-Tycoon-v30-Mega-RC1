import { CommonLearningCatalog, mountCommonPicker } from './commonLearningCatalog.js?v=commerce-6afe2d573839';
import { questionCatalog } from './questionPack.js?v=commerce-6afe2d573839';
const cleanups = new WeakMap();
/** Café controls only. This never changes eligibility, pack IDs, grading or saved scopes. */
export function mountCafeStudyPicker(select, packs) {
    cleanups.get(select)?.();
    if (questionCatalog instanceof CommonLearningCatalog) {
        const cleanup = mountCommonPicker(select, questionCatalog);
        cleanups.set(select, cleanup);
        return cleanup;
    }
    const host = select.parentElement;
    host.querySelector('.cafe-study-picker')?.remove();
    const panel = document.createElement('div');
    panel.className = 'cafe-study-picker';
    const controls = ['과목', '학년', '학기', '단원'].map((name, i) => { const label = document.createElement('label'), s = document.createElement('select'); label.textContent = name; s.id = ['study-subject', 'study-grade', 'study-semester', 'study-unit'][i]; s.setAttribute('aria-label', name); label.append(s); panel.append(label); return s; });
    const [subject, grade, semester, unit] = controls;
    const options = (s, rows, value) => { s.replaceChildren(...rows.map(r => { const o = document.createElement('option'); o.value = r.value; o.textContent = r.label; return o; })); s.value = rows.some(r => r.value === value) ? value : rows[0]?.value ?? ''; };
    const unique = (values) => [...new Set(values)];
    let syncing = false;
    const render = (fromPack = false) => { if (syncing)
        return; syncing = true; try {
        const chosen = packs.find(p => p.packId === select.value);
        options(subject, unique(packs.map(p => p.subject)).map(value => ({ value, label: value })), fromPack ? chosen?.subject ?? '' : subject.value);
        let filtered = packs.filter(p => p.subject === subject.value);
        options(grade, unique(filtered.map(p => String(p.grade))).sort((a, b) => Number(a) - Number(b)).map(value => ({ value, label: value + '학년' })), fromPack ? String(chosen?.grade ?? '') : grade.value);
        filtered = filtered.filter(p => String(p.grade) === grade.value);
        options(semester, unique(filtered.map(p => String(p.semester))).sort().map(value => ({ value, label: value + '학기' })), fromPack ? String(chosen?.semester ?? '') : semester.value);
        filtered = filtered.filter(p => String(p.semester) === semester.value);
        options(unit, filtered.map(p => ({ value: p.packId, label: p.unit })), fromPack ? chosen?.packId ?? '' : unit.value);
        if (select.value !== unit.value) {
            select.value = unit.value;
            select.dispatchEvent(new Event('change'));
        }
        const current = packs.find(p => p.packId === select.value), title = host.querySelector('#study-title');
        if (title && current)
            title.textContent = current.selectionLabel ?? current.title;
        for (const c of controls)
            c.disabled = select.disabled;
    }
    finally {
        syncing = false;
    } };
    subject.onchange = grade.onchange = semester.onchange = () => render();
    unit.onchange = () => { if (select.disabled)
        return; select.value = unit.value; select.dispatchEvent(new Event('change')); };
    const changed = () => render(true);
    select.addEventListener('change', changed);
    // Existing resume code locks the original pack select. Keep every visible control locked too.
    const observer = new MutationObserver(() => { for (const c of controls)
        c.disabled = select.disabled; if (!host.isConnected)
        observer.disconnect(); });
    observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
    host.append(panel);
    select.hidden = true;
    render(true);
    const cleanup = () => { observer.disconnect(); select.removeEventListener('change', changed); panel.remove(); cleanups.delete(select); };
    cleanups.set(select, cleanup);
    return cleanup;
}
