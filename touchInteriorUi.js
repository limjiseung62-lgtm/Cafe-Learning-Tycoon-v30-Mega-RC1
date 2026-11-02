import { iso, uniso, megaDimensions, megaChairs } from './megaSpace.js?v=furniture-ux-dd837b78b1a8';
import { adoptInterior, interiorCatalog, inventorySku, tableSeatCount } from './megaInventory.js?v=furniture-ux-dd837b78b1a8';
import { buyInterior, saveInteriorLayout } from './megaShop.js?v=furniture-ux-dd837b78b1a8';
import { InteriorHistory, installedIds, interiorCandidate, removeInterior } from './interiorPlacement.js?v=furniture-ux-dd837b78b1a8';
import { paintMegaFloor, paintMegaTable, paintMegaChair } from './megaView.js?v=furniture-ux-dd837b78b1a8';
import { paintMegaDecor, environmentPlacements, paintEnvironment, megaImage } from './megaArt.js?v=furniture-ux-dd837b78b1a8';
import { furnitureFor } from './furnitureCatalog.js?v=furniture-ux-dd837b78b1a8';
import { prepareFurniture, furnitureUnlocked } from './furnitureUnlocks.js?v=furniture-ux-dd837b78b1a8';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=furniture-ux-dd837b78b1a8';
export async function openTouchInterior(repo, refresh, initial, tab = 'inventory') {
    if (!await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' && !initial)
        return;
    const state = adoptInterior(read.status === 'ready' ? read.save : initial);
    if (!state.mega?.inventory || state.campaign?.run && !state.campaign.run.closed)
        return;
    prepareFurniture(state);
    const history = new InteriorHistory(state, repo, read.status === 'ready' ? read.save : state), box = document.createElement('section');
    box.className = 'interior-dialog touch-interior';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '카페 꾸미기');
    document.body.append(box);
    const abort = new AbortController();
    let selected = '', placing = false, continuous = false, rotation = 0, message = '가구 그림을 누르고, 초록 칸이나 원하는 빈 바닥을 눌러요.', confirm = '', zoom = 1, pan = { x: 0, y: 0 }, ghost = null, generation = 0, closed = false, scanTimer = 0;
    let zones = [], paint = () => { };
    const exit = () => { closed = true; generation++; clearTimeout(scanTimer); abort.abort(); box.remove(); refresh(); };
    const inv = () => history.state.mega.inventory;
    const plan = () => history.plan;
    const item = () => inv().items.find(i => i.id === selected);
    const result = (p) => p ? saveInteriorLayout(history.state, p) : { ok: false, reason: '의자는 테이블의 빈 의자 자리에 놓아요.' };
    const choose = (sku) => { const used = installedIds(plan()), all = inv().items.filter(i => i.sku === sku); selected = (all.find(i => !used.has(i.id)) ?? all[0])?.id ?? ''; placing = !!selected && !used.has(selected); continuous = placing; rotation = 0; const d = megaDimensions[plan().level - 1]; ghost = placing ? { x: d[0] / 2, y: d[1] / 2 } : null; message = placing ? '원하는 위치를 누르면 바로 저장돼요.' : '배치한 가구를 눌러 이동·회전·보관해요.'; render(); scan(); };
    const edit = (p) => { if (!p) {
        message = '의자는 테이블의 빈 의자 자리에 놓아요.';
        render();
        return;
    } const r = history.commit(p); message = r.ok ? '배치하고 저장했어요!' : r.message; if (r.ok && placing && continuous) {
        const sku = item()?.sku, used = installedIds(plan()), next = inv().items.find(i => i.sku === sku && !used.has(i.id));
        selected = next?.id ?? selected;
        placing = !!next;
    }
    else if (r.ok) {
        placing = false;
        continuous = false;
    } if (r.ok)
        ghost = null; render(); scan(); };
    const scan = () => { clearTimeout(scanTimer); const version = ++generation; zones = []; if (!placing || !selected) {
        paint();
        return;
    } paint(); scanTimer = window.setTimeout(async () => { const p = plan(), [w, h] = megaDimensions[p.level - 1], center = ghost ?? { x: w / 2, y: h / 2 }; const points = item()?.sku === 'chair' ? p.tables.flatMap(t => megaChairs({ ...t, chairs: undefined }).map(c => c.chair)) : Array.from({ length: 81 }, (_, i) => ({ x: Math.round(center.x) - 4 + i % 9 + .5, y: Math.round(center.y) - 4 + Math.floor(i / 9) + .5 })).filter(q => q.x >= .5 && q.y >= .5 && q.x <= w - .5 && q.y <= h - .5); for (const q of points) {
        if (version !== generation || closed)
            return;
        const candidate = interiorCandidate(history.state, p, selected, q.x, q.y, rotation), r = result(candidate);
        zones.push({ ...q, ok: r.ok });
        paint();
        await new Promise(r => setTimeout(r, 0));
    } }, 0); };
    function render() {
        generation++;
        const p = plan(), used = installedIds(p), [w, h] = megaDimensions[p.level - 1];
        box.innerHTML = `<div class="touch-shell"><header><h2>카페 꾸미기</h2><strong>내 돈 ${history.state.money.toLocaleString()}원</strong><button data-close>완료 · 카페로</button></header><div class="touch-toolbar"><button data-undo ${!history.undo.length ? 'disabled' : ''}>↶ 되돌리기</button><button data-redo ${!history.redo.length ? 'disabled' : ''}>↷ 다시 실행</button><button data-zoom="in">＋ 확대</button><button data-zoom="out">− 축소</button><button data-fit>전체 보기</button><button data-inspect>가구 선택 · 이동</button></div><div class="touch-layout"><div class="touch-world"><canvas width="1000" height="700" tabindex="0" aria-label="카페 가구 배치 지도. 가구 선택 후 위치를 누르세요"></canvas><p role="status">${message}</p><p class="touch-legend">초록: 배치 가능 · 빨강: 불가 · 끌기: 카메라 이동<br>${w}×${h} · 좌석 ${p.tables.reduce((a, t) => a + tableSeatCount(t), 0)} · 선택 ${item() ? inventorySku(item().sku)?.name : '없음'}</p><div class="touch-context" ${!selected || !used.has(selected) ? 'hidden' : ''}><button data-move>선택 가구 이동</button><button data-rotate>90° 회전</button><button data-store>보관하기</button></div></div><aside><nav><button data-tab="inventory" aria-pressed="${tab === 'inventory'}">내 보관함</button><button data-tab="shop" aria-pressed="${tab === 'shop'}">가구 상점</button></nav><p>${tab === 'inventory' ? '가구 그림 → 바닥 터치, 바로 배치!' : '구매한 가구는 보관함에 바로 들어가요.'}</p><div class="touch-cards">${interiorCatalog.map(d => { const owned = inv().items.filter(i => i.sku === d.sku), placed = owned.filter(i => used.has(i.id)).length, allowed = history.state.cafeLevel >= d.level && (d.type !== 'table' || furnitureUnlocked(history.state.longTerm, d.sku)); if (tab === 'inventory' && !owned.length)
            return ''; return `<button class="touch-card" data-sku="${d.sku}" ${tab === 'inventory' ? '' : !allowed || history.state.money < d.cost ? 'disabled' : ''} aria-pressed="${item()?.sku === d.sku}"><canvas width="130" height="110" data-thumb="${d.sku}" aria-hidden="true"></canvas><b>${d.name}</b><span>보유 ${owned.length} · 배치 ${placed} · 보관 ${owned.length - placed}</span>${tab === 'shop' ? `<span>${d.cost.toLocaleString()}원 · ${allowed ? '구매 가능' : 'Lv.' + d.level + ' 해금 필요'}</span>` : ''}</button>`; }).join('')}</div><div class="touch-buy" ${!confirm ? 'hidden' : ''}>${confirm ? inventorySku(confirm).name + ' · ' + inventorySku(confirm).cost.toLocaleString() + '원' : ''}<button data-buy>확인 · 구매</button><button data-buy-cancel>취소</button></div></aside></div></div>`;
        box.querySelector('[data-close]').addEventListener('click', exit);
        box.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; confirm = ''; render(); });
        box.querySelectorAll('[data-sku]').forEach(b => b.onclick = () => { if (tab === 'inventory')
            choose(b.dataset.sku);
        else {
            confirm = b.dataset.sku;
            render();
        } });
        box.querySelector('[data-buy-cancel]').addEventListener('click', () => { confirm = ''; render(); });
        box.querySelector('[data-buy]').addEventListener('click', () => { if (!confirm)
            return; const sku = confirm, r = buyInterior(history.state, sku, inv().next); if (!r.ok) {
            message = r.reason;
            render();
            return;
        } const saved = repo.write(r.save, history.expected); if (saved.ok) {
            history.state = r.save;
            history.expected = r.save;
            tab = 'inventory';
            confirm = '';
            choose(sku);
        }
        else {
            message = saved.message;
            render();
        } });
        const bind = (selector, fn) => box.querySelector(selector).addEventListener('click', fn);
        bind('[data-undo]', () => { message = history.back().message; ghost = null; render(); scan(); });
        bind('[data-redo]', () => { message = history.forward().message; ghost = null; render(); scan(); });
        bind('[data-fit]', () => { zoom = 1; pan = { x: 0, y: 0 }; render(); scan(); });
        box.querySelectorAll('[data-zoom]').forEach(b => b.onclick = () => { zoom = Math.max(1, Math.min(12, zoom * (b.dataset.zoom === 'in' ? 1.4 : 1 / 1.4))); render(); scan(); });
        bind('[data-inspect]', () => { placing = false; zones = []; ghost = null; message = '매장에 놓인 가구를 눌러 선택해요.'; render(); });
        bind('[data-move]', () => { placing = true; continuous = false; ghost = null; message = '새 위치를 누르세요. 손님 자리와 통로는 보호해요.'; render(); scan(); });
        bind('[data-store]', () => edit(removeInterior(plan(), selected)));
        bind('[data-rotate]', () => { if (!selected)
            return; const q = structuredClone(plan()), t = [...q.tables, ...q.decor, ...(q.fixtures ?? [])].find(x => x.id === selected) ?? q.tables.find(t => t.chairs?.some(c => c.id === selected)); if (t) {
            t.rotation = ((t.rotation + 90) % 360);
            edit(q);
        }
        else {
            rotation = (rotation + 90) % 360;
            render();
            scan();
        } });
        const cv = box.querySelector('.touch-world>canvas'), ctx = cv.getContext('2d'), scale = Math.min(920 / ((w + h) * 24 + 60), 590 / ((w + h) * 12 + 90)) * zoom;
        const base = { x: 500 - (w - h) * 12 * scale, y: 70 };
        const origin = () => ({ x: Math.max(80 - w * 24 * scale, Math.min(920 + h * 24 * scale, base.x + pan.x)), y: Math.max(80 - (w + h) * 12 * scale, Math.min(620, base.y + pan.y)) });
        const project = (x, y) => { const r = cv.getBoundingClientRect(), o = origin(); return uniso({ x: ((x - r.left) * 1000 / r.width - o.x) / scale, y: ((y - r.top) * 700 / r.height - o.y) / scale }); };
        const furniture = (q, only) => { for (const t of q.tables) {
            if (only && only !== t.id && !t.chairs?.some(c => c.id === only))
                continue;
            for (const c of megaChairs(t))
                if (!only || only === t.id || t.chairs?.some(v => v.id === only && v.slot === c.slot))
                    paintMegaChair(ctx, t, { ...c.chair, rear: c.rear });
            if (!only || only === t.id)
                paintMegaTable(ctx, t);
        } for (const d of q.decor)
            if (!only || d.id === only)
                paintMegaDecor(ctx, q, d); for (const f of q.fixtures ?? [])
            if (only && f.id === only) {
                const a = iso(f);
                paintEnvironment(ctx, 'prep', a.x, a.y, 72, 12);
            } };
        paint = () => { if (!cv.isConnected)
            return; ctx.clearRect(0, 0, 1000, 700); ctx.save(); const o = origin(); ctx.translate(o.x, o.y); ctx.scale(scale, scale); paintMegaFloor(ctx, plan()); for (const e of environmentPlacements(plan())) {
            const a = iso(e);
            paintEnvironment(ctx, e.id, a.x, a.y, e.width, e.baseRise, e.flip);
        } for (const cell of zones) {
            const a = iso(cell);
            ctx.fillStyle = cell.ok ? '#26884b99' : '#cf443588';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - 6);
            ctx.lineTo(a.x + 12, a.y);
            ctx.lineTo(a.x, a.y + 6);
            ctx.lineTo(a.x - 12, a.y);
            ctx.closePath();
            ctx.fill();
        } furniture(plan()); if (selected) {
            const p = [...plan().tables, ...plan().decor, ...(plan().fixtures ?? [])].find(x => x.id === selected) ?? plan().tables.flatMap(t => megaChairs(t).filter(c => t.chairs?.find(a => a.id === selected && a.slot === c.slot)).map(c => c.chair))[0];
            if (p) {
                const a = iso(p);
                ctx.strokeStyle = '#126a41';
                ctx.lineWidth = 3 / scale;
                ctx.strokeRect(a.x - 24, a.y - 32, 48, 36);
            }
        } if (placing && ghost) {
            const q = interiorCandidate(history.state, plan(), selected, ghost.x, ghost.y, rotation), r = result(q);
            ctx.globalAlpha = .55;
            if (q)
                furniture(q, selected);
            ctx.globalAlpha = 1;
            const a = iso(ghost);
            ctx.strokeStyle = r.ok ? '#12844c' : '#dd3426';
            ctx.lineWidth = 3 / scale;
            ctx.beginPath();
            ctx.ellipse(a.x, a.y, 20, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
        } ctx.restore(); };
        let down = null;
        cv.onpointerdown = e => { if (e.button !== 0 || !e.isPrimary)
            return; down = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, drag: false }; cv.setPointerCapture(e.pointerId); };
        cv.onpointermove = e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) {
            down.drag = true;
            const r = cv.getBoundingClientRect();
            pan = { x: down.panX + (e.clientX - down.x) * 1000 / r.width, y: down.panY + (e.clientY - down.y) * 700 / r.height };
            paint();
        }
        else if (placing) {
            const p = project(e.clientX, e.clientY);
            ghost = { x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 };
            paint();
        } };
        cv.onpointerup = e => { if (!e.isPrimary || !down)
            return; const wasDrag = down.drag; down = null; if (wasDrag) {
            scan();
            return;
        } const p = project(e.clientX, e.clientY); if (placing && selected) {
            const snap = zones.find(z => Math.hypot(z.x - p.x, z.y - p.y) < .4), x = snap?.x ?? Math.round(p.x * 2) / 2, y = snap?.y ?? Math.round(p.y * 2) / 2;
            ghost = { x, y };
            edit(interiorCandidate(history.state, plan(), selected, x, y, rotation));
        }
        else {
            const points = [...plan().tables, ...plan().decor, ...(plan().fixtures ?? []), ...plan().tables.flatMap(t => megaChairs(t).map(c => ({ ...c.chair, id: t.chairs?.find(v => v.slot === c.slot)?.id ?? '' })).filter(c => c.id))], closest = points.map(t => ({ t, d: Math.hypot(t.x - p.x, t.y - p.y) })).sort((a, b) => a.d - b.d)[0];
            if (closest && closest.d < 2) {
                selected = closest.t.id;
                message = '선택했어요. 이동·회전·보관을 선택하세요.';
                render();
            }
        } };
        cv.onpointercancel = () => down = null;
        cv.onwheel = e => { e.preventDefault(); zoom = Math.max(1, Math.min(12, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); render(); scan(); };
        paint();
        paintThumbs();
    }
    function paintThumbs() { box.querySelectorAll('[data-thumb]').forEach(cv => { const sku = cv.dataset.thumb, c = cv.getContext('2d'), d = inventorySku(sku); c.clearRect(0, 0, 130, 110); c.save(); c.translate(65, 78); if (d.type === 'table') {
        const f = furnitureFor(sku.includes('long') || sku.includes('workbench') ? 'long' : sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(sku) ? 'four' : 'two', sku), t = { id: 'thumb', kind: f.kind, furnitureId: sku, x: 0, y: 0, rotation: 0 };
        for (const q of megaChairs(t))
            paintMegaChair(c, t, { ...q.chair, rear: q.rear });
        paintMegaTable(c, t);
    }
    else if (d.type === 'chair')
        paintMegaChair(c, { id: 'thumb', kind: 'two', x: 0, y: 0, rotation: 0 }, { x: 0, y: 0, rear: false });
    else if (d.type === 'fixture')
        paintEnvironment(c, 'prep', 0, 0, 72, 12);
    else {
        const art = megaImage('assets/art/long-growth/' + sku.slice(6) + '.svg');
        if (art)
            c.drawImage(art, -24, -48, 48, 48);
    } c.restore(); }); }
    document.addEventListener('mega-art-ready', () => { paint(); paintThumbs(); }, { signal: abort.signal });
    box.onkeydown = e => { if (e.key === 'Escape')
        exit(); };
    render();
}
