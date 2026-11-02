import { megaZones } from './megaZones.js?v=v30-rc1-f88374ed22e0';
import { validInterior, tableSeatCount } from './megaInventory.js?v=v30-rc1-f88374ed22e0';
import { allDecorationCatalog } from './longGrowthConfig.js?v=v30-rc1-f88374ed22e0';
import { cafeGrowthBalance } from './modeBalance.js?v=v30-rc1-f88374ed22e0';
import { tableKinds, turn } from './freeLayoutModel.js?v=v30-rc1-f88374ed22e0';
import { furnitureFor } from './furnitureCatalog.js?v=v30-rc1-f88374ed22e0';
export const megaDimensions = [[8, 6], [10, 7], [12, 8], [12, 10], [14, 10], [14, 12], [16, 12], [16, 14], [18, 14], [20, 16]].concat(Array.from({ length: 20 }, (_, i) => { const l = i + 11; return l < 20 ? [20, 16] : l < 30 ? [40, 30] : [64, 48]; }));
export const megaBudget = [4, 6, 6, 8, 8, 10, 12, 12, 14, 14, ...Array(9).fill(14), ...Array(10).fill(48), 96];
export const megaKey = (level, branch) => (branch ?? 'base') + ':' + level;
export const isMegaDeployment = () => typeof document !== 'undefined' && ['v26-v27-class-v30-local', 'v26-v27-class-v30-qa', 'v26-v27-class-v30b-local', 'v26-v27-class-v30b-qa', 'v30c-local', 'v30c-qa', 'v30d-local', 'v30d-qa', 'v30e-local', 'v30e-qa', 'v30e-common-local'].includes(document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '');
export const megaEnabled = (g) => g.mode === 'CAFE_GROWTH' && !!g.mega && (g.cafeLevel <= 10 || !!g.mega.paid);
export const toEngine = (p) => ({ x: p.x * 8, y: p.y * 12 }), toTile = (p) => ({ x: p.x / 8, y: p.y / 12 });
export const iso = (p, z = 0) => ({ x: (p.x - p.y) * 24, y: (p.x + p.y) * 12 - z });
export const uniso = (p) => ({ x: (p.x / 24 + p.y / 12) / 2, y: (p.y / 12 - p.x / 24) / 2 });
export function defaultMegaPlan(level, branch = null) { const centers = [[3.5, 2.5], [6.5, 2.5], [8.5, 4.5], [4.5, 7.5], [10.5, 9.5], [13.5, 4.5], [15.5, 11.5]]; return { version: 1, level, branch, tables: centers.slice(0, megaBudget[level - 1] / 2).map(([x, y], i) => ({ id: 'mega-' + (i + 1), kind: 'two', x, y, rotation: 0 })), decor: [] }; }
export function newMegaState(paid = false) { return { ...(paid ? { paid: { spaceLevel: 1, receipts: [] } } : {}), version: 1, source: 'new', plans: { [megaKey(1)]: { ...defaultMegaPlan(1), ...(paid ? { entry: { x: .5, y: 5.5 } } : {}) } } }; }
export function ensureMegaPlan(state, level, branch) { if (state.paid)
    level = state.paid.spaceLevel; const key = megaKey(level, branch); if (state.plans[key])
    return state.plans[key]; const previous = Object.values(state.plans).filter(p => p.level <= level).sort((a, b) => b.level - a.level)[0]; const p = previous ? { ...structuredClone(previous), level, branch: branch ?? null } : defaultMegaPlan(level, branch ?? null); const seats = p.tables.reduce((a, t) => a + tableKinds[t.kind].seats, 0); if (previous && !state.inventory && seats < megaBudget[level - 1]) {
    for (const t of defaultMegaPlan(level, branch ?? null).tables) {
        if (p.tables.some(a => a.id === t.id))
            continue;
        const next = { ...p, tables: [...p.tables, t] };
        if (!validateMegaPlan(next).length)
            p.tables.push(t);
        if (p.tables.reduce((a, t) => a + tableKinds[t.kind].seats, 0) >= megaBudget[level - 1])
            break;
    }
} if (validateMegaPlan(p).length)
    throw Error('확장 전 배치를 확인해 주세요. 기존 배치는 보존됩니다.'); return state.plans[key] = p; }
