import { architectureStyles, newAppearance } from './renewalAppearanceState.js?v=v31-5d872fe24674';
import { megaDimensions, iso } from './megaSpace.js?v=v31-5d872fe24674';
import { megaImage, bitmapFragment, cachedFragment } from './megaArt.js?v=v31-5d872fe24674';
export const appearanceFor = (g) => g.mode === 'CAFE_GROWTH' && g.mega?.finalGrowth?.renewal ? (g.mega.finalGrowth.renewal.appearance ?? (g.mega.finalGrowth.renewal.origin === 'new' ? newAppearance() : undefined)) : undefined;
export function architectureSprite(style, row, width, async = false) { const img = megaImage('assets/art/renewal-v31/architecture.png'); if (!img)
    return null; const w = img.naturalWidth / 4, h = img.naturalHeight / 3, col = architectureStyles.indexOf(style), box = [col * w, row * h, w, h], height = width * h / w, tile = async ? bitmapFragment(img, box, width, height) : cachedFragment(img, box, width, height); return tile ? { tile, width, height } : null; }
export const architecturePalette = (a) => ({ wood: ['#dba774', '#d79a68', '#e0ac7b', '#d79f70', '#e6b387'], brick: ['#c88b70', '#b77a65', '#d39a7c', '#c48a72', '#daac8c'], glass: ['#e4e1d5', '#d3dcd7', '#dae5df', '#e9e8de', '#c9d6d0'], brand: ['#f2e6c9', '#e3d3ad', '#e8dfc7', '#ddcba8', '#ede3ce'] }[a.selected.floor]);
export function paintArchitectureWalls(c, p, a, async = false) { const [w, h] = megaDimensions[p.level - 1]; for (const [axis, length, row] of [['x', w, 1], ['y', h, 0]])
    for (let t = 1; t < length; t += 2) {
        if ((p.doors ?? []).some(d => d.wall === (axis === 'x' ? 'north' : 'west') && Math.abs(d.offset - t) < 1.5))
            continue;
        const q = iso(axis === 'x' ? { x: t, y: 0 } : { x: 0, y: t }), style = t % 4 === 1 ? a.selected.window : a.selected.wall, s = architectureSprite(style, row, 48, async);
        if (s)
            c.drawImage(s.tile, q.x - 24, q.y - s.height + 12, 48, s.height);
        if (a.selected.light !== 'wood' && t % 6 === 1) {
            c.save();
            c.fillStyle = a.selected.light === 'brand' ? '#f3d38c' : '#fff2bd';
            c.shadowColor = '#ffc66b';
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(q.x + 14, q.y - 22, 2.5, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    } }
