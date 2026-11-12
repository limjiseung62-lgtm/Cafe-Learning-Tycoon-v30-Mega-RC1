import { createGrowthSession } from './sessionFactory.js?v=v31-5d872fe24674';
import { GrowthSessionController as ManagerController } from './growthSession.js?v=v31-5d872fe24674';
import { openActionManager } from './managerActionUi.js?v=v31-5d872fe24674';
import { managerFrames } from './managerFrames.js?v=v31-5d872fe24674';
import { managerCatalog, managerById, ensureManager, completeManagerConstruction, selectManager, deferManager } from './managerState.js?v=v31-5d872fe24674';
import { managerAdvice, nextManagerAdvice } from './managerAdvice.js?v=v31-5d872fe24674';
import { talkManager } from './managerActor.js?v=v31-5d872fe24674';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=v31-5d872fe24674';
import { liveManagementOpen } from './liveManagement.js?v=v31-5d872fe24674';
function syncManagerRun(save) { const run = save.campaign?.run; if (run && !run.closed && run.cafe.mega && save.mega)
    run.cafe.mega.manager = structuredClone(save.mega.manager); return save; }
const portrait = (row) => { const frame = managerFrames[row][0], top = frame.box[1], height = frame.box[3]; return '<div class="manager-portrait" style="aspect-ratio:192/' + height + '" aria-hidden="true"><img loading="lazy" src="assets/art/managers/companion-atlas.png" alt="" style="top:-' + top / height * 100 + '%;height:' + 1024 / height * 100 + '%"></div>'; };
const modalOpen = () => [...document.querySelectorAll('dialog[open],[role="dialog"]')].some(el => !el.hidden && el.getClientRects().length > 0);
let session = null;
function dialog(title) { const d = document.createElement('dialog'); d.className = 'manager-dialog'; d.setAttribute('aria-label', title); d.tabIndex = -1; document.body.append(d); return d; }
async function recruitment(port) {
    if (document.querySelector('.manager-dialog'))
        return;
    if (!await ensureGrowthWriteLock()) {
        let p = document.getElementById('manager-access-note');
        if (!p) {
            p = document.createElement('p');
            p.id = 'manager-access-note';
            p.setAttribute('role', 'status');
            document.querySelector('.setup')?.append(p);
        }
        p.textContent = '다른 창에서 카페를 운영 중이에요. 그 창을 닫은 뒤 매니저 선택을 다시 눌러 주세요.';
        return;
    }
    if (document.querySelector('.manager-dialog'))
        return;
    const expected = port.read(), copy = structuredClone(expected), m = copy.mega?.manager;
    if (!m || !['pending', 'deferred'].includes(m.status))
        return;
    const first = !m.introduced;
    m.introduced = true;
    const written = port.commit(copy, expected);
    if (!written.ok) {
        const p = document.createElement('p');
        p.setAttribute('role', 'status');
        p.textContent = written.message;
        document.querySelector('.setup')?.append(p);
        return;
    }
    const d = dialog(first ? '우리 카페에 매니저가 찾아왔어요!' : '매니저 선택 이어하기');
    d.innerHTML = '<header><p>나의 첫 사업 파트너</p><h2>' + (first ? '우리 카페에 매니저가 찾아왔어요!' : '함께할 매니저를 골라요') + '</h2><p>직원 자리를 차지하지 않아요. 세 사람 모두 모든 핵심 조언을 해요. 경영 결정은 사장님이 직접 해요.</p></header><div class="manager-choices">' + managerCatalog.map(v => '<article style="--manager-color:' + v.color + '">' + portrait(v.row) + '<div><h3>' + v.name + '</h3><strong>' + v.field + '</strong><p>' + v.intro + '</p></div><button data-manager="' + v.id + '">' + v.name + (v.id === 'hajun' ? '과' : '와') + ' 함께하기</button></article>').join('') + '</div><p role="status"></p><button data-defer>나중에 결정 · 선택 기회 보관</button>';
    let busy = false;
    const choose = (id) => { if (busy)
        return; busy = true; const before = port.read(), next = structuredClone(before); const ok = id ? selectManager(next.mega, id) : deferManager(next.mega); if (!ok) {
        busy = false;
        return;
    } const r = port.commit(next, before); if (!r.ok) {
        d.querySelector('[role=status]').textContent = r.message;
        busy = false;
        return;
    } d.remove(); port.after?.(); };
    d.querySelectorAll('[data-manager]').forEach(b => b.onclick = () => choose(b.dataset.manager));
    d.querySelector('[data-defer]').addEventListener('click', () => choose());
    d.addEventListener('cancel', e => { e.preventDefault(); choose(); });
    d.showModal();
    d.focus({ preventScroll: true });
    d.scrollTop = 0;
}
function adviceDialog(port) { const g = port.game, id = port.read().mega?.manager?.selected; if (!g || !id || document.querySelector('.manager-dialog'))
    return; const v = managerById(id), list = managerAdvice(g, port.read()); talkManager(g); document.dispatchEvent(new CustomEvent('cafe-manager-focus')); const d = dialog(v.name + ' 매니저의 조언'); d.innerHTML = '<header><h2>' + v.name + (id === 'hajun' ? '과' : '와') + ' 카페 이야기</h2><p>' + v.field + ' · 사장님의 선택을 함께 고민해요.</p></header><div class="manager-advice-profile">' + portrait(v.row) + '<p>카페 Lv.' + g.cafeLevel + ' · 보유 ' + g.money.toLocaleString() + '원<br>직원 ' + g.service.paid.length + '명 · 실제 좌석 ' + (g.serviceSpace?.seats.length ?? 0) + '개</p></div><div class="manager-advice-list">' + list.map(a => '<article><h3>' + a.title + '</h3><p>' + a.text + '</p>' + (a.action !== 'none' ? '<button data-action="' + a.action + '">' + ({ stock: '음식 만들기', staff: '직원 화면 열기', shop: '매장 관리 열기', expansion: '증축 화면 살펴보기', recovery: '직원 위치 복구하기', research: '연구소 살펴보기', village: '마을 살펴보기', none: '' }[a.action]) + '</button>' : '') + '</article>').join('') + '</div><button data-close>카페로 돌아가기</button>'; d.querySelector('[data-close]').addEventListener('click', () => d.remove()); d.addEventListener('cancel', e => { e.preventDefault(); d.remove(); }); d.querySelectorAll('[data-action]').forEach(b => b.onclick = () => { d.remove(); const action = b.dataset.action; if (action === 'stock')
    document.getElementById('make')?.click();
else if (action === 'recovery')
    document.getElementById('staff-position-recovery')?.click();
else if (action === 'staff')
    document.querySelector('[data-focus-tab="staff"]')?.click();
else if (['shop', 'expansion'].includes(action))
    document.getElementById('live-mega-management')?.click();
else if (action === 'research')
    document.querySelector('[data-management]')?.click(); }); d.showModal(); d.focus({ preventScroll: true }); d.scrollTop = 0; }
