import { appendRenewalFacilities } from './renewalFacilities.js?v=v31-final-636a93f6f215';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=v31-final-636a93f6f215';
import { appearanceCatalog, appearanceSlots, newAppearance } from './renewalAppearanceState.js?v=v31-final-636a93f6f215';
export function appearanceQuote(s, id) { const item = appearanceCatalog.find(x => x.id === id), state = s.mega?.finalGrowth?.renewal?.appearance ?? newAppearance(), owned = state.owned.includes(id), cost = owned ? 0 : item?.cost ?? 0; return { item, owned, cost, remaining: s.money - cost, eligible: !!s.mega?.finalGrowth?.renewal && !!item && (owned || s.cafeLevel >= item.level) && s.money >= cost }; }
/** Explicit compare-and-swap purchase. Selecting an owned item never charges again. */
export function commitAppearance(repo, expected, id) { const read = repo.read(); if (read.status !== 'ready')
    return { ok: false, message: '다른 작업으로 카페가 바뀌었어요. 다시 확인해 주세요.' }; const q = appearanceQuote(expected, id); if (!q.eligible || !q.item)
    return { ok: false, message: !q.item ? '외관 항목을 확인해 주세요.' : expected.cafeLevel < q.item.level ? 'Lv.' + q.item.level + '부터 구매할 수 있어요.' : Math.max(0, -q.remaining).toLocaleString() + '원이 부족해요.' }; const next = structuredClone(expected), renewal = next.mega.finalGrowth.renewal, a = renewal.appearance ??= newAppearance(); if (!q.owned) {
    a.owned.push(id);
    a.receipts.push({ id: 'appearance-' + (a.receipts.length + 1), item: id, cost: q.cost });
    next.money -= q.cost;
} a.selected[q.item.slot] = q.item.style; return repo.write(next, expected); }
export function appearanceAction(container, repo, save, refresh) { if (!save.mega?.finalGrowth?.renewal)
    return; const b = document.createElement('button'); b.textContent = '건축·외관 꾸미기 · 외벽·창문·간판'; b.onclick = () => openAppearance(repo, refresh); container.append(b); }
export async function openAppearance(repo, done = () => { }) { if (document.querySelector('dialog.renewal-appearance'))
    return; if (!await ensureGrowthWriteLock()) {
    const box = document.createElement('dialog');
    box.textContent = '다른 창이 카페를 저장하고 있어요. 그 창을 마친 뒤 다시 열어 주세요.';
    const b = document.createElement('button');
    b.textContent = '카페로 돌아가기';
    b.onclick = () => { box.remove(); done(); };
    box.append(b);
    document.body.append(box);
    box.showModal();
    return;
} const dialog = document.createElement('dialog'); dialog.className = 'renewal-appearance'; dialog.style.cssText = 'width:min(960px,94vw);max-height:90vh;overflow:auto;background:#fff8ed;color:#26382c;border:2px solid #ac9876;border-radius:18px'; let slot = appearanceSlots[0], pending = '', message = ''; const close = () => { dialog.remove(); done(); }; const render = () => { const read = repo.read(); if (read.status !== 'ready') {
    close();
    return;
} const s = read.save, a = s.mega?.finalGrowth?.renewal?.appearance ?? newAppearance(); dialog.replaceChildren(); const h = document.createElement('h2'); h.textContent = '우리 카페 건축·외관 꾸미기'; const p = document.createElement('p'); p.textContent = '보유금 ' + s.money.toLocaleString() + '원 · 외관은 통로·가구·재고를 바꾸지 않아요. 해금 후 직접 구매하고 적용해요.'; dialog.append(h, p); const tabs = document.createElement('div'); tabs.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px'; for (const key of appearanceSlots) {
    const b = document.createElement('button');
    b.style.minHeight = '48px';
    b.textContent = { wall: '외벽', window: '창문', door: '출입문', floor: '바닥', sign: '간판', light: '조명' }[key];
    b.setAttribute('aria-pressed', String(slot === key));
    b.onclick = () => { slot = key; pending = ''; render(); };
    tabs.append(b);
} dialog.append(tabs); const cards = document.createElement('div'); cards.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px'; for (const item of appearanceCatalog.filter(x => x.slot === slot)) {
    const q = appearanceQuote(s, item.id), card = document.createElement('article');
    card.style.cssText = 'padding:12px;border:1px solid #c2b38c;border-radius:12px';
    const img = document.createElement('div');
    const col = ['wood', 'brick', 'glass', 'brand'].indexOf(item.style), row = slot === 'door' || slot === 'sign' ? 2 : 0;
    img.style.cssText = `height:180px;background-image:url(assets/art/renewal-v31/architecture.png);background-size:400% 300%;background-position:${col / 3 * 100}% ${row / 2 * 100}%;background-repeat:no-repeat`;
    img.setAttribute('role', 'img');
    img.setAttribute('aria-label', item.name + ' 외형');
    const title = document.createElement('h3');
    title.textContent = item.name;
    const info = document.createElement('p');
    info.textContent = (a.selected[slot] === item.style ? '현재 적용 · ' : '') + (q.owned ? '보유 · 무료 적용' : item.cost.toLocaleString() + '원 · Lv.' + item.level);
    const b = document.createElement('button');
    b.style.minHeight = '48px';
    b.textContent = q.owned ? '이 외관 적용' : '외형·비용 확인';
    b.disabled = !q.eligible;
    b.onclick = () => { if (q.owned) {
        const r = commitAppearance(repo, s, item.id);
        message = r.ok ? '외관을 적용하고 저장했어요.' : r.message;
        render();
    }
    else {
        pending = item.id;
        render();
    } };
    card.append(img, title, info, b);
    cards.append(card);
} dialog.append(cards); appendRenewalFacilities(dialog, repo, s, render); if (pending) {
    const q = appearanceQuote(s, pending), section = document.createElement('section'), text = document.createElement('p');
    text.textContent = q.item.name + ' · ' + q.cost.toLocaleString() + '원 / 구매 후 ' + q.remaining.toLocaleString() + '원. 가구·직원 배치와 이동 경로는 그대로예요.';
    const yes = document.createElement('button');
    yes.textContent = '확인 · 외관 구매하고 적용';
    yes.style.minHeight = '48px';
    yes.onclick = () => { yes.disabled = true; const r = commitAppearance(repo, s, pending); message = r.ok ? '구매·적용·저장을 완료했어요.' : r.message; pending = ''; render(); };
    const no = document.createElement('button');
    no.textContent = '구매 취소';
    no.onclick = () => { pending = ''; render(); };
    section.append(text, yes, no);
    dialog.append(section);
} const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = message; const back = document.createElement('button'); back.textContent = '카페로 돌아가기'; back.style.minHeight = '48px'; back.onclick = close; dialog.append(status, back); }; dialog.oncancel = e => { e.preventDefault(); close(); }; document.body.append(dialog); render(); dialog.showModal(); }
