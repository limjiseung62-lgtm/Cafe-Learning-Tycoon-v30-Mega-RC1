import { backupLimit, backupFilename, checkedGrowthBackup, prepareGrowthRestore } from './backupRecovery.js?v=v31-5d872fe24674';
import { ensureGrowthWriteLock, supportsGrowthLock } from './growthWriteLock.js?v=v31-5d872fe24674';
import { escapeText as esc } from './questionRenderer.js?v=v31-5d872fe24674';
import { createGrowthSave, createProgressiveGrowthSave } from './growthSave.js?v=v31-5d872fe24674';
import { v26Deployment } from './progressiveFeatures.js?v=v31-5d872fe24674';
let url;
if (typeof addEventListener === 'function')
    addEventListener('pagehide', () => { if (url)
        URL.revokeObjectURL(url); url = undefined; });
function button(text) { const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.textContent = text; b.style.cssText = 'min-height:48px;padding:12px 16px;margin:6px 0;font:inherit;width:100%;box-sizing:border-box'; return b; }
export function downloadCafeBackup(repo, host, before) { const status = host.querySelector('[data-backup-status]') ?? host.appendChild(document.createElement('p')); status.dataset.backupStatus = ''; status.setAttribute('role', 'status'); try {
    const result = before?.();
    if (result && !result.ok)
        throw Error(result.message);
    const read = repo.read();
    if (read.status !== 'ready')
        throw Error(read.status === 'empty' ? '저장된 카페가 없어요.' : read.message);
    const text = checkedGrowthBackup(read.save);
    if (url)
        URL.revokeObjectURL(url);
    document.querySelectorAll('[data-backup-download]').forEach(a => a.remove());
    url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFilename();
    a.textContent = '준비한 JSON 파일 저장';
    a.dataset.backupDownload = '';
    a.style.cssText = 'display:block;padding:12px;min-height:44px';
    host.append(a);
    a.click();
    status.textContent = '백업 파일을 준비했어요. 다운로드 완료 여부는 Chrome의 다운로드 목록에서 확인해 주세요. 파일이 안 보이면 아래 저장 링크를 눌러요. 다운로드 폴더 또는 내 파일 앱 → 다운로드에서 찾을 수 있어요.';
}
catch (e) {
    status.textContent = e instanceof Error ? e.message : '백업을 준비하지 못했어요. 기존 카페는 유지돼요.';
} }
export function mountBackupControls(host, repo, onRestored, { download = true, before } = {}) { const wrap = document.createElement('section'); wrap.className = 'growth-backup'; wrap.style.cssText = 'max-width:100%;box-sizing:border-box;word-break:keep-all'; const note = document.createElement('p'); note.textContent = '브라우저 기록 삭제·학교 기기 정리로 저장이 사라질 수 있어요. 매 수업이 끝나면 JSON 파일을 받아 보관해 주세요. 파일 복원은 이 기기 안에서 처리해요.'; wrap.append(note); if (download) {
    const b = button('내 카페 백업하기');
    b.id = 'export-growth';
    b.onclick = () => downloadCafeBackup(repo, wrap, before);
    wrap.append(b);
} const restore = button('백업 파일로 이어하기'); restore.dataset.backupRestore = ''; const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.id = 'import-growth'; input.setAttribute('aria-label', '카페 백업 JSON 파일 선택'); input.hidden = true; const status = document.createElement('p'); status.dataset.backupStatus = ''; status.setAttribute('role', 'status'); wrap.append(restore, input, status); restore.onclick = () => { input.value = ''; input.click(); }; let generation = 0; input.onchange = async () => { const file = input.files?.[0], token = ++generation; if (!file)
    return; restore.disabled = true; status.textContent = '백업 파일을 확인하고 있어요. 기존 카페는 바뀌지 않아요.'; try {
    if (file.size > backupLimit)
        throw Error('백업 파일은32MB까지 확인할 수 있어요.');
    const preview = await prepareGrowthRestore(await file.text(), repo);
    if (token !== generation || !wrap.isConnected)
        return;
    document.getElementById('growth-restore-preview')?.remove();
    const d = document.createElement('dialog');
    d.id = 'growth-restore-preview';
    d.style.cssText = 'max-width:min(560px,calc(100vw - 40px));box-sizing:border-box;border-radius:18px;padding:20px;word-break:keep-all';
    d.innerHTML = '<h2>이 카페를 불러올까요?</h2><p>복원 가능 · 파일과 이어하기 상태 확인 완료</p><p><strong>백업 카페 Lv.' + preview.save.cafeLevel + ' · ' + preview.save.money.toLocaleString() + '원</strong></p><p>백업 날짜: ' + esc(new Date(preview.date).toLocaleString('ko-KR')) + '</p><p>' + (preview.current.status === 'ready' ? '현재 기기: Lv.' + preview.current.save.cafeLevel + ' · ' + preview.current.save.money.toLocaleString() + '원. 현재 카페는 복원 전에 별도 보관해요.' : preview.current.status === 'empty' ? '현재 기기에 저장된 카페가 없어요. 새 카페를 만들지 않고 복원할 수 있어요.' : '현재 저장은 읽지 못했어요. 원본을 별도 보관한 뒤 복원해요.') + '</p><p>백업에 포함된 기존 영업 종료 시각과 학습 기록을 유지해요. 보상을 새로 지급하지 않아요.</p>';
    const apply = button('이 카페로 복원하기'), cancel = button('취소'), message = document.createElement('p');
    message.setAttribute('role', 'status');
    d.append(message, apply, cancel);
    document.body.append(d);
    d.showModal();
    let busy = false;
    cancel.onclick = () => { if (!busy)
        d.remove(); };
    d.addEventListener('cancel', e => { if (busy)
        e.preventDefault();
    else
        d.remove(); });
    apply.onclick = async () => { if (busy)
        return; busy = true; apply.disabled = true; cancel.disabled = true; try {
        if (!supportsGrowthLock() || !await ensureGrowthWriteLock())
            throw Error('다른 카페 창을 닫고 다시 시도해 주세요. 최신 Chrome의 HTTPS 연결이 필요해요.');
        const result = await preview.restore();
        if (!result.ok)
            throw Error(result.message);
        d.remove();
        onRestored();
    }
    catch (e) {
        message.textContent = e instanceof Error ? e.message : '복원하지 못했어요. 기존 카페는 유지돼요.';
        busy = false;
        apply.disabled = false;
        cancel.disabled = false;
    } };
}
catch (e) {
    status.textContent = (e instanceof Error ? e.message : '파일을 확인하지 못했어요.') + ' 기존 카페는 변경하지 않았어요.';
}
finally {
    restore.disabled = false;
} }; host.append(wrap); return wrap; }
export function mountRecoveryStart(host, repo, onOpen) { const wrap = document.createElement('section'); wrap.setAttribute('aria-label', '카페 이어하기와 파일 복원'); const r = repo.read(), resume = button('이어하기'); resume.id = 'growth-resume-home'; resume.disabled = r.status !== 'ready'; resume.onclick = onOpen; const hint = document.createElement('p'); hint.textContent = r.status === 'ready' ? '이 기기 카페: Lv.' + r.save.cafeLevel + ' · ' + r.save.money.toLocaleString() + '원' : r.status === 'empty' ? '기기에 카페가 없으면 백업 파일로 이어할 수 있어요.' : r.message; wrap.append(resume, hint); mountBackupControls(wrap, repo, onOpen, { download: false }); const fresh = button('새 카페 시작'); fresh.id = 'growth-new-home'; fresh.onclick = () => { const current = repo.read(), start = async () => { fresh.disabled = true; try {
    if (!supportsGrowthLock() || !await ensureGrowthWriteLock())
        throw Error('다른 카페 창을 닫은 뒤 최신 Chrome에서 시도해 주세요.');
    if (JSON.stringify(repo.read()) !== JSON.stringify(current))
        throw Error('기기의 카페 기록이 바뀌었어요. 다시 확인해 주세요.');
    const result = repo.replace(v26Deployment() ? createProgressiveGrowthSave() : createGrowthSave(), true);
    if (!result.ok)
        throw Error(result.message);
    onOpen();
}
catch (e) {
    hint.textContent = e instanceof Error ? e.message : '기존 카페를 보호하기 위해 시작하지 않았어요.';
}
finally {
    fresh.disabled = false;
} }; if (current.status === 'empty') {
    void start();
    return;
} const d = document.createElement('dialog'); d.style.cssText = 'max-width:min(520px,calc(100vw - 40px));box-sizing:border-box'; d.innerHTML = '<h2>새 카페를 시작할까요?</h2><p>현재 카페를 별도 보관하고 새 Lv.1 카페로 바꿔요. 먼저 JSON 백업을 받아 두는 것이 좋아요.</p>'; const yes = button('기존 카페 보관 후 새로 시작'), no = button('취소'); d.append(yes, no); document.body.append(d); d.showModal(); no.onclick = () => d.remove(); yes.onclick = () => { d.remove(); void start(); }; }; wrap.append(fresh); host.append(wrap); }
export function mountPlayingBackup(repo, before) { document.querySelectorAll('[data-playing-backup]').forEach(n => n.remove()); for (const target of [document.querySelector('.mode-status'), document.querySelector('.session-menu-content')]) {
    if (!target)
        continue;
    const wrap = document.createElement('div');
    wrap.dataset.playingBackup = '';
    const b = button('내 카페 백업하기');
    b.onclick = () => downloadCafeBackup(repo, wrap, before);
    wrap.append(b);
    target.append(wrap);
} }
/** Inline guidance rather than an unrequested automatic download (Android requires a user gesture). */
export function mountEndBackup(host, repo, before) { host.querySelector('#growth-backup-reminder')?.remove(); const section = document.createElement('section'); section.id = 'growth-backup-reminder'; section.setAttribute('aria-label', '수업 끝 백업 안내'); section.style.cssText = 'padding:20px;margin:0 0 20px;border:3px solid #448b5a;border-radius:18px;background:#eff9ef;word-break:keep-all;box-sizing:border-box;max-width:100%'; const title = document.createElement('h2'); title.textContent = '오늘 키운 카페를 파일로 보관해요!'; const text = document.createElement('p'); text.textContent = '이 기기의 자동 저장과 별도로, JSON 파일을 받아 두면 다음 수업에도 이어할 수 있어요. 학교 기기의 브라우저 기록이 지워져도 파일이 있으면 복원할 수 있어요.'; const steps = document.createElement('ol'); for (const line of ['아래 초록색 버튼을 눌러 JSON 백업 파일을 받아요.', 'Chrome 오른쪽 위 ⋮ → 다운로드 또는 내 파일 → 다운로드에서 파일 이름과 날짜를 확인해요.', '다음 수업에는 시작 화면의 백업 파일로 이어하기 → JSON 선택 → 이 카페로 복원하기를 눌러요.']) {
    const li = document.createElement('li');
    li.textContent = line;
    steps.append(li);
} const save = button('내 카페 백업하기 · JSON 파일 저장'); save.id = 'result-backup-growth'; save.style.background = '#27663c'; save.style.color = 'white'; save.style.fontWeight = '800'; save.onclick = () => downloadCafeBackup(repo, section, before); const note = document.createElement('p'); note.textContent = '다운로드 안내만 뜬 것은 완료 확인이 아니에요. 실제 파일이 보이는지 확인하고 수업을 마쳐요. 파일에는 카페와 학습 기록이 담겨요.'; section.append(title, text, steps, save, note); host.prepend(section); }
