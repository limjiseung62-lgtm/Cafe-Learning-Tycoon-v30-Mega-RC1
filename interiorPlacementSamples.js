import { megaDimensions } from './megaSpace.js?v=mega-d152ad969955';
/** Bounded visual samples span the whole floor plus the current cursor neighborhood. Direct placement is never restricted to this list. */
export function placementSamples(p, center) { const [w, h] = megaDimensions[p.level - 1], out = [], seen = new Set(), add = (x, y) => { if (x < .5 || y < .5 || x > w - .5 || y > h - .5)
    return; const k = x + ':' + y; if (!seen.has(k)) {
    seen.add(k);
    out.push({ x, y });
} }; for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++)
        add(Math.round(center.x) - 4 + col + .5, Math.round(center.y) - 4 + row + .5); const sx = Math.max(1, Math.ceil(w / 8)), sy = Math.max(1, Math.ceil(h / 8)); for (let y = .5; y < h; y += sy)
    for (let x = .5; x < w; x += sx)
        add(x, y); return out; }