export function tableParts(t) { const size = t.kind === 'long' ? 2.3 : t.kind === 'four' ? 1.7 : 1, half = size / 2, parts = []; const rect = (cx, cy, w, h) => { const p = turn(cx, cy, t.rotation), vertical = t.rotation % 180 !== 0; parts.push({ left: t.x + p.x - (vertical ? h : w) / 2, right: t.x + p.x + (vertical ? h : w) / 2, top: t.y + p.y - (vertical ? w : h) / 2, bottom: t.y + p.y + (vertical ? w : h) / 2 }); }; rect(0, 0, size, .65); const n = tableKinds[t.kind].seats / 2; for (const side of [-1, 1])
    for (let i = 0; i < n; i++) {
        const slot = (side === -1 ? 0 : n) + i;
        if (!t.chairs || t.chairs.some(c => c.slot === slot))
            rect((i - (n - 1) / 2) * .7, side * .9, .45, .45);
    } return parts; }
export function megaChairs(t) { const n = tableKinds[t.kind].seats / 2; return [-1, 1].flatMap(side => Array.from({ length: n }, (_, i) => { const a = turn((i - (n - 1) / 2) * .7, side * .9, t.rotation), b = turn((i - (n - 1) / 2) * .7, side * 1.55, t.rotation); return { slot: (side === -1 ? 0 : n) + i, chair: { x: t.x + a.x, y: t.y + a.y }, access: { x: t.x + b.x, y: t.y + b.y }, rear: a.x - a.y > 0 }; })).filter(c => !t.chairs || t.chairs.some(q => q.slot === c.slot)); }
export function fixedMega(level, anchorWidth, prepIsland = false, starterOnly = false) { const [originalW, h] = megaDimensions[level - 1], w = anchorWidth ?? originalW; const boxes = [{ left: 0, right: 1.8, top: 0, bottom: 5 }]; if (level >= 4 && !starterOnly)
    boxes.push({ left: w - 5, right: w - 1, top: 0, bottom: 1.4 }); if (prepIsland && level === 10 && !starterOnly)
    boxes.push({ left: 14, right: 18, top: 6.5, bottom: 8 }); return boxes; }
