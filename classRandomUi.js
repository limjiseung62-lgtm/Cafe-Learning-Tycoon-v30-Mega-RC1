import { impactTitle, impactOptions } from './classImpact.js?v=v31-final-636a93f6f215';
import { sprite } from './art.js?v=v31-final-636a93f6f215';
import { customerPoseArt, selectCustomerPose } from './customerPoses.js?v=v31-final-636a93f6f215';
import { classChoice, classProgress, eventNames, classReport } from './classRandom.js?v=v31-final-636a93f6f215';
import { classRuntime } from './classRuntime.js?v=v31-final-636a93f6f215';
import { branchCatalog, branchPreview } from './growthBranch.js?v=v31-final-636a93f6f215';
import { specializationCatalog } from './specializationConfig.js?v=v31-final-636a93f6f215';
import { chooseSpecialization } from './specialization.js?v=v31-final-636a93f6f215';
import { pollMiniUi } from './miniGameUi.js?v=v31-final-636a93f6f215';
import { activeMini } from './miniGames.js?v=v31-final-636a93f6f215';
import { escapeText as esc } from './questionRenderer.js?v=v31-final-636a93f6f215';
export const eventArt = (kind) => 'assets/class-events/' + kind + '.svg?v=27.2';
export const cinematicArt = (k) => 'assets/class-scenes/' + ({ vip: 'vip', critics: 'vip', thief: 'thief', 'stock-loss': 'thief', 'small-mistake': 'mistake', 'big-mistake': 'mistake', festival: 'festival', birthday: 'festival', gift: 'gift', helper: 'gift', supply: 'gift', group: 'group', urgent: 'group', popular: 'group', discount: 'group', regular: 'vip' }[k] ?? 'gift') + '.webp?v=271';
function eventScene(k, title) { let cast = ''; if (k === 'vip' || k === 'critics')
    cast = customerPoseArt(selectCustomerPose(k === 'vip' ? 'special-vip' : 'special-gourmand', 'ENTERING', 'left', 'WAVE'));
else if (k.includes('mistake'))
    cast = sprite('staff-1');
else if (['festival', 'group', 'urgent'].includes(k))
    cast = sprite('student') + sprite('reader') + sprite('grandma');
else if (k === 'helper' || k === 'regular')
    cast = sprite('grandma');
else if (['gift', 'supply'].includes(k))
    cast = sprite('cookie') + sprite('coffee');
else if (k === 'birthday')
    cast = sprite('special-cake'); return '<div class="class-event-scene scene-' + k + '" role="img" aria-label="' + esc(title) + '"><img class="class-scene-illustration" src="' + cinematicArt(k) + '" alt="' + esc(title) + '의 카페 장면" decoding="async"><img class="class-scene-emblem" src="' + eventArt(k) + '" alt=""><div class="class-event-cast">' + cast + '</div></div>'; }
