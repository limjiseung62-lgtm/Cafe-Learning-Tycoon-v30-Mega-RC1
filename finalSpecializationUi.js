import { openRenewalSpecialization } from './renewalSpecializationUi.js';
import { chooseFinalSpecialization, finalSpecializationFor } from './finalSpecialization.js';
import { finalSpecializationOffers, finalSignatureMenus, signatureImage } from './finalSpecializationState.js';
import { configureFinalSupply } from './finalSupply.js';
import { specializationRoom } from './specializationConfig.js';
export function openFinalSpecialization(g, flush, done = () => { }) { if (document.querySelector('dialog.final-specialization'))
    return; if (g.mega?.finalGrowth?.renewal)
    return openRenewalSpecialization(g, flush, done); const dialog = document.createElement('dialog'); dialog.className = 'final-specialization live-mega-hub'; dialog.style.cssText = 'max-width:850px;width:94vw;max-height:85vh;overflow:auto'; document.body.append(dialog); const close = () => { dialog.remove(); done(); }; const render = () => { dialog.replaceChildren(); const h = document.createElement('h2'); h.textContent = '우리 카페의 두 가지 꿈'; dialog.append(h); const current = finalSpecializationFor(g), info = document.createElement('p'); info.textContent = '내 돈 ' + g.money.toLocaleString() + '원 · 현재 정답 생산 ' + g.productionAmount + '개/메뉴 · 창고 ' + g.warehouse.capacity + '개/메뉴. 선택은 한 번만 하며 현재 후보에서는 변경할 수 없어요.'; dialog.append(info); if (current) {
    const p = document.createElement('p');
    p.textContent = finalSpecializationOffers[current.path].name + ' 운영 중 · ' + (current.legacyChoice ? '이전 전문화 선택을 추가 결제 없이 이어받았어요.' : '투자 ' + current.cost.toLocaleString() + '원 완료');
    dialog.append(p);
} for (const path of ['mass', 'brand']) {
    const offer = finalSpecializationOffers[path], card = document.createElement('article');
    card.style.cssText = 'padding:16px;margin:12px 0;border:2px solid #ccb18c;border-radius:16px';
    const title = document.createElement('h3');
    title.textContent = offer.name;
    const preview = document.createElement('img');
    preview.src = specializationRoom(path === 'mass' ? 'factory' : 'artisan');
    preview.alt = offer.name + ' 공간 분위기 참고 이미지';
    preview.loading = 'lazy';
    preview.style.cssText = 'width:100%;max-width:340px;border-radius:12px';
    const description = document.createElement('p');
    description.textContent = path === 'mass' ? '정답 생산량을 설비에 따라 1→2 · 3→5 · 5→7 · 8→12 · 12→17 · 20→28개로 생산해요. 서빙 1회 운반+1개(최대6), 물류 운반12개·서빙대 목표재고4개로 큰 주문을 준비하고, 주방의 조리 설비 외형이 바뀌어요. 창고 상한은 그대로여서 창고 투자도 필요해요.' : '해금 메뉴 판매가+20%, 시그니처 메뉴 주문 우선 기회40%, 실제 VIP·특별 손님 방문 확률 보완, Lv.11 나뭇잎 크림 라테·Lv.15 브랜드 정원 타르트 해금. 주방 진열과 쇼케이스 외형이 바뀌어요. 정답 생산량은 구매한 설비대로예요.';
    const cost = document.createElement('p');
    cost.textContent = current ? (current.path === path ? '투자 ' + current.cost.toLocaleString() + '원 완료 · 추가 결제 없음' : '다른 경영 방향 참고 · 현재 후보는 선택 변경 없음') : '투자 ' + offer.cost.toLocaleString() + '원 · 투자 후 ' + Math.max(0, g.money - offer.cost).toLocaleString() + '원' + (g.money < offer.cost ? ' · ' + (offer.cost - g.money).toLocaleString() + '원 더 필요해요' : '') + ' · Lv.11 /20×16 유료 매장 필요';
    card.append(title, preview, description, cost);
    if (path === 'brand')
        for (const m of finalSignatureMenus) {
            const img = document.createElement('img');
            img.src = signatureImage(m.visualKey);
            img.alt = m.name;
            img.loading = 'lazy';
            img.style.cssText = 'width:112px;height:112px;object-fit:contain';
            card.append(img);
        }
    const select = document.createElement('button');
    select.textContent = current ? (current.path === path ? '선택한 전문화' : '다른 전문화는 선택하지 않았어요') : offer.name + ' 비교 후 선택';
    select.disabled = !!current || g.cafeLevel < 11 || (g.mega?.paid?.spaceLevel ?? 1) < 10 || g.money < offer.cost;
    select.style.minHeight = '48px';
    select.onclick = () => confirm(path);
    card.append(select);
    dialog.append(card);
} const back = document.createElement('button'); back.textContent = current ? '카페로 돌아가기' : '나중에 결정하기'; back.onclick = close; dialog.append(back); }; const confirm = (path) => { const offer = finalSpecializationOffers[path]; dialog.replaceChildren(); const h = document.createElement('h2'); h.textContent = offer.name + '에 ' + offer.cost.toLocaleString() + '원을 투자할까요?'; const p = document.createElement('p'); p.textContent = '기존 가구·직원·매장 공간과 학습 기록은 유지해요. 선택 후 변경은 지원하지 않아요.'; const message = document.createElement('p'); message.setAttribute('role', 'status'); const back = document.createElement('button'); back.textContent = '다시 비교하기'; back.onclick = render; const yes = document.createElement('button'); yes.textContent = '확인 · 전문화 투자'; yes.onclick = () => { yes.disabled = true; const before = { money: g.money, mega: structuredClone(g.mega), menus: structuredClone(g.menus) }, r = chooseFinalSpecialization(g, path); if (!r.ok) {
    message.textContent = r.reason;
    yes.disabled = false;
    return;
} if (!flush()) {
    g.money = before.money;
    g.mega = before.mega;
    g.menus = before.menus;
    configureFinalSupply(g);
    message.textContent = '저장하지 못해 결제를 취소했어요. 기존 카페를 유지해요.';
    yes.disabled = false;
    return;
} configureFinalSupply(g); render(); }; dialog.append(h, p, message, back, yes); }; dialog.addEventListener('cancel', e => { e.preventDefault(); close(); }); render(); dialog.showModal(); }
