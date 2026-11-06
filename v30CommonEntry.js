import { attachExternal, manualReturn } from './externalLaunch.js?v=level-seats-83d02b666a1c';
import { installCommonArchiveMenu } from './commonCafeResults.js?v=level-seats-83d02b666a1c';
import { configureQuestionCatalog, QuestionPackCatalog } from './questionPack.js?v=level-seats-83d02b666a1c';
import { CommonLearningCatalog } from './commonLearningCatalog.js?v=level-seats-83d02b666a1c';
import { commonCatalogSHA256 } from './commonCatalogPin.js?v=level-seats-83d02b666a1c';
try {
    const response = await fetch('assets/common-learning/catalog.json');
    if (!response.ok)
        throw Error('학습 범위 목록을 불러오지 못했어요.');
    const bytes = new Uint8Array(await response.arrayBuffer()), actual = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
    if (actual !== commonCatalogSHA256)
        throw Error('학습 범위 목록의 해시가 달라요.');
    const catalog = JSON.parse(new TextDecoder().decode(bytes));
    const additions = await (await fetch('./sq-learning/approved-registry.json')).json();
    for (const u of additions.units)
        catalog.subjects.push({ subject: u.subject, label: u.subject === 'korean-literacy' ? '국어' : '사회', packId: additions.providers[u.subject].releaseRef.split('@')[0], units: [{ grade: u.grade, semester: u.semester, semesterKey: 'g4s2', unitId: u.id, unitLabel: u.title.replace(/^\d+\. /, ''), order: u.subject === 'korean-literacy' ? 3 : 2, skills: u.objectives.map((o) => ({ id: o.id, label: o.label })) }] });
    const instance = new CommonLearningCatalog(catalog.subjects, new QuestionPackCatalog());
    await attachExternal(instance);
    configureQuestionCatalog(instance);
    installCommonArchiveMenu();
    await import('./main.js?v=level-seats-83d02b666a1c');
}
catch (error) {
    const box = document.createElement('section');
    box.className = 'welcome-card';
    const h = document.createElement('h1');
    h.textContent = '학습 자료를 불러오지 못했어요';
    const note = document.createElement('p');
    note.textContent = error instanceof Error ? error.message : '인터넷 연결을 확인해 주세요. 기존 저장은 유지됩니다.';
    const b = document.createElement('button');
    b.textContent = '다시 연결하기';
    b.onclick = () => location.reload();
    box.append(h, note, b);
    if (location.hash.startsWith('#sq')) {
        const manual = document.createElement('button');
        manual.textContent = '기존 수동 선택으로 돌아가기';
        manual.onclick = manualReturn;
        box.append(manual);
    }
    document.getElementById('app').replaceChildren(box);
}
