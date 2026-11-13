import { mountRewardWallet } from './renewalRewardUi.js?v=v31-final-636a93f6f215';
import { MegaView } from './megaView.js?v=v31-final-636a93f6f215';
import { SpatialScene } from './spatial.js?v=v31-final-636a93f6f215';
import { newTutorialPause, beginTutorialPause, endTutorialPause } from './tutorialPause.js?v=v31-final-636a93f6f215';
import { newRenewalTutorials, pendingTutorials, tutorialLevels, tutorialTitles } from './renewalTutorialState.js?v=v31-final-636a93f6f215';
import { RenewalPractice } from './renewalPractice.js?v=v31-final-636a93f6f215';
import { commonQuestion } from './commonLearningCatalog.js?v=v31-final-636a93f6f215';
import { activeMini } from './miniGames.js?v=v31-final-636a93f6f215';
let current, flush = () => false, practiceFlow, dialog, disposePractice;
function progress(g) { if (g.mega?.finalGrowth?.renewal)
    return g.mega.finalGrowth.renewal.tutorials ??= newRenewalTutorials(); g.tutorialPause ??= newTutorialPause(); return g.tutorialPause.progress ??= newRenewalTutorials(); }
const enabled = (g) => !!g.mega?.finalGrowth?.renewal || g.mode === 'CLASS_MATCH' && document.querySelector('meta[name="cafe-renewal"]')?.getAttribute('content') === 'v31-candidate';
export function beginRenewalTutorials(g, save, flow) { disposePractice?.(); disposePractice = undefined; dialog?.remove(); dialog = undefined; current = g; flush = save; practiceFlow = flow; mountRewardWallet(g, save); document.getElementById('renewal-help')?.remove(); if (!enabled(g))
    return; const b = document.createElement('button'); b.id = 'renewal-help'; b.textContent = '직접 해보는 도움말'; b.style.minHeight = '48px'; b.onclick = () => help(g); document.getElementById('playing')?.append(b); }
export function pollRenewalTutorials(g) { if (g !== current || !enabled(g) || dialog || g.status !== 'RUNNING' || activeMini(g) || document.querySelector('dialog[open]') || !document.getElementById('problem-panel')?.hidden)
    return; const active = g.tutorialPause?.active?.reasons[0], level = active ? Number(active.slice(9)) : pendingTutorials(progress(g), g.mode === 'CLASS_MATCH' ? 1 : g.cafeLevel)[0]; if (level)
    void open(g, level); }
