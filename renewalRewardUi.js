import { studioItem } from './renewalFurnitureCatalog.js?v=v31-final-636a93f6f215';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=v31-final-636a93f6f215';
import { validateGrowthSave } from './growthSave.js?v=v31-final-636a93f6f215';
import { rewardState, useRewardVoucher } from './renewalRewards.js?v=v31-final-636a93f6f215';
import { rewardCash } from './renewalRewardState.js?v=v31-final-636a93f6f215';
import { interiorCatalog, inventorySku } from './megaInventory.js?v=v31-final-636a93f6f215';
import { buyInterior } from './megaShop.js?v=v31-final-636a93f6f215';
import { kitchenStages } from './productionKitchen.js?v=v31-final-636a93f6f215';
const names = { stock: '메뉴 재고 보급권', furniture: '가구 20% 할인권', training: '직원 교육 20% 할인권', kitchen: '주방 20% 할인권', warehouse: '창고 20% 할인권', decoration: '미션 전용 특별 장식권' };
export function mountRewardWallet(g, flush) { document.getElementById('renewal-reward-wallet')?.remove(); if (g.mega?.finalGrowth?.renewal?.menuPolicy !== 2 || g.mode !== 'CAFE_GROWTH')
    return; const b = document.createElement('button'); b.id = 'renewal-reward-wallet'; b.textContent = '미션·미니게임 보상함'; b.style.minHeight = '48px'; b.onclick = () => { const d = document.createElement('dialog'); d.style.cssText = 'width:min(600px,92vw);max-height:80vh;overflow:auto;background:#fff9ed'; const paint = () => { d.replaceChildren(); const h = document.createElement('h2'); h.textContent = '운영 보상 · 학습 정답과 별도'; d.append(h); const s = rewardState(g), p = document.createElement('p'); p.textContent = '현재 레벨 미니게임 성공 ' + rewardCash(g.cafeLevel, 'mini').toLocaleString() + '원부터 · 미션 ' + rewardCash(g.cafeLevel, 'mission').toLocaleString() + '원부터. 실패·건너뛰기 보상0, 한 영업 최대3도전. 같은 보상은 한 번만 받아요.'; d.append(p); for (const v of s.vouchers.filter(v => !v.used)) {
    const row = document.createElement('section'), label = document.createElement('h3');
    label.textContent = names[v.kind];
    row.append(label);
    if (v.kind === 'furniture' || v.kind === 'decoration') {
        row.append(document.createTextNode('영업 후 준비 화면 보상함에서 가구를 선택해요.'));
        d.append(row);
        continue;
    }
    const select = document.createElement('select');
    select.setAttribute('aria-label', '교육할 직원');
    if (v.kind === 'training') {
        for (const w of g.service.paid.filter(w => w.level < 5)) {
            const o = document.createElement('option');
            o.value = w.staffId;
            o.textContent = w.name + ' Lv.' + w.level;
            select.append(o);
        }
        row.append(select);
    }
    const info = document.createElement('p'), use = document.createElement('button');
    use.style.minHeight = '48px';
    use.textContent = v.kind === 'stock' ? '각 메뉴 최대3개 보급 · 확인 후 사용' : '할인 내용 확인';
    use.onclick = () => { const target = select.value, cost = v.kind === 'stock' ? 0 : v.kind === 'training' ? g.getStaffUpgradeCost(target) : v.kind === 'kitchen' ? kitchenStages[(g.mega?.production?.tier ?? 0) + 1]?.cost : g.nextWarehouse?.cost; if (cost === null || cost === undefined) {
        info.textContent = '강화할 대상이나 해금 조건을 확인해 주세요.';
        return;
    } const discount = Math.floor(cost * .2), confirm = document.createElement('button'); confirm.style.minHeight = '48px'; confirm.textContent = v.kind === 'stock' ? '확인 · 재고 보급' : '확인 · ' + (cost - discount).toLocaleString() + '원 결제'; info.textContent = v.kind === 'stock' ? '창고 여유만큼 해금 메뉴마다 최대3개를 보급해요. 정답·생산 기회 기록은 바뀌지 않아요.' : '정상 ' + cost.toLocaleString() + '원 − 할인 ' + discount.toLocaleString() + '원 · 보유 ' + g.money.toLocaleString() + '원'; confirm.onclick = () => { confirm.disabled = true; const result = useRewardVoucher(g, v.id, target); if (result.ok) {
        const saved = flush();
        paint();
        if (!saved) {
            const warning = document.createElement('p');
            warning.setAttribute('role', 'alert');
            warning.textContent = '보상 사용 내용을 저장하지 못했어요. 새로고침 전에 카페 저장을 다시 확인해 주세요.';
            d.prepend(warning);
        }
    }
    else {
        info.textContent = result.reason;
        confirm.remove();
    } }; row.append(confirm); };
    row.append(info, use);
    d.append(row);
} if (!s.vouchers.some(v => !v.used))
    d.append(document.createTextNode('아직 보상권이 없어요. 미션이나 미니게임을 완료해 보세요.')); const close = document.createElement('button'); close.textContent = '카페로 돌아가기'; close.style.minHeight = '48px'; close.onclick = () => d.remove(); d.append(close); }; paint(); document.body.append(d); d.showModal(); }; document.getElementById('playing')?.append(b); }