let shown = '', owner = null;
function close() { document.getElementById('class-event-dialog')?.remove(); document.getElementById('app')?.removeAttribute('inert'); shown = ''; }
function sheet(title, html, major = false) { const d = document.createElement('section'); d.id = 'class-event-dialog'; d.className = 'class-cinematic ' + (major ? 'major' : 'ordinary'); d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', title); d.innerHTML = '<article tabindex="-1">' + html + '</article>'; document.body.append(d); document.getElementById('app')?.setAttribute('inert', ''); d.querySelector('button')?.focus(); d.onkeydown = ev => { if (ev.key === 'Escape') {
    d.querySelector('[data-close]')?.click();
    ev.preventDefault();
} if (ev.key === 'Tab') {
    const list = [...d.querySelectorAll('button:not([disabled])')], first = list[0], last = list.at(-1);
    if (ev.shiftKey && document.activeElement === first) {
        last?.focus();
        ev.preventDefault();
    }
    else if (!ev.shiftKey && document.activeElement === last) {
        first?.focus();
        ev.preventDefault();
    }
} }; return d; }
function transact(g, fn) { const s = structuredClone(g.classRandom), money = g.money, revenue = g.stats.revenue, stocks = g.menus.map(m => m.stock), branch = structuredClone(g.growthBranch), spec = structuredClone(g.specialization); fn(); if (!classRuntime.flush()) {
    Object.assign(g.classRandom, s);
    g.money = money;
    g.stats.revenue = revenue;
    g.menus.forEach((m, i) => m.stock = stocks[i]);
    g.growthBranch = branch;
    g.specialization = spec;
    const status = document.querySelector('#class-event-dialog [role="status"]');
    if (status)
        status.textContent = classRuntime.message;
    return false;
} return true; }
function eventCard(g, e, sound) {
    const k = e.kind, result = e.status !== 'queued', intro = !result && !e.introSeen, title = impactTitle(e, eventNames[k]), p = e.impact;
    const risk = ['thief', 'small-mistake', 'big-mistake', 'stock-loss'].includes(k);
    const body = k === 'thief' ? '창고에 작은 불청객이 나타났어요! 재료를 지키는 방법을 골라요.' : k.includes('mistake') ? '앗, 트레이가 기울었어요! 함께 정리하고 바쁜 시간을 넘겨요.' : k === 'festival' ? '광장이 북적북적! 재고와 서빙 준비에 맞춰 손님을 맞이해요.' : k === 'vip' ? '특별한 손님이 큰 주문을 준비했어요. 차분히 준비할까요, 큰 도전을 할까요?' : k === 'critics' ? '맛집 평가단이 찾아왔어요. 실제로 주문을 완성해 좋은 인상을 남겨요.' : k === 'birthday' ? '생일 손님들의 특별한 하루! 음식과 새 학습 정답을 함께 준비해요.' : k === 'popular' ? '오늘은 한 메뉴가 인기예요! 준비한 재료와 새로운 도전 중 골라요.' : k === 'discount' ? '할인 소식에 손님이 몰려올 거예요. 재고를 보고 할인 폭을 정해요.' : k === 'helper' ? '이웃이 재료를 나눠 주고 잠시 손님을 안내해 줘요. 새 손님의 기다리는 시간이 40초 늘어요.' : k === 'gift' ? '이웃이 커다란 재료 상자를 보내왔어요! 빈 창고를 채울 방법을 골라요.' : k === 'supply' ? '특별한 재료가 도착했어요! 고르게 나눌까요, 깜짝 상자를 열까요?' : k === 'regular' ? '반가운 단골이 찾아왔어요! 단골의 실제 주문을 완성해 약속을 지켜요.' : k === 'stock-loss' ? '재료 선반을 점검할 시간이에요. 정리 방법에 따라 지킬 수 있는 재료가 달라져요.' : k === 'group' || k === 'urgent' ? '여러 손님이 함께 주문해요! 더 바쁜 응대에는 더 큰 보상이 기다려요.' : '카페에 새로운 이야기가 찾아왔어요. 창고와 손님을 살펴보고 결정해요.';
    const changes = e.changes.map(c => (g.menus.find(m => m.menuId === c.menuId)?.name ?? c.menuId) + ' ' + (c.amount > 0 ? '+' : '') + c.amount).join(' · '), options = p ? impactOptions(g, e) : [{ id: 'careful', name: risk ? '차분히 점검 · 손실 줄이기' : '준비하고 맞이하기', detail: '기존 v2.7 회차의 대응 규칙 유지' }, { id: 'quick', name: '빠르게 대응해 보기', detail: '기존 회차의 위험과 보상 유지' }];
    const phase = result ? '결과' : intro ? '등장' : '선택';
    const metrics = p ? '<p class="class-impact">' + (risk ? (g.menus.find(m => m.menuId === p.menuId)?.name ?? '재료') + ' · 위험 재고 최대 ' + p.lossCap + '개' : '평소 약 1분 매출 ' + p.minute.toLocaleString() + '원 기준') + '</p>' : '';
    const resultHtml = '<div class="class-impact result-' + e.status + '"><strong>' + ({ success: '멋지게 해결했어요!', failed: '다시 일어설 수 있어요!', cancelled: '다음 기회를 기다려요!' }[e.status] ?? '주문을 준비해요') + '</strong><p class="class-result-number">' + (e.money ? '보너스 +' + e.money.toLocaleString() + '원' : e.lost ? '재고 -' + e.lost + '개' : e.gift ? '재고 +' + e.gift + '개' : e.status === 'failed' ? '추가 손실 0원' : '새로운 영업 흐름 시작') + '</p><p>' + esc(changes || '직접 재고 변화 없음') + '</p>' + ((p?.beforeStock !== undefined && p?.afterStock !== undefined) ? '<p>전체 재고 ' + p.beforeStock + ' → ' + p.afterStock + '개</p>' : '') + (p?.beforeMoney !== undefined ? '<p>현금 ' + p.beforeMoney.toLocaleString() + ' → ' + (p.afterMoney ?? g.money).toLocaleString() + '원 <small>(대응 구간 일반 판매 포함)</small></p>' : '') + (e.status === 'failed' ? '<p>정답을 맞히면 다시 재료를 만들 수 있어요. 학습 기록과 카페 레벨은 그대로예요.</p>' : '') + '</div><button class="primary" data-result>확인 · 카페로</button>';
    const d = sheet(title, '<p class="class-act">' + (p?.rare ? '희귀 초대형' : e.major ? '대형 사건' : '카페 사건') + ' · ' + phase + '</p>' + eventScene(k, title) + '<h2>' + esc(title) + '</h2><p>' + body + '</p>' + (result ? resultHtml : intro ? metrics + '<button class="primary" data-intro>대응 방법 보기</button><button class="secondary" data-close>잠시 뒤에 보기</button>' : metrics + '<div class="class-choices">' + options.map(o => '<button class="' + (o.id === 'careful' ? 'primary' : 'secondary') + '" data-choice="' + o.id + '"><strong>' + o.name + '</strong><span>' + o.detail + '</span></button>').join('') + '<button class="secondary" data-close>잠시 뒤에 보기</button></div>') + '<p role="status"></p><small>영업·손님 시간은 계속 흘러요. 학습 정답률은 바뀌지 않아요.</small>', e.major);
    d.dataset.kind = k;
    d.dataset.act = phase;
    if (e.major)
        sound(result ? (e.status === 'success' ? 'coin' : 'wrong') : risk ? 'wrong' : k === 'festival' ? 'levelup' : k === 'supply' ? 'item-stock' : 'vip');
    d.querySelector('[data-intro]')?.addEventListener('click', () => { if (transact(g, () => { e.introSeen = true; }))
        close(); });
    d.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => { if (transact(g, () => { classChoice(g, e.id, b.dataset.choice); }))
        close(); });
    d.querySelector('[data-close]')?.addEventListener('click', () => { if (transact(g, () => { e.deferUntil = g.elapsedTime + 15; }))
        close(); });
    d.querySelector('[data-result]')?.addEventListener('click', () => { if (transact(g, () => { e.seenResult = true; }))
        close(); });
}
function branchCard(g) { const d = sheet('CLASS 가게 선택', '<h2>어떤 가게로 성장할까요?</h2><p>이번 30분 CLASS에서만 이어져요. 육성 카페는 바뀌지 않아요.</p><div class="class-branch-options">' + branchCatalog.map(b => '<button data-branch="' + b.id + '"><img src="' + branchPreview(b.id) + '" alt="' + b.name + '"><strong>' + b.name + '</strong><span>' + b.feature + '</span><small>' + b.event + '</small></button>').join('') + '</div><p role="status"></p>'); d.querySelectorAll('[data-branch]').forEach(b => b.onclick = () => { const id = b.dataset.branch, info = branchCatalog.find(c => c.id === id); d.querySelector('article').innerHTML = '<img class="class-event-art" src="' + branchPreview(id) + '" alt="' + info.name + '"><h2>' + info.name + '로 정할까요?</h2><p>손님과 서빙이 끝난 뒤 안전하게 새 공간으로 바뀌어요.</p><button data-confirm class="primary">확인 · 이 가게 선택</button><button data-back class="secondary">다시 비교</button><p role="status"></p>'; d.querySelector('[data-back]').addEventListener('click', () => { close(); }); d.querySelector('[data-confirm]').addEventListener('click', () => { if (transact(g, () => { g.requestBranch(id); }))
    close(); }); }); }
