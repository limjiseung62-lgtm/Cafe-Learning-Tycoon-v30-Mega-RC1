import { openTouchInterior } from './touchInteriorUi.js?v=commerce-6afe2d573839';
import { megaOperatingGrade } from './megaOperations.js?v=commerce-6afe2d573839';
import { megaZones } from './megaZones.js?v=commerce-6afe2d573839';
import { adoptInterior, interiorCatalog, inventorySku, tableSeatCount, isShopDeployment } from './megaInventory.js?v=commerce-6afe2d573839';
import { buyInterior, saveInteriorLayout } from './megaShop.js?v=commerce-6afe2d573839';
import { ensureMegaPlan, megaKey, megaDimensions, megaChairs, validateMegaPlan, megaBudget, iso, uniso } from './megaSpace.js?v=commerce-6afe2d573839';
import { furnitureFor } from './furnitureCatalog.js?v=commerce-6afe2d573839';
import { furnitureUnlocked, prepareFurniture } from './furnitureUnlocks.js?v=commerce-6afe2d573839';
import { allDecorationCatalog } from './longGrowthConfig.js?v=commerce-6afe2d573839';
import { paintMegaFloor, paintMegaTable, paintMegaChair } from './megaView.js?v=commerce-6afe2d573839';
import { paintMegaDecor, environmentPlacements, paintEnvironment, megaImage } from './megaArt.js?v=commerce-6afe2d573839';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=commerce-6afe2d573839';
const name = (sku) => inventorySku(sku)?.name ?? allDecorationCatalog.find(d => 'decor-' + d.id === sku)?.name ?? sku;
const assigned = (p) => new Set([...p.tables.flatMap(t => [t.id, ...(t.chairs ?? []).map(c => c.id)]), ...p.decor.map(d => d.id), ...(p.fixtures ?? []).map(d => d.id)]);
function shell(title, exit) { const el = document.createElement('section'); el.className = 'mega-edit-dialog interior-dialog'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title); document.body.append(el); el.onkeydown = e => { if (e.key === 'Escape')
    exit(); }; return el; }
