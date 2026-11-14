import { createManagerProposal, executeManagerProposal, managerAvailable, undoManagerSettings, canUndoManagerSettings } from './managerActions.js';
import { managerById } from './managerState.js';
import { managerAdvice } from './managerAdvice.js';
import { talkManager } from './managerActor.js';
import { openFinalSupply } from './finalSupplyUi.js';
import { recruitPortrait } from './recruitArt.js';
import { recruitById, finalProfile, staffEffect } from './recruitConfig.js';
import { finalSalary } from './finalPayroll.js';
import { crewAssignment } from './finalSupply.js';
import { recruitCost } from './staffRecruitment.js';
import { escapeText as esc } from './questionRenderer.js';
import { ensureMegaPlan, megaDimensions, megaChairs, iso } from './megaSpace.js';
import { paintArtFloor, environmentPlacements, paintEnvironment } from './megaArt.js';
import { paintMegaTable, paintMegaChair } from './megaView.js';
const roleText = (id) => ({ floor: '홀 서빙', kitchen: '주방 지원', logistics: '재고 보급', vip: 'VIP 서비스', 'zone-manager': '구역 관리' }[id] ?? id);
function drawPreview(plan, label) { const box = document.createElement('figure'), caption = document.createElement('figcaption'), canvas = document.createElement('canvas'); caption.textContent = label; canvas.width = 440; canvas.height = 300; canvas.style.width = '100%'; canvas.style.height = 'auto'; canvas.setAttribute('aria-label', label); box.append(canvas, caption); const c = canvas.getContext('2d'), [w, h] = megaDimensions[plan.level - 1], scale = Math.min(420 / ((w + h) * 24 + 90), 280 / ((w + h) * 12 + 150)); c.fillStyle = '#fff8e9'; c.fillRect(0, 0, 440, 300); c.translate(220, 65); c.scale(scale, scale); c.translate(-(w - h) * 12, 0); paintArtFloor(c, plan); for (const env of environmentPlacements(plan)) {
    const q = iso(env);
    paintEnvironment(c, env.id, q.x, q.y, env.width, env.baseRise, env.flip);
} for (const t of plan.tables) {
    for (const ch of megaChairs(t).filter(ch => ch.rear))
        paintMegaChair(c, t, { ...ch.chair, rear: ch.rear });
    paintMegaTable(c, t);
    for (const ch of megaChairs(t).filter(ch => !ch.rear))
        paintMegaChair(c, t, { ...ch.chair, rear: ch.rear });
} return box; }
export function openActionManager(g, c, onClose = () => { }) {
    if (!managerAvailable(g) || document.querySelector('.action-manager-dialog'))
        return;
    talkManager(g);
    const manager = managerById(g.mega.manager.selected), dialog = document.createElement('dialog');
    dialog.className = 'manager-dialog action-manager-dialog';
    dialog.setAttribute('aria-label', manager.name + ' 매니저 통합 관리');
    document.body.append(dialog);
    let busy = false, closed = false;
    const close = () => { closed = true; dialog.querySelectorAll('canvas').forEach(v => { v.width = 0; v.height = 0; }); dialog.remove(); onClose(); };
    dialog.addEventListener('cancel', e => { e.preventDefault(); if (!busy)
        close(); });
    const manual = (kind) => { if (kind === 'hire' || kind === 'training') {
        void preview(kind);
        return;
    } close(); if (kind === 'roles')
        openFinalSupply(g, c, () => { });
    else
        document.getElementById('live-mega-management')?.click(); };
    const preview = async (kind, choice) => { if (busy)
        return; busy = true; dialog.innerHTML = '<h2>실제 공간과 비용을 확인하고 있어요…</h2><p>아직 구매하거나 바꾸지 않았어요. 영업은 계속돼요.</p>'; try {
        const p = await createManagerProposal(g, c, kind, choice);
        if (closed)
            return;
        dialog.innerHTML = '<h2>' + esc(manager.name + ' · ' + p.title) + '</h2><p>1. 내용과 비용 확인 → 2. 추천대로 실행</p><p>' + esc(manager.field + ' 관점에서 살펴봤어요. ' + p.reason) + '</p><div class="manager-cost"><strong>필요 현금 ' + p.cost.toLocaleString() + '원</strong><p>현재 ' + g.money.toLocaleString() + '원 → 예상 ' + Math.max(0, g.money - p.cost).toLocaleString() + '원' + (g.money < p.cost ? ' · 부족 ' + (p.cost - g.money).toLocaleString() + '원' : '') + '</p><p>15분 약정 급여 증가 ' + p.wage.toLocaleString() + '원 · 실제 합류 이후 근무시간만 반영</p></div><ul>' + p.changes.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul><p>' + esc(p.effect) + '</p><p role="status"></p><div class="manager-apply-actions"><button data-execute>추천대로 실행</button><button data-manual>직접 설정</button><button data-later>나중에 하기</button></div><button data-back>관리 메뉴로</button>';
        const run = dialog.querySelector('[data-execute]');
        run.disabled = !p.changes.length || g.money < p.cost;
        run.onclick = async () => { if (busy)
            return; busy = true; const buttons = [...dialog.querySelectorAll('button')].map(b => ({ b, disabled: b.disabled })); for (const { b } of buttons)
            b.disabled = true; const r = await executeManagerProposal(g, c, p, true); dialog.querySelector('[role=status]').textContent = r.message; for (const { b, disabled } of buttons)
            b.disabled = disabled; busy = false; if (r.ok) {
            run.disabled = true;
            run.textContent = '적용·저장 완료';
        }
        else {
            run.disabled = true;
            const refresh = document.createElement('button');
            refresh.textContent = '추천 다시 계산';
            refresh.onclick = () => void preview(kind, choice);
            dialog.querySelector('[role=status]').after(refresh);
        } };
        dialog.querySelector('[data-manual]').addEventListener('click', () => manual(kind));
        dialog.querySelector('[data-later]').addEventListener('click', close);
        dialog.querySelector('[data-back]').addEventListener('click', home);
        if (p.next && (kind === 'setup' || kind === 'logistics')) {
            const pair = document.createElement('div');
            pair.className = 'manager-layout-pair';
            pair.append(drawPreview(ensureMegaPlan(structuredClone(g.mega), g.cafeLevel, g.branchId), '현재 배치'), drawPreview(ensureMegaPlan(p.next.mega, g.cafeLevel, g.branchId), '추천 후 배치 · 승인 전 미적용'));
            dialog.querySelector('.manager-apply-actions').after(pair);
        }
        if (kind === 'hire' && p.next?.roster?.offer && !p.next.roster.offer.closed) {
            const list = document.createElement('div');
            list.className = 'manager-candidates';
            for (const id of p.next.roster.offer.ids) {
                const d = recruitById(id), card = document.createElement('article');
                card.innerHTML = recruitPortrait(id) + '<h3>' + esc(d.name) + '</h3><p>' + esc(roleText(finalProfile(id)?.role ?? 'floor')) + ' · ' + esc(staffEffect(id, 1)) + '</p><p>채용비 ' + (recruitCost(p.next, id) ?? 0).toLocaleString() + '원 · 15분 약정 급여 ' + finalSalary(id).toLocaleString() + '원</p><button>이 후보로 비용 비교</button>';
                card.querySelector('button').onclick = () => void preview('hire', id);
                list.append(card);
            }
            dialog.append(list);
        }
        if (kind === 'training') {
            const list = document.createElement('div');
            for (const w of g.service.paid) {
                const b = document.createElement('button');
                b.textContent = w.name + ' Lv.' + w.level + ' 교육 비교';
                b.disabled = w.level >= 5;
                b.onclick = () => void preview('training', w.staffId);
                list.append(b);
            }
            dialog.append(list);
        }
    }
    catch (e) {
        dialog.innerHTML = '<h2>추천을 확인해 주세요</h2><p>' + esc(e instanceof Error ? e.message : '아직 변경하지 않았어요.') + '</p><button data-close>닫기</button>';
        dialog.querySelector('button').onclick = close;
    }
    finally {
        busy = false;
    } };
    function home() { if (busy)
        return; const advice = managerAdvice(g, c.current()).slice(0, 3), roles = g.service.paid.reduce((a, w) => { const role = crewAssignment(g, w.staffId).role; a[role] = (a[role] ?? 0) + 1; return a; }, {}); dialog.innerHTML = '<h2>' + esc(manager.name) + ' 매니저 통합 관리</h2><p>' + esc(manager.field) + ' · 모든 기본 실행 기능을 함께 사용할 수 있어요.</p><p>직원 ' + g.service.paid.length + ' / ' + g.staffLimit + '명 · 15분 약정 급여 ' + g.service.paid.reduce((n, w) => n + finalSalary(w.staffId), 0).toLocaleString() + '원 · 보유 ' + g.money.toLocaleString() + '원</p><p>' + esc(Object.entries(roles).map(([k, n]) => ({ floor: '홀 서빙', kitchen: '주방 지원', logistics: '재고 보급', vip: 'VIP 서비스', 'zone-manager': '구역 관리' }[k] ?? k) + ' ' + n + '명').join(' · ')) + '</p><p>① 할 일을 골라요 → ② 비용과 바뀔 내용을 봐요 → ③ 괜찮으면 실행해요. 직접 배치한 가구는 옮기거나 팔지 않아요.</p><section><h3>지금 중요한 진단</h3>' + advice.map(a => '<article><strong>' + esc(a.title) + '</strong><p>' + esc(a.text) + '</p></article>').join('') + '</section><div class="action-manager-menu"></div><p>추천은 미리보기 후 승인해야 적용돼요. 화면을 열어도 영업·주문·재고는 계속 유지돼요.</p><button data-close>카페로 돌아가기</button>'; const menu = dialog.querySelector('.action-manager-menu'); for (const [label, task] of [['매장 자동 세팅', 'setup'], ['직원 구인·채용', 'hire'], ['직원 역할·구역 자동 배치', 'roles'], ['직원 교육', 'training'], ['가구·시설 배치', 'setup'], ['보조 서빙대·물류', 'logistics'], ['주방 생산 설비 투자', 'kitchen'], ['창고 확장 투자', 'storage']]) {
        const b = document.createElement('button');
        b.textContent = label;
        b.onclick = () => void preview(task);
        menu.append(b);
    } const manualRoles = document.createElement('button'); manualRoles.textContent = '직원 직접 설정 · 역할·대기 위치·잠금'; manualRoles.onclick = () => manual('roles'); menu.append(manualRoles); const undo = document.createElement('button'); undo.textContent = '직전 배치·역할 되돌리기 · 구매 환불 없음'; undo.disabled = !canUndoManagerSettings(g); undo.onclick = () => { const result = undoManagerSettings(g, c); const p = document.createElement('p'); p.setAttribute('role', 'status'); p.textContent = result.message; undo.after(p); undo.disabled = result.ok; }; menu.append(undo); dialog.querySelector('[data-close]').addEventListener('click', close); }
    home();
    dialog.showModal();
    dialog.focus({ preventScroll: true });
}
