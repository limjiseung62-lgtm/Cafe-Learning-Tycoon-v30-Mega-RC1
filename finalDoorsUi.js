import { ensureMegaPlan, megaDimensions } from './megaSpace.js?v=mega-d152ad969955';
import { explicitDoors, prepareDoorMove } from './finalDoors.js?v=mega-d152ad969955';
export function openFinalDoors(repo, done) { const r = repo.read(); if (r.status !== 'ready' || !r.save.mega?.finalGrowth) {
    done();
    return;
} const original = r.save, p = ensureMegaPlan(structuredClone(original.mega), original.cafeLevel, original.growthBranch?.active ?? undefined), doors = explicitDoors(p), [w, h] = megaDimensions[p.level - 1], d = document.createElement('dialog'); d.className = 'mega-expansion'; d.innerHTML = '<h2>출입구 이동</h2><p>소유한 출입구를 외벽으로 옮겨요. 모든 좌석·주방·직원 통로를 검사한 뒤 적용해요. 영업 중 손님이 이동 중이면 잠시 기다려 주세요.</p><label>출입구<select data-door>' + doors.map((v, i) => '<option value="' + v.id + '">출입구 ' + (i + 1) + '</option>').join('') + '</select></label><label>외벽<select data-wall><option value="west">왼쪽 서쪽 벽</option><option value="east">오른쪽 동쪽 벽</option><option value="north">뒤쪽 북쪽 벽</option><option value="south">앞쪽 남쪽 벽</option></select></label><label>벽을 따라 위치 (0.5칸 단위)<input data-offset type="number" min="0.5" step="0.5"></label><p>실제 바닥 ' + w + '×' + h + '칸 · 현재 소유 출입구 ' + doors.length + '개</p><p role="status"></p><button data-apply>통로 검사 · 이동 적용</button><button data-close>취소</button><p>추가 출입구 구매와 보조 서빙대 실재고 이체는 다음 물류 단계에서 구현 예정이에요.</p>'; for (const b of d.querySelectorAll('button,input,select'))
    b.style.cssText = 'min-height:48px;font:inherit;margin:6px;max-width:100%'; document.body.append(d); d.showModal(); const sel = d.querySelector('[data-door]'), wall = d.querySelector('[data-wall]'), offset = d.querySelector('[data-offset]'), status = d.querySelector('[role=status]'); const selected = () => { const q = doors.find(v => v.id === sel.value); wall.value = q.wall; offset.value = String(q.offset); }; sel.onchange = selected; selected(); const close = () => { d.remove(); done(); }; d.querySelector('[data-close]').addEventListener('click', close); d.addEventListener('cancel', e => { e.preventDefault(); close(); }); d.querySelector('[data-apply]').onclick = () => { const next = prepareDoorMove(original, sel.value, wall.value, Number(offset.value)); if (!next.ok) {
    status.textContent = next.reason;
    return;
} const written = repo.write(next.save, original); if (!written.ok) {
    status.textContent = written.message;
    return;
} close(); }; }
