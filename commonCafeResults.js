import { commonRecordEntries, wrapCommonBackup, unpackCommonBackup } from './commonBackup.js?v=placement-ea9474dcb7f1';
import { CommonCafeFlow } from './commonCafeFlow.js?v=placement-ea9474dcb7f1';
import { commonQuestion, commonAnswerText } from './commonLearningCatalog.js?v=placement-ea9474dcb7f1';
import { loadCommonRuntime } from './commonBankLoader.js?v=placement-ea9474dcb7f1';
import { deploymentLocalStorage, deploymentPrefix } from './deploymentStorage.js?v=placement-ea9474dcb7f1';
import { escapeText, renderQuestionText, renderDiagram } from './questionRenderer.js?v=placement-ea9474dcb7f1';
import { worksheetHtml } from './twinWorksheet.js?v=placement-ea9474dcb7f1';
const mounted = new WeakMap();
const archiveExpected = new WeakMap();
export async function restoreCommonArchive(flow, saved) { const raw = deploymentLocalStorage.getItem(archiveKey(saved.learningRecordId)); const cp = raw ? await flow.loaded.module.decode(raw) : saved; await flow.restore(cp); archiveExpected.set(flow, raw); }
const archiveKey = (id) => 'common-record/' + id;
function download(blob, name, host) { const reader = new FileReader(); reader.onload = () => { for (const old of host.querySelectorAll('a[download]'))
    if (old.download === name)
        old.remove(); const a = document.createElement('a'); a.href = String(reader.result); a.download = name; a.textContent = name + ' · 파일 저장'; a.className = 'secondary'; host.append(a); a.click(); }; reader.readAsDataURL(blob); }
async function archive(flow) { if (!navigator.locks)
    throw Error('학습 기록 보관에는 최신 HTTPS 브라우저가 필요해요. JSON으로 백업해 주세요.'); const cp = await flow.snapshot(), raw = await flow.loaded.module.encode(cp), key = archiveKey(cp.learningRecordId); await navigator.locks.request(deploymentPrefix() + 'common-archive-index', async () => { const previous = deploymentLocalStorage.getItem(key), expected = archiveExpected.get(flow) ?? null; if (previous !== expected && previous !== raw)
    throw Error('다른 창에서 이 학습 기록을 갱신했어요. 현재 기록을 JSON으로 백업하고 다시 열어 주세요.'); if (previous) {
    const old = await flow.loaded.module.decode(previous);
    if (old.gameSessionId !== cp.gameSessionId || old.manifestSHA256 !== cp.manifestSHA256)
        throw Error('다른 학습 기록과 겹쳐요.');
} deploymentLocalStorage.setItem(key, raw); archiveExpected.set(flow, raw); const text = deploymentLocalStorage.getItem('common-record-index'), index = text ? JSON.parse(text) : []; if (!Array.isArray(index))
    throw Error('기록 목록을 확인해 주세요. 기존 데이터는 유지돼요.'); if (!index.some((i) => i.id === cp.learningRecordId)) {
    index.push({ id: cp.learningRecordId, subject: cp.subject, at: new Date().toISOString(), scope: cp.choices.map(c => c.unitLabel).join(', ') });
    deploymentLocalStorage.setItem('common-record-index', JSON.stringify(index));
} }); }
async function worksheet(flow, host) { const items = []; for (const s of flow.sources.values())
    for (const row of await s.engine.getReviewQueue({ includeCompleted: true })) {
        const root = row.rootQuestionRef, candidates = s.bank.getEquivalentCandidates(root), ref = candidates.find((r) => r.questionId !== root.questionId);
        if (!ref)
            continue;
        const q = s.bank.getQuestion(ref), choice = flow.choices.find(c => c.unitId === q.metadata.unitId && c.semesterKey === 'g' + q.metadata.grade + 's' + q.metadata.semester);
        items.push({ question: commonQuestion(q, q.metadata.packId, flow.choices, flow.loaded.subject, choice.unitLabel), label: choice.unitLabel, kind: 'twin', previouslySeen: true });
    } const sheet = { packName: flow.loaded.subject === 'math' ? '수학' : '과학', items, skipped: 0 }; for (const answer of [false, true])
    download(new Blob([worksheetHtml(sheet, answer)], { type: 'text/html;charset=utf-8' }), 'cafe-common-' + (answer ? 'answers' : 'worksheet') + '.html', host); }
