import { megaZones } from './megaZones.js?v=v30-rc1-f88374ed22e0';
import { megaArtFrames } from './megaArtFrames.js?v=v30-rc1-f88374ed22e0';
import { webAsset } from './webAsset.js?v=v30-rc1-f88374ed22e0';
import { iso, megaDimensions, fixedMega } from './megaSpace.js?v=v30-rc1-f88374ed22e0';
export const environmentIds = ['fridge', 'sink', 'coffee', 'pastry', 'oven', 'prep', 'coffee-sage', 'shelf', 'wall-left', 'wall-right', 'window-left', 'window-right', 'entrance', 'plant', 'wall-shelf', 'wall-lamp'];
const images = new Map();
const fragments = new Map();
export const megaArtMetrics = { imageRequests: 0, fragmentBuilds: 0, fragmentHits: 0 };
export function furnitureProjection(kind, chair = false) { const x = chair ? .45 : kind === 'long' ? 2.3 : kind === 'four' ? 1.7 : 1, y = chair ? .45 : .65; return { width: (x + y) * 24, baseRise: (x + y) * 6 }; }
export function megaImage(file) { const url = webAsset(file); let img = images.get(url); if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (file.includes('mega-v30b') || file.includes('furniture'))
        document.dispatchEvent(new Event('mega-art-ready')); };
    img.src = url;
    images.set(url, img);
    megaArtMetrics.imageRequests++;
} return img.complete && img.naturalWidth ? img : null; }
export function cachedFragment(img, box, width, height) { const key = [img.src, ...box, Math.round(width * 4), Math.round(height * 4)].join('/'); let tile = fragments.get(key); if (tile) {
    megaArtMetrics.fragmentHits++;
    return tile;
} tile = document.createElement('canvas'); tile.width = Math.max(1, Math.ceil(width * 4)); tile.height = Math.max(1, Math.ceil(height * 4)); tile.getContext('2d').drawImage(img, box[0], box[1], box[2], box[3], 0, 0, tile.width, tile.height); if (fragments.size >= 256)
    fragments.delete(fragments.keys().next().value); fragments.set(key, tile); megaArtMetrics.fragmentBuilds++; return tile; }
export function environmentSprite(id, width) { const img = megaImage('assets/web/mega-v30b/environment.webp'); if (!img)
    return null; const source = megaArtFrames.boxes[environmentIds.indexOf(id)], box = [source[0] * img.naturalWidth / megaArtFrames.width, source[1] * img.naturalHeight / megaArtFrames.height, source[2] * img.naturalWidth / megaArtFrames.width, source[3] * img.naturalHeight / megaArtFrames.height], height = width * box[3] / box[2]; return { tile: cachedFragment(img, box, width, height), width, height }; }
export function paintEnvironment(c, id, x, y, width, baseRise = 0, flip = false) { const sprite = environmentSprite(id, width); if (!sprite)
    return false; if (flip) {
    c.save();
    c.translate(x, y);
    c.scale(-1, 1);
    c.drawImage(sprite.tile, -width / 2, -sprite.height + baseRise, width, sprite.height);
    c.restore();
}
else
    c.drawImage(sprite.tile, x - width / 2, y - sprite.height + baseRise, width, sprite.height); return true; }
