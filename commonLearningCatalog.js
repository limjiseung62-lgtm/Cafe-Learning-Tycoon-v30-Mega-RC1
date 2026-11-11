import { QuestionPackCatalog } from './questionPack.js?v=mega-d152ad969955';
import { loadCommonRuntime } from './commonBankLoader.js?v=mega-d152ad969955';
import { safeCommonDiagram } from './questionRenderer.js?v=mega-d152ad969955';
export const commonDeployment = () => typeof document !== 'undefined' && ['v30e-city-integrated-local', 'v30e-common-local', 'v30e-v31-local'].includes(document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '');
export function commonAnswerText(q) { const text = q.render?.choices?.find((c) => c.id === q.assessment?.answer?.choiceId)?.text; if (typeof text !== 'string' || !text)
    throw Error('정답 연결을 확인해 주세요.'); return text; }
export function commonQuestion(q, packId, choices, subject, unitLabel) { if (q.metadata.questionType !== 'single-choice' || (q.render.inputKind !== undefined && q.render.inputKind !== 'choice') || !Array.isArray(q.render.choices) || new Set(q.render.choices.map((c) => c.text)).size !== q.render.choices.length || q.render.svg && !safeCommonDiagram(q.render.svg))
    throw Error('아직 카페에서 검증되지 않은 문항 형식이에요. 다른 문제로 바꿔 채우지 않아요.'); const answer = commonAnswerText(q); if (!answer)
    throw Error('정답 연결을 확인해 주세요.'); return { problemId: q.questionId, questionId: q.questionId, sourceId: q.questionId, packId, subject: ({ 'math': '수학', 'science': '과학', 'korean-literacy': '국어', 'social-studies': '사회' }[subject]), grade: q.metadata.grade, semester: q.metadata.semester, unit: unitLabel, type: 'multiple_choice', difficulty: q.metadata.difficulty, question: q.render.text, prompt: q.render.text, choices: q.render.choices.map((c) => c.text), choiceIds: q.render.choices.map((c) => c.id), answer, explanation: q.assessment.explanation, hint: q.assessment.hint, diagram: q.render.svg || undefined, skillId: q.metadata.skillIds[0], tags: [unitLabel], packVersion: q.metadata.packVersion, commonRef: q.questionRef, commonChoice: { subject, choices } }; }
