import { iso, toTile } from './megaSpace.js';
// Distance-driven presentation only. Never changes simulation position, timing or facing assets.
export class MegaActorMotion {
    tracks = new Map();
    sample(id, position, seconds) {
        const p = iso(toTile(position)), old = this.tracks.get(id), dx = old ? p.x - old.point.x : 0, dy = old ? p.y - old.point.y : 0, step = Math.hypot(dx, dy), stepped = step > .001 && step < 70, moving = stepped || (seconds !== undefined && !!old?.moving && seconds - old.movedAt < .16);
        const distance = (old?.distance ?? 0) + (stepped ? step : 0), direction = stepped ? (dx < 0 ? (dy < 0 ? 'NW' : 'SW') : (dy < 0 ? 'NE' : 'SE')) : old?.direction ?? 'SE';
        const value = { point: p, distance, facing: stepped ? (dx < 0 ? 'left' : 'right') : old?.facing ?? 'right', direction, moving, phase: distance / 9, movedAt: stepped ? (seconds ?? 0) : old?.movedAt ?? 0 };
        this.tracks.set(id, value);
        return value;
    }
    retain(ids) { for (const id of this.tracks.keys())
        if (!ids.has(id))
            this.tracks.delete(id); }
    clear() { this.tracks.clear(); }
}
