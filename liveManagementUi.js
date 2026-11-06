import { growthSeats } from './levelSeats.js?v=level-seats-83d02b666a1c';
import { attachManagerSession } from './managerUi.js?v=level-seats-83d02b666a1c';
import { expansionAction } from './megaExpansionUi.js?v=level-seats-83d02b666a1c';
import { openInteriorShop, openInteriorEditor } from './megaShopUi.js?v=level-seats-83d02b666a1c';
import { liveManagementRepository, liveManagementOpen, setLiveManagementOpen } from './liveManagement.js?v=level-seats-83d02b666a1c';
export function mountLiveManagement(g, c) { document.getElementById('live-mega-management')?.remove(); if (!c || g.mode !== 'CAFE_GROWTH' || !g.mega) {
    attachManagerSession(g, null);
    return;
} const b = document.createElement('button'); b.id = 'live-mega-management'; b.className = 'staff-position-recovery'; b.textContent = '매장 관리 · 증축·가구 배치'; document.getElementById('staff-position-recovery').before(b); attachManagerSession(g, c); b.onclick = () => { if (liveManagementOpen || g.status !== 'RUNNING')
    return; setLiveManagementOpen(true); const repo = liveManagementRepository(g, c), hub = document.createElement('dialog'); hub.className = 'live-mega-hub'; hub.innerHTML = '<h2>영업 중 매장 관리</h2><p>관리 중에도 영업 시간은 흘러요. 손님이 사용하는 좌석과 직원 통로는 유지해 주세요.</p><div class="live-mega-actions"></div><button data-return>카페로 돌아가기</button>'; document.body.append(hub); hub.showModal(); const done = () => { hub.remove(); setLiveManagementOpen(false); }; const seatRights = growthSeats(g.cafeLevel, g.mega, g.branchId); if (seatRights) {
    const p = document.createElement('p');
    p.textContent = '설치 ' + seatRights.installed + '석 · 현재 동시 운영 ' + seatRights.operating + '석 / 레벨 권한 ' + seatRights.permission + '석' + (seatRights.next ? ' · 다음 레벨 권한 ' + seatRights.next + '석' : ' · 최대 레벨');
    hub.querySelector('h2').after(p);
} const actions = hub.querySelector('.live-mega-actions'); const initial = repo.read(); expansionAction(actions, repo, initial.status === 'ready' ? initial.save : c.current(), () => { setLiveManagementOpen(false); }); const expansion = actions.querySelector('button'); const open = expansion.onclick; expansion.onclick = e => { open.call(expansion, e); const dialog = document.querySelector('dialog.mega-expansion'); if (dialog) {
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
