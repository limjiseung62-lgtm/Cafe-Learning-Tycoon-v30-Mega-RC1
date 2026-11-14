import { beginInteriorEditing, finishInteriorEditing } from './interiorPause.js';
import { openAppearance } from './renewalAppearance.js';
import { openFinalSpecialization } from './finalSpecializationUi.js';
import { openFinalSupply } from './finalSupplyUi.js';
import { openFinalDoors } from './finalDoorsUi.js';
import { finalActive } from './finalGrowth.js';
import { finalGrowthSummary } from './finalGrowthUi.js';
import { attachManagerSession } from './managerUi.js';
import { expansionAction } from './megaExpansionUi.js';
import { openInteriorShop, openInteriorEditor } from './megaShopUi.js';
import { liveManagementRepository, liveManagementOpen, setLiveManagementOpen } from './liveManagement.js';
export function mountLiveManagement(g, c) { document.getElementById('live-mega-management')?.remove(); if (!c || g.mode !== 'CAFE_GROWTH' || !g.mega) {
    attachManagerSession(g, null);
    return;
} const b = document.createElement('button'); b.id = 'live-mega-management'; b.className = 'staff-position-recovery'; b.textContent = '매장 관리 · 증축·가구 배치'; document.getElementById('staff-position-recovery').before(b); attachManagerSession(g, c); b.onclick = () => { if (liveManagementOpen || g.status !== 'RUNNING')
    return; setLiveManagementOpen(true); const repo = liveManagementRepository(g, c), hub = document.createElement('dialog'); hub.className = 'live-mega-hub'; hub.innerHTML = '<h2>영업 중 매장 관리</h2><p>이 안내 화면에서는 영업이 계속돼요. 가구 상점·배치 화면에서는 영업 시간이 멈춰요. 사용 중인 좌석과 통로는 유지해 주세요.</p><div class="live-mega-actions"></div><button data-return>카페로 돌아가기</button>'; document.body.append(hub); hub.showModal(); const done = () => { hub.remove(); setLiveManagementOpen(false); }; hub.querySelector('h2').insertAdjacentHTML('afterend', finalGrowthSummary(g)); const actions = hub.querySelector('.live-mega-actions'); const initial = repo.read(); expansionAction(actions, repo, initial.status === 'ready' ? initial.save : c.current(), () => { setLiveManagementOpen(false); }); const expansion = actions.querySelector('button'); const open = expansion.onclick; expansion.onclick = e => { open.call(expansion, e); const dialog = document.querySelector('dialog.mega-expansion'); if (dialog) {
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
    x.onclick = () => { const paused = !!g.mega?.finalGrowth?.renewal; if (paused && !beginInteriorEditing(g, () => c.save().ok)) {
        const warning = document.createElement('p');
        warning.setAttribute('role', 'status');
        warning.textContent = '꾸미기 일시정지를 저장하지 못했어요. 기존 카페는 그대로예요. 다시 시도해 주세요.';
        actions.append(warning);
        return;
    } const finish = () => { if (paused)
        finishInteriorEditing(g, () => c.save().ok); done(); }; hub.close(); hub.remove(); void open(repo, finish).then(() => { if (!document.querySelector('.touch-interior,.interior-dialog'))
        finish(); }).catch(() => finish()); };
    actions.append(x);
} if (g.mega?.finalGrowth?.renewal) {
    const exterior = document.createElement('button');
    exterior.textContent = '건축·외관 꾸미기 · 외벽·창문·간판';
    exterior.onclick = () => { hub.close(); hub.remove(); openAppearance(repo, done); };
    actions.append(exterior);
} if (finalActive(g)) {
    const spec = document.createElement('button');
    spec.textContent = '전문화 · 생산량과 브랜드 비교';
    spec.onclick = () => { hub.close(); hub.remove(); openFinalSpecialization(g, () => c.save().ok, done); };
    actions.append(spec);
    const supply = document.createElement('button');
    supply.textContent = '직원 역할 · 구역 · 서빙대 재고';
    supply.onclick = () => { hub.close(); hub.remove(); openFinalSupply(g, c, done); };
    actions.append(supply);
    const doors = document.createElement('button');
    doors.textContent = '출입구 이동 · 실제 통로 검사';
    doors.onclick = () => { hub.close(); hub.remove(); openFinalDoors(repo, done); };
    actions.append(doors);
} hub.querySelector('[data-return]').addEventListener('click', done); hub.addEventListener('cancel', e => { e.preventDefault(); done(); }); }; }
