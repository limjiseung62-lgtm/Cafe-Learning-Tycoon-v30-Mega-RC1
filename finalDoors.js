import { ensureMegaPlan, megaDimensions, validateMegaPlan, megaEntrances, toTile } from './megaSpace.js?v=mega-5d509fb5dbfc';
export function explicitDoors(p) { if (p.doors)
    return structuredClone(p.doors); const [w, h] = megaDimensions[p.level - 1]; return megaEntrances(p).map((port, i) => { const q = toTile(port.inside), o = toTile(port.outside), wall = o.x < 0 ? 'west' : o.x > w ? 'east' : o.y < 0 ? 'north' : 'south'; return { id: 'door-inherited-' + i, wall, offset: wall === 'west' || wall === 'east' ? q.y : q.x }; }); }
/** First gate supports moving existing owned portals. Additional purchases wait for the logistics/economy gate. */
export function prepareDoorMove(source, id, wall, offset) { if (!source.mega?.finalGrowth || source.mode !== 'CAFE_GROWTH')
    return { ok: false, reason: '로컬 GROWTH 후보에서만 출입구를 바꿀 수 있어요.' }; const save = structuredClone(source), p = ensureMegaPlan(save.mega, save.cafeLevel, save.growthBranch?.active ?? undefined); p.doors = explicitDoors(p); const d = p.doors.find(d => d.id === id); if (!d)
    return { ok: false, reason: '소유한 출입구를 선택해 주세요.' }; d.wall = wall; d.offset = offset; const errors = validateMegaPlan(p); if (errors.length)
    return { ok: false, reason: errors[0] }; return { ok: true, save }; }
