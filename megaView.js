import { megaOperatingGrade } from './megaOperations.js?v=v30-rc1-5973f32a35f5';
import { megaZones } from './megaZones.js?v=v30-rc1-5973f32a35f5';
import { livingWalkAsset } from './megaLivingArt.js?v=v30-rc1-5973f32a35f5';
import { MegaActorMotion } from './megaActorMotion.js?v=v30-rc1-5973f32a35f5';
import { MegaFramePacer } from './megaFramePacer.js?v=v30-rc1-5973f32a35f5';
import { megaEntrances, megaEnabled, megaDimensions, iso, toTile, megaChairs, megaMetrics } from './megaSpace.js?v=v30-rc1-5973f32a35f5';
import { selectCustomerPose, selectedPoseAsset } from './customerPoses.js?v=v30-rc1-5973f32a35f5';
import { workerFrame } from './motionSprites.js?v=v30-rc1-5973f32a35f5';
import { guestMotion, workerMotion } from './characterMotion.js?v=v30-rc1-5973f32a35f5';
import { motionFrame } from './animationPresentation.js?v=v30-rc1-5973f32a35f5';
import { furnitureFor } from './furnitureCatalog.js?v=v30-rc1-5973f32a35f5';
import { megaFurnitureFrames } from './megaFurnitureFrames.js?v=v30-rc1-5973f32a35f5';
import { furnitureFrames } from './furnitureFrames.js?v=v30-rc1-5973f32a35f5';
import { paintMegaDecor, megaImage as image, cachedFragment, paintArtFloor, environmentPlacements, megaArtMetrics, furnitureProjection, environmentSprite } from './megaArt.js?v=v30-rc1-5973f32a35f5';
const baseWorkers = { owner: [22, 76, 228, 429], 'staff-1': [274, 100, 234, 407], 'staff-2': [532, 70, 221, 434], 'staff-3': [782, 79, 241, 430], 'staff-4': [1045, 104, 232, 401], 'staff-5': [1310, 98, 203, 406] };
export const paintMegaFloor = paintArtFloor;
export function paintMegaBox(c, x, y, w, h, z, color) { const a = iso({ x, y }), b = iso({ x: x + w, y }), d = iso({ x, y: y + h }), e = iso({ x: x + w, y: y + h }); for (const [pts, fill] of [[[a, b, { x: b.x, y: b.y - z }, { x: a.x, y: a.y - z }], '#b38c5d'], [[b, e, { x: e.x, y: e.y - z }, { x: b.x, y: b.y - z }], '#8e6e4b'], [[{ x: a.x, y: a.y - z }, { x: b.x, y: b.y - z }, { x: e.x, y: e.y - z }, { x: d.x, y: d.y - z }], color]]) {
    c.beginPath();
    pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    c.strokeStyle = '#7f614247';
    c.lineWidth = .6;
    c.stroke();
} }
function preparedFurniture(t, chair) { const f = furnitureFor(t.kind, t.furnitureId), img = f && image(f.atlas); if (!f || !img)
    return null; const theme = f.atlas.match(/theme-furniture\/(garden|bakery|dessert)/)?.[1], sheet = theme ? furnitureFrames[theme] : megaFurnitureFrames, row = chair ? f.chairRow : f.row, column = chair ? (chair.rear ? 0 : 2) : (t.rotation % 180 === 0 ? 0 : 2), source = sheet?.frames[row]?.[column], size = img.naturalWidth / 4; const crop = source ? { x: source.x * img.naturalWidth / sheet.width, y: source.y * img.naturalHeight / sheet.height, w: source.w * img.naturalWidth / sheet.width, h: source.h * img.naturalHeight / sheet.height } : { x: column * size, y: row * size, w: size, h: size }; const point = iso(chair ?? t), projection = furnitureProjection(t.kind, !!chair), width = projection.width, height = width * crop.h / crop.w; const tile = cachedFragment(img, [crop.x, crop.y, crop.w, crop.h], width, height); return (c) => c.drawImage(tile, point.x - width / 2, point.y - height + projection.baseRise, width, height); }
