import { megaChairs, ensureMegaPlan } from './megaSpace.js?v=mega-5d509fb5dbfc';
import { inventorySku } from './megaInventory.js?v=mega-5d509fb5dbfc';
import { furnitureFor } from './furnitureCatalog.js?v=mega-5d509fb5dbfc';
import { allDecorationCatalog } from './longGrowthConfig.js?v=mega-5d509fb5dbfc';
import { saveInteriorLayout } from './megaShop.js?v=mega-5d509fb5dbfc';
export const installedIds = (p) => new Set([...p.tables.flatMap(t => [t.id, ...(t.chairs ?? []).map(c => c.id)]), ...p.decor.map(d => d.id), ...(p.fixtures ?? []).map(f => f.id)]);
export function interiorCandidate(s, p, id, x, y, rotation) {
    const item = s.mega?.inventory?.items.find(i => i.id === id), d = item && inventorySku(item.sku);
    if (!item || !d || ![x, y].every(Number.isFinite))
        return null;
    const q = structuredClone(p);
    if (d.type === 'chair') {
        const targets = q.tables.flatMap(t => megaChairs({ ...t, chairs: undefined }).filter(c => !t.chairs?.some(v => v.slot === c.slot && v.id !== id)).map(c => ({ t, c, dist: Math.hypot(c.chair.x - x, c.chair.y - y) }))).sort((a, b) => a.dist - b.dist);
        if (!targets.length || targets[0].dist > 1.5)
            return null;
        for (const t of q.tables)
            t.chairs = t.chairs?.filter(c => c.id !== id);
        (targets[0].t.chairs ??= []).push({ id, slot: targets[0].c.slot });
    }
    else if (d.type === 'table') {
        let t = q.tables.find(t => t.id === id);
        if (!t) {
            const f = furnitureFor(item.sku.includes('long') || item.sku.includes('workbench') ? 'long' : item.sku.includes('four') || ['garden-outdoor', 'bakery-bench'].includes(item.sku) ? 'four' : 'two', item.sku);
            if (!f)
                return null;
            t = { id, kind: f.kind, furnitureId: item.sku, x, y, rotation: (rotation ?? 0), integratedSeats: true, chairs: [] };
            const used = installedIds(q);
            for (const c of s.mega.inventory.items.filter(c => c.sku === 'chair' && item.receipt && c.receipt === item.receipt && !used.has(c.id)).slice(0, d.bundle))
                t.chairs.push({ id: c.id, slot: t.chairs.length });
            q.tables.push(t);
        }
        t.integratedSeats = true;
        t.x = x;
        t.y = y;
        if (rotation !== undefined)
            t.rotation = rotation;
    }
    else if (d.type === 'fixture') {
        q.fixtures ??= [];
        let f = q.fixtures.find(f => f.id === id);
        if (!f) {
            f = { id, sku: 'service-prep', x, y, rotation: (rotation ?? 0) };
            q.fixtures.push(f);
        }
        f.x = x;
        f.y = y;
        if (rotation !== undefined)
            f.rotation = rotation;
    }
    else {
        let a = q.decor.find(v => v.id === id);
        const def = allDecorationCatalog.find(v => v.id === item.sku.slice(6));
        if (!def)
            return null;
        if (!a) {
            a = { id, decorId: def.id, x, y, wall: def.slot === 'wall', rotation: (rotation ?? 0) };
            q.decor.push(a);
        }
        a.x = x;
        a.y = a.wall ? 0 : y;
        if (rotation !== undefined)
            a.rotation = rotation;
    }
    return q;
}
export function removeInterior(p, id) { const q = structuredClone(p); q.tables = q.tables.filter(t => t.id !== id); for (const t of q.tables)
    t.chairs = t.chairs?.filter(c => c.id !== id); q.decor = q.decor.filter(d => d.id !== id); q.fixtures = q.fixtures?.filter(f => f.id !== id); return q; }
export class InteriorHistory {
    state;
    repo;
    expected;
    undo = [];
    redo = [];
    constructor(state, repo, expected = state) {
        this.state = state;
        this.repo = repo;
        this.expected = expected;
    }
    get plan() { return ensureMegaPlan(this.state.mega, this.state.cafeLevel, this.state.growthBranch?.active ?? undefined); }
    commit(p, kind = 'edit') { const old = structuredClone(this.plan), r = saveInteriorLayout(this.state, p); if (!r.ok)
        return { ok: false, message: r.reason }; const w = this.repo.write(r.save, this.expected); if (!w.ok)
        return w; this.state = r.save; this.expected = r.save; if (kind === 'edit') {
        this.undo.push(old);
        this.undo = this.undo.slice(-40);
        this.redo = [];
    }
    else if (kind === 'undo') {
        this.undo.pop();
        this.redo.push(old);
    }
    else {
        this.redo.pop();
        this.undo.push(old);
    } return w; }
    back() { const p = this.undo.at(-1); return p ? this.commit(p, 'undo') : { ok: false, message: '되돌릴 작업이 없어요.' }; }
    forward() { const p = this.redo.at(-1); return p ? this.commit(p, 'redo') : { ok: false, message: '다시 할 작업이 없어요.' }; }
}
