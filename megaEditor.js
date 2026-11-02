import { managerPreparationAction } from './managerUi.js?v=furniture-ux-dd837b78b1a8';
import { megaGrowthBalance } from './megaGrowthEconomy.js?v=furniture-ux-dd837b78b1a8';
import { expansionQuote } from './megaExpansion.js?v=furniture-ux-dd837b78b1a8';
import { interiorActions, openInteriorEditor } from './megaShopUi.js?v=furniture-ux-dd837b78b1a8';
import { isShopDeployment } from './megaInventory.js?v=furniture-ux-dd837b78b1a8';
import { expansionAction } from './megaExpansionUi.js?v=furniture-ux-dd837b78b1a8';
import { environmentPlacements, paintEnvironment } from './megaArt.js?v=furniture-ux-dd837b78b1a8';
import { megaDimensions, megaKey, validateMegaPlan, defaultMegaPlan, iso, uniso, validMega, isMegaDeployment } from './megaSpace.js?v=furniture-ux-dd837b78b1a8';
import { paintMegaFloor, paintMegaTable, paintMegaChair } from './megaView.js?v=furniture-ux-dd837b78b1a8';
import { megaChairs } from './megaSpace.js?v=furniture-ux-dd837b78b1a8';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=furniture-ux-dd837b78b1a8';
import { allDecorationCatalog } from './longGrowthConfig.js?v=furniture-ux-dd837b78b1a8';
import { freeKey } from './freeLayoutModel.js?v=furniture-ux-dd837b78b1a8';
import { furnitureCatalog } from './furnitureCatalog.js?v=furniture-ux-dd837b78b1a8';
import { furnitureUnlocked } from './furnitureUnlocks.js?v=furniture-ux-dd837b78b1a8';
const mega30Deployment = () => typeof document !== 'undefined' && document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content')?.startsWith('v30e-') === true;
export function proposeMega(save, extended = false) { const level = extended ? Math.min(10, save.cafeLevel) : save.cafeLevel, branch = save.growthBranch?.active ?? null; if (level > 10)
    throw Error('Phase 1은 Lv.1~10만 지원해요. 기존 높은 레벨은 기존 화면에서 계속 운영해요.'); const source = save.freeLayouts?.plans[freeKey(save.cafeLevel, branch)] ?? save.layouts?.plans[megaKey(save.cafeLevel, branch)]; const [w, h] = megaDimensions[level - 1], snap = (x) => Math.round(x * 2) / 2; const p = source ? { version: 1, level, branch, tables: source.tables.map((t, i) => ({ id: t.id, kind: 'kind' in t ? t.kind : 'two', ...'furnitureId' in t ? { furnitureId: t.furnitureId } : {}, x: snap(2.75 + (t.x - 4) / 92 * (w - 4)), y: snap(1.75 + (t.y - 42) / 54 * (h - 3.5)), rotation: t.rotation })), decor: source.decor.map(d => ({ id: d.id, decorId: d.decorId, x: snap(2.5 + (d.x - 4) / 92 * (w - 3)), y: allDecorationCatalog.find(x => x.id === d.decorId)?.slot === 'wall' ? 0 : snap(2 + (d.y - 42) / 54 * (h - 3)), rotation: d.rotation, wall: allDecorationCatalog.find(x => x.id === d.decorId)?.slot === 'wall' })) } : defaultMegaPlan(level, branch); return { ...(extended ? { extended: true, paid: { spaceLevel: level, receipts: [] } } : {}), version: 1, source: 'confirmed-copy', plans: { [megaKey(level, branch)]: p } }; }
