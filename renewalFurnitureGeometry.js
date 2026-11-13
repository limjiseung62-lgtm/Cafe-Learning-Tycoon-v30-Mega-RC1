import { studioItem } from './renewalFurnitureCatalog.js?v=v31-final-636a93f6f215';
export function studioDecorBox(d) { const s = studioItem(d.decorId); if (!s)
    return null; const [a, b] = s.size, w = d.rotation % 180 === 0 ? a : b, h = d.rotation % 180 === 0 ? b : a; return { left: d.x - w / 2, right: d.x + w / 2, top: d.y - h / 2, bottom: d.y + h / 2 }; }
/** The square-set artwork has one chair per edge, not two on each long side. */
export function studioChairOffsets(id) {
    const item = id ? studioItem(id) : undefined;
    if (!item?.kind)
        return undefined;
    const points = id === 'studio-two-bar' ? [{ x: -.35, y: .9 }, { x: .35, y: .9 }] : item.kind === 'four' && id !== 'studio-four-booth' ? [{ x: -1.2, y: 0 }, { x: 0, y: -1.2 }, { x: 0, y: 1.2 }, { x: 1.2, y: 0 }] : item.kind === 'two' ? [{ x: 0, y: -1.2 }, { x: 0, y: 1.2 }] : undefined;
    return points?.map(p => { const n = Math.hypot(p.x, p.y); return { ...p, accessX: p.x + p.x / n * .65, accessY: p.y + p.y / n * .65 }; });
}
export function studioTableSize(id) { const item = id ? studioItem(id) : undefined; return item?.kind === 'four' && id !== 'studio-four-booth' ? [1.4, 1.4] : undefined; }
/** Integrated set sheets include taller chair backs; align the sitting rig with their seat plane. */
export const studioSeatedLift = (id) => id && studioItem(id)?.kind ? 21 : 7;
