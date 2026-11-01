import { installCommonArchiveMenu } from './commonCafeResults.js?v=v30-rc1-5973f32a35f5';
import { configureQuestionCatalog, QuestionPackCatalog } from './questionPack.js?v=v30-rc1-5973f32a35f5';
import { CommonLearningCatalog } from './commonLearningCatalog.js?v=v30-rc1-5973f32a35f5';
import { commonCatalogSHA256 } from './commonCatalogPin.js?v=v30-rc1-5973f32a35f5';
try {
    const response = await fetch('assets/common-learning/catalog.json');
    if (!response.ok)
        throw Error('학습 범위 목록을 불러오지 못했어요.');
    const bytes = new Uint8Array(await response.arrayBuffer()), actual = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
    if (actual !== commonCatalogSHA256)
        throw Error('학습 범위 목록의 해시가 달라요.');
    const catalog = JSON.parse(new TextDecoder().decode(bytes));
    configureQuestionCatalog(new CommonLearningCatalog(catalog.subjects, new QuestionPackCatalog()));
    installCommonArchiveMenu();
    await import('./main.js?v=v30-rc1-5973f32a35f5');
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
    document.getElementById('app').replaceChildren(box);
}