export function interiorActions(host, repo, save, refresh) { if (!isShopDeployment() || !save.mega)
    return false; const active = !!save.campaign?.run && !save.campaign.run.closed; for (const [label, open] of [['가구 상점 · 가격과 보관함', openInteriorShop], ['보유 가구 자유 배치 · 의자·보관', openInteriorEditor]]) {
    const b = document.createElement('button');
    b.textContent = label;
    b.disabled = active;
    b.onclick = () => void open(repo, refresh, save);
    host.append(b);
} const p = document.createElement('p'); p.textContent = '시작 테이블2개·의자4개·필수 주방은 무료예요. 증축 후 빈 공간은 구매한 가구로 직접 꾸며요. 의자가 있는 자리만 손님이 앉아요.'; host.append(p); return true; }
async function openLegacyInteriorShop(repo, refresh, initial) {
    if (!await ensureGrowthWriteLock())
        return;
    const abort = new AbortController();
    let dialog;
    const exit = () => { abort.abort(); dialog.remove(); refresh(); };
    dialog = shell('가구 상점', exit);
    let message = '', confirm = '', busy = false, category = 'all';
    const render = () => {
        const read = repo.read();
        if (read.status !== 'ready' && !(read.status === 'empty' && initial)) {
            dialog.innerHTML = '<p>카페 저장을 먼저 확인해 주세요.</p><button id="shop-close">닫기</button>';
            dialog.querySelector('#shop-close').onclick = exit;
            return;
        }
        const persisted = read.status === 'ready' ? read.save : initial, s = adoptInterior(persisted);
        if (!s.mega) {
            dialog.innerHTML = '<p>기존 카페의 메가 공간 복사를 먼저 확인해 주세요.</p><button id=shop-close>닫기</button>';
            dialog.querySelector('#shop-close').onclick = exit;
            return;
        }
        prepareFurniture(s);
        const inv = s.mega.inventory, plan = ensureMegaPlan(s.mega, s.cafeLevel, s.growthBranch?.active ?? undefined), placed = assigned(plan);
        dialog.innerHTML = '<div class="mega-edit-shell"><header><h2>가구 상점</h2><button id="shop-close">닫기</button></header><p><strong>보유 ' + s.money.toLocaleString() + '원</strong> · 보관 ' + inv.items.filter(i => !placed.has(i.id)).length + '개 · 구매 영수증 ' + inv.receipts.length + '건</p><p>구매한 가구는 보관함으로 들어가요. 구매와 배치 저장은 별개예요. 기본 테이블은 의자 별도, 벤치·소파는 표시된 좌석을 포함해요.</p><label>종류 <select id="shop-filter"><option value="all">전체</option><option value="table">테이블·소파</option><option value="chair">의자</option><option value="decor">장식·쇼케이스</option><option value="fixture">주방·서빙</option></select></label><p role="status">' + message + '</p><div class="interior-confirm">' + (confirm ? '<strong>' + name(confirm) + ' · ' + inventorySku(confirm).cost.toLocaleString() + '원 결제할까요?</strong><button id="shop-confirm">확인 · 구매</button><button id="shop-back">취소</button>' : '') + '</div><div class="interior-cards">' + interiorCatalog.filter(d => category === 'all' || d.type === category).map(d => { const allowed = s.cafeLevel >= d.level && (d.type !== 'table' || furnitureUnlocked(s.longTerm, d.sku)), count = inv.items.filter(i => i.sku === d.sku).length; return '<article><canvas width="130" height="110" data-thumb="' + d.sku + '" aria-label="' + d.name + ' 모습"></canvas><h3>' + d.name + '</h3><p>' + d.cost.toLocaleString() + '원 · 보유 ' + count + '개</p><p>' + (d.type === 'table' ? (d.bundle ? d.bundle + '좌석 포함' : '의자 별도 · 최대 ' + ({ two: 2, four: 4, long: 6 }[furnitureFor((d.sku.includes('long') || d.sku.includes('workbench')) ? 'long' : d.sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(d.sku) ? 'four' : 'two', d.sku).kind]) + '석') : d.type === 'chair' ? '테이블 좌석에 연결해 사용' : d.type === 'fixture' ? '실제 픽업2곳 · 음식 자동 생산 없음' : '공간을 꾸미는 장식 · 자동 수익 없음') + '</p><p>' + (allowed ? '구매 가능' : 'Lv.' + d.level + ' · ' + (d.type === 'table' ? furnitureFor((d.sku.includes('long') || d.sku.includes('workbench')) ? 'long' : d.sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(d.sku) ? 'four' : 'two', d.sku).condition : '카페 성장 필요')) + '</p><button data-buy="' + d.sku + '" ' + (!allowed || s.money < d.cost || busy ? 'disabled' : '') + '>구매 · ' + d.cost.toLocaleString() + '원</button></article>'; }).join('') + '</div><p>필수 주방은 무료로 유지돼요. 가구의 좌석 수와 통로가 실제 영업에 반영돼요.</p></div>';
        dialog.querySelector('#shop-filter').value = category;
        dialog.querySelector('#shop-filter').onchange = e => { category = e.target.value; render(); };
        dialog.querySelector('#shop-close').onclick = exit;
        dialog.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { confirm = b.dataset.buy; message = ''; render(); dialog.querySelector('#shop-confirm')?.scrollIntoView({ block: 'nearest' }); });
        dialog.querySelector('#shop-back')?.addEventListener('click', () => { confirm = ''; render(); });
        dialog.querySelector('#shop-confirm')?.addEventListener('click', async () => { if (busy)
            return; busy = true; if (!await ensureGrowthWriteLock()) {
            busy = false;
            return;
        } const result = buyInterior(persisted, confirm, inv.next); if (result.ok) {
            const write = repo.write(result.save, read.status === 'ready' ? persisted : undefined);
            message = write.ok ? name(confirm) + ' 구매 완료! 보관함에서 놓아 보세요.' : write.message;
        }
        else
            message = result.reason; confirm = ''; busy = false; render(); });
        paintThumbs();
    };
    const paintThumbs = () => { dialog.querySelectorAll('[data-thumb]').forEach(cv => { const sku = cv.dataset.thumb, ctx = cv.getContext('2d'); ctx.clearRect(0, 0, 130, 110); ctx.save(); ctx.translate(65, 78); const f = inventorySku(sku); if (f?.type === 'table') {
        const d = furnitureFor(sku.includes('long') || sku.includes('workbench') ? 'long' : sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(sku) ? 'four' : 'two', sku);
        const t = { id: 'thumb', kind: d.kind, furnitureId: sku, x: 0, y: 0, rotation: 0 };
        for (const c of megaChairs(t))
            paintMegaChair(ctx, t, { ...c.chair, rear: c.rear });
        paintMegaTable(ctx, t);
    }
    else if (f?.type === 'fixture')
        paintEnvironment(ctx, 'prep', 0, 0, 72, 12);
    else if (sku === 'chair')
        paintMegaChair(ctx, { id: 'thumb', kind: 'two', x: 0, y: 0, rotation: 0 }, { x: 0, y: 0, rear: false });
    else {
        const img = megaImage('assets/art/long-growth/' + sku.slice(6) + '.svg');
        if (img)
            ctx.drawImage(img, -24, -48, 48, 48);
    } ctx.restore(); }); };
    document.addEventListener('mega-art-ready', paintThumbs, { signal: abort.signal });
    render();
}
export async function openLegacyInteriorEditor(repo, refresh, initial) {
    if (!await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' && !(read.status === 'empty' && initial))
        return;
    const original = read.status === 'ready' ? read.save : initial, s = adoptInterior(original);
    if (s.campaign?.run && !s.campaign.run.closed)
        return;
    if (!s.mega)
        return;
    const m = s.mega, inv = m.inventory, key = megaKey(m.paid.spaceLevel, s.growthBranch?.active), plan = ensureMegaPlan(m, s.cafeLevel, s.growthBranch?.active ?? undefined);
    let draft = structuredClone(plan), selected = draft.tables[0]?.id ?? inv.items[0]?.id ?? '', history = [], spots = [], message = '', token = 0, viewZoom = 1, viewCenter = null;
    const abort = new AbortController();
    let dialog;
    const exit = () => { token++; abort.abort(); dialog.remove(); refresh(); };
    dialog = shell('보유 가구 자유 배치', exit);
    let repaint = () => { };
    document.addEventListener('mega-art-ready', () => repaint(), { signal: abort.signal });
    const placedChair = (id) => draft.tables.find(t => t.chairs?.some(c => c.id === id));
    const mutate = (candidate) => { const result = saveInteriorLayout(s, candidate); if (!result.ok) {
        message = result.reason;
        render();
        return false;
    } history.push(structuredClone(draft)); draft = candidate; message = '배치 가능해요. 확정하면 저장돼요.'; spots = []; render(); return true; };
    const put = (x, y) => {
        const item = inv.items.find(i => i.id === selected);
        if (!item)
            return;
        const candidate = structuredClone(draft), def = inventorySku(item.sku);
        if (item.sku === 'chair') {
            const targets = candidate.tables.flatMap(t => megaChairs({ ...t, chairs: undefined }).filter(c => !t.chairs?.some(q => q.slot === c.slot)).map(c => ({ t, c, d: Math.hypot(c.chair.x - x, c.chair.y - y) }))).sort((a, b) => a.d - b.d);
            if (!targets.length || targets[0].d > 2) {
                message = '선택한 테이블의 빈 의자 자리 근처를 눌러 주세요.';
                render();
                return;
            }
            for (const t of candidate.tables)
                t.chairs = t.chairs?.filter(c => c.id !== selected);
            targets[0].t.chairs.push({ id: selected, slot: targets[0].c.slot });
        }
        else if (def?.type === 'table') {
            let t = candidate.tables.find(t => t.id === selected);
            if (!t) {
                const d = furnitureFor(item.sku.includes('long') || item.sku.includes('workbench') ? 'long' : item.sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(item.sku) ? 'four' : 'two', item.sku);
                t = { id: selected, kind: d.kind, furnitureId: item.sku, x, y, rotation: 0, chairs: [] };
                candidate.tables.push(t);
            }
            t.x = x;
            t.y = y;
        }
        else if (def?.type === 'fixture') {
            candidate.fixtures ??= [];
            let f = candidate.fixtures.find(f => f.id === selected);
            if (!f) {
                f = { id: selected, sku: 'service-prep', x, y, rotation: 0 };
                candidate.fixtures.push(f);
            }
            f.x = x;
            f.y = y;
        }
        else {
            let d = candidate.decor.find(d => d.id === selected);
            const decoration = allDecorationCatalog.find(d => 'decor-' + d.id === item.sku);
            if (!d) {
                d = { id: selected, decorId: decoration.id, x, y: decoration.slot === 'wall' ? 0 : y, wall: decoration.slot === 'wall', rotation: 0 };
                candidate.decor.push(d);
            }
            d.x = x;
            d.y = d.wall ? 0 : y;
        }
        mutate(candidate);
    };
    const find = async () => { const item = inv.items.find(i => i.id === selected); if (item.sku === 'chair') {
        const targets = draft.tables.flatMap(t => megaChairs({ ...t, chairs: undefined }).filter(c => !t.chairs?.some(q => q.slot === c.slot)).map(c => ({ t, c })));
        for (const { t, c } of targets) {
            const probe = structuredClone(draft);
            for (const q of probe.tables)
                q.chairs = q.chairs?.filter(v => v.id !== selected);
            probe.tables.find(q => q.id === t.id).chairs.push({ id: selected, slot: c.slot });
            if (!validateMegaPlan(probe).length) {
                put(c.chair.x, c.chair.y);
                return;
            }
        }
        message = '의자 통로가 열리는 빈 자리가 없어요. 테이블 위치를 옮겨 주세요.';
        render();
        return;
    } const generation = ++token; spots = []; message = '통로까지 검사하고 있어요…'; dialog.querySelector('[role=status]').textContent = message; const [w, h] = megaDimensions[draft.level - 1]; for (let y = viewCenter ? Math.max(1.5, Math.floor(viewCenter.y - 6) + .5) : 1.5; y < (viewCenter ? Math.min(h - .5, viewCenter.y + 6) : h - .5); y += 1) {
        for (let x = viewCenter ? Math.max(2.5, Math.floor(viewCenter.x - 7) + .5) : 2.5; x < (viewCenter ? Math.min(w - .5, viewCenter.x + 7) : w - .5); x += 1) {
            if (Math.floor(x) % 4 === 0)
                await new Promise(r => setTimeout(r, 0));
            if (generation !== token)
                return;
            const c = structuredClone(draft), def = inventorySku(item.sku);
            if (def?.type === 'table') {
                let t = c.tables.find(t => t.id === selected);
                if (!t) {
                    const f = furnitureFor(item.sku.includes('long') || item.sku.includes('workbench') ? 'long' : item.sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(item.sku) ? 'four' : 'two', item.sku);
                    t = { id: selected, kind: f.kind, furnitureId: item.sku, x, y, rotation: 0, chairs: [] };
                    c.tables.push(t);
                }
                t.x = x;
                t.y = y;
            }
            else if (def?.type === 'fixture') {
                c.fixtures ??= [];
                let f = c.fixtures.find(f => f.id === selected);
                if (!f) {
                    f = { id: selected, sku: 'service-prep', x, y, rotation: 0 };
                    c.fixtures.push(f);
                }
                f.x = x;
                f.y = y;
            }
            else {
                const d = allDecorationCatalog.find(d => 'decor-' + d.id === item.sku), p = c.decor.find(d => d.id === selected);
                if (p) {
                    p.x = x;
                    p.y = p.wall ? 0 : y;
                }
                else
                    c.decor.push({ id: selected, decorId: d.id, x, y: d.slot === 'wall' ? 0 : y, rotation: 0, wall: d.slot === 'wall' });
            }
            const check = structuredClone(c), future = check.tables.find(t => t.id === selected);
            if (future && !(future.chairs?.length)) {
                const other = check.tables.filter(t => t.id !== selected).reduce((n, t) => n + tableSeatCount(t), 0), count = Math.min(megaChairs({ ...future, chairs: undefined }).length, megaBudget[draft.level - 1] - other);
                future.chairs = Array.from({ length: Math.max(1, count) }, (_, slot) => ({ id: 'probe-' + slot, slot }));
            }
            const sy = c.decor.find(d => d.id === selected)?.wall ? 0 : y;
            if (!validateMegaPlan(check).length && !spots.some(p => p.x === x && p.y === sy))
                spots.push({ x, y: sy });
            if (spots.length === 16)
                break;
        }
        if (spots.length === 16)
            break;
        await new Promise(r => setTimeout(r, 0));
    } if (generation !== token)
        return; message = '동선이 연결되는 추천 자리 ' + spots.length + '곳'; dialog.querySelector('[role=status]').textContent = message; repaint(); };
    const render = () => {
        token++;
        const placed = assigned(draft), [w, h] = megaDimensions[draft.level - 1], selectedItem = inv.items.find(i => i.id === selected);
        dialog.innerHTML = '<div class="mega-edit-shell"><header><h2>내 가구로 꾸미기</h2><button id="interior-cancel">취소 · 기존 배치 유지</button></header><p>' + w + '×' + h + ' · ' + draft.tables.length + '테이블 · 실제 좌석 ' + draft.tables.reduce((n, t) => n + tableSeatCount(t), 0) + '개 · 보관 ' + inv.items.filter(i => !placed.has(i.id)).length + '개</p><p>구역 준비 ' + megaOperatingGrade(draft).ready.length + '/' + megaOperatingGrade(draft).all + ' · 운영 가격 가산 ' + Math.round((megaOperatingGrade(draft).factor - 1) * 100) + '% (준비된 구역의 실제 주문만 적용)</p><p>현재 매장은 최대 ' + megaBudget[draft.level - 1] + '좌석을 놓을 수 있어요. 보관 가구는 영업에 참여하지 않아요.</p><p>가구 선택 → 빈 바닥 터치. 의자는 테이블의 빈 좌석 원을 누르거나 자동 연결해요. 테이블을 움직이거나 돌리면 의자도 함께 움직여요. 영업을 위해 최소 한 좌석은 남겨요.</p><div class="mega-edit-layout"><div><canvas width="1000" height="700" tabindex="0" aria-label="구매한 가구 선택 후 바닥이나 의자 자리를 터치"></canvas><p role="status">' + (message || '선택: ' + name(selectedItem.sku)) + '</p></div><aside><h3>보기 조절</h3><div class=interior-camera><button id=interior-zoom-in>선택 위치 확대</button><button id=interior-zoom-out>축소</button><button id=interior-fit>전체 보기</button><button data-pan=up aria-label=배치화면위로>↑</button><button data-pan=left aria-label=배치화면왼쪽으로>←</button><button data-pan=down aria-label=배치화면아래로>↓</button><button data-pan=right aria-label=배치화면오른쪽으로>→</button></div><h3>보유 가구</h3><label>가구 선택<select id="interior-select">' + inv.items.map(i => '<option value="' + i.id + '">' + (placed.has(i.id) ? '배치 · ' : '보관 · ') + name(i.sku) + ' [' + i.id + ']</option>').join('') + '</select></label><p>선택: ' + name(selectedItem.sku) + '</p><label>구역 보기 <select id="interior-zone"><option value="">선택 가구 주변</option>' + megaZones(draft).map(z => '<option value="' + z.id + '">' + z.name + '</option>').join('') + '</select></label><button id="interior-store" ' + (!placed.has(selected) ? 'disabled' : '') + '>선택 가구 보관</button><button id="interior-rotate">90° 회전 · 의자는 테이블과 함께</button><button id="interior-spots">가능한 자리 표시</button><button id="interior-auto">추천 자리 자동 배치·의자 연결</button><button id="interior-undo" ' + (!history.length ? 'disabled' : '') + '>되돌리기</button><button id="interior-save">배치 확정 · 저장</button><p>초록 원은 통로 검사 통과 위치예요. 빨간 안내가 나오면 이전 정상 배치를 유지해요.</p></aside></div></div>';
        dialog.querySelector('#interior-cancel').onclick = exit;
        const select = dialog.querySelector('#interior-select');
        select.value = selected;
        select.onchange = () => { selected = select.value; spots = []; message = ''; render(); };
        const zones = dialog.querySelector('#interior-zone');
        zones.onchange = () => { const z = megaZones(draft).find(z => z.id === zones.value); if (z) {
            viewCenter = { x: z.x + z.w / 2, y: z.y + z.h / 2 };
            viewZoom = Math.max(1, Math.min(6, (w + h) / (z.w + z.h)));
            render();
        } };
        const bind = (id, fn) => dialog.querySelector('#' + id).onclick = fn;
        const focusPoint = () => [...draft.tables, ...draft.decor, ...(draft.fixtures ?? [])].find(t => t.id === selected) ?? placedChair(selected) ?? { x: w / 2, y: h / 2 };
        bind('interior-zoom-in', () => { viewZoom = Math.min(6, viewZoom * 1.5); viewCenter = { x: focusPoint().x, y: focusPoint().y }; render(); });
        bind('interior-zoom-out', () => { viewZoom = Math.max(1, viewZoom / 1.5); render(); });
        bind('interior-fit', () => { viewZoom = 1; viewCenter = null; render(); });
        dialog.querySelectorAll('[data-pan]').forEach(b => b.onclick = () => { viewZoom = Math.max(2, viewZoom); const p = viewCenter ?? focusPoint(), d = b.dataset.pan; viewCenter = { x: Math.max(.5, Math.min(w - .5, p.x + (['left', 'up'].includes(d) ? -1 : 1))), y: Math.max(.5, Math.min(h - .5, p.y + (['right', 'up'].includes(d) ? -1 : 1))) }; render(); });
        bind('interior-store', () => { const c = structuredClone(draft); c.tables = c.tables.filter(t => t.id !== selected); for (const t of c.tables)
            t.chairs = t.chairs?.filter(c => c.id !== selected); c.decor = c.decor.filter(d => d.id !== selected); c.fixtures = c.fixtures?.filter(d => d.id !== selected); mutate(c); });
        bind('interior-rotate', () => { const c = structuredClone(draft), a = [...c.tables, ...c.decor, ...(c.fixtures ?? [])].find(t => t.id === selected) ?? c.tables.find(t => t.chairs?.some(c => c.id === selected)); if (a) {
            a.rotation = ((a.rotation + 90) % 360);
            mutate(c);
        }
        else {
            message = '먼저 가구를 놓아 주세요.';
            render();
        } });
        bind('interior-undo', () => { if (history.length) {
            draft = history.pop();
            message = '이전 배치로 되돌렸어요.';
            render();
        } });
        bind('interior-spots', () => void find());
        bind('interior-auto', () => { const chosen = selected; void find().then(() => { if (dialog.isConnected && selected === chosen && spots.length)
            put(spots[0].x, spots[0].y); }); });
        bind('interior-save', () => { const result = saveInteriorLayout(original, draft); if (result.ok) {
            const r = repo.write(result.save, read.status === 'ready' ? original : undefined);
            if (r.ok)
                exit();
            else {
                message = r.message;
                render();
            }
        }
        else {
            message = result.reason;
            render();
        } });
        const cv = dialog.querySelector('canvas'), ctx = cv.getContext('2d'), scale = Math.min(920 / ((w + h) * 24 + 60), 590 / ((w + h) * 12 + 90)) * viewZoom, center = iso(viewCenter ?? { x: w / 2, y: h / 2 }), origin = viewZoom === 1 ? { x: 500 - (w - h) * 12 * scale, y: 70 } : { x: 500 - center.x * scale, y: 350 - center.y * scale };
        repaint = () => { ctx.clearRect(0, 0, 1000, 700); ctx.save(); ctx.translate(origin.x, origin.y); ctx.scale(scale, scale); paintMegaFloor(ctx, draft); for (const e of environmentPlacements(draft)) {
            const q = iso(e);
            paintEnvironment(ctx, e.id, q.x, q.y, e.width, e.baseRise, e.flip);
        } for (const t of draft.tables) {
            for (const c of megaChairs(t))
                paintMegaChair(ctx, t, { ...c.chair, rear: c.rear });
            paintMegaTable(ctx, t);
            if (t.id === selected || placedChair(selected)?.id === t.id) {
                const q = iso(t);
                ctx.strokeStyle = '#258757';
                ctx.lineWidth = 2 / scale;
                ctx.strokeRect(q.x - 25, q.y - 30, 50, 40);
            }
            if (selectedItem.sku === 'chair')
                for (const c of megaChairs({ ...t, chairs: undefined })) {
                    if (t.chairs?.some(q => q.slot === c.slot))
                        continue;
                    const probe = structuredClone(draft);
                    for (const p of probe.tables)
                        p.chairs = p.chairs?.filter(a => a.id !== selected);
                    probe.tables.find(a => a.id === t.id).chairs.push({ id: selected, slot: c.slot });
                    const q = iso(c.chair);
                    ctx.fillStyle = validateMegaPlan(probe).length ? '#bb413677' : '#399c5c88';
                    ctx.beginPath();
                    ctx.ellipse(q.x, q.y, 7, 4, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
        } for (const d of draft.decor) {
            const q = iso(d);
            paintMegaDecor(ctx, draft, d);
            if (d.id === selected) {
                ctx.strokeStyle = '#267f4b';
                ctx.strokeRect(q.x - 16, q.y - (d.wall ? 40 : 26), 32, 32);
            }
        } for (const f of draft.fixtures ?? [])
            if (f.id === selected) {
                const q = iso(f);
                ctx.strokeStyle = '#267f4b';
                ctx.strokeRect(q.x - 36, q.y - 32, 72, 42);
            } for (const p of spots) {
            const q = iso(p);
            ctx.fillStyle = '#359d5e88';
            ctx.beginPath();
            ctx.ellipse(q.x, q.y, 10, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        } ctx.restore(); };
        repaint();
        let down = null;
        cv.onpointerdown = e => { down = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); };
        cv.onpointerup = e => { if (!down)
            return; down = null; const r = cv.getBoundingClientRect(), p = uniso({ x: ((e.clientX - r.left) * 1000 / r.width - origin.x) / scale, y: ((e.clientY - r.top) * 700 / r.height - origin.y) / scale }); put(Math.round(p.x * 2) / 2, Math.round(p.y * 2) / 2); };
        cv.onpointercancel = () => down = null;
    };
    render();
}
export const openInteriorEditor = (repo, refresh, initial) => openTouchInterior(repo, refresh, initial, 'inventory');
export const openInteriorShop = (repo, refresh, initial) => openTouchInterior(repo, refresh, initial, 'shop');