export function prepareFurnitureVoucher(source, id, sku, expectedNext) { const v = source.mega?.finalGrowth?.renewal?.rewards?.vouchers.find(v => v.id === id && (v.kind === 'furniture' || v.kind === 'decoration') && !v.used), item = inventorySku(sku); if (!v || !item || source.campaign?.run && !source.campaign.run.closed)
    return { ok: false, reason: '영업 후 사용하지 않은 가구 할인권을 선택해요.' }; const discount = Math.floor(item.cost * .2); if (source.money < item.cost - discount || !Number.isSafeInteger(source.money + discount))
    return { ok: false, reason: '할인 후 보유금을 확인해 주세요.' }; const credit = structuredClone(source); credit.money += discount; const r = buyInterior(credit, sku, expectedNext); if (!r.ok)
    return r; const next = r.save, inv = next.mega.inventory, receipt = inv.receipts.at(-1), paid = inv.items.find(i => i.id === receipt.items[0]); receipt.cost -= discount; paid.cost -= discount; const rewards = next.mega.finalGrowth.renewal.rewards; rewards.vouchers.find(v => v.id === id).used = true; rewards.uses.push({ id: 'reward-use-' + (rewards.uses.length + 1), voucher: id, kind: 'furniture', amount: discount, target: sku }); if (!validateGrowthSave(next))
    return { ok: false, reason: '할인 저장 검증 실패. 기존 기록은 유지돼요.' }; return { ok: true, save: next }; }
export function rewardSetupAction(host, repo, save, refresh) { const vouchers = save.mega?.finalGrowth?.renewal?.rewards?.vouchers.filter(v => (v.kind === 'furniture' || v.kind === 'decoration') && !v.used) ?? []; if (!vouchers.length)
    return; const button = document.createElement('button'); button.textContent = '보상함 · 가구·장식권 ' + vouchers.length + '장'; button.disabled = !!save.campaign?.run && !save.campaign.run.closed; button.onclick = () => { const d = document.createElement('dialog'); d.style.cssText = 'width:min(600px,92vw);max-height:80vh;overflow:auto'; const h = document.createElement('h2'); h.textContent = vouchers[0].kind === 'decoration' ? '미션 전용 특별 장식 · 무료로 받기' : '가구 할인권 · 1개 구매에20%'; const select = document.createElement('select'); select.setAttribute('aria-label', '할인 구매할 가구'); for (const item of interiorCatalog.filter(item => vouchers[0].kind === 'decoration' ? studioItem(item.sku)?.rewardOnly : !studioItem(item.sku)?.rewardOnly)) {
    const o = document.createElement('option');
    o.value = item.sku;
    o.textContent = item.name + (vouchers[0].kind === 'decoration' ? ' · 보상으로 받기' : ' · ' + (item.cost - Math.floor(item.cost * .2)).toLocaleString() + '원');
    select.append(o);
} const status = document.createElement('p'), yes = document.createElement('button'), no = document.createElement('button'); yes.textContent = vouchers[0].kind === 'decoration' ? '선택한 특별 장식 받기' : '선택한 가구1개 할인 구매'; yes.style.minHeight = '48px'; yes.onclick = async () => { yes.disabled = true; if (!await ensureGrowthWriteLock()) {
    status.textContent = '저장 권한을 확인하지 못했어요. 기존 카페는 그대로예요.';
    yes.disabled = false;
    return;
} const r = vouchers[0].kind === 'decoration' ? prepareDecorationReward(save, vouchers[0].id, select.value) : prepareFurnitureVoucher(save, vouchers[0].id, select.value, save.mega.inventory.next); if (!r.ok) {
    status.textContent = r.reason;
    yes.disabled = false;
    return;
} const saved = repo.write(r.save, save); if (!saved.ok) {
    status.textContent = saved.message;
    yes.disabled = false;
    return;
} d.remove(); refresh(); }; no.textContent = '취소'; no.onclick = () => d.remove(); d.append(h, select, status, yes, no); document.body.append(d); d.showModal(); }; host.append(button); }
export function prepareDecorationReward(source, id, sku) { const v = source.mega?.finalGrowth?.renewal?.rewards?.vouchers.find(v => v.id === id && v.kind === 'decoration' && !v.used), item = studioItem(sku); if (!v || !item?.rewardOnly || source.campaign?.run && !source.campaign.run.closed)
    return { ok: false, reason: '영업 후 특별 장식권과 전용 장식을 선택해요.' }; if (!source.mega?.inventory || source.mega.inventory.items.length >= 256)
    return { ok: false, reason: '가구 보관함에 공간을 마련해 주세요. 보상권은 유지돼요.' }; const s = structuredClone(source), r = s.mega.finalGrowth.renewal.rewards, newId = 'event-decor-' + (r.uses.length + 1); if (s.mega.inventory.items.some(i => i.id === newId))
    return { ok: false, reason: '장식 기록을 다시 확인해 주세요.' }; s.mega.inventory.items.push({ id: newId, sku, source: 'event', cost: 0 }); s.longTerm ??= { version: 1, owned: [], placed: {}, visitors: {}, titles: [], albums: [], boards: [] }; if (!s.longTerm.owned.includes(item.id))
    s.longTerm.owned.push(item.id); r.vouchers.find(v => v.id === id).used = true; r.uses.push({ id: 'reward-use-' + (r.uses.length + 1), voucher: id, kind: 'decoration', amount: 1, target: sku }); if (!validateGrowthSave(s))
    return { ok: false, reason: '특별 장식 저장 검증 실패. 원본은 유지돼요.' }; return { ok: true, save: s }; }