function specCard(g) { const d = sheet('CLASS 전문화 선택', '<h2>가게의 특별한 이야기를 골라요</h2><div class="class-branch-options">' + specializationCatalog.filter(s => s.branch === g.branchId).map(s => '<button data-spec="' + s.id + '"><img src="assets/web/specializations/' + s.id + '.webp" alt="' + s.name + '"><strong>' + s.name + '</strong><span>' + s.operation + '</span></button>').join('') + '</div><p role="status"></p>'); d.querySelectorAll('[data-spec]').forEach(b => b.onclick = () => { if (transact(g, () => { chooseSpecialization(g, b.dataset.spec); }))
    close(); }); }
export function pollClassUi(g, sound = () => { }) {
    if (!g.classRandom) {
        if (owner)
            close();
        owner = null;
        return;
    }
    if (owner !== g) {
        close();
        owner = g;
    }
    if (g.status === 'CLOSED') {
        close();
        return;
    }
    if (classRuntime.blocked) {
        if (!document.getElementById('class-event-dialog'))
            sheet('CLASS 저장 보호', '<h2>다른 CLASS 창이 열려 있어요</h2><p>' + classRuntime.message + '</p><p>다른 창을 닫고 새로고침해 주세요. 이 창의 추가 채점은 멈췄어요.</p>').dataset.storageBlocked = 'true';
        return;
    }
    if (document.getElementById('class-event-dialog')?.dataset.storageBlocked === 'true')
        close();
    const busy = !document.getElementById('problem-panel')?.hidden || !document.getElementById('investment-panel')?.hidden || !!document.querySelector('#mini-dialog,#rush-briefing,#craft-brief,#arcade-brief,.branch-dialog,.specialization-dialog,.mode-confirm') || !!activeMini(g);
    if (busy)
        return;
    if (document.getElementById('class-event-dialog'))
        return;
    const event = g.classRandom.events.find(e => e.status === 'queued' && (e.deferUntil ?? 0) <= g.elapsedTime || e.kind && ['success', 'failed'].includes(e.status) && !e.seenResult);
    if (event) {
        shown = String(event.id);
        eventCard(g, event, sound);
        return;
    }
    if (g.durationSeconds === 1800 && g.cafeLevel >= 7 && !g.growthBranch) {
        branchCard(g);
        return;
    }
    if (g.durationSeconds === 1800 && g.cafeLevel >= 11 && g.branchId && !g.specialization) {
        specCard(g);
        return;
    }
    if (g.durationSeconds === 1800)
        pollMiniUi(g);
    let status = document.getElementById('class-live-status');
    if (!status) {
        status = document.createElement('p');
        status.id = 'class-live-status';
        status.setAttribute('role', 'status');
        document.getElementById('make')?.after(status);
    }
    const active = g.classRandom.events.find(e => e.status === 'active');
    status.textContent = g.growthBranch && !g.growthBranch.active ? '새 가게 준비 중 · 기존 손님과 서빙이 끝나면 공간이 바뀌어요.' : active ? eventNames[active.kind] + ' · 응대 ' + Math.min(active.target, classProgress(g, active)) + '/' + active.target + '팀 · ' + Math.max(0, Math.ceil(active.deadline - g.elapsedTime)) + '초' : classRuntime.message;
}
export function classResultLines(g) { const r = classReport(g); return r ? ['CLASS ' + r.duration / 60 + '분 · 최종 Lv.' + r.level, '총매출 ' + r.revenue + '원 · 투자 후 순이익 ' + r.net + '원', '직원 ' + r.staff + '명 · 강화 ' + r.upgrades + '회 · 특별 손님 ' + r.specialVisitors + '명', '사건 성공 ' + r.success + ' / 실패 ' + r.failed + ' · 재고 손실 ' + r.lost + ' / 선물 ' + r.gift + '개', '차분한 위기 대응 ' + r.rescued + '회 · 가게 ' + (r.branch ?? '기본') + ' · 전문화 ' + (r.specialization ?? '없음'), '미니게임 ' + r.mini.map(m => m.kind + ' ' + m.outcome).join(' · ')] : []; }
