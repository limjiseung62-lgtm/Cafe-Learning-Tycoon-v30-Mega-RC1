import { finalSalary } from './finalPayroll.js';
import { staffEffect } from './recruitConfig.js';
import { finalRoles } from './finalSupplyState.js';
import { configureFinalSupply, crewAssignment, supplyState } from './finalSupply.js';
import { megaZones } from './megaZones.js';
const labels = { floor: '홀 서빙', kitchen: '주방 지원', logistics: '재고 보급', vip: 'VIP 서비스', 'zone-manager': '구역 관리' };
export function openFinalSupply(g, c, done) { if (g.mega?.finalGrowth?.renewal && g.cafeLevel < 14 && g.mega.finalGrowth.renewal.origin !== 'legacy') {
    const d = document.createElement('dialog');
    d.textContent = '직원 담당 구역과 대기 위치 지정은 Lv.14부터예요. 기존 자동 서빙은 계속돼요.';
    const b = document.createElement('button');
    b.textContent = '카페로 돌아가기';
    b.onclick = () => { d.remove(); done(); };
    d.append(b);
    document.body.append(d);
    d.showModal();
    return;
} const dialog = document.createElement('dialog'); dialog.className = 'live-mega-hub'; document.body.append(dialog); const close = () => { dialog.remove(); done(); }; const render = () => { dialog.replaceChildren(); const h = document.createElement('h2'); h.textContent = '직원 분업 · 실제 재고 보급'; dialog.append(h); const note = document.createElement('p'); note.textContent = '보급 직원은 중앙 주방의 음식을 서빙대로 직접 운반해요. 보급으로 음식이 새로 생기지는 않아요. 관리 중에도 영업은 계속돼요.'; dialog.append(note); const message = document.createElement('p'); message.setAttribute('role', 'status'); dialog.append(message); const commit = (change) => { const before = structuredClone(g.mega.finalGrowth); change(); const result = c.save(); if (!result.ok) {
    g.mega.finalGrowth = before;
    configureFinalSupply(g);
    message.textContent = result.message ?? '저장하지 못했어요. 변경 전 상태를 유지해요.';
    return;
} configureFinalSupply(g); render(); }; const zones = g.serviceSpace?.megaPlan ? megaZones(g.serviceSpace.megaPlan) : []; for (const w of g.service.paid) {
    const row = document.createElement('fieldset'), title = document.createElement('legend');
    title.textContent = w.name + ' · 이동 ' + Math.round(w.walkDistance ?? 0) + ' · 보급 ' + (w.supplyTrips ?? 0) + '회';
    row.append(title);
    const contract = document.createElement('p');
    contract.textContent = staffEffect(w.staffId, w.level) + ' · 약정 급여 ' + finalSalary(w.staffId).toLocaleString() + '원 / 15분 (매출 범위) · 실제 트레이 ' + (g.service.support?.tripCapacity?.(w) ?? w.carryCapacity) + '개' + (g.service.support?.batchServing ? ' · 가까운 주문 묶음 수령' : '');
    row.append(contract);
    const a = crewAssignment(g, w.staffId);
    if (a.pending) {
        const planned = document.createElement('p');
        planned.textContent = '현재 작업 완료 후 ' + labels[a.pending.role] + ' · ' + a.pending.zone + ' 구역으로 전환해요.';
        row.append(planned);
    }
    const role = document.createElement('select'), zone = document.createElement('select');
    role.setAttribute('aria-label', w.name + ' 담당 역할');
    zone.setAttribute('aria-label', w.name + ' 담당 구역');
    for (const value of finalRoles) {
        const o = new Option(labels[value], value);
        o.selected = value === a.role;
        role.add(o);
    }
    for (const value of ['all', ...zones.map(z => z.id)]) {
        const o = new Option(value === 'all' ? '모든 구역' : zones.find(z => z.id === value)?.name ?? value, value);
        o.selected = value === a.zone;
        zone.add(o);
    }
    const apply = document.createElement('button');
    apply.textContent = '담당 변경';
    apply.onclick = () => commit(() => { const s = g.mega.finalGrowth; (s.crew ??= {})[w.staffId] = { ...a, pending: { role: role.value, zone: zone.value } }; });
    const home = document.createElement('button');
    home.textContent = '현재 위치를 대기 위치로';
    home.onclick = () => commit(() => { const s = g.mega.finalGrowth; (s.crew ??= {})[w.staffId] = { ...crewAssignment(g, w.staffId), home: { ...w.position } }; });
    const lock = document.createElement('button');
    lock.textContent = a.locked ? '자동 배치 잠금 해제' : '이 직원 자동 배치 잠금';
    lock.onclick = () => commit(() => { g.mega.finalGrowth.crew ??= {}; g.mega.finalGrowth.crew[w.staffId] = { ...crewAssignment(g, w.staffId), locked: !a.locked }; });
    row.append(role, zone, apply, home, lock);
    dialog.append(row);
} const s = supplyState(g); let stationNumber = 0; for (const [id, station] of Object.entries(s.stations)) {
    const row = document.createElement('p');
    row.textContent = '서빙대 ' + (++stationNumber) + ' · 보관 ' + Object.values(station.stock).reduce((a, b) => a + b, 0) + '개 · ' + (s.jobs.some(j => j.stationId === id) ? '운반 중' : '보급 대기');
    const recall = document.createElement('button');
    recall.textContent = station.recall ? '중앙 주방으로 회수 중' : '재고 회수 요청';
    recall.disabled = !!station.recall;
    recall.onclick = () => commit(() => { supplyState(g).stations[id].recall = true; });
    row.append(recall);
    dialog.append(row);
} const refresh = document.createElement('button'); refresh.textContent = '현황 새로 보기'; refresh.onclick = render; const back = document.createElement('button'); back.textContent = '카페로 돌아가기'; back.onclick = close; dialog.append(refresh, back); }; dialog.addEventListener('cancel', e => { e.preventDefault(); close(); }); render(); dialog.showModal(); }
