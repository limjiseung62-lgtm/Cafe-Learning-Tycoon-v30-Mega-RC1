import { studioSeatedLift } from './renewalFurnitureGeometry.js?v=v31-final-636a93f6f215';
import { paintStudioFurniture } from './megaArt.js?v=v31-final-636a93f6f215';
import { paintRenewalFinishes } from './renewalFacilityArt.js?v=v31-final-636a93f6f215';
import { appearanceFor, architectureSprite } from './renewalArchitectureArt.js?v=v31-final-636a93f6f215';
import { renderPhase, renderPhaseStart, renderPhaseEnd } from './renderPhaseTiming.js?v=v31-final-636a93f6f215';
import { seatedDirection, eatingPose, paintEatingMotion } from './megaSeatedMotion.js?v=v31-final-636a93f6f215';
import { finalRuntimeDiagnostics } from './finalRuntimeDiagnostics.js?v=v31-final-636a93f6f215';
import { finalActorFrame } from './finalActorArt.js?v=v31-final-636a93f6f215';
import { finalActorCache, finalActorFrameCache, finalActorBitmap } from './finalActorCache.js?v=v31-final-636a93f6f215';
import { finalSpecializationFor } from './finalSpecialization.js?v=v31-final-636a93f6f215';
import { signatureImage } from './finalSpecializationState.js?v=v31-final-636a93f6f215';
import { managerActor, managerSprite } from './managerActor.js?v=v31-final-636a93f6f215';
import { managerById } from './managerState.js?v=v31-final-636a93f6f215';
import { megaOperatingGrade } from './megaOperations.js?v=v31-final-636a93f6f215';
import { megaZones } from './megaZones.js?v=v31-final-636a93f6f215';
import { livingWalkAsset } from './megaLivingArt.js?v=v31-final-636a93f6f215';
import { MegaActorMotion } from './megaActorMotion.js?v=v31-final-636a93f6f215';
import { MegaFramePacer } from './megaFramePacer.js?v=v31-final-636a93f6f215';
import { megaEntrances, megaEnabled, megaDimensions, iso, toTile, megaChairs, megaMetrics } from './megaSpace.js?v=v31-final-636a93f6f215';
import { selectCustomerPose, selectedPoseAsset } from './customerPoses.js?v=v31-final-636a93f6f215';
import { workerFrame } from './motionSprites.js?v=v31-final-636a93f6f215';
import { guestMotion, workerMotion } from './characterMotion.js?v=v31-final-636a93f6f215';
import { motionFrame } from './animationPresentation.js?v=v31-final-636a93f6f215';
import { furnitureFor } from './furnitureCatalog.js?v=v31-final-636a93f6f215';
import { megaFurnitureFrames } from './megaFurnitureFrames.js?v=v31-final-636a93f6f215';
import { furnitureFrames } from './furnitureFrames.js?v=v31-final-636a93f6f215';
import { paintMegaDecor, megaImage as image, cachedFragment, paintArtFloor, paintArtWalls, environmentPlacements, megaArtMetrics, furnitureProjection, environmentSprite, bitmapFragment, clearArtBitmaps, artBitmapCache } from './megaArt.js?v=v31-final-636a93f6f215';
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
function preparedFurniture(t, chair, asynchronous = false) { const f = furnitureFor(t.kind, t.furnitureId); if (f?.studio)
    return chair ? () => { } : (c) => { const p = iso(t); paintStudioFurniture(c, f.id, p.x, p.y, t.rotation, asynchronous); }; const img = f && image(f.atlas); if (!f || !img)
    return null; const theme = f.atlas.match(/theme-furniture\/(garden|bakery|dessert)/)?.[1], sheet = theme ? furnitureFrames[theme] : megaFurnitureFrames, row = chair ? f.chairRow : f.row, column = chair ? (chair.rear ? 0 : 2) : (t.rotation % 180 === 0 ? 0 : 2), source = sheet?.frames[row]?.[column], size = img.naturalWidth / 4; const crop = source ? { x: source.x * img.naturalWidth / sheet.width, y: source.y * img.naturalHeight / sheet.height, w: source.w * img.naturalWidth / sheet.width, h: source.h * img.naturalHeight / sheet.height } : { x: column * size, y: row * size, w: size, h: size }; const point = iso(chair ?? t), projection = furnitureProjection(t.kind, !!chair), width = projection.width, height = width * crop.h / crop.w; const tile = asynchronous ? bitmapFragment(img, [crop.x, crop.y, crop.w, crop.h], width, height) : cachedFragment(img, [crop.x, crop.y, crop.w, crop.h], width, height); if (!tile)
    return null; return (c) => c.drawImage(tile, point.x - width / 2, point.y - height + projection.baseRise, width, height); }
