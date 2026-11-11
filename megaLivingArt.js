import { livingFrames } from './megaLivingFrames.js?v=mega-d152ad969955';
import { livingCatalog } from './megaLivingCatalog.js?v=mega-d152ad969955';
export function livingWalkAsset(identity, m) {
    const direction = ['SE', 'SW', 'NW', 'NE'].indexOf(m.direction);
    if (direction < 0)
        return null;
    if (identity !== 'owner' && identity !== 'student') {
        const sheet = livingCatalog[identity];
        if (!sheet)
            return null;
        const offset = direction * 2 + (m.moving ? Math.floor(m.phase / 2) % 2 : 0), cell = sheet.cells[offset];
        return { file: sheet.file, width: sheet.width, height: sheet.height, box: [...cell.box], anchorX: cell.anchorX, anchorY: cell.anchorY, nativeFacing: sheet.facings[direction] };
    }
    const row = (identity === 'owner' ? 0 : 4) + direction, r = livingFrames.rows[row], column = m.moving ? Math.floor(m.phase) % 4 : 1, x = column * livingFrames.width / 4, w = livingFrames.width / 4;
    return { file: 'assets/web/mega-v30c/owner-student-walk.webp', width: livingFrames.width, height: livingFrames.height, box: [x, r.top, w, r.bottom - r.top], anchorX: x + w / 2, anchorY: r.baseline, nativeFacing: m.facing };
}
