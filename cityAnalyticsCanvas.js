// @ts-nocheck
import { byId, iso, uniso, artRect } from './cityBuildingCatalog.js?v=mega-5d509fb5dbfc';
import { districts } from './cityDistrictModel.js?v=mega-5d509fb5dbfc';
export const intersects = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export function layoutLabels(items, width, height) { const placed = []; for (const item of items) {
    let best = null;
    for (const dy of [-40, -80, -120, 25, 65, 105])
        for (const dx of [0, -65, 65, -130, 130]) {
            const r = { x: Math.max(4, Math.min(width - item.w - 4, item.anchor.x - item.w / 2 + dx)), y: Math.max(4, Math.min(height - item.h - 4, item.anchor.y + dy)), w: item.w, h: item.h };
            const overlaps = placed.filter(p => intersects(r, p, 4)).length, score = overlaps * 10000 + Math.abs(dx) + Math.abs(dy + 40) * .5;
            if (!best || score < best.score)
                best = { ...r, score };
        }
    placed.push({ ...best, ...item });
} return placed; }
export class ArtCache {
    constructor(meta) { this.meta = meta; this.images = new Map(); this.alpha = new Map(); }
    key(a) { return a.kind === 'new' ? 'sheet-' + a.sheet : a.legacySheet === 'expansion' ? 'brand-extra' : 'brand-old'; }
    async load(key) { if (this.images.has(key))
        return this.images.get(key); const src = key === 'brand-extra' ? 'assets/city-modern/expansion-atlas.png' : key === 'brand-old' ? 'assets/city-modern/atlas.png' : 'assets/city-urban/' + key + '.png'; const promise = (async () => { const im = new Image(); im.src = src; await im.decode(); return im; })(); this.images.set(key, promise); return promise; }
    async prepare(buildings) { await Promise.all([...new Set(buildings.map(b => this.key(byId[b.variantId])))].map(key => this.load(key))); }
    async image(a) { return this.load(this.key(a)); }
    async prepareAlpha(key) { if (this.alpha.has(key))
        return; const im = await this.load(key), c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(im, 0, 0); const rgba = ctx.getImageData(0, 0, c.width, c.height).data, alpha = new Uint8Array(c.width * c.height); for (let i = 0; i < alpha.length; i++)
        alpha[i] = rgba[i * 4 + 3]; this.alpha.set(key, { data: alpha, width: c.width }); c.width = c.height = 1; }
    memoryEstimate() { return { decodedImageBytes: [...this.images.keys()].reduce((n, k) => { const m = k.startsWith('sheet-') ? this.meta.find(s => 'sheet-' + s.index === k) : k === 'brand-extra' ? { width: 1536, height: 1024 } : { width: 1122, height: 1402 }; return n + (m ? m.width * m.height * 4 : 0); }, 0), alphaBytes: [...this.alpha.values()].reduce((n, a) => n + a.data.length, 0) }; }
}
const heatColor = (v, min, max) => { const t = Math.max(0, Math.min(1, (v - min) / (max - min || 1))); return t < .25 ? '#4b99be' : t < .5 ? '#69b88d' : t < .75 ? '#d9b452' : '#cc795c'; };
export class CityView {
    constructor(canvas, cache, city, { onSelect = () => { }, interactive = true, fixedScale = false } = {}) { this.canvas = canvas; this.cache = cache; this.city = city; this.onSelect = onSelect; this.fixedScale = fixedScale; this.camera = { zoom: 1, x: 0, y: 0 }; this.images = new Map(); this.drawn = []; this.labels = []; this.samples = []; this.selected = null; this.focusBrand = null; this.brandOnly = false; this.analysis = null; this.analysisData = null; this.range = [0, 100]; this.brand = { name: '새봄 카페', color: '#2c735f' }; this.ro = new ResizeObserver(() => { this.resize(); this.fit(); }); this.ro.observe(canvas); if (interactive)
        this.bind(); }
    async setCity(city) { this.city = city; await this.cache.prepare(city.buildings); for (const b of city.buildings) {
        const a = byId[b.variantId];
        this.images.set(this.cache.key(a), await this.cache.image(a));
    } this.selected = null; this.focusBrand = null; this.resize(); this.fit(); }
    resize() { const r = this.canvas.getBoundingClientRect(); this.width = r.width; this.height = r.height; this.dpr = Math.min(devicePixelRatio || 1, innerWidth <= 720 ? 1.5 : 2); this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr); }
    bounds() { const rects = this.city.buildings.map(artRect), c = [[0, 0], [this.city.width, 0], [0, this.city.height], [this.city.width, this.city.height]].map(([x, y]) => iso(x, y)); return { left: Math.min(...rects.map(r => r.x), ...c.map(p => p.x)) - 60, right: Math.max(...rects.map(r => r.x + r.w), ...c.map(p => p.x)) + 60, top: Math.min(...rects.map(r => r.y), 0) - 60, bottom: Math.max(...rects.map(r => r.y + r.h), ...c.map(p => p.y)) + 80 }; }
    fit() { if (!this.width)
        return; const b = this.bounds(); this.camera.zoom = this.fixedScale ? Math.min(this.width / 6800, this.height / 4000) : Math.min(this.width / (b.right - b.left), this.height / (b.bottom - b.top)) * .94; this.fitZoom = this.camera.zoom; this.camera.x = this.fixedScale ? 144 : (b.left + b.right) / 2; this.camera.y = this.fixedScale ? 1400 : (b.top + b.bottom) / 2; this.draw(); }
    screen(p) { return { x: (p.x - this.camera.x) * this.camera.zoom + this.width / 2, y: (p.y - this.camera.y) * this.camera.zoom + this.height / 2 }; }
    world(p) { return { x: (p.x - this.width / 2) / this.camera.zoom + this.camera.x, y: (p.y - this.height / 2) / this.camera.zoom + this.camera.y }; }
    clamp() { const p = uniso(this.camera.x, this.camera.y), q = iso(Math.max(0, Math.min(this.city.width, p.x)), Math.max(0, Math.min(this.city.height, p.y))); this.camera.x = q.x; this.camera.y = q.y; }
    zoom(f, anchor = { x: this.width / 2, y: this.height / 2 }) { const a = this.world(anchor); this.camera.zoom = Math.max(this.fitZoom * .45, Math.min(1.4, this.camera.zoom * f)); const b = this.world(anchor); this.camera.x += a.x - b.x; this.camera.y += a.y - b.y; this.clamp(); this.draw(); }
    focus(id) { const b = this.city.buildings.find(b => b.id === id); if (!b)
        return; this.selected = id; this.focusBrand = b.brandLink ? b.id : null; const r = artRect(b); this.camera.zoom = Math.min(1.25, Math.max(this.fitZoom * 2, Math.min(this.width * .62 / r.w, this.height * .72 / r.h))); this.camera.x = r.x + r.w / 2; this.camera.y = r.y + r.h * .47; this.draw(); this.onSelect(b.parcelId, b); }
    polygon(points, fill, stroke, width = 1) { const c = this.canvas.getContext('2d'); c.beginPath(); points.map(([x, y]) => this.screen(iso(x, y))).forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); if (fill) {
        c.fillStyle = fill;
        c.fill();
    } if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = width;
        c.stroke();
    } }
    box(r, fill, stroke, width = 1) { this.polygon([[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]], fill, stroke, width); }
    draw() {
        if (!this.width)
            return;
        const start = performance.now(), c = this.canvas.getContext('2d'), z = this.camera.zoom;
        c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        c.clearRect(0, 0, this.width, this.height);
        c.fillStyle = '#eae7df';
        c.fillRect(0, 0, this.width, this.height);
        this.box({ x: 0, y: 0, w: this.city.width, h: this.city.height }, '#d8d6c8');
        for (const r of this.city.roads) {
            this.box({ ...r, x: r.x - .35, y: r.y - .35, w: r.w + .7, h: r.h + .7 }, '#c8c4b6');
            this.box(r, r.kind === 'avenue' ? '#747f80' : '#89908d');
            const a = this.screen(iso(r.x + (r.id[0] === 'v' ? r.w / 2 : 0), r.y + (r.id[0] === 'h' ? r.h / 2 : 0))), b = this.screen(iso(r.x + r.w - (r.id[0] === 'v' ? r.w / 2 : 0), r.y + r.h - (r.id[0] === 'h' ? r.h / 2 : 0)));
            c.beginPath();
            c.moveTo(a.x, a.y);
            c.lineTo(b.x, b.y);
            c.strokeStyle = this.city.trafficInvestment ? '#b4d4b1' : '#ddd8bf';
            c.lineWidth = Math.max(.6, z);
            c.setLineDash([7 * z, 6 * z]);
            c.stroke();
            c.setLineDash([]);
        }
        for (const p of this.city.parcels) {
            this.box(p, p.vacant ? '#c9e3b5' : p.protected ? '#e9c2af' : '#ddd4c0', districts[p.district].color, Math.max(.5, z));
            if (this.analysis && this.analysisData) {
                const value = this.analysisData.blocks[p.id][this.analysis];
                c.globalAlpha = .24;
                this.box(p, heatColor(value, ...this.range));
                c.globalAlpha = 1;
            }
        }
        for (const r of this.city.landscapes) {
            this.box(r, r.kind === 'brand-plaza' ? '#f0e0b8' : r.kind === 'parking' ? '#b6bbb4' : '#c8d4b5');
            if (r.kind === 'brand-plaza') {
                const a = this.screen(iso(r.x + r.w / 2, r.y)), b = this.screen(iso(r.x + r.w / 2, r.y + r.h));
                c.beginPath();
                c.moveTo(a.x, a.y);
                c.lineTo(b.x, b.y);
                c.strokeStyle = '#b99b5e';
                c.lineWidth = Math.max(1, 2 * z);
                c.stroke();
            }
        }
        const sorted = this.city.buildings.toSorted((a, b) => (a.x + a.y + a.w + a.h) - (b.x + b.y + b.w + b.h));
        const focused = this.focusBrand ? this.city.buildings.find(b => b.id === this.focusBrand) : null, fr = focused ? artRect(focused) : null, fs = fr ? this.screen(fr) : null, focusRect = fr ? { ...fs, w: fr.w * z, h: fr.h * z } : null;
        this.drawn = [];
        const pins = [];
        for (const b of sorted) {
            if (this.brandOnly && !b.brandLink)
                continue;
            const a = byId[b.variantId], r = artRect(b), s = this.screen(r), w = r.w * z, h = r.h * z;
            if (s.x + w < 0 || s.y + h < 0 || s.x > this.width || s.y > this.height)
                continue;
            const im = this.images.get(this.cache.key(a));
            if (!im)
                continue;
            const fade = focused && b.id !== focused.id && !b.brandLink && intersects({ x: s.x, y: s.y, w, h }, focusRect);
            c.globalAlpha = fade ? .22 : 1;
            c.drawImage(im, a.frame.x, a.frame.y, a.frame.w, a.frame.h, s.x, s.y, w, h);
            c.globalAlpha = 1;
            this.drawn.push({ b, a, key: this.cache.key(a), x: s.x, y: s.y, w, h });
            if (b.brandLink)
                pins.push({ b, anchor: { x: s.x + w / 2, y: s.y + h * .1 } });
        }
        if (this.preview) {
            const b = this.preview, a = byId[b.variantId], r = artRect(b), s = this.screen(r), im = this.images.get(this.cache.key(a));
            if (im) {
                c.globalAlpha = .6;
                c.drawImage(im, a.frame.x, a.frame.y, a.frame.w, a.frame.h, s.x, s.y, r.w * z, r.h * z);
                c.globalAlpha = 1;
                this.box({ x: b.x, y: b.y, w: a.w, h: a.h }, null, '#c99a32', 3);
            }
        }
        const overview = z < this.fitZoom * 1.65;
        const items = pins.map(({ b, anchor }) => { const text = overview ? (b.brandLink.kind === 'main' ? '본' : b.brandLink.kind === 'hq' ? 'HQ' : String(b.brandLink.branchId)) : this.brand.name + ' · ' + b.brandLink.name; c.font = '700 12px system-ui'; return { b, anchor, text, w: overview ? 30 : Math.min(this.width - 12, c.measureText(text).width + 20), h: overview ? 30 : 28 }; });
        this.labels = layoutLabels(items, this.width, this.height);
        for (const p of this.labels) {
            c.beginPath();
            c.moveTo(p.x + p.w / 2, p.y + p.h);
            c.lineTo(p.anchor.x, p.anchor.y);
            c.strokeStyle = this.brand.color;
            c.lineWidth = 1.4;
            c.stroke();
            c.beginPath();
            c.roundRect(p.x, p.y, p.w, p.h, overview ? 15 : 8);
            c.fillStyle = this.brand.color;
            c.fill();
            c.strokeStyle = p.b.id === this.selected ? '#efca67' : '#fff8e2';
            c.lineWidth = p.b.id === this.selected ? 3 : 1;
            c.stroke();
            c.font = '700 12px system-ui';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillStyle = '#fffaf0';
            c.fillText(p.text, p.x + p.w / 2, p.y + p.h / 2);
            c.textBaseline = 'alphabetic';
        }
        if (this.selected) {
            const b = this.city.buildings.find(b => b.id === this.selected), p = this.city.parcels.find(p => p.id === (b?.parcelId ?? this.selected));
            if (p)
                this.box(p, null, '#d5a147', 3);
        }
        this.samples.push(performance.now() - start);
        if (this.samples.length > 300)
            this.samples.shift();
    }
    async pick(point) { for (const p of this.labels.toReversed())
        if (point.x >= p.x - 7 && point.x <= p.x + p.w + 7 && point.y >= p.y - 7 && point.y <= p.y + p.h + 7) {
            this.focus(p.b.id);
            return;
        } for (const r of this.drawn.toReversed()) {
        if (point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h)
            continue;
        await this.cache.prepareAlpha(r.key);
        const alpha = this.cache.alpha.get(r.key), x = r.a.frame.x + Math.min(r.a.frame.w - 1, Math.floor((point.x - r.x) / r.w * r.a.frame.w)), y = r.a.frame.y + Math.min(r.a.frame.h - 1, Math.floor((point.y - r.y) / r.h * r.a.frame.h));
        if (alpha.data[y * alpha.width + x] < 40)
            continue;
        this.selected = r.b.id;
        this.focusBrand = r.b.brandLink ? r.b.id : null;
        this.onSelect(r.b.parcelId, r.b);
        this.draw();
        return;
    } const q = this.world(point), t = uniso(q.x, q.y), p = this.city.parcels.find(p => t.x >= p.x && t.x <= p.x + p.w && t.y >= p.y && t.y <= p.y + p.h); if (p) {
        this.selected = p.id;
        this.focusBrand = null;
        this.onSelect(p.id, null);
        this.draw();
    } }
    bind() { const el = this.canvas, points = new Map(); let start, last, moved = false, pinch = 0; const at = e => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }; el.addEventListener('wheel', e => { e.preventDefault(); this.zoom(e.deltaY < 0 ? 1.12 : .88, at(e)); }, { passive: false }); el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); start = last = at(e); moved = false; points.set(e.pointerId, last); }); el.addEventListener('pointermove', e => { if (!points.has(e.pointerId))
        return; const p = at(e); points.set(e.pointerId, p); if (points.size === 2) {
        const [a, b] = [...points.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch)
            this.zoom(d / pinch, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        pinch = d;
        moved = true;
        return;
    } if (Math.hypot(p.x - start.x, p.y - start.y) > 7)
        moved = true; if (moved) {
        this.camera.x -= (p.x - last.x) / this.camera.zoom;
        this.camera.y -= (p.y - last.y) / this.camera.zoom;
        this.clamp();
        this.draw();
    } last = p; }); el.addEventListener('pointerup', e => { points.delete(e.pointerId); if (!moved && !points.size)
        void this.pick(at(e)); pinch = 0; }); el.addEventListener('pointercancel', e => { points.delete(e.pointerId); moved = true; pinch = 0; }); el.addEventListener('keydown', e => { const move = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] }[e.key]; if (move) {
        e.preventDefault();
        this.camera.x += move[0] / this.camera.zoom;
        this.camera.y += move[1] / this.camera.zoom;
        this.clamp();
        this.draw();
    }
    else if (e.key === 'Home')
        this.fit();
    else if (e.key === '+')
        this.zoom(1.2);
    else if (e.key === '-')
        this.zoom(.8); }); }
    destroy() { this.ro.disconnect(); }
}
