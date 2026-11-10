import { validateGrowthSave } from './growthSave.js?v=mega-5d509fb5dbfc';
import { operatingSeatContract } from './finalGrowth.js?v=mega-5d509fb5dbfc';
import { ensureMegaPlan, megaKey, megaDimensions, validateMegaPlan, megaObstacles, tableParts, fixtureParts, megaCrewHomes } from './megaSpace.js?v=mega-5d509fb5dbfc';
import { inventorySku, tableSeatCount, includedSeats } from './megaInventory.js?v=mega-5d509fb5dbfc';
import { installedIds, interiorCandidate } from './interiorPlacement.js?v=mega-5d509fb5dbfc';
import { buyInterior } from './megaShop.js?v=mega-5d509fb5dbfc';
import { crewAssignment, configureFinalSupply } from './finalSupply.js?v=mega-5d509fb5dbfc';
import { megaZones } from './megaZones.js?v=mega-5d509fb5dbfc';
import { rosterFor, openRecruitment, candidateWeights, hireCandidate, recruitCost } from './staffRecruitment.js?v=mega-5d509fb5dbfc';
import { finalProfile, recruitById } from './recruitConfig.js?v=mega-5d509fb5dbfc';
import { finalSalary } from './finalPayroll.js?v=mega-5d509fb5dbfc';
import { kitchenStages } from './productionKitchen.js?v=mega-5d509fb5dbfc';
import { liveManagementRepository } from './liveManagement.js?v=mega-5d509fb5dbfc';
const roleName = { floor: '홀 서빙', kitchen: '주방 지원', logistics: '재고 보급', vip: 'VIP 서비스', 'zone-manager': '구역 관리' };
const zoneLabel = (g, id) => g.serviceSpace?.megaPlan ? megaZones(g.serviceSpace.megaPlan).find(z => z.id === id)?.name ?? '전체 구역' : '전체 구역';
const serial = (g) => g.mega?.finalGrowth?.managerActions?.serial ?? 0;
export function managerFingerprint(g) { const m = g.mega; return JSON.stringify([g.cafeLevel, m?.paid, m?.inventory, m?.plans, m?.production, m?.finalGrowth?.specialization, g.roster?.owned, g.roster?.active, m?.finalGrowth?.crew, m?.manager?.selected, serial(g)]); }
export function managerAvailable(g) { return g.mode === 'CAFE_GROWTH' && !!g.mega?.finalGrowth && g.mega.manager?.status === 'selected' && (g.mega.paid?.spaceLevel ?? 1) > 1; }
const uncampaign = (s) => { const n = structuredClone(s); delete n.campaign; return n; };
const pause = () => new Promise(r => setTimeout(r, 0));
export function suggestAssignments(g, planOverride) { const workers = [...g.service.paid], p = planOverride ?? g.serviceSpace?.megaPlan, zones = p ? megaZones(p) : [], homes = p ? megaCrewHomes(p, g.staffLimit + 1) : [], out = {}; const logisticsCount = workers.length >= 2 && (p?.fixtures?.length ?? 0) > 0 ? Math.max(1, Math.floor(workers.length / 8)) : 0; const quotas = Array.from({ length: workers.length }, (_, i) => i < logisticsCount ? 'logistics' : workers.length >= 10 && i === logisticsCount ? 'kitchen' : workers.length >= 5 && i === logisticsCount + 1 ? 'vip' : workers.length >= 16 && i === logisticsCount + 2 ? 'zone-manager' : 'floor'); const pool = workers.filter(w => !crewAssignment(g, w.staffId).locked); for (const w of workers)
    if (crewAssignment(g, w.staffId).locked)
        out[w.staffId] = structuredClone(crewAssignment(g, w.staffId)); for (const [i, role] of quotas.entries()) {
    if (!pool.length)
        break;
    pool.sort((a, b) => Number(finalProfile(b.staffId)?.role === role) - Number(finalProfile(a.staffId)?.role === role) || b.carryCapacity - a.carryCapacity || b.moveSpeed - a.moveSpeed);
    const w = pool.shift(), old = crewAssignment(g, w.staffId), zone = role === 'kitchen' ? 'kitchen' : role === 'vip' && zones.some(z => z.id === 'vip') ? 'vip' : zones[i % Math.max(1, zones.length)]?.id ?? 'all', next = { role, zone, home: homes[g.service.paid.indexOf(w) + 1] };
    const effective = old.pending ?? old;
    if (JSON.stringify([effective.role, effective.zone, effective.home]) === JSON.stringify([next.role, next.zone, next.home]))
        out[w.staffId] = structuredClone(old);
    else
        out[w.staffId] = { ...old, pending: next };
} return out; }
async function layoutSuggestion(g, source, facility) { let s = uncampaign(source), p = structuredClone(ensureMegaPlan(s.mega, g.cafeLevel, g.branchId)), added = 0, attempts = 0; const limit = operatingSeatContract(g).operatingLimit, [W, H] = megaDimensions[p.level - 1], target = facility ? 1 : Math.max(0, limit - p.tables.reduce((n, t) => n + tableSeatCount(t), 0)); if (facility && limit < 12)
    return { save: s, added: 0 }; if (facility && (p.fixtures?.length ?? 0) >= Math.max(1, Math.ceil(limit / 25)))
    return { save: s, added: 0 }; while (added < target) {
    if (!facility && target - added < 2)
        break;
    const used = installedIds(p), stored = s.mega.inventory.items.find(i => !used.has(i.id) && inventorySku(i.sku)?.type === (facility ? 'fixture' : 'table') && (facility || includedSeats(i.sku) <= target - added)), fallback = facility ? 'service-prep' : g.cafeLevel >= 3 && target - added >= 4 ? 'classic-four' : 'classic-two', path = g.mega?.finalGrowth?.specialization?.path;
    let sku = stored?.sku ?? (facility ? fallback : path === 'mass' && target - added >= 6 ? 'classic-long' : path === 'brand' ? 'garden-round' : fallback);
    let draft = s, id = stored?.id;
    if (!id) {
        let r = buyInterior(s, sku, s.mega.inventory.next);
        if (!r.ok && sku !== fallback) {
            sku = fallback;
            r = buyInterior(s, sku, s.mega.inventory.next);
        }
        if (!r.ok)
            break;
        draft = r.save;
        id = draft.mega.inventory.receipts.at(-1).items[0];
    }
    let chosen;
    const zones = megaZones(p), zoneOf = (x, y) => zones.find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h), counts = new Map(zones.map(z => [z.id, p.tables.filter(t => zoneOf(t.x, t.y)?.id === z.id).reduce((n, t) => n + tableSeatCount(t), 0)])), points = [];
    for (let y = 2.5; y < H - 1; y += 4)
        for (let x = 3.5; x < W - 1; x += 4) {
            const zone = zoneOf(x, y);
            if (!facility && ['kitchen', 'bakery'].includes(zone?.id ?? ''))
                continue;
            const density = zone ? (counts.get(zone.id) ?? 0) / (zone.w * zone.h) : 1, score = facility ? -(zone ? (counts.get(zone.id) ?? 0) / (1 + (p.fixtures ?? []).filter(f => zoneOf(f.x, f.y)?.id === zone.id).length) : 0) : density;
            points.push({ x, y, score, distance: zone ? Math.hypot(x - zone.x - zone.w / 2, y - zone.y - zone.h / 2) : 0 });
        }
    points.sort((a, b) => a.score - b.score || a.distance - b.distance || a.y - b.y || a.x - b.x);
    for (const { x, y } of points) {
        if (chosen)
            break;
        if (++attempts % 24 === 0)
            await pause();
        const q = interiorCandidate(draft, p, id, x, y, 0);
        if (!q)
            continue;
        const parts = facility ? fixtureParts(q.fixtures.at(-1)) : tableParts(q.tables.at(-1));
        const obstacles = megaObstacles(p);
        if (parts.some(a => obstacles.some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)))
            continue;
        if (!validateMegaPlan(q).length)
            chosen = q;
    }
    if (!chosen)
        break;
    s = draft;
    p = chosen;
    s.mega.plans[megaKey(p.level, p.branch)] = p;
    added += facility ? 1 : tableSeatCount(p.tables.at(-1));
    await pause();
    if (facility)
        break;
} return { save: s, added }; }
export async function createManagerProposal(g, c, kind, choice) { if (!managerAvailable(g))
    throw Error('첫 유료 증축 후 매니저를 선택해 주세요.'); const source = c.current(), base = { serial: serial(g), kind, fingerprint: managerFingerprint(g), cost: 0, wage: 0, changes: [], title: '', reason: '실제 카페 상태를 확인했어요.', effect: '기존 가구와 진행 중인 주문은 그대로 유지해요.' }; if (kind === 'roles') {
    const assignments = suggestAssignments(g);
    return { ...base, title: '직원 역할·구역 자동 배분', reason: '직원 특성과 운반 능력을 비교했어요. 잠긴 직원은 유지해요.', assignments, changes: g.service.paid.filter(w => !crewAssignment(g, w.staffId).locked && !!assignments[w.staffId].pending).map(w => w.name + ' · ' + roleName[crewAssignment(g, w.staffId).role] + ' → ' + roleName[assignments[w.staffId].pending.role] + ' / ' + zoneLabel(g, assignments[w.staffId].pending.zone) + ' · 현재 작업 후 전환'), effect: '홀·주방·물류·VIP·구역 업무를 나눠요. 진행 중 작업은 먼저 마쳐요.' };
} if (kind === 'setup' || kind === 'logistics') {
    const r = await layoutSuggestion(g, source, kind === 'logistics');
    let next = r.save;
    const changes = r.added ? [kind === 'setup' ? r.added + '개 좌석 추가 · 기존 배치 유지' : '보조 서빙대1개 추가'] : [];
    if (kind === 'setup') {
        let facilities = 0;
        for (let i = 0; i < Math.max(1, Math.ceil(operatingSeatContract(g).operatingLimit / 25)); i++) {
            const logistics = await layoutSuggestion(g, next, true);
            next = logistics.save;
            facilities += logistics.added;
            if (!logistics.added)
                break;
        }
        if (facilities)
            changes.push('보조 서빙대' + facilities + '개 추가');
        if (changes.length) {
            next.mega.finalGrowth.crew = suggestAssignments(g, ensureMegaPlan(next.mega, g.cafeLevel, g.branchId));
            changes.push('잠금 제외 직원 역할·구역 배분 · 현재 작업 후 전환');
            changes.push('기존 출입구 유지 · 새 좌석과 주방 연결 경로 검사');
        }
    }
    return { ...base, title: kind === 'setup' ? '증축 공간 기본 세팅' : '보조 서빙대 설치', next, cost: source.money - next.money, changes, effect: changes.length ? '보관 가구부터 재사용하고 필요한 가구만 정상 가격으로 구매해요.' : '안전한 빈 공간·보유금 또는 운영 권한이 부족해요. 기존 배치를 유지해요.' };
} if (kind === 'hire') {
    if (g.service.paid.length >= g.staffLimit)
        return { ...base, title: '직원 정원이 가득 찼어요.', effect: '현재 ' + g.staffLimit + '명 정원. 역할 배분을 먼저 확인해요.' };
    const s = uncampaign(source);
    s.roster ??= rosterFor(s);
    openRecruitment(s);
    if (!s.roster.offer || s.roster.offer.closed) {
        const window = 'manager-recruit-' + (serial(g) + 1), ids = candidateWeights(s, s.roster).sort((a, b) => (recruitCost(s, a.id) ?? Infinity) - (recruitCost(s, b.id) ?? Infinity) || a.id.localeCompare(b.id)).slice(0, 3).map(v => v.id);
        if (ids.length && !s.roster.windows.includes(window)) {
            s.roster.offer = { window, ids, closed: false };
            s.roster.windows.push(window);
        }
    }
    const ids = s.roster.offer && !s.roster.offer.closed ? s.roster.offer.ids : [], eligible = ids.filter(id => !s.roster.owned.some(o => o.id === id)), id = choice && eligible.includes(choice) ? choice : eligible.sort((a, b) => (recruitCost(s, a) ?? Infinity) - (recruitCost(s, b) ?? Infinity))[0];
    return { ...base, title: '현재 구인 후보 채용', hireId: id, next: s, cost: id ? recruitCost(s, id) ?? 0 : 0, wage: id ? finalSalary(id) : 0, changes: id ? [recruitById(id).name + ' 실제 채용·즉시 근무'] : [], effect: id ? '기존50종 풀의 해금된 후보를 비교했어요. 실제 채용비와 근무 급여를 적용하며, 기존 직원·공고 기록은 유지해요.' : '해금된 미보유 후보가 없거나 직원 보유 정원이 가득 찼어요.' };
} if (kind === 'training') {
    const w = g.service.paid.filter(w => w.level < 5 && (!choice || w.staffId === choice)).sort((a, b) => b.walkDistance - a.walkDistance)[0];
    return { ...base, title: '직원 교육', trainingId: w?.staffId, cost: w ? g.getStaffUpgradeCost(w.staffId) ?? 0 : 0, changes: w ? [w.name + ' Lv.' + w.level + ' → ' + (w.level + 1)] : [], effect: '기존 직원 강화 비용·능력을 적용해요.' };
} const next = kind === 'kitchen' ? kitchenStages[(g.mega?.production?.tier ?? 0) + 1] : g.nextWarehouse; const available = next && (kind !== 'kitchen' || g.cafeLevel >= ('level' in next ? next.level : 1) && (g.mega?.paid?.spaceLevel ?? 1) >= ('space' in next ? next.space : 1)); return { ...base, title: kind === 'kitchen' ? '생산 설비 강화' : '창고 확장', expectedTier: g.mega?.production?.tier ?? 0, cost: available ? next.cost : 0, changes: available ? [kind === 'kitchen' ? ('name' in next ? next.name : '생산량 증가') : '메뉴별 창고 ' + ('capacity' in next ? next.capacity : 0) + '개'] : [], effect: available ? '기존 구매 비용과 정답 생산 정책을 그대로 적용해요. 음식이나 현금을 무료로 지급하지 않아요.' : '해금 조건을 확인하거나 최고 단계에 도달했어요.' }; }
const reversals = new WeakMap();
const undoFingerprint = (g) => JSON.stringify([g.mega?.plans, g.mega?.inventory, g.mega?.finalGrowth?.managerActions?.serial, Object.fromEntries(Object.entries(g.mega?.finalGrowth?.crew ?? {}).map(([id, a]) => [id, { ...a, ...a.pending, pending: undefined }]))]);
export const canUndoManagerSettings = (g) => reversals.has(g);
export function undoManagerSettings(g, c) { const r = reversals.get(g); if (!r || r.fingerprint !== undoFingerprint(g))
    return { ok: false, message: '직접 설정이 바뀌었어요. 기존 영업 거래를 보호하기 위해 자동으로 되돌리지 않아요.' }; const expected = uncampaign(c.current()), next = structuredClone(expected); if (r.plan)
    next.mega.plans[megaKey(r.plan.level, r.plan.branch)] = structuredClone(r.plan); if (r.crew) {
    next.mega.finalGrowth.crew = Object.fromEntries(g.service.paid.map(w => [w.staffId, { ...crewAssignment(g, w.staffId), pending: structuredClone(r.crew[w.staffId] ?? { role: finalProfile(w.staffId)?.role ?? 'floor', zone: 'all' }) }]));
} const state = next.mega.finalGrowth.managerActions; state.serial++; state.receipts.push({ id: 'manager-' + state.serial, kind: r.plan ? 'setup' : 'roles', cost: 0, at: new Date().toISOString() }); state.receipts = state.receipts.slice(-100); const result = liveManagementRepository(g, c).write(next, expected); if (result.ok)
    reversals.delete(g); return result.ok ? { ok: true, message: '배치·역할만 되돌렸어요. 구매한 가구는 보관하며 영업 매출·재고·결제는 되돌리지 않아요.' } : result; }