export class CommonLearningCatalog extends QuestionPackCatalog {
    subjects;
    legacy;
    choice = new Map();
    resume = null;
    constructor(subjects, legacy) {
        super();
        this.subjects = subjects;
        this.legacy = legacy;
        for (const s of subjects) {
            const u = s.units.find(u => u.grade === 4 && u.semester === 2 && u.unitId === 'sem2_unit4') ?? s.units[0];
            this.setChoices(s.subject, [{ semesterKey: u.semesterKey, unitId: u.unitId, unitLabel: u.unitLabel }]);
        }
    }
    prepareResume(value) { this.resume = value ?? null; const c = value?.learning?.session?.common; if (c?.version === 1 && this.subjects.some(s => s.subject === c.subject))
        this.choice.set(c.subject, structuredClone(c.choices)); }
    choices(subject) { return structuredClone(this.choice.get(subject)); }
    setChoices(subject, choices) { const s = this.subjects.find(s => s.subject === subject); if (!choices.length || choices.some(c => !s.units.some(u => u.semesterKey === c.semesterKey && u.unitId === c.unitId && (!c.skillIds || c.skillIds.length > 0 && c.skillIds.every(id => u.skills.some(k => k.id === id))))))
        throw Error('학습 범위를 확인해 주세요.'); this.choice.set(subject, choices.map(c => ({ ...structuredClone(c), skillLabels: Object.fromEntries(s.units.find(u => u.semesterKey === c.semesterKey && u.unitId === c.unitId).skills.map(k => [k.id, k.label])) }))); }
    descriptors() { return this.subjects.map(s => { const c = this.choice.get(s.subject)[0], u = s.units.find(u => u.semesterKey === c.semesterKey && u.unitId === c.unitId); return { packId: s.packId, title: '공통 ' + s.label + ' · 학습 범위 선택', selectionLabel: s.label + ' · ' + this.choice.get(s.subject).map(c => c.unitLabel).join(', '), subject: s.label, grade: u.grade, semester: u.semester, unit: u.unitLabel, file: 'approved-common-bank', enabledForSelection: true, enabledForGrowth: true, approvedCommonSupply: true, defaultForSelection: s.subject === 'math' }; }); }
    async list() { const now = this.descriptors(), old = await this.legacy.list(); return [...now, ...old.filter(p => !now.some(n => n.packId === p.packId)).map(p => ({ ...p, enabledForSelection: false, enabledForGrowth: false }))]; }
    async selectable() { const now = this.descriptors(); if (this.resume && !this.resume.learning?.session?.common) {
        const old = (await this.legacy.list()).find(p => p.packId === this.resume.packId);
        if (old && !now.some(p => p.packId === old.packId))
            now.push(old);
    } return now; }
    reset() { super.reset(); this.legacy.reset(); }
    async load(id) { if (this.resume && !this.resume.learning?.session?.common)
        return this.legacy.load(id); const subject = this.subjects.find(s => s.packId === id); if (!subject)
        return this.legacy.load(id); const choices = this.choices(subject.subject), loaded = await loadCommonRuntime(subject.subject, choices), questions = []; const ids = new Set(); for (const choice of choices) {
        const bank = loaded.runtime.createBank({ semesterKey: choice.semesterKey, learningRecordId: 'CAFE-PREPARATION' }), scope = { ...bank.defaultScope(choice.unitId), ...choice.skillIds ? { skillIds: choice.skillIds } : {}, ...choice.levels ? { levels: choice.levels } : {} };
        for (const candidate of bank.getCandidates(scope)) {
            const q = bank.getQuestion(candidate.questionRef);
            if (ids.has(q.questionId))
                continue;
            ids.add(q.questionId);
            questions.push(commonQuestion(q, id, choices, subject.subject, choice.unitLabel));
        }
    } if (!questions.length)
        throw Error('선택한 범위에 공급 가능한 문항이 없어요.'); const first = questions[0]; return { schemaVersion: 1, packId: id, title: subject.label, subject: subject.label, grade: first.grade, semester: first.semester, unit: first.unit, version: first.packVersion, source: 'approved common bank', questions, templates: [] }; }
}
export function mountCommonPicker(select, catalog) {
    const host = select.parentElement;
    host.querySelector('.cafe-study-picker')?.remove();
    const panel = document.createElement('div');
    panel.className = 'cafe-study-picker';
    const controls = ['과목', '학년', '학기'].map((name, i) => { const l = document.createElement('label'), c = document.createElement('select'); c.setAttribute('aria-label', name); c.id = ['study-subject', 'study-grade', 'study-semester'][i]; l.textContent = name; l.append(c); panel.append(l); return c; }), [subject, grade, semester] = controls;
    const unitBox = document.createElement('fieldset');
    unitBox.className = 'common-unit-choices';
    unitBox.innerHTML = '<legend>단원 · 여러 개 선택할 수 있어요</legend>';
    panel.append(unitBox);
    const skillBox = document.createElement('details');
    skillBox.className = 'common-skill-choices';
    skillBox.innerHTML = '<summary>학습 요소 고르기</summary>';
    panel.append(skillBox);
    const options = (s, items, value) => { s.replaceChildren(...items.map(i => { const o = document.createElement('option'); o.value = i.value; o.textContent = i.label; return o; })); s.value = items.some(i => i.value === value) ? value : items[0]?.value ?? ''; };
    const apply = () => { const s = catalog.subjects.find(s => s.subject === subject.value); const selected = [...unitBox.querySelectorAll('input:checked')].map(i => s.units.find(u => u.unitId === i.value && u.grade === Number(grade.value) && u.semester === Number(semester.value))); if (!selected.length) {
        const first = unitBox.querySelector('input');
        if (first) {
            first.checked = true;
            selected.push(s.units.find(u => u.unitId === first.value && u.grade === Number(grade.value) && u.semester === Number(semester.value)));
        }
    } catalog.setChoices(s.subject, selected.map(u => ({ semesterKey: u.semesterKey, unitId: u.unitId, unitLabel: u.unitLabel }))); select.value = s.packId; select.dispatchEvent(new Event('change')); host.querySelector('#study-title').textContent = s.label + ' · ' + selected.map(u => u.unitLabel).join(', '); skills(); };
    const skills = () => { skillBox.querySelectorAll('label').forEach(l => l.remove()); const s = catalog.subjects.find(s => s.subject === subject.value); for (const choice of catalog.choices(s.subject)) {
        const u = s.units.find(u => u.unitId === choice.unitId && u.semesterKey === choice.semesterKey);
        for (const k of u.skills) {
            const l = document.createElement('label'), i = document.createElement('input');
            i.type = 'checkbox';
            i.checked = !choice.skillIds || choice.skillIds.includes(k.id);
            i.disabled = select.disabled;
            i.onchange = () => { const choices = catalog.choices(s.subject), c = choices.find(c => c.unitId === u.unitId && c.semesterKey === u.semesterKey); const ids = c.skillIds ?? u.skills.map(k => k.id); c.skillIds = i.checked ? [...new Set([...ids, k.id])] : ids.filter(id => id !== k.id); if (!c.skillIds.length) {
                i.checked = true;
                return;
            } catalog.setChoices(s.subject, choices); };
            l.append(i, document.createTextNode(k.label));
            skillBox.append(l);
        }
    } };
    let syncing = false;
    const render = (fromPack = false) => { if (syncing)
        return; syncing = true; try {
        const chosen = catalog.subjects.find(s => s.packId === select.value) ?? catalog.subjects[0];
        options(subject, catalog.subjects.map(s => ({ value: s.subject, label: s.label })), fromPack ? chosen.subject : subject.value);
        const s = catalog.subjects.find(s => s.subject === subject.value), current = catalog.choices(s.subject)[0], u = s.units.find(u => u.semesterKey === current.semesterKey && u.unitId === current.unitId);
        options(grade, [...new Set(s.units.map(u => u.grade))].map(n => ({ value: String(n), label: n + '학년' })), fromPack ? String(u.grade) : grade.value);
        options(semester, [...new Set(s.units.filter(u => u.grade === Number(grade.value)).map(u => u.semester))].map(n => ({ value: String(n), label: n + '학기' })), fromPack ? String(u.semester) : semester.value);
        unitBox.querySelectorAll('label').forEach(n => n.remove());
        const units = s.units.filter(u => u.grade === Number(grade.value) && u.semester === Number(semester.value)), selected = catalog.choices(s.subject);
        for (const u of units) {
            const l = document.createElement('label'), i = document.createElement('input');
            i.type = 'checkbox';
            i.value = u.unitId;
            i.checked = selected.some(c => c.semesterKey === u.semesterKey && c.unitId === u.unitId);
            i.disabled = select.disabled;
            i.onchange = apply;
            l.append(i, document.createTextNode(u.order + '. ' + u.unitLabel));
            unitBox.append(l);
        }
        for (const c of controls)
            c.disabled = select.disabled;
        if (fromPack) {
            skills();
            host.querySelector('#study-title').textContent = s.label + ' · ' + catalog.choices(s.subject).map(c => c.unitLabel).join(', ');
        }
        else
            apply();
    }
    finally {
        syncing = false;
    } };
    subject.onchange = grade.onchange = semester.onchange = () => render();
    const changed = () => render(true);
    select.addEventListener('change', changed);
    host.append(panel);
    select.hidden = true;
    render(true);
    const observer = new MutationObserver(() => { panel.querySelectorAll('input,select').forEach(c => c.disabled = select.disabled); });
    observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
    return () => { observer.disconnect(); select.removeEventListener('change', changed); };
}
