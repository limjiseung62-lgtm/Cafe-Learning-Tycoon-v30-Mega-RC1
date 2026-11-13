import { megaZones } from './megaZones.js?v=v31-final-636a93f6f215';
import { iso } from './megaSpace.js?v=v31-final-636a93f6f215';
/** Surface finish only: same owned tiles, furniture, collisions and routing. */
export function paintRenewalFinishes(c, p, f) { for (const receipt of f?.receipts ?? []) {
    if (!['terrace', 'vip'].includes(receipt.kind))
        continue;
    const zone = megaZones(p).find(z => receipt.kind === 'terrace' ? ['terrace', 'garden'].includes(z.id) : z.id === 'vip');
    if (!zone)
        continue;
    const { x, y, w, h } = zone, points = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }].map(iso);
    c.save();
    c.beginPath();
    points.forEach((q, i) => i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y));
    c.closePath();
    c.fillStyle = receipt.kind === 'terrace' ? '#6f8c7133' : '#69475933';
    c.fill();
    c.strokeStyle = receipt.kind === 'terrace' ? '#506c4a' : '#967049';
    c.lineWidth = 3;
    c.stroke();
    c.clip();
    for (let row = y; row < y + h; row++) {
        const a = iso({ x, y: row }), b = iso({ x: x + w, y: row });
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.strokeStyle = receipt.kind === 'terrace' ? '#e1c69d55' : '#f3dba455';
        c.lineWidth = 1;
        c.stroke();
    }
    c.restore();
} }