function furniture(c, t, chair) { const draw = preparedFurniture(t, chair); if (!draw)
    return false; draw(c); return true; }
export function paintMegaChair(c, t, ch) { if (!furniture(c, t, ch))
    paintMegaBox(c, ch.x - .22, ch.y - .22, .44, .44, 5, t.furnitureId?.includes('sofa') ? '#b2a2c1' : '#8da47d'); }
export function paintMegaTable(c, t) { if (furniture(c, t))
    return; const horizontal = t.rotation % 180 === 0, w = t.kind === 'long' ? 2.3 : t.kind === 'four' ? 1.7 : 1, W = horizontal ? w : .65, H = horizontal ? .65 : w; paintMegaBox(c, t.x - W / 2, t.y - H / 2, W, H, 22, t.furnitureId?.includes('marble') ? '#f0e9df' : t.furnitureId?.includes('sofa') ? '#c0accb' : '#d9ad72'); const a = iso(t); c.fillStyle = '#f9edd8'; c.beginPath(); c.ellipse(a.x, a.y - 13, 4, 2, 0, 0, Math.PI * 2); c.fill(); }
export class MegaView {
    actors = new MegaActorMotion();
    pacer = new MegaFramePacer();
    host = null;
    canvas = null;
    room = null;
    game = null;
    scene = null;
    physicalLevel = 0;
    level = 0;
    zoom = 1;
    target = 1;
    fitScale = 1;
    center = { x: 0, y: 0 };
    width = 1;
    height = 1;
    drag = null;
    floor = null;
    floorKey = '';
    last = 0;
    intervals = [];
    lastStats = 0;
    debug = false;
    reviewScale = null;
    observer = null;
    staticKey = '';
    staticObjects = [];
    cpu = [];
    onArt = () => { this.floorKey = ''; this.staticKey = ''; };
    onVisibility = () => { this.last = 0; this.pacer.reset(); };
    setReviewScale(scale) { this.reviewScale = scale; if (scale !== null) {
        this.zoom = scale;
        this.target = scale;
    }
    else
        this.fit(); this.paint(); }
    active(g) { return megaEnabled(g); }
    sync(room, g, s) {
        if (!this.active(g)) {
            this.detach();
            return false;
        }
        if (this.game !== g)
            this.actors.clear();
        this.game = g;
        this.scene = s;
        room.dataset.mega = 'true';
        room.classList.add('mega-room');
        if (this.room !== room || !this.host?.isConnected) {
            this.detach();
            this.room = room;
            room.dataset.mega = 'true';
            room.classList.add('mega-room');
            const host = document.createElement('div');
            host.className = 'mega-host';
            host.innerHTML = '<div class="mega-toolbar"><button data-camera="out" aria-label="카페 축소">−</button><button data-camera="in" aria-label="카페 확대">＋</button><button data-camera="fit">전체 보기</button><button data-camera="work">운영 보기</button><button data-camera="paths">동선 보기</button><select aria-label="운영 구역 보기" data-zone style="min-height:44px;font:inherit"><option value="">전체 구역</option></select><span class="mega-size"></span></div><canvas tabindex="0" aria-label="실제 운영 중인 2.5D 카페. 화살표로 카메라 이동, 더하기 빼기로 확대 축소"></canvas><p class="mega-notice" role="status"></p><div class="mega-orders"></div><details class="mega-diagnostics"><summary>공간·성능 검수</summary><output></output></details>';
            room.append(host);
            this.host = host;
            document.addEventListener('mega-art-ready', this.onArt);
            document.addEventListener('visibilitychange', this.onVisibility);
            this.canvas = host.querySelector('canvas');
            host.querySelectorAll('[data-camera]').forEach(b => b.onclick = () => { const id = b.dataset.camera; if (id === 'fit')
                this.fit();
            else if (id === 'work') {
                this.target = Math.max(this.fitScale * 1.8, 1);
                this.clamp();
            }
            else if (id === 'paths')
                this.debug = !this.debug;
            else
                this.target = Math.max(this.fitScale, Math.min(4, this.target * (id === 'in' ? 1.25 : .8))); this.paint(); });
            const zoneSelect = host.querySelector('[data-zone]');
            zoneSelect.onchange = () => { const p = this.scene?.space.megaPlan, z = p && megaZones(p).find(z => z.id === zoneSelect.value); if (z) {
                this.center = iso({ x: z.x + z.w / 2, y: z.y + z.h / 2 });
                this.target = Math.max(this.fitScale, Math.min(2, this.width / ((z.w + z.h) * 24 + 100), this.height / ((z.w + z.h) * 12 + 100)));
                this.clamp();
            }
            else
                this.fit(); this.paint(); };
            const cv = this.canvas;
            cv.onwheel = e => { e.preventDefault(); this.target = Math.max(this.fitScale, Math.min(4, this.target * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); this.paint(); };
            cv.onpointerdown = e => { this.drag = { x: e.clientX, y: e.clientY, center: { ...this.center } }; cv.setPointerCapture(e.pointerId); };
            cv.onpointermove = e => { if (!this.drag)
                return; this.center = { x: this.drag.center.x - (e.clientX - this.drag.x) / this.zoom, y: this.drag.center.y - (e.clientY - this.drag.y) / this.zoom }; this.clamp(); this.paint(); };
            cv.onpointerup = () => this.drag = null;
            cv.onpointercancel = () => this.drag = null;
            cv.onkeydown = e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', 'Home'].includes(e.key))
                e.preventDefault(); if (e.key === 'Home')
                this.fit(); if (e.key === '+' || e.key === '-')
                this.target = Math.max(this.fitScale, Math.min(4, this.target * (e.key === '+' ? 1.2 : 1 / 1.2))); if (e.key === 'ArrowLeft')
                this.center.x -= 40 / this.zoom; if (e.key === 'ArrowRight')
                this.center.x += 40 / this.zoom; if (e.key === 'ArrowUp')
                this.center.y -= 40 / this.zoom; if (e.key === 'ArrowDown')
                this.center.y += 40 / this.zoom; this.clamp(); this.paint(); };
            this.observer = new ResizeObserver(() => { if (this.canvas === cv) {
                this.resize();
                this.paint();
            } });
            this.observer.observe(cv);
            this.level = 0;
        }
        this.resize();
        if (this.level !== g.cafeLevel || this.physicalLevel !== s.space.megaPlan?.level) {
            const physicalChanged = this.physicalLevel !== s.space.megaPlan?.level;
            this.physicalLevel = s.space.megaPlan?.level ?? 0;
            const previous = this.level;
            this.level = g.cafeLevel;
            if (physicalChanged || !previous) {
                this.fit();
                this.host.querySelector('[data-zone]').innerHTML = '<option value="">전체 구역</option>' + megaZones(s.space.megaPlan).map(z => '<option value="' + z.id + '">' + z.name + '</option>').join('');
            }
            this.host.querySelector('.mega-notice').textContent = previous ? (physicalChanged ? '새 바닥·주방·통로가 열렸어요! 기존 가구 위치는 그대로예요.' : '카페 레벨이 올랐어요! 매장 면적은 유지돼요. 영업 후 증축 메뉴에서 넓힐 수 있어요.') : '정답으로 음식을 만들고 손님을 서빙해요. 확대·드래그로 카페를 살펴보세요.';
            if (!previous || matchMedia('(prefers-reduced-motion: reduce)').matches)
                this.zoom = this.target;
            this.paint();
        }
        return true;
    }
    resize() { if (!this.canvas)
        return; const r = this.canvas.getBoundingClientRect(); this.width = Math.max(1, r.width); this.height = Math.max(1, r.height); const dpr = Math.min(1.5, devicePixelRatio || 1); if (this.canvas.width !== Math.round(r.width * dpr) || this.canvas.height !== Math.round(r.height * dpr)) {
        this.canvas.width = Math.round(r.width * dpr);
        this.canvas.height = Math.round(r.height * dpr);
        const old = this.fitScale;
        this.calculateFit();
        if (this.target <= old * 1.05)
            this.fit();
    } }
    calculateFit() { if (!this.game)
        return; const [w, h] = megaDimensions[(this.scene?.space.megaPlan?.level ?? this.game.cafeLevel) - 1]; this.fitScale = Math.min(this.width / ((w + h) * 24 + 64), this.height / ((w + h) * 12 + 145)); }
    fit() { if (!this.game)
        return; this.calculateFit(); const [w, h] = megaDimensions[(this.scene?.space.megaPlan?.level ?? this.game.cafeLevel) - 1]; this.center = { x: (w - h) * 12, y: (w + h) * 6 - 25 }; this.target = this.fitScale; }
    clamp() { if (!this.game)
        return; const [w, h] = megaDimensions[(this.scene?.space.megaPlan?.level ?? this.game.cafeLevel) - 1], minX = -h * 24 - 20, maxX = w * 24 + 20, minY = -105, maxY = (w + h) * 12 + 20; const axis = (v, min, max, half) => max - min <= half * 2 ? (min + max) / 2 : Math.max(min + half, Math.min(max - half, v)); this.center.x = axis(this.center.x, minX, maxX, this.width / 2 / this.target); this.center.y = axis(this.center.y, minY, maxY, this.height / 2 / this.target); }
    paint() {
        const g = this.game, s = this.scene, c = this.canvas?.getContext('2d');
        if (!g || !s?.space.megaPlan || !c || !this.canvas)
            return;
        if (document.hidden) {
            this.last = 0;
            this.pacer.reset();
            return;
        }
        if (!this.pacer.accept(performance.now()))
            return;
        const p = s.space.megaPlan;
        const reduce = document.body.classList.contains('motion-low') || matchMedia('(prefers-reduced-motion: reduce)').matches;
        const now = performance.now();
        if (this.last && now > this.last)
            this.intervals.push(now - this.last);
        this.last = now;
        if (this.intervals.length > 6000)
            this.intervals.shift();
        if (this.reviewScale !== null)
            this.target = this.zoom = this.reviewScale;
        this.zoom += (this.target - this.zoom) * .18;
        if (Math.abs(this.zoom - this.target) < .001)
            this.zoom = this.target;
        this.clamp();
        const dpr = this.canvas.width / this.width;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.fillStyle = '#f6efdc';
        c.fillRect(0, 0, this.width, this.height);
        c.translate(this.width / 2, this.height / 2);
        c.scale(this.zoom, this.zoom);
        c.translate(-this.center.x, -this.center.y);
        const floorKey = JSON.stringify(p);
        const [w, h] = megaDimensions[p.level - 1], floorW = (w + h) * 24 + 100, floorH = (w + h) * 12 + 155;
        if (floorKey !== this.floorKey) {
            this.floor = document.createElement('canvas');
            const cacheScale = Math.min(2, 2048 / floorW);
            this.floor.width = Math.ceil(floorW * cacheScale);
            this.floor.height = Math.ceil(floorH * cacheScale);
            const fc = this.floor.getContext('2d');
            fc.scale(cacheScale, cacheScale);
            fc.translate(h * 24 + 50, 105);
            paintMegaFloor(fc, p);
            this.floorKey = floorKey;
        }
        c.drawImage(this.floor, -h * 24 - 50, -105, floorW, floorH);
        if (this.debug) {
            c.strokeStyle = '#267b60';
            c.lineWidth = 1.2;
            for (const seat of s.space.seats) {
                c.beginPath();
                seat.entryPath.forEach((v, i) => { const q = iso(toTile(v)); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); });
                c.stroke();
            }
        }
        const stamp = floorKey;
        if (stamp !== this.staticKey) {
            this.staticKey = stamp;
            this.staticObjects = [];
            for (const env of environmentPlacements(p)) {
                const q = iso(env), sprite = environmentSprite(env.id, env.width);
                if (sprite)
                    this.staticObjects.push({ depth: env.depth, draw: ctx => { if (env.flip) {
                            ctx.save();
                            ctx.translate(q.x, q.y);
                            ctx.scale(-1, 1);
                            ctx.drawImage(sprite.tile, -sprite.width / 2, -sprite.height + env.baseRise, sprite.width, sprite.height);
                            ctx.restore();
                        }
                        else
                            ctx.drawImage(sprite.tile, q.x - sprite.width / 2, q.y - sprite.height + env.baseRise, sprite.width, sprite.height); } });
            }
            for (const t of p.tables) {
                for (const ch of megaChairs(t))
                    this.staticObjects.push({ depth: ch.chair.x + ch.chair.y, draw: preparedFurniture(t, { ...ch.chair, rear: ch.rear }) ?? (ctx => paintMegaChair(ctx, t, { ...ch.chair, rear: ch.rear })) });
                this.staticObjects.push({ depth: t.x + t.y, draw: preparedFurniture(t) ?? (ctx => paintMegaTable(ctx, t)) });
            }
            for (const d of p.decor)
                this.staticObjects.push({ depth: d.x + d.y, draw: ctx => paintMegaDecor(ctx, p, d) });
            const portal = environmentSprite('entrance', 65);
            if (portal)
                for (const [index, port] of megaEntrances(p).entries()) {
                    const point = toTile(port.inside), door = iso(index === 0 ? (p.entry ? { x: 0, y: p.entry.y } : { x: w - .1, y: h - .5 }) : index === 1 ? { x: w, y: h / 2 } : { x: w / 2, y: h });
                    this.staticObjects.push({ depth: index === 0 ? (p.entry ? p.entry.x + p.entry.y + .2 : w + h + .2) : point.x + point.y + .2, draw: ctx => ctx.drawImage(portal.tile, door.x - 32.5, door.y - portal.height + 8, 65, portal.height) });
                }
        }
        const objects = this.staticObjects.map(o => ({ depth: o.depth, draw: () => o.draw(c) }));
        const visible = (q) => { const x = (q.x - this.center.x) * this.zoom + this.width / 2, y = (q.y - this.center.y) * this.zoom + this.height / 2; return x > -80 && x < this.width + 80 && y > -80 && y < this.height + 80; };
        for (const guest of g.guests) {
            const pose = s.guest(guest), walk = this.actors.sample('g' + guest.id, pose, g.elapsedTime), facing = pose.seated ? pose.facing : walk.facing, tile = toTile(pose), q = iso(tile, pose.seated ? 7 : 0);
            if (!visible(q))
                continue;
            objects.push({ depth: tile.x + tile.y, draw: () => { this.shadow(c, iso(tile), pose.seated ? .65 : 1); const motion = guestMotion(guest, g.events); try {
                    const selected = selectCustomerPose(guest.definition.visualKey, pose.action, facing, motion, pose.seated ? motionFrame(guest.elapsed, guest.id, reduce) : Math.floor(walk.phase) % 2);
                    const living = !pose.seated ? livingWalkAsset(guest.definition.visualKey, walk) : null;
                    this.sprite(c, living || selectedPoseAsset(selected), q, facing, pose.seated ? 32 : living ? 37 : 34, pose.opacity);
                }
                catch {
                    this.fallback(c, q, '#c79b7d');
                } if ((guest.state === 'ORDERING' || guest.state === 'EATING' || guest.state === 'PAYING') && guest.elapsed < 1.8)
                    this.bubble(c, q, guest.state === 'ORDERING' ? '주문할게요' : guest.state === 'EATING' ? '잘 먹을게요' : '고마워요'); if (guest.state === 'EATING') {
                    const t = p.tables.find(t => t.id === s.space.seats[guest.seat].tableId);
                    const m = iso(t, 24), food = image('assets/art/hospitality/signature.svg');
                    if (food)
                        c.drawImage(food, m.x - 5, m.y - 6, 10, 10);
                    else {
                        c.fillStyle = '#fff1df';
                        c.beginPath();
                        c.ellipse(m.x, m.y, 5, 3, 0, 0, Math.PI * 2);
                        c.fill();
                    }
                } } });
        }
        for (const worker of g.service.workers) {
            const pose = s.worker(worker, g), walk = this.actors.sample('w' + worker.staffId, pose, g.elapsedTime), assigned = g.guests.find(v => v.id === worker.orderId), seat = assigned ? s.space.seats[assigned.seat] : undefined, facing = worker.state === 'SERVING' && seat ? (iso(toTile(seat)).x < iso(toTile(pose)).x ? 'left' : 'right') : walk.facing, tile = toTile(pose), q = iso(tile, pose.seated ? 7 : 0);
            if (!visible(q))
                continue;
            objects.push({ depth: tile.x + tile.y, draw: () => { this.shadow(c, iso(tile), 1); const frame = ((['MOVING_TO_PICKUP', 'MOVING_TO_TABLE', 'RETURNING'].includes(worker.state) || walk.moving) ? livingWalkAsset(worker.staffId, walk) : null) ?? workerFrame(worker.staffId, workerMotion(worker), facing); if (frame)
                    this.sprite(c, frame, q, facing, frame.file.includes('mega-v30c') ? 37 : 35, 1);
                else {
                    const box = baseWorkers[worker.staffId] ?? baseWorkers['staff-1'];
                    this.sprite(c, { file: 'assets/art/characters.png', width: 1536, height: 1024, box, nativeFacing: 'right' }, q, pose.facing, 35, 1);
                } if (worker.state === 'SERVING')
                    this.bubble(c, q, '맛있게 드세요'); if (worker.cargo.length) {
                    c.fillStyle = '#ebc286';
                    c.fillRect(q.x + (facing === 'left' ? -15 : 4), q.y - 12, 11, 3);
                    c.fillStyle = '#f9f3dd';
                    c.fillRect(q.x + (facing === 'left' ? -11 : 6), q.y - 16, 5, 4);
                } } });
        }
        this.actors.retain(new Set([...g.guests.map(x => 'g' + x.id), ...g.service.workers.map(x => 'w' + x.staffId)]));
        for (const o of objects.sort((a, b) => a.depth - b.depth))
            o.draw();
        this.cpu.push(performance.now() - now);
        if (this.cpu.length > 6000)
            this.cpu.shift();
        if (now - this.lastStats > 900) {
            this.lastStats = now;
            const grade = megaOperatingGrade(p);
            this.host.querySelector('.mega-size').textContent = `카페 Lv.${g.cafeLevel} · ${w}×${h} · ${w * h}칸 · 좌석 ${s.space.seats.length}(동시 ${g.cafe.maxCustomers})${p.level >= 20 ? ' · 가동 구역' + grade.ready.length + '/' + grade.all + ' · 해당 구역 운영가 +' + Math.round((grade.factor - 1) * 100) + '%' : ''}`;
            const sorted = [...this.intervals].sort((a, b) => a - b), avg = this.intervals.reduce((a, b) => a + b, 0) / Math.max(1, this.intervals.length), p95 = sorted[Math.floor(sorted.length * .95)] ?? 0, p99 = sorted[Math.floor(sorted.length * .99)] ?? 0;
            this.host.querySelector('output').textContent = `평균 ${avg ? (1000 / avg).toFixed(1) : '측정 중'} FPS · p99 환산 ${p99 ? (1000 / p99).toFixed(1) : '-'} · p95 ${p95.toFixed(1)}ms · draw p95 ${([...this.cpu].sort((a, b) => a - b)[Math.floor(this.cpu.length * .95)] ?? 0).toFixed(2)}ms · sprite cache ${megaArtMetrics.fragmentBuilds}/${megaArtMetrics.fragmentHits} · 경로 탐색 ${megaMetrics.searches} / 실패 ${megaMetrics.failures} / 캐시 ${megaMetrics.cacheHits} · 실제 손님 ${g.guests.length} / 직원 ${g.service.paid.length} · 매출 ${g.stats.revenue.toLocaleString()}원 · JS heap ${(performance.memory?.usedJSHeapSize ?? 0) / 1048576 ? ((performance.memory?.usedJSHeapSize ?? 0) / 1048576).toFixed(1) + 'MiB' : '지원 안 함'} · 초기 전송 ${(performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) / 1048576).toFixed(2)}MiB`;
            const list = this.host.querySelector('.mega-orders');
            list.innerHTML = g.guests.filter(x => !['ENTERING', 'MOVING_TO_SEAT', 'LEAVING'].includes(x.state)).map(x => `<button data-mega-guest="${x.id}">손님 ${x.id} · ${x.state === 'EATING' ? '식사 중' : (x.order.length ? x.order.map(o => (g.menus.find(m => m.menuId === o.menuId)?.name ?? '특별 메뉴') + '×' + o.quantity).join(' · ') : '주문을 고르는 중')}</button>`).join('');
            list.querySelectorAll('[data-mega-guest]').forEach(b => b.onclick = () => document.dispatchEvent(new CustomEvent('mega-guest', { detail: Number(b.dataset.megaGuest) })));
        }
    }
    bubble(c, p, text) { c.save(); c.font = '7px system-ui'; const w = c.measureText(text).width + 8; c.fillStyle = '#fff9eb'; c.strokeStyle = '#ad9470'; c.lineWidth = .5; c.fillRect(p.x - w / 2, p.y - 51, w, 11); c.strokeRect(p.x - w / 2, p.y - 51, w, 11); c.fillStyle = '#584730'; c.textAlign = 'center'; c.fillText(text, p.x, p.y - 43); c.restore(); }
    shadow(c, p, size) { c.save(); c.fillStyle = '#4a3b2830'; c.beginPath(); c.ellipse(p.x, p.y, 6 * size, 2.4 * size, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    sprite(c, a, q, facing, height, alpha) { const img = image(a.file); if (!img) {
        this.fallback(c, q, '#8a9d78');
        return;
    } const [x, y, w, h] = a.box, W = height * w / h; c.save(); c.globalAlpha = alpha; c.translate(q.x, q.y); if (a.nativeFacing && a.nativeFacing !== facing)
        c.scale(-1, 1); const sx = img.naturalWidth / a.width, sy = img.naturalHeight / a.height; const tile = cachedFragment(img, [x * sx, y * sy, w * sx, h * sy], W, height); c.drawImage(tile, -W * ((a.anchorX ?? (x + w / 2)) - x) / w, -height * ((a.anchorY ?? (y + h - 2)) - y) / h, W, height); c.restore(); }
    fallback(c, p, color) { c.fillStyle = color; c.fillRect(p.x - 4, p.y - 17, 8, 15); c.fillStyle = '#e8c5a0'; c.beginPath(); c.arc(p.x, p.y - 20, 5, 0, Math.PI * 2); c.fill(); }
    detach() { this.actors.clear(); this.pacer.reset(); document.removeEventListener('mega-art-ready', this.onArt); document.removeEventListener('visibilitychange', this.onVisibility); this.staticKey = ''; this.staticObjects = []; this.observer?.disconnect(); this.observer = null; if (this.room) {
        delete this.room.dataset.mega;
        this.room.classList.remove('mega-room');
    } this.host?.remove(); this.host = null; this.canvas = null; this.room = null; this.level = 0; this.floorKey = ''; }
}
export const megaView = new MegaView();