const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const pointIn = (p, r, pad = .16) => p.x > r.left - pad && p.x < r.right + pad && p.y > r.top - pad && p.y < r.bottom + pad;
export const megaMetrics = { searches: 0, failures: 0, cacheHits: 0, expanded: 0 };
const graphCache = new WeakMap();
export function fixtureParts(f) { const W = f.rotation % 180 === 0 ? 2 : 1.2, H = f.rotation % 180 === 0 ? 1.2 : 2; return [{ left: f.x - W / 2, right: f.x + W / 2, top: f.y - H / 2, bottom: f.y + H / 2 }]; }
export function megaAllPickups(p) { return [...megaPickups(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly), ...(p.fixtures ?? []).flatMap(f => [-.55, .55].map(x => { const a = turn(x, 1, f.rotation); return toEngine({ x: f.x + a.x, y: f.y + a.y }); }))]; }
export function megaObstacles(p) { return [...(p.fixtures ?? []).flatMap(fixtureParts), ...fixedMega(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly), ...p.tables.flatMap(tableParts), ...p.decor.filter(d => !d.wall).map(d => ({ left: d.x - .35, right: d.x + .35, top: d.y - .35, bottom: d.y + .35 }))]; }
export const megaPointClear = (p, engine) => { const q = toTile(engine), d = megaDimensions[p.level - 1]; return !!d && q.x >= .25 && q.y >= .25 && q.x <= d[0] - .25 && q.y <= d[1] - .25 && !megaObstacles(p).some(r => pointIn(q, r)); };
/** Occupancy is built once per layout. Reverse BFS fields are shared by all workers heading to a fixed pickup/seat. Dynamic avoidance is temporary and never cached. */
export function megaRoute(p, from, to, avoid = []) {
    if (avoid.length) {
        const base = megaRoute(p, from, to), points = base.map(toTile), obstacles = avoid.map(toTile);
        const blocked = obstacles.some(q => points.slice(1).some((b, i) => { const a = points[i], dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy, t = den ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / den)) : 0, d = Math.hypot(q.x - a.x - t * dx, q.y - a.y - t * dy), initial = Math.hypot(q.x - points[0].x, q.y - points[0].y); return d < .42 && !(i === 0 && initial < .42 && d >= initial - .001); }));
        if (!blocked)
            return base;
    }
    megaMetrics.searches++;
    const stamp = JSON.stringify(p), [w, h] = megaDimensions[p.level - 1], W = w * 4, H = h * 4, size = W * (H + 1);
    let graph = graphCache.get(p);
    if (!graph || graph.stamp !== stamp) {
        const blocked = megaObstacles(p), mask = new Uint8Array(size);
        for (let y = 1; y < H; y++)
            for (let x = 1; x < W; x++)
                if (!blocked.some(r => pointIn({ x: x / 4, y: y / 4 }, r)))
                    mask[y * W + x] = 1;
        graph = { stamp, blocked, mask, routes: new Map(), fields: new Map() };
        graphCache.set(p, graph);
    }
    const a = toTile(from), b = toTile(to), key = [a.x, a.y, b.x, b.y].map(v => v.toFixed(3)).join('/');
    if (!avoid.length && graph.routes.has(key)) {
        megaMetrics.cacheHits++;
        return structuredClone(graph.routes.get(key));
    }
    const ix = (q) => Math.round(q.y * 4) * W + Math.round(q.x * 4), start = ix(a), end = ix(b), avoids = avoid.map(toTile), allowed = (id) => { if (!graph.mask[id])
        return false; const x = id % W / 4, y = Math.floor(id / W) / 4; return !avoids.some(c => { const d = Math.hypot(c.x - x, c.y - y), initial = Math.hypot(c.x - a.x, c.y - a.y); return d < .42 && !(initial < .42 && d >= initial - .001); }); };
    if (!allowed(start) || !allowed(end))
        throw Error('이동 시작점 또는 도착점이 가구와 겹쳐요.');
    let parent = !avoid.length ? graph.fields.get(end) : undefined;
    const reverse = !avoid.length;
    if (parent)
        megaMetrics.cacheHits++;
    else {
        parent = new Int32Array(size).fill(-1);
        if (reverse) {
            const queue = new Int32Array(size);
            let count = 1;
            queue[0] = end;
            parent[end] = end;
            for (let i = 0; i < count; i++) {
                const n = queue[i], x = n % W, y = Math.floor(n / W);
                megaMetrics.expanded++;
                for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const X = x + dx, Y = y + dy, id = Y * W + X;
                    if (X < 1 || X >= W || Y < 1 || Y >= H || parent[id] !== -1 || !allowed(id))
                        continue;
                    parent[id] = n;
                    queue[count++] = id;
                }
            }
            if (graph.fields.size >= 64)
                graph.fields.delete(graph.fields.keys().next().value);
            graph.fields.set(end, parent);
        }
        else {
            const score = new Float64Array(size).fill(Infinity), heap = [], heuristic = (id) => Math.abs(id % W - end % W) + Math.abs(Math.floor(id / W) - Math.floor(end / W));
            const push = (id, priority) => { const v = { id, priority }; let i = heap.length; heap.push(v); while (i) {
                const j = (i - 1) >> 1;
                if (heap[j].priority <= priority)
                    break;
                heap[i] = heap[j];
                i = j;
            } heap[i] = v; }, pop = () => { const first = heap[0], last = heap.pop(); if (heap.length) {
                let i = 0;
                while (i * 2 + 1 < heap.length) {
                    let c = i * 2 + 1;
                    if (c + 1 < heap.length && heap[c + 1].priority < heap[c].priority)
                        c++;
                    if (heap[c].priority >= last.priority)
                        break;
                    heap[i] = heap[c];
                    i = c;
                }
                heap[i] = last;
            } return first; };
            score[start] = 0;
            parent[start] = start;
            push(start, heuristic(start));
            while (heap.length) {
                const current = pop(), n = current.id;
                if (current.priority > score[n] + heuristic(n))
                    continue;
                megaMetrics.expanded++;
                if (n === end)
                    break;
                const x = n % W, y = Math.floor(n / W);
                for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const X = x + dx, Y = y + dy, id = Y * W + X, cost = score[n] + 1;
                    if (X < 1 || X >= W || Y < 1 || Y >= H || cost >= score[id] || !allowed(id))
                        continue;
                    score[id] = cost;
                    parent[id] = n;
                    push(id, cost + heuristic(id));
                }
            }
        }
    }
    if (parent[reverse ? start : end] < 0) {
        megaMetrics.failures++;
        throw Error('통로가 막혔어요.');
    }
    const nodes = [];
    for (let n = reverse ? start : end;; n = parent[n]) {
        nodes.push({ x: n % W / 4, y: Math.floor(n / W) / 4 });
        if (n === (reverse ? end : start))
            break;
    }
    if (!reverse)
        nodes.reverse();
    nodes[0] = a;
    nodes[nodes.length - 1] = b;
    const slim = [a];
    for (let i = 1; i < nodes.length - 1; i++) {
        const x = nodes[i - 1], y = nodes[i], z = nodes[i + 1];
        if ((y.x - x.x) * (z.y - y.y) !== (y.y - x.y) * (z.x - y.x))
            slim.push(y);
    }
    slim.push(b);
    const result = slim.map(toEngine);
    if (!avoid.length) {
        if (graph.routes.size >= 512)
            graph.routes.delete(graph.routes.keys().next().value);
        graph.routes.set(key, result);
    }
    return result;
}
const validations = new Map();
export function validateMegaPlan(p) { const stamp = JSON.stringify(p); const cached = validations.get(stamp); if (cached)
    return [...cached]; const result = validateMegaUncached(p); if (validations.size >= 256)
    validations.clear(); validations.set(stamp, result); return [...result]; }
