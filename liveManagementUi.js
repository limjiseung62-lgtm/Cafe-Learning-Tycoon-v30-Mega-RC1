import { attachManagerSession } from './managerUi.js?v=placement-ea9474dcb7f1';
import { expansionAction } from './megaExpansionUi.js?v=placement-ea9474dcb7f1';
import { openInteriorShop, openInteriorEditor } from './megaShopUi.js?v=placement-ea9474dcb7f1';
import { liveManagementRepository, liveManagementOpen, setLiveManagementOpen } from './liveManagement.js?v=placement-ea9474dcb7f1';
export function mountLiveManagement(g, c) { document.getElementById('live-mega-management')?.remove(); if (!c || g.mode !== 'CAFE_GROWTH' || !g.mega) {
    attachManagerSession(g, null);
    return;
} const b = document.createElement('button'); b.id = 'live-mega-management'; b.className = 'staff-position-recovery'; b.textContent = '매장 관리 · 증축·가구 배치'; document.getElementById('staff-position-recovery').before(b); attachManagerSession(g, c); b.onclick = () => { if (liveManagementOpen || g.status !== 'RUNNING')
    return; setLiveManagementOpen(true); const repo = liveManagementRepository(g, c), hub = document.createElement('dialog'); hub.className = 'live-mega-hub'; hub.innerHTML = '<h2>영업 중 매장 관리</h2><p>관리 중에도 영업 시간은 흘러요. 손님이 사용하는 좌석과 직원 통로는 유지해 주세요.</p><div class="live-mega-actions"></div><button data-return>카페로 돌아가기</button>'; document.body.append(hub); hub.showModal(); const done = () => { hub.remove(); setLiveManagementOpen(false); }; const actions = hub.querySelector('.live-mega-actions'); const initial = repo.read(); expansionAction(actions, repo, initial.status === 'ready' ? initial.save : c.current(), () => { setLiveManagementOpen(false); }); const expansion = actions.querySelector('button'); const open = expansion.onclick; expansion.onclick = e => { open.call(expansion, e); const dialog = document.querySelector('dialog.mega-expansion'); if (dialog) {
    dialog.addEventListener('close', () => setLiveManagementOpen(false), { once: true });
    const watch = new MutationObserver(() => { if (!dialog.isConnected) {
        watch.disconnect();
        done();
    } });
    watch.observe(document.body, { childList: true });
    hub.close();
    hub.remove();
}
else
    done(); }; for (const [label, open] of [['가구 상점 · 구매·보관함', openInteriorShop], ['가구 배치 · 이동·회전·보관', openInteriorEditor]]) {
    const x = document.createElement('button');
    x.textContent = label;
    x.onclick = () => { hub.close(); hub.remove(); void open(repo, done).then(() => { if (!document.querySelector('.interior-dialog'))
        done(); }).catch(() => done()); };
    actions.append(x);
} hub.querySelector('[data-return]').addEventListener('click', done); hub.addEventListener('cancel', e => { e.preventDefault(); done(); }); }; }