function help(g) { if (dialog || document.querySelector('dialog[open]'))
    return; const d = document.createElement('dialog'); d.style.cssText = 'max-height:85vh;overflow:auto;width:min(600px,92vw)'; const h = document.createElement('h2'); h.textContent = '필요한 조작을 다시 연습해요'; d.append(h); for (const [i, level] of tutorialLevels.entries()) {
    const b = document.createElement('button');
    b.textContent = 'Lv.' + level + ' ' + tutorialTitles[i] + ' · ' + (progress(g).states[level] === 'complete' ? '완료' : progress(g).states[level] === 'skipped' ? '건너뜀' : '미시청');
    b.style.cssText = 'display:block;min-height:48px;margin:6px';
    b.disabled = g.mode === 'CLASS_MATCH' ? level !== 1 : level > g.cafeLevel;
    b.onclick = () => { d.remove(); void open(g, level); };
    d.append(b);
} const back = document.createElement('button'); back.textContent = '닫기'; back.onclick = () => d.remove(); d.append(back); document.body.append(d); d.showModal(); }
async function open(g, level) {
    if (dialog || g.status !== 'RUNNING')
        return;
    const reason = 'tutorial-' + level;
    g.tutorialPause ??= newTutorialPause();
    if (!beginTutorialPause(g.tutorialPause, reason))
        return;
    const d = document.createElement('dialog');
    dialog = d;
    d.className = 'renewal-tutorial';
    d.style.cssText = 'width:min(760px,94vw);max-height:90vh;overflow:auto;background:#fff8ed;color:#24382d;border-radius:20px';
    document.body.append(d);
    const h = document.createElement('h2');
    h.textContent = '함께 해봐요 · ' + tutorialTitles[tutorialLevels.indexOf(level)];
    const frozen = document.createElement('p');
    frozen.textContent = '영업 시간이 멈췄어요. 손님·직원·이벤트·급여도 기다려요. 아래는 연습용 복사본이에요. 실제 돈·음식·기록은 그대로예요.';
    const area = document.createElement('section'), status = document.createElement('p');
    status.setAttribute('role', 'status');
    d.append(h, frozen, area, status);
    const finish = (outcome, all = false) => { const before = structuredClone(g.tutorialPause), states = structuredClone(progress(g)); if (all)
        for (const l of pendingTutorials(progress(g), g.mode === 'CLASS_MATCH' ? 1 : g.cafeLevel))
            progress(g).states[l] = 'skipped';
    else
        progress(g).states[level] = outcome; endTutorialPause(g.tutorialPause, reason); if (!flush()) {
        g.tutorialPause = before;
        if (g.mega?.finalGrowth?.renewal)
            g.mega.finalGrowth.renewal.tutorials = states;
        status.textContent = '저장하지 못했어요. 연습 상태를 유지했으니 다시 눌러 주세요.';
        return;
    } disposePractice?.(); disposePractice = undefined; d.remove(); dialog = undefined; };
    const done = document.createElement('button');
    done.textContent = '연습 완료 · 카페로 돌아가기';
    done.disabled = true;
    const skip = document.createElement('button');
    skip.textContent = '이번 체험 건너뛰기';
    skip.onclick = () => finish('skipped');
    const skipAll = document.createElement('button');
    skipAll.textContent = '지금 열린 체험 모두 건너뛰기';
    skipAll.onclick = () => finish('skipped', true);
    for (const b of [done, skip, skipAll])
        b.style.cssText = 'min-height:48px;margin:5px';
    done.onclick = () => finish('complete');
    d.append(done, skip, skipAll);
    d.oncancel = e => { e.preventDefault(); finish('skipped'); };
    d.showModal();
    if (!flush()) {
        status.textContent = '튜토리얼 일시정지를 저장하지 못했어요. 저장 공간을 확인해 주세요.';
        return;
    }
    try {
        const model = new RenewalPractice(level), preview = document.createElement('div');
        preview.style.cssText = 'width:100%;height:260px;min-width:0;position:relative;overflow:hidden;border-radius:14px;background:#eee5d0';
        preview.setAttribute('aria-label', '연습 복사본 실제 카페');
        area.append(preview);
        const view = new MegaView(), scene = new SpatialScene(model.game.cafeLevel, model.game.cafe.maxCustomers, true);
        const paint = () => { scene.sync(model.game); view.sync(preview, model.game, scene); view.paint(performance.now()); };
        paint();
        const timer = setInterval(() => { if (!document.hidden)
            paint(); }, 150);
        disposePractice = () => { clearInterval(timer); view.detach(); };
        if (level === 1) {
            if (!practiceFlow) {
                status.textContent = '승인 문제은행을 연결한 학습에서 문제풀이 체험을 할 수 있어요. 임의 문제로 바꾸지 않아요.';
                return;
            }
            const flow = practiceFlow();
            const next = await flow.next();
            if (next.status !== 'question') {
                status.textContent = '선택 범위의 연습 문항을 준비하지 못했어요. 실제 기록은 그대로예요.';
                return;
            }
            const q = commonQuestion(next.question, 'tutorial', flow.choices, flow.loaded.subject, flow.choices[0].unitLabel), text = document.createElement('p');
            text.textContent = q.question;
            area.append(text);
            if (q.diagram) {
                const img = document.createElement('img');
                img.alt = '승인 문항 그림';
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(q.diagram);
                img.style.cssText = 'width:100%;max-height:min(240px,30vh);object-fit:contain';
                area.append(img);
            }
            let answered = false;
            for (let i = 0; i < q.choices.length; i++) {
                const b = document.createElement('button');
                b.textContent = q.choices[i];
                b.style.cssText = 'min-height:48px;margin:5px';
                b.onclick = async () => { if (answered)
                    return; answered = true; const result = await flow.answer(q.choiceIds[i], 0); if (result.status !== 'correct') {
                    status.textContent = '연습 오답이에요. ' + q.explanation + ' 실제 오답노트에는 남지 않아요.';
                    const retry = document.createElement('button');
                    retry.textContent = '해설 확인 · 생산과 서빙 연습';
                    retry.onclick = () => serve();
                    area.append(retry);
                }
                else
                    serve(); };
                area.append(b);
            }
            const serve = () => { area.replaceChildren(preview); model.game.recordAnswer(true, 1, 1); model.game.tick(6); status.textContent = '연습 정답으로 메뉴별 ' + model.game.productionAmount + '개 생산했어요. ' + q.explanation; const b = document.createElement('button'); b.textContent = '연습 손님 주문 · 서빙해 보기'; b.onclick = () => { for (let i = 0; i < 600 && model.game.stats.servedCustomers < 1; i++) {
                model.game.tick(.2);
                model.game.serveReadyOrder();
            } status.textContent = '실제 연습 시뮬레이션 · 서빙 ' + model.game.stats.servedCustomers + '건 · 재고 ' + model.game.menus.map(m => m.stock).join(',') + '개 · 실제 카페 보상 없음'; done.disabled = model.game.stats.servedCustomers < 1; }; area.append(b); };
            return;
        }
        const summary = document.createElement('p');
        summary.textContent = model.summary();
        area.append(summary);
        const choice = document.createElement('select');
        if (level === 3) {
            choice.setAttribute('aria-label', '연습 직원 선택');
            for (const o of model.options())
                choice.add(new Option(o.name, o.id));
            area.append(choice);
        }
        if (level === 11) {
            choice.setAttribute('aria-label', '연습 전문화 선택');
            choice.add(new Option('대량생산', 'mass'));
            choice.add(new Option('개성·브랜드', 'brand'));
            area.append(choice);
        }
        const cost = document.createElement('p');
        const showCost = () => { cost.textContent = '이 연습의 결제 ' + model.quote(choice.value).toLocaleString() + '원 · 연습 예산에서만 사용해요. 실제 카페에서 구매할 때 다시 확인해요.'; };
        choice.onchange = showCost;
        showCost();
        area.append(cost);
        let point;
        if ([13, 16].includes(level)) {
            const label = document.createElement('p');
            label.textContent = '연습 바닥 칸을 고른 뒤 설치해요. 실제 충돌·통로 검사를 사용해요.';
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(8,minmax(44px,1fr));gap:3px;max-width:100%;overflow:auto';
            for (let y = 3; y < (level === 16 ? 4 : 8); y++)
                for (let x = 3; x < 11; x++) {
                    const b = document.createElement('button');
                    b.textContent = x + ',' + y;
                    b.style.cssText = 'min-height:44px;min-width:44px;padding:4px;font-size:14px';
                    b.onclick = () => { point = { x, y }; status.textContent = '선택한 연습 칸 ' + x + ',' + y; };
                    grid.append(b);
                }
            area.append(label, grid);
        }
        const action = document.createElement('button');
        action.textContent = '연습에서 선택·실행하기';
        action.style.minHeight = '48px';
        action.onclick = () => { try {
            status.textContent = model.act(choice.value, point);
            summary.textContent = model.summary();
            done.disabled = !model.done;
            if (model.done)
                action.disabled = true;
        }
        catch (e) {
            status.textContent = e instanceof Error ? e.message : '연습 조건을 확인해 주세요.';
        } };
        area.append(action);
    }
    catch (error) {
        status.textContent = error instanceof Error ? error.message : '연습 화면을 준비하지 못했어요. 실제 기록은 그대로예요.';
    }
}