function validateMegaUncached(p) {
    const errors = [];
    try {
        if (!p || (p.shopLayout !== undefined && typeof p.shopLayout !== 'boolean') || (p.starterKitchenOnly !== undefined && typeof p.starterKitchenOnly !== 'boolean') || (p.prepIsland !== undefined && (typeof p.prepIsland !== 'boolean' || p.prepIsland && p.level !== 10)) || (p.kitchenAnchorWidth !== undefined && (!Number.isInteger(p.kitchenAnchorWidth) || p.level < 4 || p.kitchenAnchorWidth < 12 || p.kitchenAnchorWidth > megaDimensions[p.level - 1][0])) || (p.entry !== undefined && (!Number.isFinite(p.entry.x) || !Number.isFinite(p.entry.y) || p.entry.x !== .5 || p.entry.y !== 5.5)) || (p.serviceHubs !== undefined && typeof p.serviceHubs !== 'boolean') || p.version !== 1 || !Number.isInteger(p.level) || p.level < 1 || p.level > 30 || ![null, 'garden', 'bakery', 'dessert'].includes(p.branch) || !Array.isArray(p.tables) || p.tables.length < 1 || p.tables.length > (p.level >= 30 ? 48 : p.level >= 20 ? 24 : 7) || new Set(p.tables.map(t => t.id)).size !== p.tables.length || !Array.isArray(p.decor) || p.decor.length > (p.level >= 20 ? 96 : 24) || new Set(p.decor.map(d => d.id)).size !== p.decor.length || !p.shopLayout && new Set(p.decor.map(d => d.decorId)).size !== p.decor.length)
            return ['배치 정보를 확인해 주세요.'];
        if (p.fixtures !== undefined && (!p.shopLayout || !Array.isArray(p.fixtures) || p.fixtures.length > (p.level >= 20 ? 24 : 6) || new Set(p.fixtures.map(f => f.id)).size !== p.fixtures.length))
            return ['준비대 정보를 확인해 주세요.'];
        const [w, h] = megaDimensions[p.level - 1];
        const boxes = [];
        for (const f of p.fixtures ?? []) {
            if (f.sku !== 'service-prep' || !/^[-a-zA-Z0-9_]{1,60}$/.test(f.id) || ![f.x, f.y].every(Number.isFinite) || ![0, 90, 180, 270].includes(f.rotation))
                return ['준비대 정보를 확인해 주세요.'];
            boxes.push({ id: f.id, parts: fixtureParts(f) });
        }
        for (const t of p.tables) {
            if (t.chairs !== undefined && (!p.shopLayout || !Array.isArray(t.chairs) || new Set(t.chairs.map(c => c.slot)).size !== t.chairs.length || t.chairs.some(c => !Number.isInteger(c.slot) || c.slot < 0 || c.slot >= (tableKinds[t.kind]?.seats ?? 0) || !/^[-a-zA-Z0-9_]{1,60}$/.test(c.id))))
                return ['의자 배치 정보를 확인해 주세요.'];
            if (!Object.hasOwn(tableKinds, t.kind) || !furnitureFor(t.kind, t.furnitureId) || !/^[-a-zA-Z0-9_]{1,60}$/.test(t.id) || ![0, 90, 180, 270].includes(t.rotation) || ![t.x, t.y].every(Number.isFinite))
                return ['테이블 정보를 확인해 주세요.'];
            boxes.push({ id: t.id, parts: tableParts(t) });
        }
        for (const d of p.decor) {
            if (![d.x, d.y].every(Number.isFinite) || !allDecorationCatalog.some(a => a.id === d.decorId) || ![0, 90, 180, 270].includes(d.rotation) || typeof d.wall !== 'boolean')
                return ['장식 정보를 확인해 주세요.'];
            if (!d.wall)
                boxes.push({ id: d.id, parts: [{ left: d.x - .35, right: d.x + .35, top: d.y - .35, bottom: d.y + .35 }] });
            else if (d.x < 0 || d.x > w || d.y !== 0)
                errors.push('벽 장식은 뒤쪽 벽에 놓아요.');
        }
        if (p.tables.reduce((a, t) => a + tableSeatCount(t), 0) > megaBudget[p.level - 1])
            errors.push(p.shopLayout ? '현재 매장에 놓을 수 있는 좌석 수를 초과했어요.' : '보유 좌석 수를 초과했어요.');
        for (const a of boxes) {
            if (a.parts.some(r => r.left < .2 || r.right > w - .2 || r.top < .2 || r.bottom > h - .2 || fixedMega(p.level, p.kitchenAnchorWidth, p.prepIsland, p.starterKitchenOnly).some(f => overlap(r, f))))
                errors.push('가구가 벽·주방을 벗어나거나 겹쳐요.');
            if (boxes.some(b => a.id < b.id && a.parts.some(r => b.parts.some(t => overlap(r, t)))))
                errors.push('가구끼리 겹쳐요.');
        }
        if (errors.length)
            return errors;
        const accesses = p.tables.flatMap(megaChairs).map(c => c.access);
        if (accesses.some(a => a.x < .25 || a.y < .25 || a.x > w - .25 || a.y > h - .25) || p.level >= 20 && accesses.some(a => !megaPointClear(p, toEngine(a))))
            return ['의자 앞 접근 공간을 비워 주세요.'];
        const root = toEngine(p.entry ?? { x: w - .5, y: h - .5 });
        const pickups = megaAllPickups(p);
        for (const t of p.tables)
            for (const c of megaChairs(t))
                try {
                    megaRoute(p, toEngine(c.access), root);
                }
                catch {
                    errors.push('좌석으로 가는 손님·직원 통로를 열어 주세요.');
                }
        for (const from of [...pickups, ...megaEntrances(p).map(e => e.inside), ...(p.level >= 20 && p.serviceHubs ? megaHubHomes(p) : megaHomes(p.level))])
            try {
                megaRoute(p, from, root);
            }
            catch {
                errors.push('입구와 주방의 연결을 열어 주세요.');
            }
    }
    catch {
        return ['배치 정보를 확인해 주세요.'];
    }
    return errors;
}
export function megaPickups(level, anchorWidth, prepIsland = false, starterOnly = false) { const w = anchorWidth ?? megaDimensions[level - 1][0]; return level >= 4 && !starterOnly ? [toEngine({ x: 2.5, y: .5 }), toEngine({ x: 2.5, y: 5.5 }), ...Array.from({ length: 4 }, (_, i) => toEngine({ x: w - 4.5 + i, y: 2.5 })), ...(prepIsland && level === 10 ? [toEngine({ x: 14.5, y: 8.75 }), toEngine({ x: 16.5, y: 8.75 })] : [])] : Array.from({ length: 6 }, (_, i) => toEngine({ x: 2.5, y: .5 + i })); }
export function megaHomes(level) { const [w, h] = megaDimensions[level - 1]; return Array.from({ length: level >= 30 ? 13 : level >= 20 ? 9 : 6 }, (_, i) => toEngine({ x: Math.round((w - 1.5 - i * 1.2) * 4) / 4, y: h - .5 })); }
export function validMega(v) { try {
    const s = v;
    return !!s && validPaid(s.paid) && validInterior(s) && (s.extended === undefined || s.extended === true) && s.version === 1 && ['new', 'confirmed-copy'].includes(s.source) && !!s.plans && Object.keys(s.plans).length > 0 && Object.keys(s.plans).length <= 100 && Object.entries(s.plans).every(([key, p]) => key === megaKey(p.level, p.branch) && (p.level <= 10 || s.extended === true) && !validateMegaPlan(p).length && p.tables.reduce((a, t) => a + tableSeatCount(t), 0) >= (s.inventory ? 1 : cafeGrowthBalance.cafes[Math.min(15, p.level) - 1].maxCustomers));
}
catch {
    return false;
} }
export function megaEntrances(p) { const [w, h] = megaDimensions[p.level - 1], a = p.entry ?? { x: w - .5, y: h - .5 }; return [{ inside: toEngine(a), outside: toEngine(p.entry ? { x: -.5, y: a.y } : { x: w + .5, y: h - .5 }) }, ...(p.level >= 20 ? [{ inside: toEngine({ x: w - .5, y: h / 2 }), outside: toEngine({ x: w + .5, y: h / 2 }) }, { inside: toEngine({ x: w / 2, y: h - .5 }), outside: toEngine({ x: w / 2, y: h + .5 }) }] : [])]; }
export function createMegaSpace(plan) { const [w, h] = megaDimensions[plan.level - 1], entrance = plan.entry ?? { x: w - .5, y: h - .5 }; const tables = plan.tables.map(t => ({ ...toEngine(t), tableId: t.id, tableKind: t.kind, rotation: t.rotation, furnitureId: t.furnitureId, scale: 1, servicePoints: megaChairs(t).map(c => toEngine(c.access)) })); const seats = plan.tables.flatMap(t => megaChairs(t).map((c, i) => { const p = toEngine(c.chair), access = toEngine(c.access), options = megaEntrances(plan).map(port => ({ ...port, path: megaRoute(plan, port.inside, access) })), best = options.sort((a, b) => a.path.slice(1).reduce((n, q, i) => n + Math.hypot(q.x - a.path[i].x, (q.y - a.path[i].y) * 2 / 3), 0) - b.path.slice(1).reduce((n, q, i) => n + Math.hypot(q.x - b.path[i].x, (q.y - b.path[i].y) * 2 / 3), 0))[0], entry = best.path; return { entrance: best.inside, exit: best.outside, ...p, seatId: t.id + '-seat-' + i, tableId: t.id, facing: c.rear ? 'left' : 'right', occupiedBy: null, cafeLevel: plan.level, scale: 1, servicePoint: access, approach: access, rear: c.rear, entryPath: entry, standPoint: p }; })); const pickups = megaAllPickups(plan); return { megaPlan: plan, level: plan.level, grown: true, worldScale: 1, branch: (plan.branch ?? undefined), entrance: toEngine(entrance), exit: toEngine(plan.entry ? { x: -.5, y: entrance.y } : { x: w + .5, y: h - .5 }), pickup: pickups[0], pickupSlots: pickups, staffWaitingPoints: plan.serviceHubs ? megaHubHomes(plan) : megaHomes(plan.level), staffAccessPoints: [], intermediateWaypoints: [], tables, seats }; }
export const megaTravelSeconds = (seat) => Math.max(1, seat.entryPath.slice(1).reduce((a, p, i) => a + Math.hypot((p.x - seat.entryPath[i].x) / 8, (p.y - seat.entryPath[i].y) / 12), 0) / 3);
function validPaid(p) { return !p || (Number.isInteger(p.spaceLevel) && p.spaceLevel >= 1 && p.spaceLevel <= 30 && Array.isArray(p.receipts) && p.receipts.length <= 10 && new Set(p.receipts.map(r => r.id)).size === p.receipts.length && p.receipts.every(r => [4, 10, 20, 30].includes(r.to) && Number.isInteger(r.from) && r.from >= 1 && r.from < r.to && Number.isSafeInteger(r.cost) && r.cost > 0 && r.to <= p.spaceLevel && r.id === 'space:' + r.from + ':' + r.to && typeof r.id === 'string' && r.id.length < 100 && Number.isFinite(Date.parse(r.at)))); }
const hubCache = new WeakMap();
export function megaHubHomes(p) { const stamp = JSON.stringify(p), cached = hubCache.get(p); if (cached?.stamp === stamp)
    return cached.points.map(q => ({ ...q })); if (p.level >= 20) {
    const points = [], pickups = megaAllPickups(p), count = p.level >= 30 ? 13 : 9;
    for (let pass = 0; pass < 6 && points.length < count; pass++)
        for (const z of megaZones(p)) {
            const q = toEngine({ x: z.x + z.w / 2 + (pass % 3 === 1 ? 1.5 : pass % 3 === 2 ? -1.5 : 0), y: z.y + 2.5 + Math.floor(pass / 3) * 1.5 });
            if (megaPointClear(p, q) && pickups.every(t => Math.hypot(q.x - t.x, (q.y - t.y) * 2 / 3) > 5) && points.every(t => Math.hypot(q.x - t.x, (q.y - t.y) * 2 / 3) >= 6))
                points.push(q);
            if (points.length === count)
                break;
        }
    if (points.length === count) {
        hubCache.set(p, { stamp, points });
        return points.map(q => ({ ...q }));
    }
} const [w, h] = megaDimensions[p.level - 1], pickups = megaAllPickups(p), access = p.tables.flatMap(megaChairs).map(c => toEngine(c.access)), candidates = [], distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3); for (let y = 2.5; y < h - 1; y += .5)
    for (let x = 2.5; x < w - 1; x += .5) {
        const point = toEngine({ x, y });
        if (!megaPointClear(p, point) || [...pickups, ...access].some(q => distance(q, point) < 5))
            continue;
        const score = Math.min(...pickups.map(q => distance(q, point))) + Math.min(...access.map(q => distance(q, point))) * .25;
        candidates.push({ point, score });
    } candidates.sort((a, b) => a.score - b.score || a.point.y - b.point.y || a.point.x - b.point.x); const points = []; for (const c of candidates) {
    if (points.every(q => distance(c.point, q) >= 6)) {
        points.push(c.point);
        if (points.length === (p.level >= 30 ? 13 : p.level >= 20 ? 9 : 6))
            break;
    }
} if (points.length < (p.level >= 30 ? 13 : p.level >= 20 ? 9 : 6))
    return megaHomes(p.level); hubCache.set(p, { stamp, points }); return points.map(q => ({ ...q })); }
export const isPaidDeployment = () => typeof document !== 'undefined' && /^v30[cde]-/.test(document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '');