export function mountCommonCafeResults(flow, save) { const root = document.getElementById('results'); if (!root)
    return; const old = mounted.get(flow); if (old?.isConnected)
    return; const section = document.createElement('section'); section.id = 'common-learning-report'; section.className = 'learning-report'; root.append(section); mounted.set(flow, section); void render(flow, section, save); }
async function render(flow, section, save) {
    section.innerHTML = '<h3>공통 학습 결과</h3><p role="status">최초 성적과 복습 기록을 준비하고 있어요…</p>';
    try {
        const report = await flow.report();
        if (!flow.firstReport) {
            flow.firstReport = report;
            if (!await save())
                throw Error('학습 결과를 카페와 함께 저장하지 못했어요. 초기화하지 말고 JSON으로 백업해 주세요.');
        }
        let archiveWarning = '';
        try {
            await archive(flow);
        }
        catch (e) {
            archiveWarning = e instanceof Error ? e.message : '기록 보관 실패 · JSON으로 백업해 주세요.';
        }
        const s = report.summary;
        section.innerHTML = '<h3>나의 학습 결과</h3><p>' + escapeText(flow.choices.map(c => c.unitLabel).join(', ')) + '</p><div class="result-grid">' + [['최초 풀이', s.base + '문항'], ['최초 정답률', s.firstAccuracy.percent === null ? '미응시' : s.firstAccuracy.percent + '%'], ['즉시 회복', s.recovered + '개'], ['확정 오답', s.confirmedWrong + '개'], ['남은 오답', report.review.remaining + '개'], ['최종 해결률', report.summary.finalResolution.percent === null ? '미응시' : report.summary.finalResolution.percent + '%']].map(([k, v]) => '<div>' + k + '<strong>' + v + '</strong></div>').join('') + '</div><p>처음 성적은 복습 후에도 바뀌지 않아요. 오답노트는 음식 보상 없이 연습해요.</p><button class="primary" data-common-png="first">학습 결과 PNG 저장</button><button class="secondary" data-common-png="after">복습 후 결과 PNG 저장</button><button class="secondary" data-common-review>오답노트 · 다시 풀 문제</button><button class="secondary" data-common-json>학습 JSON 백업</button><button class="secondary" data-common-sheet>복습지·정답 해설 HTML</button><p role="status" data-common-status></p><div data-common-files></div>';
        const status = section.querySelector('[data-common-status]');
        status.textContent = archiveWarning;
        const files = section.querySelector('[data-common-files]');
        const action = (button, task) => button.addEventListener('click', () => { button.disabled = true; void task().catch(e => status.textContent = e instanceof Error ? e.message : '파일을 준비하지 못했어요.').finally(() => button.disabled = false); });
        section.querySelectorAll('[data-common-png]').forEach(button => action(button, async () => { const r = button.dataset.commonPng === 'first' ? flow.firstReport : await flow.report(), pages = await flow.loaded.png.renderReportPNG(r); for (const page of pages)
            download(page.blob, page.filename, files); status.textContent = pages.length + '페이지를 준비했어요. 아래 파일 링크에서도 저장할 수 있어요.'; }));
        action(section.querySelector('[data-common-json]'), async () => { const raw = await flow.loaded.module.encode(await flow.snapshot()); download(new Blob([raw], { type: 'application/json' }), 'cafe-common-learning-backup.json', files); });
        action(section.querySelector('[data-common-sheet]'), () => worksheet(flow, files));
        action(section.querySelector('[data-common-review]'), async () => { await openNotebook(flow, async () => { if (!await save())
            throw Error('카페 학습 저장에 실패했어요.'); await archive(flow); }, () => { void render(flow, section, save); }); });
    }
    catch (error) {
        section.innerHTML = '<h3>학습 기록 확인</h3><p role="alert">' + escapeText(error instanceof Error ? error.message : '기록을 확인하지 못했어요.') + '</p><button class="secondary">학습 JSON 백업</button>';
        section.querySelector('button').onclick = () => { void flow.snapshot().then(cp => flow.loaded.module.encode(cp)).then(raw => download(new Blob([raw], { type: 'application/json' }), 'cafe-common-learning-backup.json', section)); };
    }
}
export async function openNotebook(flow, save, changed) {
    const dialog = document.createElement('dialog');
    dialog.className = 'common-notebook';
    dialog.setAttribute('aria-label', '오답노트');
    document.body.append(dialog);
    let busy = false;
    const close = () => { if (busy)
        return; dialog.close(); dialog.remove(); };
    const paint = async () => { const notes = await flow.reviewQueue(); dialog.innerHTML = '<h2>다시 풀 문제</h2><p>서로 다른 동등 문제 2개 연속 정답으로 완료해요. 음식은 생산되지 않아요.</p><div data-notes></div><button data-close class="secondary">닫기</button>'; dialog.querySelector('[data-close]').addEventListener('click', close); const list = dialog.querySelector('[data-notes]'); if (!notes.length)
        list.textContent = '남아 있는 오답이 없어요!'; for (const note of notes) {
        const q = flow.sources.get(note.sourceId).bank.getQuestion(note.rootQuestionRef), article = document.createElement('article');
        const firstWrong = note.history?.find((a) => a.role === 'base' && a.status === 'incorrect'), firstLabel = q.render.choices.find((c) => c.id === firstWrong?.response)?.text ?? '기록 없음';
        article.innerHTML = '<p>' + escapeText(q.metadata.grade + '학년 ' + q.metadata.semester + '학기 · ' + (flow.choices.find(c => c.unitId === q.metadata.unitId)?.unitLabel ?? '학습 개념')) + '</p><p>' + renderQuestionText(q.render.text) + '</p>' + renderDiagram(q.render.svg, '도형', true) + '<p>처음 선택: ' + renderQuestionText(firstLabel) + '</p><details><summary>정답·해설 확인</summary><p>' + renderQuestionText(commonAnswerText(q)) + '</p><p>' + renderQuestionText(q.assessment.explanation) + '</p></details><p>현재 연속 정답 ' + (note.consecutiveCorrect ?? 0) + '/2</p><button class="primary">도전하기</button>';
        article.querySelector('button').onclick = () => { if (busy)
            return; busy = true; void flow.startChallenge(note.sourceId, note.reviewEntryId).then(async (r) => { if (r.status === 'started' || r.status === 'resumed') {
            if (r.status === 'resumed')
                await flow.sources.get(note.sourceId).engine.resumeChallenge(r.challengeId);
            await save();
            await challenge(note.sourceId, r.challengeId);
        }
        else
            article.append(document.createTextNode('동등 문제 후보가 부족해요. 기록은 그대로 기다려요.')); }).catch(e => article.append(document.createTextNode(e.message))).finally(() => busy = false); };
        list.append(article);
    } };
    const challenge = async (sourceId, id) => { const r = await flow.nextChallenge(sourceId, id); await save(); if (r.status !== 'question') {
        await paint();
        const p = document.createElement('p');
        p.setAttribute('role', 'status');
        p.textContent = r.status === 'completed' ? '2/2 복습 완료! 처음 성적과 이력은 그대로 보존돼요.' : '후보 부족 또는 도전 대기 상태예요. 다른 개념으로 바꾸지 않아요.';
        dialog.prepend(p);
        return;
    } const q = r.question; dialog.dataset.commonQuestionId = q.questionId; dialog.innerHTML = '<h2>오답노트 도전 · 음식 보상 없음</h2><p>' + renderQuestionText(q.render.text) + '</p>' + renderDiagram(q.render.svg, '도형', true) + '<div class="choices" data-answers></div><p role="status" data-feedback></p><button class="secondary" data-close>나중에 하기</button>'; dialog.querySelector('[data-close]').addEventListener('click', () => { if (busy)
        return; busy = true; void flow.sources.get(sourceId).engine.pauseChallenge(id).then(save).then(() => { busy = false; close(); }).finally(() => busy = false); }); for (const c of q.render.choices) {
        const b = document.createElement('button');
        b.className = 'answer-choice';
        b.textContent = c.text;
        b.onclick = () => { if (busy)
            return; busy = true; dialog.querySelectorAll('[data-answers] button').forEach(b => b.disabled = true); void flow.answer(c.id, 0).then(async (a) => { await save(); const correct = a.status === 'correct'; dialog.querySelector('[data-feedback]').textContent = (correct ? '정확해요!' : '연속 정답은 0/2로 돌아가요.') + ' ' + q.assessment.explanation; const next = document.createElement('button'); next.className = 'primary'; next.textContent = correct ? '계속 확인하기' : '오답노트로'; next.onclick = () => { if (busy)
            return; busy = true; void (correct ? challenge(sourceId, id) : paint()).finally(() => busy = false); }; dialog.append(next); }).catch(e => dialog.querySelector('[data-feedback]').textContent = e.message).finally(() => busy = false); };
        dialog.querySelector('[data-answers]').append(b);
    } };
    dialog.addEventListener('close', () => { dialog.remove(); changed?.(); });
    dialog.addEventListener('cancel', e => { if (busy)
        e.preventDefault(); });
    try {
        await paint();
        dialog.showModal();
    }
    catch (error) {
        dialog.remove();
        throw error;
    }
}
export function installCommonArchiveMenu() { document.addEventListener('cafe-mode-view', () => { const card = document.querySelector('.welcome-card'); if (!card || card.querySelector('#common-archive-open'))
    return; const button = document.createElement('button'); button.id = 'common-archive-open'; button.className = 'secondary'; button.textContent = '지난 학습 · 오답노트'; button.onclick = () => { const picker = document.createElement('dialog'); picker.className = 'common-notebook'; picker.innerHTML = '<h2>지난 학습 기록</h2><div data-list></div><button class="secondary" data-export-all>전체 학습 JSON 백업</button><label>전체 학습 JSON 가져오기<textarea data-import-all aria-label="전체 학습 JSON"></textarea></label><button class="secondary" data-restore-all>학습 JSON 확인 후 가져오기</button><p data-import-status role="status"></p><div data-files></div><button class="secondary" data-close>닫기</button>'; document.body.append(picker); picker.querySelector('[data-close]').addEventListener('click', () => { picker.close(); picker.remove(); }); let list; try {
    list = JSON.parse(deploymentLocalStorage.getItem('common-record-index') ?? '[]');
}
catch {
    list = [];
} for (const row of commonRecordEntries()) {
    try {
        const cp = JSON.parse(row.raw).body;
        if (!list.some(i => i.id === cp.learningRecordId))
            list.push({ id: cp.learningRecordId, subject: cp.subject, scope: cp.choices.map((c) => c.unitLabel).join(', ') });
    }
    catch { }
} picker.querySelector('[data-export-all]').addEventListener('click', () => download(new Blob([wrapCommonBackup('{}')], { type: 'application/json' }), 'cafe-common-all-records.json', picker.querySelector('[data-files]'))); picker.querySelector('[data-restore-all]').addEventListener('click', () => { const status = picker.querySelector('[data-import-status]'); void unpackCommonBackup(picker.querySelector('[data-import-all]').value).then(p => p.install()).then(() => status.textContent = '학습 기록을 복사했어요. 닫은 뒤 다시 열어 주세요. 기존 기록과 음식 재고는 변경하지 않았어요.').catch(e => status.textContent = e.message); }); for (const item of list.slice().reverse()) {
    const b = document.createElement('button');
    b.className = 'secondary';
    b.textContent = (item.subject === 'math' ? '수학' : '과학') + ' · ' + item.scope;
    b.onclick = () => { b.disabled = true; void (async () => { const loaded = await loadCommonRuntime(item.subject), raw = deploymentLocalStorage.getItem(archiveKey(item.id)); if (!raw)
        throw Error('기록 파일을 찾지 못했어요.'); const cp = await loaded.module.decode(raw), flow = new CommonCafeFlow(loaded, cp.choices, cp); await flow.restore(cp); archiveExpected.set(flow, raw); picker.close(); picker.remove(); const host = document.createElement('dialog'); host.className = 'common-notebook'; host.innerHTML = '<div id="common-past-result"></div><button class="secondary" data-close>닫기</button>'; document.body.append(host); const section = host.querySelector('#common-past-result'); await render(flow, section, async () => { await archive(flow); return true; }); host.querySelector('[data-close]').addEventListener('click', () => { host.close(); host.remove(); }); host.showModal(); })().catch(e => { b.after(document.createTextNode(e.message)); b.disabled = false; }); };
    picker.querySelector('[data-list]').append(b);
} if (!list.length)
    picker.querySelector('[data-list]').textContent = '영업이 끝나면 이곳에서 다시 복습할 수 있어요.'; picker.showModal(); }; card.append(button); }); }