function furniture(c, t, chair, asynchronous = false) { const draw = preparedFurniture(t, chair, asynchronous); if (!draw)
    return false; draw(c); return true; }
export function paintMegaChair(c, t, ch, asynchronous = false) { if (!furniture(c, t, ch, asynchronous))
    paintMegaBox(c, ch.x - .22, ch.y - .22, .44, .44, 5, t.furnitureId?.includes('sofa') ? '#b2a2c1' : '#8da47d'); }
export function paintMegaTable(c, t, asynchronous = false) { if (furniture(c, t, undefined, asynchronous))
    return; const horizontal = t.rotation % 180 === 0, w = t.kind === 'long' ? 2.3 : t.kind === 'four' ? 1.7 : 1, W = horizontal ? w : .65, H = horizontal ? .65 : w; paintMegaBox(c, t.x - W / 2, t.y - H / 2, W, H, 22, t.furnitureId?.includes('marble') ? '#f0e9df' : t.furnitureId?.includes('sofa') ? '#c0accb' : '#d9ad72'); const a = iso(t); c.fillStyle = '#f9edd8'; c.beginPath(); c.ellipse(a.x, a.y - 13, 4, 2, 0, 0, Math.PI * 2); c.fill(); }
export class MegaView {
    /** Optional constant-space QA observer, called only for real canvas paints. */
    paintObserver;
    onManagerFocus = () => { const g = this.game, a = g && managerActor(g); if (!a)
        return; this.center = iso(toTile(a.position)); this.target = Math.max(this.fitScale, 1.25); this.clamp(); this.paint(); };
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
    walls = null;
    wallKey = '';
    wallEpoch = 0;
    last = 0;
    intervals = [];
    lastStats = 0;
    debug = false;
    reviewScale = null;
    observer = null;
    staticKey = '';
    staticObjects = [];
    cpu = [];
    onArt = (event) => { const file = event.detail?.file; if (!file)
        this.floorKey = ''; if (!file || file.includes('mega-v30b/environment') || file.includes('renewal-v31')) {
        this.wallEpoch++;
        if (file?.includes('renewal-v31'))
            this.floorKey = '';
    } ; this.staticKey = ''; };
    onVisibility = () => { this.last = 0; this.pacer.reset(); };
    get retainedResources() { return { game: !!this.game, scene: !!this.scene, canvasPixels: this.canvas ? this.canvas.width * this.canvas.height : 0, floorPixels: this.floor ? this.floor.width * this.floor.height : 0, staticObjects: this.staticObjects.length, intervals: this.intervals.length, cpuSamples: this.cpu.length }; }
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
            this.game = g;
            this.scene = s;
            this.room = room;
            room.dataset.mega = 'true';
            room.classList.add('mega-room');
            const host = document.createElement('div');
            host.className = 'mega-host';
            host.innerHTML = '<div class="mega-toolbar"><button data-camera="out" aria-label="카페 축소">−</button><button data-camera="in" aria-label="카페 확대">＋</button><button data-camera="fit">전체 보기</button><button data-camera="work">운영 보기</button><button data-camera="paths">동선 보기</button><select aria-label="운영 구역 보기" data-zone style="min-height:44px;font:inherit"><option value="">전체 구역</option></select><span class="mega-size"></span></div><canvas tabindex="0" aria-label="실제 운영 중인 2.5D 카페. 화살표로 카메라 이동, 더하기 빼기로 확대 축소"></canvas><p class="mega-notice" role="status"></p><div class="mega-orders"></div><details class="mega-diagnostics"><summary>공간·성능 검수</summary><output></output></details>';
            room.append(host);
            this.host = host;
            document.addEventListener('mega-art-ready', this.onArt);
            document.addEventListener('cafe-manager-focus', this.onManagerFocus);
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
    paint(frameTime = performance.now()) {
        const g = this.game, s = this.scene, c = this.canvas?.getContext('2d');
        if (!g || !s?.space.megaPlan || !c || !this.canvas)
            return;
        if (document.hidden) {
            this.last = 0;
            this.pacer.reset();
            return;
        }
        if (!this.pacer.accept(frameTime))
            return;
        const p = s.space.megaPlan;
        const reduce = document.body.classList.contains('motion-low') || matchMedia('(prefers-reduced-motion: reduce)').matches;
        const now = performance.now();
        if (this.last && now > this.last) {
            this.intervals.push(now - this.last);
            this.paintObserver?.(now - this.last);
        }
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
        const appearance = appearanceFor(g), floorKey = JSON.stringify([p, appearance?.selected, g.mega?.finalGrowth?.renewal?.facilities]);
        const [w, h] = megaDimensions[p.level - 1], floorW = (w + h) * 24 + 100, floorH = (w + h) * 12 + 155;
        if (floorKey !== this.floorKey) {
            this.floor = document.createElement('canvas');
            const cacheScale = Math.min(2, 2048 / floorW);
            this.floor.width = Math.ceil(floorW * cacheScale);
            this.floor.height = Math.ceil(floorH * cacheScale);
            const fc = this.floor.getContext('2d');
            fc.scale(cacheScale, cacheScale);
            fc.translate(h * 24 + 50, 105);
            const floorStart = performance.now();
            renderPhase('floor-raster', () => { paintMegaFloor(fc, p, true, false, appearance); paintRenewalFinishes(fc, p, g.mega?.finalGrowth?.renewal?.facilities); });
            megaArtMetrics.floorMaxMs = Math.max(megaArtMetrics.floorMaxMs, performance.now() - floorStart);
            this.floorKey = floorKey;
        }
        renderPhase('floor-blit', () => c.drawImage(this.floor, -h * 24 - 50, -105, floorW, floorH));
        const wallKey = floorKey + '/' + this.wallEpoch;
        if (wallKey !== this.wallKey) {
            this.walls ??= document.createElement('canvas');
            const cacheScale = Math.min(2, 2048 / floorW);
            this.walls.width = Math.ceil(floorW * cacheScale);
            this.walls.height = Math.ceil(floorH * cacheScale);
            const wc = this.walls.getContext('2d');
            wc.scale(cacheScale, cacheScale);
            wc.translate(h * 24 + 50, 105);
            renderPhase('wall-raster', () => paintArtWalls(wc, p, true, appearance));
            this.wallKey = wallKey;
        }
        renderPhase('wall-blit', () => c.drawImage(this.walls, -h * 24 - 50, -105, floorW, floorH));
        if (this.debug) {
            c.strokeStyle = '#267b60';
            c.lineWidth = 1.2;
            for (const seat of s.space.seats) {
                c.beginPath();
                seat.entryPath.forEach((v, i) => { const q = iso(toTile(v)); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); });
                c.stroke();
            }
        }
        const specialization = finalSpecializationFor(g), stamp = floorKey + '/' + (specialization?.path ?? 'none') + '/' + (specialization?.renewal?.stage ?? 0) + '/' + artBitmapCache.metrics.closed;
        if (stamp !== this.staticKey) {
            const staticStart = performance.now(), staticTiming = renderPhaseStart();
            this.staticKey = stamp;
            this.staticObjects = [];
            for (const baseEnv of environmentPlacements(p)) {
                const env = { ...baseEnv };
                if (env.fixed && specialization?.path === 'mass' && ['prep', 'shelf'].includes(env.id)) {
                    const stage = specialization.renewal?.stage ?? 4;
                    env.id = (Math.floor(env.x + env.y) % 4 < stage) ? 'oven' : 'prep';
                }
                if (env.fixed && specialization?.path === 'brand' && ['prep', 'shelf', 'coffee'].includes(env.id)) {
                    const stage = specialization.renewal?.stage ?? 4;
                    env.id = env.id === 'coffee' ? 'coffee-sage' : Math.floor(env.x + env.y) % 4 < stage ? 'pastry' : 'shelf';
                }
                const q = iso(env), sprite = environmentSprite(env.id, env.width, true);
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
                    this.staticObjects.push({ depth: ch.chair.x + ch.chair.y, draw: preparedFurniture(t, { ...ch.chair, rear: ch.rear }, true) ?? (ctx => paintMegaChair(ctx, t, { ...ch.chair, rear: ch.rear }, true)) });
                this.staticObjects.push({ depth: t.x + t.y, draw: preparedFurniture(t, undefined, true) ?? (ctx => paintMegaTable(ctx, t, true)) });
            }
            for (const d of p.decor)
                this.staticObjects.push({ depth: d.x + d.y, draw: ctx => paintMegaDecor(ctx, p, d) });
            const portal = appearance ? architectureSprite(appearance.selected.door, 2, 65, true) : environmentSprite('entrance', 65, true), sign = appearance ? architectureSprite(appearance.selected.sign, 2, 65, true) : null;
            if (portal)
                for (const [index, port] of megaEntrances(p).entries()) {
                    const point = toTile(port.inside), door = iso(p.doors ? { x: point.x + (port.outside.x - port.inside.x) / 16, y: point.y + (port.outside.y - port.inside.y) / 24 } : index === 0 ? (p.entry ? { x: 0, y: p.entry.y } : { x: w - .1, y: h - .5 }) : index === 1 ? { x: w, y: h / 2 } : { x: w / 2, y: h });
                    this.staticObjects.push({ depth: p.doors ? point.x + point.y + .2 : index === 0 ? (p.entry ? p.entry.x + p.entry.y + .2 : w + h + .2) : point.x + point.y + .2, draw: ctx => { const top = door.y - portal.height + 8; ctx.drawImage(portal.tile, door.x - 32.5, top, 65, portal.height); if (sign) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(door.x - 32.5, top, 65, portal.height * .45);
                            ctx.clip();
                            ctx.drawImage(sign.tile, door.x - 32.5, top, 65, sign.height);
                            ctx.restore();
                            ctx.save();
                            const landmark = g.mega?.finalGrowth?.renewal?.facilities?.receipts.some(r => r.kind === 'landmark');
                            ctx.font = landmark ? 'bold 9px system-ui' : 'bold 7px system-ui';
                            if (landmark) {
                                ctx.shadowColor = '#d5a94e';
                                ctx.shadowBlur = 5;
                            }
                            ctx.fillStyle = '#493b25';
                            ctx.textAlign = 'center';
                            ctx.fillText(g.progressiveState?.enterprise?.name || '우리 카페', door.x, top + portal.height * .28, 42);
                            ctx.restore();
                        } } });
                }
            renderPhaseEnd('static-build', staticTiming);
            megaArtMetrics.staticMaxMs = Math.max(megaArtMetrics.staticMaxMs, performance.now() - staticStart);
        }
        const objects = this.staticObjects.map(o => ({ depth: o.depth, draw: () => renderPhase('static-draw', () => o.draw(c)) }));
        const visible = (q) => { const x = (q.x - this.center.x) * this.zoom + this.width / 2, y = (q.y - this.center.y) * this.zoom + this.height / 2; return x > -80 && x < this.width + 80 && y > -80 && y < this.height + 80; };
        for (const guest of g.guests) {
            const pose = s.guest(guest), seatTable = p.tables.find(t => t.id === s.space.seats[guest.seat]?.tableId), seatDirection = seatTable ? seatedDirection(toTile(pose), seatTable) : 'SE', walk = this.actors.sample('g' + guest.id, pose, g.elapsedTime), facing = pose.seated ? (seatDirection === 'SW' || seatDirection === 'NW' ? 'left' : 'right') : walk.facing, tile = toTile(pose), q = iso(tile, pose.seated ? studioSeatedLift(seatTable?.furnitureId) : 0);
            if (guest.state === 'EATING')
                q.y += eatingPose(guest.elapsed, guest.id, reduce).lean;
            if (!visible(q))
                continue;
            objects.push({ depth: tile.x + tile.y, draw: () => { this.shadow(c, iso(tile), pose.seated ? .65 : 1); const motion = guestMotion(guest, g.events); try {
                    const selected = selectCustomerPose(guest.definition.visualKey, pose.action, facing, motion, pose.seated ? motionFrame(guest.elapsed, guest.id, reduce) : Math.floor(walk.phase) % 2);
                    const living = finalActorFrame(guest.definition.visualKey, pose.seated ? seatDirection : walk.direction, pose.seated ? 'sit' : walk.moving ? 'walk' : 'idle', walk.phase) ?? (!pose.seated ? livingWalkAsset(guest.definition.visualKey, walk) : null);
                    this.sprite(c, living || selectedPoseAsset(selected), q, facing, pose.seated ? 32 : living ? 37 : 34, pose.opacity);
                }
                catch {
                    this.fallback(c, q, '#c79b7d');
                } if ((guest.state === 'ORDERING' || guest.state === 'EATING' || guest.state === 'PAYING') && guest.elapsed < 1.8)
                    this.bubble(c, q, guest.state === 'ORDERING' ? '주문할게요' : guest.state === 'EATING' ? '잘 먹을게요' : '고마워요'); if (guest.state === 'EATING') {
                    if (seatTable)
                        paintEatingMotion(c, q, seatTable, guest.elapsed, guest.id, reduce);
                    const t = p.tables.find(t => t.id === s.space.seats[guest.seat].tableId);
                    const m = iso(t, 24), food = image(signatureImage(guest.order.map(o => o.menuId).find(id => !!signatureImage(id)) ?? '') ?? 'assets/art/hospitality/signature.svg');
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
            objects.push({ depth: tile.x + tile.y, draw: () => { this.shadow(c, iso(tile), 1); const frame = finalActorFrame(worker.staffId, walk.direction, worker.cargo.length || worker.state === 'SERVING' ? 'carry' : walk.moving ? 'walk' : 'idle', walk.phase) ?? ((['MOVING_TO_PICKUP', 'MOVING_TO_TABLE', 'RETURNING'].includes(worker.state) || walk.moving) ? livingWalkAsset(worker.staffId, walk) : null) ?? workerFrame(worker.staffId, workerMotion(worker), facing); if (frame)
                    this.sprite(c, frame, q, facing, frame.file.includes('mega-v30c') ? 37 : 35, 1);
                else {
                    const box = baseWorkers[worker.staffId] ?? baseWorkers['staff-1'];
                    this.sprite(c, { file: 'assets/art/characters.png', width: 1536, height: 1024, box, nativeFacing: 'right' }, q, pose.facing, 35, 1);
                } if (worker.state === 'SERVING')
                    this.bubble(c, q, '맛있게 드세요'); if (worker.cargo.length) {
                    const count = Math.min(5, worker.cargo.length), width = 3 + count * 4, left = q.x + (facing === 'left' ? -width - 3 : 4);
                    c.fillStyle = '#ebc286';
                    c.fillRect(left, q.y - 12, width, 3);
                    for (let i = 0; i < count; i++) {
                        c.fillStyle = i % 2 ? '#e8b18c' : '#f9f3dd';
                        c.fillRect(left + 2 + i * 4, q.y - 16, 3, 4);
                    }
                } } });
        }
        const managerTiming = renderPhaseStart();
        const companion = managerActor(g), managerId = g.mega?.manager?.selected;
        let managerHit = this.host.querySelector('.manager-world-hit');
        if (companion && managerId) {
            const tile = toTile(companion.position), q = iso(tile), frame = managerSprite(g);
            if (visible(q) && frame)
                objects.push({ depth: tile.x + tile.y, draw: () => { this.shadow(c, q, 1.1); this.sprite(c, frame, q, companion.facing, 39, 1); if (companion.talkUntil > g.elapsedTime)
                        this.bubble(c, q, '함께 고민해요'); } });
            if (!managerHit) {
                managerHit = document.createElement('button');
                managerHit.className = 'manager-world-hit';
                managerHit.innerHTML = '<span></span>';
                managerHit.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); document.dispatchEvent(new CustomEvent('cafe-manager-talk')); };
                managerHit.onclick = e => { e.stopPropagation(); if (e.detail === 0)
                    document.dispatchEvent(new CustomEvent('cafe-manager-talk')); };
                this.host.append(managerHit);
            }
            managerHit.hidden = !visible(q);
            managerHit.dataset.motion = companion.talkUntil > g.elapsedTime ? 'TALK' : companion.moving ? 'WALK' : 'IDLE';
            managerHit.dataset.direction = (companion.back ? 'back-' : 'front-') + companion.facing;
            managerHit.setAttribute('aria-label', managerById(managerId).name + ' 매니저와 대화');
            managerHit.querySelector('span').textContent = managerById(managerId).name + ' · 매니저';
            managerHit.style.left = ((q.x - this.center.x) * this.zoom + this.width / 2) + 'px';
            managerHit.style.top = (this.canvas.offsetTop + (q.y - this.center.y) * this.zoom + this.height / 2) + 'px';
            managerHit.style.width = Math.max(48, 25 * this.zoom) + 'px';
            managerHit.style.height = Math.max(48, 42 * this.zoom) + 'px';
        }
        else if (managerHit)
            managerHit.hidden = true;
        renderPhaseEnd('manager-presentation', managerTiming);
        this.actors.retain(new Set([...g.guests.map(x => 'g' + x.id), ...g.service.workers.map(x => 'w' + x.staffId)]));
        for (const o of objects.sort((a, b) => a.depth - b.depth))
            o.draw();
        this.cpu.push(performance.now() - now);
        if (this.cpu.length > 6000)
            this.cpu.shift();
        if (now - this.lastStats > 900) {
            const domTiming = renderPhaseStart();
            this.lastStats = now;
            const grade = megaOperatingGrade(p);
            this.host.querySelector('.mega-size').textContent = `카페 Lv.${g.cafeLevel} · ${w}×${h} · ${w * h}칸 · 좌석 ${s.space.seats.length}(동시 ${g.cafe.maxCustomers})${p.level >= 20 ? ' · 가동 구역' + grade.ready.length + '/' + grade.all + ' · 해당 구역 운영가 +' + Math.round((grade.factor - 1) * 100) + '%' : ''}`;
            const sorted = [...this.intervals].sort((a, b) => a - b), avg = this.intervals.reduce((a, b) => a + b, 0) / Math.max(1, this.intervals.length), p95 = sorted[Math.floor(sorted.length * .95)] ?? 0, p99 = sorted[Math.floor(sorted.length * .99)] ?? 0;
            this.host.querySelector('output').textContent = `평균 ${avg ? (1000 / avg).toFixed(1) : '측정 중'} FPS · p99 환산 ${p99 ? (1000 / p99).toFixed(1) : '-'} · p95 ${p95.toFixed(1)}ms · draw p95 ${([...this.cpu].sort((a, b) => a - b)[Math.floor(this.cpu.length * .95)] ?? 0).toFixed(2)}ms · sprite cache ${megaArtMetrics.fragmentBuilds}/${megaArtMetrics.fragmentHits} · 경로 탐색 ${megaMetrics.searches} / 실패 ${megaMetrics.failures} / 캐시 ${megaMetrics.cacheHits} · 실제 손님 ${g.guests.length} / 직원 ${g.service.paid.length} · 매출 ${g.stats.revenue.toLocaleString()}원 · JS heap ${(performance.memory?.usedJSHeapSize ?? 0) / 1048576 ? ((performance.memory?.usedJSHeapSize ?? 0) / 1048576).toFixed(1) + 'MiB' : '지원 안 함'} · 초기 전송 ${(performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) / 1048576).toFixed(2)}MiB`;
            if (g.mega?.finalGrowth) {
                const details = this.host.querySelector('.mega-diagnostics');
                let probe = details.querySelector('[data-final-runtime]');
                if (details.open) {
                    if (!probe) {
                        probe = document.createElement('pre');
                        probe.dataset.finalRuntime = '';
                        details.append(probe);
                    }
                    probe.textContent = JSON.stringify(finalRuntimeDiagnostics(g), null, 2);
                }
            }
            const list = this.host.querySelector('.mega-orders');
            list.innerHTML = g.guests.filter(x => !['ENTERING', 'MOVING_TO_SEAT', 'LEAVING'].includes(x.state)).map(x => `<button data-mega-guest="${x.id}">손님 ${x.id} · ${x.state === 'EATING' ? '식사 중' : (x.order.length ? x.order.map(o => (g.menus.find(m => m.menuId === o.menuId)?.name ?? '특별 메뉴') + '×' + o.quantity).join(' · ') : '주문을 고르는 중')}</button>`).join('');
            list.querySelectorAll('[data-mega-guest]').forEach(b => b.onclick = () => document.dispatchEvent(new CustomEvent('mega-guest', { detail: Number(b.dataset.megaGuest) })));
            renderPhaseEnd('hud-dom', domTiming);
        }
    }
    bubble(c, p, text) { c.save(); c.font = '7px system-ui'; const w = c.measureText(text).width + 8; c.fillStyle = '#fff9eb'; c.strokeStyle = '#ad9470'; c.lineWidth = .5; c.fillRect(p.x - w / 2, p.y - 51, w, 11); c.strokeRect(p.x - w / 2, p.y - 51, w, 11); c.fillStyle = '#584730'; c.textAlign = 'center'; c.fillText(text, p.x, p.y - 43); c.restore(); }
    shadow(c, p, size) { c.save(); c.fillStyle = '#4a3b2830'; c.beginPath(); c.ellipse(p.x, p.y, 6 * size, 2.4 * size, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    sprite(c, a, q, facing, height, alpha) { const spriteTiming = renderPhaseStart(); const actor = a.file.startsWith('assets/art/final-roster/') ? finalActorBitmap(a.file, a.width, a.height, a.box) : undefined; const img = a.file.startsWith('assets/art/final-roster/') ? undefined : image(a.file); if (!img && !actor) {
        this.fallback(c, q, '#8a9d78');
        renderPhaseEnd('actor-pending', spriteTiming);
        return;
    } const [x, y, w, h] = a.box, W = height * w / h; c.save(); c.globalAlpha = alpha; c.translate(q.x, q.y); if (a.nativeFacing && a.nativeFacing !== facing)
        c.scale(-1, 1); const dx = -W * ((a.anchorX ?? (x + w / 2)) - x) / w, dy = -height * ((a.anchorY ?? (y + h - 2)) - y) / h; if (actor) {
        c.drawImage(actor, 0, 0, actor.width, actor.height, dx, dy, W, height);
    }
    else if (img) {
        const sx = img.naturalWidth / a.width, sy = img.naturalHeight / a.height;
        const tile = bitmapFragment(img, [x * sx, y * sy, w * sx, h * sy], W, height);
        if (tile)
            c.drawImage(tile, dx, dy, W, height);
        else
            this.fallback(c, q, '#8a9d78');
    } c.restore(); renderPhaseEnd(a.file.startsWith('assets/art/final-roster/') ? 'actor-cell-blit' : 'legacy-actor-fragment', spriteTiming); }
    fallback(c, p, color) { c.fillStyle = color; c.fillRect(p.x - 4, p.y - 17, 8, 15); c.fillStyle = '#e8c5a0'; c.beginPath(); c.arc(p.x, p.y - 20, 5, 0, Math.PI * 2); c.fill(); }
    detach() { this.paintObserver = undefined; if (this.room) {
        clearArtBitmaps();
        finalActorFrameCache.clear();
        finalActorCache.clear();
    } this.actors.clear(); this.pacer.reset(); document.removeEventListener('mega-art-ready', this.onArt); document.removeEventListener('cafe-manager-focus', this.onManagerFocus); document.removeEventListener('visibilitychange', this.onVisibility); this.staticKey = ''; this.staticObjects = []; this.observer?.disconnect(); this.observer = null; if (this.room) {
        delete this.room.dataset.mega;
        this.room.classList.remove('mega-room');
    } if (this.floor) {
        this.floor.width = 0;
        this.floor.height = 0;
    } this.floor = null; if (this.walls) {
        this.walls.width = 0;
        this.walls.height = 0;
    } this.walls = null; this.wallKey = ''; this.wallEpoch = 0; if (this.canvas) {
        this.canvas.width = 0;
        this.canvas.height = 0;
    } this.host?.remove(); this.host = null; this.canvas = null; this.room = null; this.game = null; this.scene = null; this.intervals = []; this.cpu = []; this.last = 0; this.lastStats = 0; this.level = 0; this.floorKey = ''; }
}
export const megaView = new MegaView();