export function environmentPlacements(p) { const result = []; for (const [fIndex, f] of fixedMega(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly).entries()) {
    const vertical = f.bottom - f.top > f.right - f.left, n = Math.ceil(vertical ? f.bottom - f.top : f.right - f.left);
    for (let i = 0; i < n; i++) {
        const x = f.left + (vertical ? (f.right - f.left) / 2 : i + .5), y = f.top + (vertical ? i + .5 : (f.bottom - f.top) / 2), width = vertical ? 58 : 56;
        const ids = fIndex === 0 ? ['fridge', 'sink', 'coffee', 'pastry', 'plant'] : fIndex === 2 ? ['pastry', 'prep', 'pastry', 'coffee-sage'] : ['oven', 'prep', 'coffee-sage', 'shelf'];
        result.push({ id: ids[i % ids.length], x, y, width, baseRise: width * .17, depth: x + y + .4, fixed: true });
    }
} for (const [i, f] of (p.fixtures ?? []).entries()) {
    const z = megaZones(p).find(z => f.x >= z.x && f.x < z.x + z.w && f.y >= z.y && f.y < z.y + z.h), id = ['kitchen', 'bakery'].includes(z?.id ?? '') ? ['oven', 'prep', 'pastry', 'coffee-sage'][i % 4] : z?.id === 'dessert' ? 'pastry' : z?.id === 'vip' ? 'coffee' : 'prep';
    result.push({ id, x: f.x, y: f.y, width: 72, baseRise: 12, depth: f.x + f.y + .4, fixed: false, flip: f.rotation % 180 !== 0 });
} return result; }
export function paintArtFloor(c, p) {
    const [w, h] = megaDimensions[p.level - 1];
    const polygon = (points, fill, stroke) => { c.beginPath(); points.forEach((a, i) => { const q = iso(a); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); }); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = .6;
        c.stroke();
    } };
    // Individual logical tiles, warm ceramic glazing and deterministic wear. No baked room image.
    const shades = ['#dba774', '#d79a68', '#e0ac7b', '#d79f70', '#e6b387'];
    polygon([{ x: 0, y: h }, { x: w, y: h }, { x: w, y: h + .25 }, { x: 0, y: h + .25 }], '#97633f');
    polygon([{ x: w, y: 0 }, { x: w + .25, y: 0 }, { x: w + .25, y: h + .25 }, { x: w, y: h }], '#7f5438');
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            polygon([{ x, y }, { x: x + 1, y }, { x: x + 1, y: y + 1 }, { x, y: y + 1 }], shades[(x * 17 + y * 31) % shades.length], '#f2d5b0');
            const q = iso({ x: x + .2, y: y + .2 });
            c.strokeStyle = '#f7dcb63b';
            c.lineWidth = .6;
            c.beginPath();
            c.moveTo(q.x - 6, q.y);
            c.lineTo(q.x + 3, q.y + 4);
            c.stroke();
        }
    for (const z of megaZones(p)) {
        polygon([{ x: z.x, y: z.y }, { x: z.x + z.w, y: z.y }, { x: z.x + z.w, y: z.y + z.h }, { x: z.x, y: z.y + z.h }], z.color + '99', '#d6ba92');
        const q = iso({ x: z.x + z.w / 2, y: z.y + 1 });
        c.fillStyle = '#765b43';
        c.font = '12px system-ui';
        c.textAlign = 'center';
        c.fillText(z.name, q.x, q.y);
    }
    if (p.level >= 5) {
        const zone = (x, y, W, H, color) => polygon([{ x, y }, { x: x + W, y }, { x: x + W, y: y + H }, { x, y: y + H }], color, '#ead8b2');
        zone(2.1, .2, 1.5, Math.min(5, h - 1), '#bfc6a0');
        if (!p.starterKitchenOnly)
            zone((p.kitchenAnchorWidth ?? w) - 5, .2, 4, 2.6, '#c2b293');
        if (p.prepIsland)
            zone(14, 6.5, 4, 1.5, '#bfc6a0');
        for (const [i, t] of p.tables.entries()) {
            const angle = t.rotation * Math.PI / 180, point = (x, y) => ({ x: t.x + x * Math.cos(angle) - y * Math.sin(angle), y: t.y + x * Math.sin(angle) + y * Math.cos(angle) }), rug = (x, y, W, H, color) => polygon([point(x, y), point(x + W, y), point(x + W, y + H), point(x, y + H)], color, '#e8d4a5'), width = t.kind === 'long' ? 3.3 : t.kind === 'four' ? 2.6 : 1.9;
            rug(-width / 2, -1.5, width, 3, ['#a1ac80', '#d3b57b', '#bd957f'][i % 3]);
            rug(-width / 2 + .13, -1.36, width - .26, 2.72, ['#b8bf94', '#e3cc9d', '#d4b19b'][i % 3]);
        }
    }
    // Continuous plaster/oak wall backing; window/wood panel modules are independent sprites.
    const wall = (a, b) => { const A = iso(a), B = iso(b); const gradient = c.createLinearGradient(0, A.y - 64, 0, B.y); gradient.addColorStop(0, '#f3e2c8'); gradient.addColorStop(1, '#d6bea0'); c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.lineTo(B.x, B.y - 65); c.lineTo(A.x, A.y - 65); c.closePath(); c.fillStyle = gradient; c.fill(); c.strokeStyle = '#956c42'; c.lineWidth = 2; c.stroke(); };
    wall({ x: 0, y: 0 }, { x: w, y: 0 });
    wall({ x: 0, y: 0 }, { x: 0, y: h });
    for (let x = 1; x < w; x += 2) {
        const q = iso({ x, y: 0 });
        paintEnvironment(c, x % 4 === 1 ? 'window-right' : 'wall-right', q.x, q.y, 48, 12);
    }
    for (let y = 1; y < h; y += 2) {
        const q = iso({ x: 0, y });
        paintEnvironment(c, y % 4 === 1 ? 'wall-left' : 'window-left', q.x, q.y, 48, 12);
    }
    // An inset woven runner occupies no collision space, along the actual entrance corridor.
    polygon(p.entry ? [{ x: .2, y: 5.05 }, { x: 2.2, y: 5.05 }, { x: 2.2, y: 5.9 }, { x: .2, y: 5.9 }] : [{ x: w - 2.1, y: h - 2.8 }, { x: w - .2, y: h - 2.8 }, { x: w - .2, y: h - .2 }, { x: w - 2.1, y: h - .2 }], '#89936c', '#e2ce9f');
}
export const environmentFootprint = (placement, plan) => fixedMega(plan.level, plan.kitchenAnchorWidth, plan.prepIsland, plan.starterKitchenOnly).some(b => placement.x >= b.left && placement.x <= b.right && placement.y >= b.top && placement.y <= b.bottom);
/** Reuse approved isometric environment cutouts for large-hall floor decor. Collision footprints and ownership are unchanged. */
export function paintMegaDecor(c, p, d) { const q = iso(d); if (p.level >= 20 && !d.wall) {
    const id = { flower: 'plant', garden: 'plant', showcase: 'pastry', bread: 'shelf' }[d.decorId];
    if (id && paintEnvironment(c, id, q.x, q.y, 34, 6))
        return;
} const art = megaImage('assets/art/long-growth/' + d.decorId + '.svg'); if (art)
    c.drawImage(art, q.x - 14, q.y - (d.wall ? 38 : 24), 28, 28); }