export async function openMegaEditor(repo, initial, close) {
    if (isShopDeployment() && initial.mega)
        return openInteriorEditor(repo, close, initial);
    if (!await ensureGrowthWriteLock()) {
        alert('다른 창의 저장을 보호하고 있어요. 카페를 연 창을 확인해 주세요.');
        return;
    }
    const read = repo.read();
    if (!['ready', 'empty'].includes(read.status)) {
        alert('저장 데이터를 먼저 복구해 주세요.');
        return;
    }
    const original = read.status === 'ready' ? read.save : initial;
    if (original.campaign?.run && !original.campaign.run.closed) {
        alert('진행 중인 영업을 먼저 마쳐 주세요.');
        return;
    }
    if (original.cafeLevel > 10 && !original.mega?.paid && !mega30Deployment()) {
        alert('Phase 1은 Lv.1~10만 지원합니다. 기존 저장은 그대로예요.');
        return;
    }
    const state = structuredClone(original.mega ?? proposeMega(original, mega30Deployment())), key = megaKey(state.paid?.spaceLevel ?? original.cafeLevel, original.growthBranch?.active), plan = state.plans[key] ?? defaultMegaPlan(state.paid?.spaceLevel ?? original.cafeLevel, original.growthBranch?.active ?? null);
    let draft = structuredClone(plan), selected = draft.tables[0].id, history = [], message = '', spots = [], generation = 0;
    let repaint = () => { };
    const artAbort = new AbortController();
    document.addEventListener('mega-art-ready', () => repaint(), { signal: artAbort.signal });
    const dialog = document.createElement('section');
    dialog.className = 'mega-edit-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '메가 카페 타일 배치');
    document.body.append(dialog);
    const exit = () => { generation++; artAbort.abort(); dialog.remove(); close(); };
    const item = () => [...draft.tables, ...draft.decor].find(t => t.id === selected);
    const change = (fn) => { history.push(structuredClone(draft)); fn(); message = ''; render(); };
    const render = () => {
        generation++;
        const issues = validateMegaPlan(draft), [w, h] = megaDimensions[draft.level - 1];
        dialog.innerHTML = '<div class="mega-edit-shell"><header><h2>' + (!original.mega ? '기존 배치를 새 공간으로 복사' : '카페 타일 배치') + '</h2><button id="mega-edit-cancel">취소 · 원본 유지</button></header><p>' + w + '×' + h + '칸 · ' + w * h + '칸. 기존 보유금·가구 소유·학습 기록은 유지합니다. ' + (!original.mega ? '원래 배치는 별도로 남습니다. 아래 변환 위치를 확인한 뒤 적용해 주세요.' : '영업 중에는 편집할 수 없어요.') + '</p><p class="mega-copy-note">' + draft.tables.map(t => t.id + ': ' + t.x + ', ' + t.y).join(' / ') + '</p><div class="mega-edit-layout"><div><canvas aria-label="가구를 선택한 후 원하는 바닥 칸을 터치해 배치" tabindex="0"></canvas><p class="mega-edit-status" role="status">' + (message || issues[0] || '모든 좌석·주방·출입구가 연결돼요.') + '</p><p>초록 원은 동선 검사까지 통과한 추천 자리예요. 다른 바닥도 직접 터치할 수 있어요.</p></div><aside><h3>테이블</h3>' + draft.tables.map(t => '<button data-select="' + t.id + '" aria-pressed="' + (selected === t.id) + '">' + t.id + ' · ' + t.kind + '</button>').join('') + '<h3>선택 테이블의 가구</h3><select id="mega-furniture" aria-label="같은 좌석 수의 보유 가구"><option value="">기존 가구 유지</option>' + furnitureCatalog.filter(f => f.kind === (draft.tables.find(t => t.id === selected)?.kind ?? 'two') && furnitureUnlocked(original.longTerm, f.id)).map(f => '<option value="' + f.id + '">' + f.name + '</option>').join('') + '</select><h3>소유 장식</h3>' + allDecorationCatalog.filter(d => original.longTerm?.owned.includes(d.id)).map(d => '<button data-decor="' + d.id + '">' + d.name + '</button>').join('') + '</aside></div><div class="mega-edit-actions"><button id="mega-rotate">90° 회전</button><button id="mega-undo" ' + (!history.length ? 'disabled' : '') + '>되돌리기</button><button id="mega-spots">가능한 자리 표시</button><button id="mega-auto">추천 자리로 자동 배치</button><button id="mega-apply" ' + (issues.length ? 'disabled' : '') + '>' + (!original.mega ? '이 위치로 복사 적용' : '배치 확정 · 저장') + '</button></div><p>테이블·의자 세트로 움직입니다. 통로가 막히면 저장할 수 없어요. 모든 기능은 선택 후 터치로 사용할 수 있어요.</p></div>';
        const canvas = dialog.querySelector('canvas'), c = canvas.getContext('2d');
        canvas.width = 1000;
        canvas.height = 700;
        const scale = Math.min(920 / ((w + h) * 24 + 60), 600 / ((w + h) * 12 + 90)), origin = { x: 500 - (w - h) * 12 * scale, y: 70 };
        const paint = () => { c.clearRect(0, 0, 1000, 700); c.save(); c.translate(origin.x, origin.y); c.scale(scale, scale); paintMegaFloor(c, draft); for (const f of environmentPlacements(draft)) {
            const q = iso(f);
            paintEnvironment(c, f.id, q.x, q.y, f.width, f.baseRise, f.flip);
        } for (const t of draft.tables) {
            for (const ch of megaChairs(t))
                paintMegaChair(c, t, { ...ch.chair, rear: ch.rear });
            paintMegaTable(c, t);
            if (t.id === selected) {
                const p = iso(t);
                c.strokeStyle = issues.length ? '#b94237' : '#247b55';
                c.lineWidth = 2 / scale;
                c.strokeRect(p.x - 24, p.y - 25, 48, 36);
            }
        } for (const d of draft.decor) {
            const p = iso(d);
            c.fillStyle = d.id === selected ? '#bf744e' : '#608b58';
            c.beginPath();
            c.arc(p.x, p.y - (d.wall ? 24 : 8), 8, 0, Math.PI * 2);
            c.fill();
        } c.fillStyle = '#3b9e6177'; for (const p of spots) {
            const q = iso(p);
            c.beginPath();
            c.ellipse(q.x, q.y, 10, 5, 0, 0, Math.PI * 2);
            c.fill();
        } c.restore(); };
        repaint = paint;
        paint();
        const destination = (e) => { const r = canvas.getBoundingClientRect(); return uniso({ x: ((e.clientX - r.left) * 1000 / r.width - origin.x) / scale, y: ((e.clientY - r.top) * 700 / r.height - origin.y) / scale }); };
        const place = (p) => change(() => { const a = item(); a.x = Math.round(p.x * 2) / 2; a.y = 'wall' in a && a.wall ? 0 : Math.round(p.y * 2) / 2; spots = []; });
        let down = false;
        canvas.onpointerdown = e => { down = true; canvas.setPointerCapture(e.pointerId); };
        canvas.onpointerup = e => { if (down)
            place(destination(e)); down = false; };
        canvas.onpointercancel = () => down = false;
        const bind = (id, fn) => dialog.querySelector('#' + id).onclick = fn;
        bind('mega-edit-cancel', exit);
        dialog.onkeydown = e => { if (e.key === 'Escape')
            exit(); };
        bind('mega-rotate', () => change(() => { item().rotation = ((item().rotation + 90) % 360); spots = []; }));
        bind('mega-undo', () => { if (history.length) {
            draft = history.pop();
            selected = draft.tables.some(t => t.id === selected) || draft.decor.some(d => d.id === selected) ? selected : draft.tables[0].id;
            spots = [];
            render();
        } });
        dialog.querySelectorAll('[data-select]').forEach(b => b.onclick = () => { selected = b.dataset.select; spots = []; render(); });
        dialog.querySelectorAll('[data-decor]').forEach(b => b.onclick = () => { const id = b.dataset.decor, d = allDecorationCatalog.find(d => d.id === id); selected = 'decor-' + id; if (!draft.decor.some(x => x.id === selected))
            change(() => draft.decor.push({ id: selected, decorId: id, x: 3, y: d.slot === 'wall' ? 0 : 4.5, rotation: 0, wall: d.slot === 'wall' }));
        else
            render(); });
        dialog.querySelector('#mega-furniture').onchange = e => { const t = draft.tables.find(t => t.id === selected); if (t)
            change(() => t.furnitureId = e.target.value || t.furnitureId); };
        const find = async () => { const token = ++generation; spots = []; message = '가능한 위치와 통로를 검사하고 있어요…'; const status = dialog.querySelector('.mega-edit-status'); status.textContent = message; const a = item(); for (let y = (a && 'wall' in a && a.wall ? 0 : 1.5); y < h - .5; y += 1) {
            for (let x = 2.5; x < w - .5; x += 1) {
                if (token !== generation || !dialog.isConnected)
                    return;
                const candidate = structuredClone(draft), q = [...candidate.tables, ...candidate.decor].find(q => q.id === selected);
                q.x = x;
                q.y = 'wall' in q && q.wall ? 0 : y;
                if (!validateMegaPlan(candidate).length)
                    spots.push({ x, y: q.y });
                if (spots.length === 16)
                    break;
            }
            if (spots.length === 16)
                break;
            await new Promise(resolve => setTimeout(resolve, 0));
        } message = spots.length ? '놓을 수 있는 추천 자리 ' + spots.length + '곳을 찾았어요.' : '추천 자리가 없어요. 다른 가구를 확인해 주세요.'; status.textContent = message; paint(); };
        bind('mega-spots', () => { void find(); });
        bind('mega-auto', () => { void find().then(() => { if (dialog.isConnected && spots.length)
            place(spots[0]); }); });
        bind('mega-apply', () => { if (validateMegaPlan(draft).length)
            return; const staged = structuredClone(original); state.plans[key] = structuredClone(draft); staged.mega = state; if (!validMega(state)) {
            message = '보유 좌석 수를 확인해 주세요.';
            render();
            return;
        } staged.updatedAt = new Date().toISOString(); const result = repo.write(staged, read.status === 'ready' ? original : undefined); if (result.ok)
            exit();
        else {
            message = result.message;
            render();
        } });
    };
    render();
    dialog.querySelector('#mega-edit-cancel').focus();
}
export function megaSetupActions(container, repo, save, refresh) { if (!isMegaDeployment())
    return; if (save.mega?.paid)
    for (const p of container.parentElement?.querySelectorAll('p') ?? [])
        if (p.textContent?.startsWith('다음 돈 목표:'))
            p.textContent = p.textContent.replace('카페 확장', '카페 레벨 올리기 · 매장 면적 유지'); for (const n of document.querySelectorAll('.hint'))
    if (n.textContent === 'v2.6 전용 카페예요. 이전 버전 카페는 그대로 보관돼요.')
        n.textContent = 'v3.0 테스트 전용 카페예요. 이전 버전 카페는 그대로 보관돼요.'; if (save.mega?.extended) {
    const quote = expansionQuote(save), qualification = megaGrowthBalance.cafes[save.cafeLevel];
    for (const p of container.parentElement?.querySelectorAll('p') ?? []) {
        if (p.textContent?.startsWith('다음 돈 목표:'))
            p.textContent = qualification ? '다음 돈 목표: ' + qualification.expansionCost.toLocaleString() + '원 · Lv.' + qualification.level + ' 자격 성장(매장 면적 유지)' : quote.next ? '다음 돈 목표: ' + quote.next.cost.toLocaleString() + '원 · ' + quote.next.size.join('×') + ' 선택 증축' : '다음 돈 목표: 원하는 가구 구입·배치와 카페 앨범 완성';
        if (p.textContent?.startsWith('다음:'))
            p.textContent = quote.next ? '다음: Lv.' + quote.next.requiredLevel + ' 자격 · ' + quote.next.size.join('×') + ' 유료 증축 · 자동 가구 지급 없음' : '다음: Lv.30 공간 완성 · 자유 인테리어와 기존 마을 성장';
    }
} managerPreparationAction(container, repo, save, refresh); expansionAction(container, repo, save, refresh); if (interiorActions(container, repo, save, refresh))
    return; const b = document.createElement('button'); b.textContent = save.mega ? '메가 카페 배치 · 타일 보기' : '기존 카페 → 메가 공간 복사 확인'; b.disabled = (save.cafeLevel > 10 && !save.mega?.paid && !mega30Deployment()) || !!save.campaign?.run && !save.campaign.run.closed; b.onclick = () => { void openMegaEditor(repo, save, refresh); }; container.append(b); const note = document.createElement('p'); note.textContent = mega30Deployment() ? 'v3.0 메가 카페 로컬 후보 · 기존 배치는 복사 확인 후 보존하며, 증축은 선택 결제예요.' : 'v3.0 로컬 후보 · Lv.1~10 실제 확장 · 기존 버전과 별도 저장. Lv.20·30과 새 매니저는 미구현입니다.'; container.append(note); }