function sessionPort(g, c) { return { game: g, read: () => c.current(), commit: (next, expected) => { if (g.mode !== 'CAFE_GROWTH' || JSON.stringify(g.mega?.manager) !== JSON.stringify(expected.mega?.manager))
        return { ok: false, message: '매니저 선택 정보가 바뀌었어요. 다시 열어 주세요.' }; const before = structuredClone(g.mega.manager); g.mega.manager = structuredClone(next.mega.manager); const r = c.save(); if (!r.ok)
        g.mega.manager = before; return r; } }; }
export function attachManagerSession(g, c) { session?.button.remove(); session = null; if (g.mode !== 'CAFE_GROWTH' || !g.mega || !c)
    return; ensureManager(g.mega); const b = document.createElement('button'); b.id = 'manager-companion'; b.className = 'staff-position-recovery manager-entry'; b.hidden = true; document.getElementById('live-mega-management')?.after(b); b.onclick = () => { const s = g.mega?.manager; if (s?.selected) {
    if (g.mega?.finalGrowth)
        openActionManager(g, c);
    else
        adviceDialog(sessionPort(g, c));
}
else
    recruitment(sessionPort(g, c)); }; session = { g, c, button: b, lastPoll: 0 }; }
export function pollManagerSession(g) { const s = session; if (!s || s.g !== g || Date.now() - s.lastPoll < 500)
    return; s.lastPoll = Date.now(); const m = g.mega?.manager; s.button.hidden = !m || m.status === 'construction'; if (!m)
    return; const port = sessionPort(g, s.c); if (completeManagerConstruction(g.mega, Date.now())) {
    const r = s.c.save();
    if (!r.ok) {
        m.status = 'construction';
        return;
    }
} s.button.textContent = m.selected ? managerById(m.selected).name + ' · ' + (s.hint && s.hint.until > Date.now() ? s.hint.text : '매니저와 대화') : '매니저 선택 이어하기'; if ((modalOpen() || document.querySelector('#problem-panel:not([hidden])')) || liveManagementOpen)
    return; if (['pending', 'deferred'].includes(m.status) && !m.introduced) {
    recruitment(port);
    return;
} if (m.selected) {
    const now = Date.now(), a = nextManagerAdvice(g, port.read(), now);
    if (a && now - (m.adviceSeen.pulse ?? 0) >= 90000) {
        const before = structuredClone(m.adviceSeen);
        m.adviceSeen[a.id] = now;
        m.adviceSeen.pulse = now;
        const r = s.c.save();
        if (!r.ok)
            m.adviceSeen = before;
        else {
            s.hint = { text: a.title, until: now + 15000 };
            s.button.textContent = managerById(m.selected).name + ' · ' + a.title;
            s.button.title = a.text;
        }
    }
} }
export function managerPreparationAction(host, repo, source, refresh) { if (!source.mega)
    return; const draw = (save) => { const m = save.mega?.manager; if (!m || m.status === 'construction')
    return; const b = document.createElement('button'); b.className = 'mega-expansion-entry'; b.textContent = m.selected ? managerById(m.selected).name + (save.mega?.finalGrowth ? ' 매니저 · 새 공간 세팅·직원 관리' : ' 매니저와 함께 영업해요') : '매니저 선택 이어하기'; b.disabled = !!m.selected && (!save.mega?.finalGrowth || !!save.campaign?.run && !save.campaign.run.closed); b.onclick = () => { if (m.selected && save.mega?.finalGrowth) {
    const game = createGrowthSession(save), controller = new ManagerController(game, repo);
    openActionManager(game, controller, refresh);
    return;
} void recruitment({ read: () => { const r = repo.read(); return r.status === 'ready' ? r.save : save; }, commit: (n, e) => repo.write(syncManagerRun(n), e), after: refresh }); }; host.append(b); if (!m.introduced && !modalOpen())
    setTimeout(() => { if (b.isConnected)
        b.click(); }, 0); }; const next = structuredClone(source), changed = ensureManager(next.mega) || completeManagerConstruction(next.mega, Date.now()); if (changed) {
    void ensureGrowthWriteLock().then(ok => { if (ok) {
        const r = repo.write(syncManagerRun(next), source);
        if (r.ok)
            draw(next);
    } });
}
else
    draw(source); if (next.mega?.manager?.status === 'construction')
    setTimeout(() => { if (host.isConnected)
        refresh(); }, Math.max(100, next.mega.manager.completeAt - Date.now() + 50)); }
export function finishManagerConstructionInRepository(repo) { const r = repo.read(); if (r.status !== 'ready' || !r.save.mega)
    return; const next = structuredClone(r.save); if (completeManagerConstruction(next.mega, Date.now(), true))
    repo.write(syncManagerRun(next), r.save); }
if (typeof document !== 'undefined')
    document.addEventListener('cafe-manager-talk', () => session?.button.click());
if (typeof document !== 'undefined')
    document.addEventListener('click', e => { if (e.target instanceof Element && e.target.closest('[data-manager-recruit]'))
        session?.button.click(); });
