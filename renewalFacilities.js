import { ensureMegaPlan, validateMegaPlan, megaDimensions } from './megaSpace.js?v=v31-5d872fe24674';
import { explicitDoors } from './finalDoors.js?v=v31-5d872fe24674';
export const renewalFacilityCatalog = [{ id: 'terrace', name: '정원 테라스 마감', level: 22, space: 20, cost: 180000 }, { id: 'vip', name: 'VIP 라운지 마감', level: 22, space: 30, cost: 280000 }, { id: 'landmark', name: '랜드마크 브랜드 간판', level: 29, space: 30, cost: 750000 }];
export function validRenewalFacilities(v) { try {
    const f = v;
    return f.version === 1 && Array.isArray(f.receipts) && f.receipts.length <= 6 && new Set(f.receipts.map(r => r.id)).size === f.receipts.length && f.receipts.every((r, i) => r.id === 'renewal-facility-' + (i + 1) && (r.kind === 'door' ? r.cost === 75000 && typeof r.doorId === 'string' && /^door-renewal-[1-3]$/.test(r.doorId) : renewalFacilityCatalog.some(x => x.id === r.kind && x.cost === r.cost) && r.doorId === undefined)) && new Set(f.receipts.filter(r => r.kind !== 'door').map(r => r.kind)).size === f.receipts.filter(r => r.kind !== 'door').length && new Set(f.receipts.filter(r => r.kind === 'door').map(r => r.doorId)).size === f.receipts.filter(r => r.kind === 'door').length && f.receipts.filter(r => r.kind === 'door').length <= 3 && Object.keys(f).every(k => ['version', 'receipts'].includes(k));
}
catch {
    return false;
} }
export const facilityOwned = (s, id) => !!s.mega?.finalGrowth?.renewal?.facilities?.receipts.some(r => r.kind === id);
export function facilityQuote(s, id) { const item = renewalFacilityCatalog.find(x => x.id === id), owned = facilityOwned(s, id), active = !!s.campaign?.run && !s.campaign.run.closed; return { item, owned, eligible: !!item && !!s.mega?.finalGrowth?.renewal && !owned && !active && s.cafeLevel >= item.level && (s.mega.paid?.spaceLevel ?? 1) >= item.space && s.money >= item.cost }; }
export function commitRenewalFacility(repo, expected, id) { const q = facilityQuote(expected, id); if (!q.eligible || !q.item)
    return { ok: false, message: q.owned ? '이미 구매한 시설이에요.' : '필요 레벨·소유 면적·보유금·영업 종료 조건을 확인해 주세요.' }; const next = structuredClone(expected), f = next.mega.finalGrowth.renewal.facilities ??= { version: 1, receipts: [] }; next.money -= q.item.cost; f.receipts.push({ id: 'renewal-facility-' + (f.receipts.length + 1), kind: q.item.id, cost: q.item.cost }); return repo.write(next, expected); }
export function prepareRenewalDoor(source, expectedCount, wall, offset) { const fail = (reason) => ({ ok: false, reason }); const r = source.mega?.finalGrowth?.renewal; if (!r || source.mode !== 'CAFE_GROWTH')
    return fail('리뉴얼 GROWTH에서만 추가 출입구를 구매해요.'); if (source.cafeLevel < 16 && !(r.origin === 'legacy' && r.legacyLevel >= 16))
    return fail('추가 출입구는 Lv.16부터 구매해요.'); if (source.money < 75000)
    return fail((75000 - source.money).toLocaleString() + '원이 부족해요.'); const s = structuredClone(source), p = ensureMegaPlan(s.mega, s.cafeLevel, s.growthBranch?.active ?? undefined); p.doors = explicitDoors(p); if (p.doors.length !== expectedCount || p.doors.length >= 4)
    return fail('출입구 수가 바뀌었거나 최대 4곳이에요.'); const f = s.mega.finalGrowth.renewal.facilities ??= { version: 1, receipts: [] }, doorId = 'door-renewal-' + (1 + f.receipts.filter(r => r.kind === 'door').length); p.doors.push({ id: doorId, wall, offset }); const errors = validateMegaPlan(p); if (errors.length)
    return fail(errors[0]); s.money -= 75000; f.receipts.push({ id: 'renewal-facility-' + (f.receipts.length + 1), kind: 'door', cost: 75000, doorId }); return { ok: true, save: s }; }
export function appendRenewalFacilities(host, repo, save, refresh) { for (const item of renewalFacilityCatalog) {
    const q = facilityQuote(save, item.id), card = document.createElement('article'), h = document.createElement('h3'), p = document.createElement('p'), b = document.createElement('button');
    h.textContent = item.name;
    p.textContent = 'Lv.' + item.level + ' · 실제 ' + megaDimensions[item.space - 1].join('×') + ' 매장 · ' + item.cost.toLocaleString() + '원. 기존 구역의 바닥·브랜드 마감이며, 가구·좌석은 지급하지 않아요.';
    b.textContent = q.owned ? '보유한 시설' : '비용 확인';
    b.disabled = !q.eligible;
    b.style.minHeight = '48px';
    b.onclick = () => { b.disabled = true; const confirm = document.createElement('button'); confirm.textContent = '확인 · ' + item.cost.toLocaleString() + '원 결제'; confirm.style.minHeight = '48px'; const cancel = document.createElement('button'); cancel.textContent = '취소'; cancel.onclick = refresh; confirm.onclick = () => { confirm.disabled = true; const result = commitRenewalFacility(repo, save, item.id); if (!result.ok)
        p.textContent = result.message;
    else
        refresh(); }; card.append(confirm, cancel); };
    card.append(h, p, b);
    host.append(card);
} }
