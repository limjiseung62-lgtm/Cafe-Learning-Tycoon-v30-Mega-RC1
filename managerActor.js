import { managerFrames } from './managerFrames.js';
import { megaPointClear, megaRoute, toEngine, megaDimensions, iso, toTile } from './megaSpace.js';
import { guestPose } from './spatial.js';
import { managerById } from './managerState.js';
const actors = new WeakMap();
const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3);
export function managerActor(g) { return actors.get(g); }
export function talkManager(g) { const a = actors.get(g); if (a) {
    a.talkUntil = g.elapsedTime + 12;
    a.moving = false;
    a.back = false;
} }
export function tickManager(g, dt) {
    if (g.mode !== 'CAFE_GROWTH' || !g.mega?.manager?.selected || !g.serviceSpace?.megaPlan)
        return;
    const space = g.serviceSpace, plan = space.megaPlan, [w, h] = megaDimensions[plan.level - 1], stamp = plan, others = [...g.service.workers.map(w => w.position), ...g.guests.map(x => guestPose(x, space))];
    let a = actors.get(g);
    const free = (p) => megaPointClear(plan, p) && others.every(o => dist(p, o) > 4);
    const candidates = () => [...space.staffAccessPoints, ...space.staffWaitingPoints, ...Array.from({ length: 80 }, (_, i) => toEngine({ x: 1.5 + (i % 10) * (w - 3) / 10, y: 1.5 + Math.floor(i / 10) * (h - 3) / 8 }))].filter(free);
    if (!a) {
        const p = candidates().find(p => space.pickupSlots.every(v => dist(p, v) > 6));
        if (!p)
            return;
        a = { position: { ...p }, moving: false, back: false, facing: 'right', distance: 0, talkUntil: 0, nextThink: g.elapsedTime + 2, path: [], index: 1, stamp };
        actors.set(g, a);
    }
    if (a.stamp !== stamp) {
        a.stamp = stamp;
        a.path = [];
        a.nextThink = 0;
        if (!megaPointClear(plan, a.position)) {
            const p = candidates()[0];
            if (!p)
                return;
            a.position = { ...p };
        }
    }
    a.moving = false;
    if (a.talkUntil > g.elapsedTime)
        return;
    if (g.elapsedTime >= a.nextThink) {
        a.nextThink = g.elapsedTime + 6;
        a.path = [];
        const near = candidates().filter(p => dist(p, a.position) > 8 && dist(p, a.position) < 90).sort((p, q) => dist(p, a.position) - dist(q, a.position));
        const offset = Math.floor(g.elapsedTime / 6) % Math.max(1, near.length);
        for (let i = 0; i < Math.min(10, near.length); i++) {
            const target = near[(offset + i) % near.length];
            try {
                a.path = megaRoute(plan, a.position, target, others);
                a.index = 1;
                break;
            }
            catch { /* Wait and try another connected corridor. */ }
        }
    }
    const target = a.path[a.index];
    if (!target)
        return;
    const d = dist(a.position, target), step = Math.min(d, dt * 15), next = d < .001 ? target : { x: a.position.x + (target.x - a.position.x) * step / d, y: a.position.y + (target.y - a.position.y) * step / d };
    if (!megaPointClear(plan, next) || others.some(o => dist(next, o) < 3.5 && dist(next, o) <= dist(a.position, o))) {
        a.nextThink = Math.min(a.nextThink, g.elapsedTime + .4);
        return;
    }
    const from = iso(toTile(a.position)), to = iso(toTile(next));
    a.facing = to.x < from.x ? 'left' : 'right';
    a.back = to.y < from.y;
    a.distance += step;
    a.moving = step > .001;
    a.position = { ...next };
    if (d <= step + .001)
        a.index++;
}
export function managerSprite(g) { const a = actors.get(g), id = g.mega?.manager?.selected; if (!a || !id)
    return null; const row = managerById(id).row, column = a.talkUntil > g.elapsedTime ? 6 + Math.floor(g.elapsedTime * 1.5) % 2 : a.moving ? (a.back ? 4 : 1) + Math.floor(a.distance / 3) % 2 : (a.back ? 3 : 0), top = [0, 345, 674][row], bottom = top + [340, 325, 350][row]; return { file: 'assets/art/managers/companion-atlas.png', width: 1536, height: 1024, box: [...managerFrames[row][column].box], anchorX: managerFrames[row][column].anchorX, anchorY: managerFrames[row][column].anchorY, nativeFacing: 'right' }; }
