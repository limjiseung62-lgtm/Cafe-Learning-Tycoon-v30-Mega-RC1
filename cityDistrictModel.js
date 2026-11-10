// @ts-nocheck
import { assets, byId } from './cityBuildingCatalog.js?v=mega-5d509fb5dbfc';
export const stageDefs = [{ id: 'early', name: '초기 · 작은 현대 도시', cols: 7, rows: 5 }, { id: 'middle', name: '중기 · 자라는 상업도시', cols: 8, rows: 7 }, { id: 'late', name: '후기 · 다채로운 대도시', cols: 10, rows: 9 }];
const widths = [9, 8, 11, 9, 10, 8, 11, 9, 10, 9], heights = [9, 10, 8, 11, 9, 10, 8, 11, 9];
const vertical = [3, 3, 4.5, 3, 3, 4, 3, 3.5, 3, 3, 3], horizontal = [3, 3, 4, 3, 4.5, 3, 3, 4, 3, 3];
export const districts = { commerce: { name: '상업지구', color: '#d0a076' }, housing: { name: '주거지구', color: '#9cab7e' }, enterprise: { name: '업무지구', color: '#739799' }, tourism: { name: '관광지구', color: '#86b9bd' }, culture: { name: '문화지구', color: '#ae95b5' } };
export const brandSites = { 'parcel-3-1': { asset: 'main', kind: 'main', name: '본점' }, 'parcel-1-3': { kind: 'hq', name: '본부' }, 'parcel-1-1': { asset: 'commerce-branch', kind: 'branch', branchId: 2, name: '2호점' }, 'parcel-1-5': { asset: 'tourism-branch', kind: 'branch', branchId: 3, name: '3호점', stage: 1 }, 'parcel-4-4': { asset: 'culture-branch', kind: 'branch', branchId: 4, name: '4호점', stage: 2 } };
const publicSlots = { 'parcel-4-0': 'school', 'parcel-2-3': 'fire', 'parcel-0-4': 'civic', 'parcel-4-3': 'hospital', 'parcel-6-0': 'sports', 'parcel-6-4': 'museum', 'parcel-5-5': 'exhibition', 'parcel-0-7': 'logistics', 'parcel-0-8': 'observation', 'parcel-3-6': 'garden', 'parcel-6-7': 'plaza', 'parcel-8-9': 'park' };
const mod = (x, n) => ((x % n) + n) % n;
function district(row, col) { return row >= 4 && col >= 4 && col <= 7 ? 'culture' : col >= 8 || col >= 5 && col <= 6 && row <= 1 ? 'tourism' : col <= 2 && row >= 2 ? 'housing' : row <= 2 && col >= 2 && col <= 4 || row >= 3 && row <= 4 && col >= 3 && col <= 5 ? 'enterprise' : 'commerce'; }
export function makeCity(stageIndex = 2) {
    const stage = stageDefs[stageIndex], parcels = [], roads = [], buildings = [], landscapes = [];
    const xs = [], ys = [];
    let x = 2, y = 2;
    for (let c = 0; c < stage.cols; c++) {
        xs.push(x + vertical[c]);
        x += vertical[c] + widths[c];
    }
    for (let r = 0; r < stage.rows; r++) {
        ys.push(y + horizontal[r]);
        y += horizontal[r] + heights[r];
    }
    const width = x + vertical[stage.cols] + 2, height = y + horizontal[stage.rows] + 2;
    for (let c = 0; c <= stage.cols; c++)
        roads.push({ id: 'v-' + c, x: c === stage.cols ? x : xs[c] - vertical[c], y: 2, w: vertical[c], h: height - 4, kind: vertical[c] >= 4 ? 'avenue' : 'street' });
    for (let r = 0; r <= stage.rows; r++)
        roads.push({ id: 'h-' + r, x: 2, y: r === stage.rows ? y : ys[r] - horizontal[r], w: width - 4, h: horizontal[r], kind: horizontal[r] >= 4 ? 'avenue' : 'street' });
    const count = id => buildings.filter(b => b.variantId === id).length;
    const add = (p, a, dx, dy, extra = {}) => { const b = { id: p.id + '/lot-' + buildings.filter(b => b.parcelId === p.id).length, parcelId: p.id, type: a.type, variantId: a.id, x: p.x + dx, y: p.y + dy, w: a.w, h: a.h, orientation: a.orientation, owner: 'environment', development: 1, occupancy: .82, redevelopmentStage: a.redevelopmentStage, constructionCost: a.constructionCost, region: p.district, investmentEffects: { profile: a.id }, saveLink: null, ...extra }; buildings.push(b); return b; };
    const nearby = (p, a) => buildings.reduce((n, b) => { const q = parcels.find(q => q.id === b.parcelId); if (!q)
        return n; const d = Math.abs(p.row - q.row) + Math.abs(p.col - q.col); return n + (d === 0 ? (b.variantId === a.id ? 1000 : b.type === a.type ? 80 : 0) : d === 1 ? (b.variantId === a.id ? 200 : b.type === a.type ? 12 : 0) : 0); }, 0);
    const isNearBrand = p => Object.entries(brandSites).some(([id, s]) => { if ((s.stage ?? 0) > stageIndex)
        return false; const [, r, c] = id.split('-').map(Number); return Math.abs(p.row - r) + Math.abs(p.col - c) <= 1; });
    function choose(p, rect, primary = false, force) { const desired = stageIndex === 0 ? 2 : stageIndex === 1 ? 6 : p.district === 'enterprise' ? 22 : p.district === 'housing' && p.col === 2 ? 18 : 6; let choices = assets.filter(a => a.kind === 'new' && a.w <= rect.w + 1e-8 && a.h <= rect.h + 1e-8 && (force ? a.type === force : (a.group === p.district || !primary && ['commerce', 'leisure'].includes(a.group))) && (force || stageIndex > 0 || a.floors <= 4) && (force || !isNearBrand(p) || a.floors <= 5)); if (!choices.length && !force)
        choices = assets.filter(a => a.kind === 'new' && a.w <= rect.w && a.h <= rect.h && ['detached', 'convenience', 'garden', 'small-retail'].includes(a.type)); return choices.toSorted((a, b) => (nearby(p, a) + count(a.id) * 2 + Math.abs(a.floors - desired) * 1.6 + mod(assets.indexOf(a) * 7 + p.row * 17 + p.col * 31, 19) * .01) - (nearby(p, b) + count(b.id) * 2 + Math.abs(b.floors - desired) * 1.6 + mod(assets.indexOf(b) * 7 + p.row * 17 + p.col * 31, 19) * .01))[0]; }
    for (let row = 0; row < stage.rows; row++)
        for (let col = 0; col < stage.cols; col++) {
            const p = { id: `parcel-${row}-${col}`, row, col, x: xs[col], y: ys[row], w: widths[col], h: heights[row], district: district(row, col), roadFrontage: true };
            parcels.push(p);
            const brand = brandSites[p.id];
            if (brand && (brand.stage ?? 0) <= stageIndex) {
                const a = byId[brand.kind === 'hq' ? 'brand-hq-' + (stageIndex + 1) : brand.asset], dx = (p.w - a.w) / 2;
                add(p, a, dx, 0, { brandLink: { ...brand, company: '새봄 카페' }, owner: 'brand-example', saveLink: brand.branchId ? `v26.branches[id=${brand.branchId}]` : brand.kind === 'hq' ? 'v26.enterprise' : 'mega.paid.spaceLevel' });
                const depth = Math.max(0, p.h - a.h);
                if (depth)
                    landscapes.push({ id: p.id + '-forecourt', parcelId: p.id, x: p.x, y: p.y + a.h, w: p.w, h: depth, kind: 'brand-plaza', greenShare: .2 });
                continue;
            }
            let forced = publicSlots[p.id];
            if (stageIndex === 0 && forced === 'hospital')
                forced = 'plaza';
            if (forced) {
                const a = choose(p, { w: p.w, h: p.h }, true, forced);
                if (a) {
                    add(p, a, (p.w - a.w) / 2, 0);
                    landscapes.push({ id: p.id + '-approach', parcelId: p.id, x: p.x, y: p.y + a.h, w: p.w, h: p.h - a.h, kind: ['school', 'hospital', 'fire', 'civic'].includes(forced) ? 'parking' : 'pedestrian', greenShare: .15 });
                    continue;
                }
            }
            const small = stageIndex === 0 || p.district === 'housing' && col === 0;
            const primaryRect = { x: 0, y: 0, w: small ? Math.min(4, p.w) : p.w, h: small ? Math.min(4, p.h) : p.h };
            if (!small && p.w >= 9 && p.h >= 9 && p.district !== 'tourism' && p.district !== 'culture' && !(stageIndex === 2 && p.district === 'enterprise') && !(stageIndex === 1 && (row + col) % 2 === 0)) {
                primaryRect.w = p.w - 3.25;
                primaryRect.h = p.h - 3.25;
            }
            const first = choose(p, primaryRect, true);
            if (!first)
                continue;
            add(p, first, 0, 0);
            const free = [{ x: first.w + .25, y: 0, w: p.w - first.w - .25, h: p.h }, { x: 0, y: first.h + .25, w: first.w, h: p.h - first.h - .25 }];
            const max = stageIndex === 0 ? 3 : stageIndex === 1 ? 4 : 5;
            while (free.length && buildings.filter(b => b.parcelId === p.id).length < max) {
                const rect = free.shift();
                if (rect.w < 3 || rect.h < 3)
                    continue;
                const a = choose(p, rect, false);
                if (!a)
                    continue;
                add(p, a, rect.x, rect.y);
                free.push({ x: rect.x + a.w + .25, y: rect.y, w: rect.w - a.w - .25, h: rect.h }, { x: rect.x, y: rect.y + a.h + .25, w: a.w, h: rect.h - a.h - .25 });
            }
        }
    return { version: 'city-indicators-design-v3', stage, stageIndex, width, height, parcels, roads, buildings, landscapes, trafficInvestment: 0, revision: 0, cash: 0, receipts: [], history: [], brand: { name: '새봄 카페', color: '#2c735f' }, note: '합성 도시 모형; 실제 학생 저장/자산/정산과 분리' };
}
export function repetition(city) { let adjacentPairs = 0, repeatedPairs = 0; const freq = {}; for (const b of city.buildings)
    freq[b.variantId] = (freq[b.variantId] ?? 0) + 1; for (let i = 0; i < city.buildings.length; i++)
    for (let j = i + 1; j < city.buildings.length; j++) {
        const a = city.buildings[i], b = city.buildings[j], p = city.parcels.find(p => p.id === a.parcelId), q = city.parcels.find(p => p.id === b.parcelId);
        if (Math.abs(p.row - q.row) + Math.abs(p.col - q.col) !== 1)
            continue;
        adjacentPairs++;
        if (a.variantId === b.variantId)
            repeatedPairs++;
    } return { objects: city.buildings.length, types: new Set(city.buildings.map(b => b.type)).size, variants: Object.keys(freq).length, maxSameVariant: Math.max(...Object.values(freq)), adjacentPairs, repeatedPairs, adjacentRepeatRate: adjacentPairs ? repeatedPairs / adjacentPairs : 0, frequency: freq }; }
