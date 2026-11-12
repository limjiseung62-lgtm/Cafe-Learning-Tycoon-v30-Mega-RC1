import { chooseFinalSpecialization } from './finalSpecialization.js?v=v31-5d872fe24674';
import { specializationUpgradeQuote, upgradeRenewalSpecialization } from './renewalSpecialization.js?v=v31-5d872fe24674';
import { massRates, brandRates, specializationLevels } from './renewalSpecializationState.js?v=v31-5d872fe24674';
import { finalSpecializationOffers, renewalSignatureMenus, signatureImage } from './finalSpecializationState.js?v=v31-5d872fe24674';
import { configureFinalSupply } from './finalSupply.js?v=v31-5d872fe24674';
export function openRenewalSpecialization(g, flush, done) { const d = document.createElement('dialog'); d.className = 'final-specialization'; d.style.cssText = 'width:min(900px,94vw);max-height:88vh;overflow:auto;background:#fff8ed;border-radius:18px'; document.body.append(d); const close = () => { d.remove(); done(); }; let message = ''; const render = () => { d.replaceChildren(); const h = document.createElement('h2'); h.textContent = '우리 카페 전문화 · 4단계 성장'; const info = document.createElement('p'); info.textContent = '보유 ' + g.money.toLocaleString() + '원 · 현재 생산 메뉴별 ' + g.productionAmount + '개 · 창고 ' + g.warehouse.capacity + '개. 강화는 자동 적용되지 않아요.'; d.append(h, info); for (const path of ['mass', 'brand']) {
    const card = document.createElement('article'), title = document.createElement('h3');
    title.textContent = finalSpecializationOffers[path].name;
    card.append(title);
    for (let i = 0; i < 4; i++) {
        const p = document.createElement('p');
        p.textContent = 'Lv.' + specializationLevels[i] + ' · ' + (i + 1) + '단계: ' + (path === 'mass' ? '최종 생산 +' + Math.round(massRates[i] * 100) + '% · 올림 · 물류 이동 효율 개선' : (i + 1) + '개 시그니처 · 시그니처 단가 +' + Math.round(brandRates[i] * 100) + '%');
        card.append(p);
    }
    if (path === 'brand')
        for (const m of renewalSignatureMenus) {
            const img = document.createElement('img');
            img.src = signatureImage(m.visualKey);
            img.alt = m.name;
            img.style.cssText = 'width:92px;height:92px;object-fit:contain';
            img.loading = 'lazy';
            card.append(img);
        }
    const current = g.mega?.finalGrowth?.specialization, b = document.createElement('button');
    b.style.minHeight = '48px';
    if (!current) {
        const offer = finalSpecializationOffers[path];
        b.textContent = offer.name + ' · ' + offer.cost.toLocaleString() + '원 · 확인하기';
        b.disabled = g.cafeLevel < 11 || (g.mega?.paid?.spaceLevel ?? 1) < 10 || g.money < offer.cost;
        b.onclick = () => confirm(path, offer.cost, () => chooseFinalSpecialization(g, path));
    }
    else if (current.path === path) {
        const q = specializationUpgradeQuote(g), p = document.createElement('p');
        p.textContent = '현재 ' + (current.renewal?.stage ?? 1) + '단계' + (current.renewal?.legacyPriceFloor || current.renewal?.legacyProductionFloor ? ' · 기존에 얻은 보너스는 유지돼요.' : '');
        card.append(p);
        b.textContent = q.next ? '다음 ' + q.next + '단계 · ' + q.cost.toLocaleString() + '원 · Lv.' + q.level : '최종 강화 완료';
        b.disabled = !q.eligible;
        b.onclick = () => confirm(path, q.cost, () => upgradeRenewalSpecialization(g, q.current));
    }
    else {
        b.textContent = '다른 경영 방향 · 현재 선택 유지';
        b.disabled = true;
    }
    card.append(b);
    d.append(card);
} const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = message; const back = document.createElement('button'); back.textContent = '카페로 돌아가기'; back.onclick = close; back.style.minHeight = '48px'; d.append(status, back); }; const confirm = (path, cost, run) => { d.replaceChildren(); const h = document.createElement('h2'); h.textContent = finalSpecializationOffers[path].name + '에 ' + cost.toLocaleString() + '원을 투자할까요?'; const p = document.createElement('p'); p.textContent = '투자 후 ' + (g.money - cost).toLocaleString() + '원 · 가구·직원·학습 기록 유지 · 생산 기회가 새로 지급되지는 않아요.'; const yes = document.createElement('button'); yes.textContent = '확인 · 전문화 투자'; yes.style.minHeight = '48px'; yes.onclick = () => { yes.disabled = true; const before = { money: g.money, mega: structuredClone(g.mega), menus: structuredClone(g.menus) }, result = run(); message = result.reason; if (result.ok && !flush()) {
    g.money = before.money;
    g.mega = before.mega;
    g.menus = before.menus;
    message = '저장하지 못해 투자와 효과를 취소했어요.';
} configureFinalSupply(g); render(); }; const back = document.createElement('button'); back.textContent = '취소 · 다시 비교'; back.onclick = render; d.append(h, p, yes, back); }; d.oncancel = e => { e.preventDefault(); close(); }; render(); d.showModal(); }