const journals = new WeakMap();
function stamp(g, p) { const s = g.mega.finalGrowth.managerActions ??= { version: 1, serial: 0, receipts: [] }; s.serial++; s.receipts.push({ id: 'manager-' + s.serial, kind: p.kind, cost: p.cost, at: new Date().toISOString() }); s.receipts = s.receipts.slice(-100); }
export async function executeManagerProposal(g, c, p, approved) { const fail = (message) => ({ ok: false, message }); if (!approved)
    return fail('학생이 추천 내용을 확인하고 승인해야 해요.'); if (!managerAvailable(g) || g.status !== 'RUNNING' || p.serial !== serial(g) || p.fingerprint !== managerFingerprint(g) || journals.get(g)?.has(p))
    return fail('카페가 바뀌었거나 이미 실행했어요. 추천을 다시 확인해 주세요.'); let fresh; try {
    fresh = await createManagerProposal(g, c, p.kind, p.hireId ?? p.trainingId);
}
catch (e) {
    return fail(e instanceof Error ? e.message : '추천을 다시 확인해 주세요.');
} if (p.serial !== serial(g) || p.fingerprint !== managerFingerprint(g) || JSON.stringify([fresh.cost, fresh.changes, fresh.hireId, fresh.trainingId]) !== JSON.stringify([p.cost, p.changes, p.hireId, p.trainingId]))
    return fail('상태가 바뀌어 추천을 다시 계산했어요. 미리보기를 다시 열어 주세요.'); if (!fresh.changes.length)
    return fail(fresh.effect); if (g.money < fresh.cost)
    return fail((fresh.cost - g.money).toLocaleString() + '원이 부족해요. 결제하지 않았어요.'); const used = journals.get(g) ?? new Set(); journals.set(g, used); used.add(p); const before = { money: g.money, mega: structuredClone(g.mega), roster: structuredClone(g.roster), workers: [...g.service.workers], workerData: structuredClone(g.service.workers), upgrades: g.telemetry.staffUpgradePurchases.length, hires: g.telemetry.staffHireTimes.length, warehouse: g.warehouseLevel, max: g.menus.map(m => m.maxStock), telemetry: g.telemetry.upgradePurchases.length, workerLevels: g.service.paid.map(w => ({ id: w.staffId, level: w.level })) }; const rollback = () => { g.money = before.money; g.mega = before.mega; g.roster = before.roster; g.warehouseLevel = before.warehouse; g.menus.forEach((m, i) => m.maxStock = before.max[i]); g.service.workers.splice(0, g.service.workers.length, ...before.workers); g.service.workers.forEach((w, i) => Object.assign(w, before.workerData[i])); g.telemetry.staffUpgradePurchases.splice(before.upgrades); g.telemetry.staffHireTimes.splice(before.hires); g.telemetry.upgradePurchases.splice(before.telemetry); configureFinalSupply(g); used.delete(p); }; try {
    if (fresh.kind === 'setup' || fresh.kind === 'logistics') {
        const next = fresh.next, expected = c.current();
        next.money = g.money - fresh.cost;
        const action = next.mega.finalGrowth.managerActions ??= { version: 1, serial: 0, receipts: [] };
        action.serial++;
        action.receipts.push({ id: 'manager-' + action.serial, kind: p.kind, cost: p.cost, at: new Date().toISOString() });
        action.receipts = action.receipts.slice(-100);
        const r = liveManagementRepository(g, c).write(next, (() => { const x = structuredClone(expected); delete x.campaign; return x; })());
        if (!r.ok) {
            used.delete(p);
            return r;
        }
        reversals.set(g, { fingerprint: undoFingerprint(g), plan: structuredClone(ensureMegaPlan(before.mega, g.cafeLevel, g.branchId)) });
        return { ok: true, message: '배치를 적용하고 저장했어요. 구매한 가구는 보관함 소유로 유지돼요.' };
    }
    if (fresh.kind === 'roles') {
        g.mega.finalGrowth.crew = fresh.assignments;
        configureFinalSupply(g);
    }
    else if (fresh.kind === 'hire') {
        const s = uncampaign(c.current());
        s.roster = structuredClone(fresh.next.roster);
        if (!hireCandidate(s, fresh.hireId))
            throw Error('후보·현금·정원을 다시 확인해 주세요.');
        g.money = s.money;
        g.roster = s.roster;
        const d = recruitById(fresh.hireId), w = g.service.hire(d);
        if (!w)
            throw Error('안전한 직원 대기 공간이 부족해요.');
        const entry = g.serviceSpace.entrance;
        if (g.service.workers.filter(v => v !== w).some(v => Math.hypot(v.position.x - entry.x, (v.position.y - entry.y) * 2 / 3) < 3))
            throw Error('입구가 혼잡해요. 잠시 뒤 다시 채용해 주세요. 결제하지 않았어요.');
        w.position = { ...entry };
        w.state = 'RETURNING';
        g.telemetry.staffHireTimes.push({ elapsedTime: g.elapsedTime, staffId: w.staffId });
        g.mega.finalGrowth.crew ??= {};
        g.mega.finalGrowth.crew[w.staffId] = { role: finalProfile(w.staffId)?.role ?? 'floor', zone: 'all', home: g.serviceSpace.staffWaitingPoints[g.service.workers.length - 1] };
        const r = g.mega.finalGrowth.payroll?.run;
        if (r && !r.settled && !r.crew.some(v => v.id === w.staffId))
            r.crew.push({ id: w.staffId, salary: finalSalary(w.staffId), joinedAt: r.seconds });
        configureFinalSupply(g);
    }
    else if (fresh.kind === 'training') {
        const r = g.upgradeStaff(fresh.trainingId);
        if (!r.ok)
            throw Error(r.reason);
        const owned = g.roster?.owned.find(w => w.id === fresh.trainingId), worker = g.service.paid.find(w => w.staffId === fresh.trainingId);
        if (owned && worker)
            owned.level = worker.level;
    }
    else {
        const r = fresh.kind === 'kitchen' ? g.upgradeProduction(fresh.expectedTier) : g.upgradeWarehouse();
        if (!r.ok)
            throw Error(r.reason);
    }
    stamp(g, p);
    if (!validateGrowthSave(c.current()))
        throw Error('저장 정보를 확인하지 못해 변경 전으로 되돌렸어요.');
    const written = c.save();
    if (!written.ok) {
        rollback();
        return written;
    }
    if (fresh.kind === 'roles')
        reversals.set(g, { fingerprint: undoFingerprint(g), crew: structuredClone(before.mega.finalGrowth.crew ?? {}) });
    const message = fresh.kind === 'hire' ? recruitById(fresh.hireId).name + '가 합류했어요. 현재 ' + g.service.paid.length + '명 근무 · 채용비 ' + fresh.cost.toLocaleString() + '원 1회 결제' : fresh.kind === 'training' ? (g.service.paid.find(w => w.staffId === fresh.trainingId)?.name ?? '직원') + ' Lv.' + g.service.paid.find(w => w.staffId === fresh.trainingId).level + ' 교육·저장 완료' : fresh.kind === 'kitchen' ? '현재 정답 생산량 메뉴별 +' + g.productionAmount + '개 · 설비 구매·저장 완료' : fresh.kind === 'storage' ? '현재 메뉴별 창고 ' + g.warehouse.capacity + '개 · 확장·저장 완료' : '직원별 역할·구역을 저장했어요. 진행 중 작업이 끝나면 적용돼요.';
    return { ok: true, message };
}
catch (e) {
    rollback();
    return fail(e instanceof Error ? e.message : '변경 전 상태로 되돌렸어요.');
} }
