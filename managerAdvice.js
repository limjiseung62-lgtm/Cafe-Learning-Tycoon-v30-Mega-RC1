import { expansionQuote } from './megaExpansion.js?v=commerce-6afe2d573839';
export function managerAdvice(g, save, now = Date.now()) {
    const id = g.mega?.manager?.selected;
    if (!id)
        return [];
    const out = [], add = (v) => out.push(v), missing = g.menus.filter(m => m.stock === 0), waiting = g.guests.filter(v => ['WAITING_FOR_FOOD', 'PREPARING', 'SERVING'].includes(v.state)), q = expansionQuote({ ...save, campaign: undefined });
    if (missing.length)
        add({ id: 'stock', title: '음식을 함께 준비해요', text: missing.slice(0, 3).map(m => m.name).join('·') + ' 재고가 없어요. 문제를 맞히면 해금된 모든 메뉴를 1개씩 만들 수 있어요.', action: 'stock' });
    if (waiting.length >= 3)
        add({ id: 'waiting', title: '기다리는 손님을 살펴봐요', text: '지금 ' + waiting.length + '명이 음식을 기다려요. 재고를 채우고 직원과 테이블 사이 통로를 확인해 봐요.', action: 'shop' });
    if (g.service.recoveryLog.some(r => g.elapsedTime - r.time < 20 && /stalled|path-unavailable/.test(r.reason)))
        add({ id: 'bottleneck', title: '직원 통로를 살펴봐요', text: '일부 직원이 경로를 다시 찾고 있어요. 재고 부족과 정상 대기를 구분하고, 겹쳐 멈춘 경우에만 위치 복구를 사용해요.', action: 'recovery' });
    if (g.service.paid.length < g.staffLimit)
        add({ id: 'staff', title: '다음 동료를 준비해요', text: '현재 직원 ' + g.service.paid.length + '/' + g.staffLimit + '명. 직원 화면에서 실제 채용 조건과 비용을 확인해요. 결정은 사장님이 해요.', action: 'staff' });
    if (g.serviceSpace && g.serviceSpace.seats.length < Math.min(14, g.cafe.maxCustomers + 2))
        add({ id: 'furniture', title: '새 공간을 꾸며 볼까요?', text: '현재 실제 좌석은 ' + g.serviceSpace.seats.length + '개예요. 가구 상점에서 테이블과 의자를 마련하고 통로를 남겨 배치해요.', action: 'shop' });
    if (q.next)
        add({ id: 'expansion', title: '다음 증축 목표', text: q.next.size.join('×') + '칸 · Lv.' + q.next.requiredLevel + ' 자격 · ' + q.next.cost.toLocaleString() + '원. ' + (q.shortage ? q.shortage.toLocaleString() + '원을 더 모으면 돼요.' : '보유금으로 준비할 수 있어요. 직원·가구 투자와 비교해 선택해요.'), action: 'expansion' });
    if (g.cafeLevel >= 9)
        add({ id: 'research', title: '우리만의 메뉴를 찾아요', text: '영업을 마친 뒤 경영실의 연구소에서 재료 조합과 시식 결과를 확인해요. 연구 메뉴는 직접 개발·등록해야 판매할 수 있어요.', action: 'none' });
    if (g.cafeLevel >= 14)
        add({ id: 'branches', title: '카페 밖의 다음 꿈', text: '영업을 마친 뒤 준비 화면에서 기존 마을 투자와 자동 분점을 살펴봐요. 분점 수익은 본점의 자격 영업을 정상 완료했을 때만 정산돼요.', action: 'none' });
    if (g.cafeLevel >= 30)
        add({ id: 'headquarters', title: '메가 카페 다음의 꿈', text: typeof document !== 'undefined' && ['v30e-common-local', 'v30e-v31-local'].includes(document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '') ? '64×48 유료 증축을 마치면 영업 준비 화면에서 프랜차이즈 본부를 선택해요. 본점은 보존하고 지역별 지점과 도시 투자를 결정할 수 있어요.' : '본부 설립·도시 경영은 아직 준비 중이에요. 지금은 기존 분점·마을 투자와 카페 앨범 목표를 함께 살펴봐요.', action: 'none' });
    if (!out.length)
        add({ id: 'steady', title: '좋은 흐름이에요', text: '손님이 앉고 직원이 안전하게 오가는지 살펴봐요. 매출보다 중요한 것은 사장님이 선택하며 성장하는 일이에요.', action: 'none' });
    const priority = { yuna: ['expansion', 'staff', 'stock', 'branches'], hajun: ['bottleneck', 'waiting', 'stock', 'staff', 'furniture'], soi: ['furniture', 'research', 'stock', 'expansion'] };
    const order = priority[id];
    out.sort((a, b) => (order.indexOf(a.id) < 0 ? 99 : order.indexOf(a.id)) - (order.indexOf(b.id) < 0 ? 99 : order.indexOf(b.id)));
    return out.map(v => ({ ...v, text: (id === 'yuna' ? '숫자를 차근차근 살펴봐요. ' : id === 'hajun' ? '우리 팀과 손님을 함께 살펴봐요. ' : '우리 카페의 색을 담아 봐요. ') + v.text }));
}
export function nextManagerAdvice(g, s, now = Date.now()) { const seen = g.mega?.manager?.adviceSeen ?? {}; return managerAdvice(g, s, now).find(a => now - (seen[a.id] ?? 0) >= 180000); }
