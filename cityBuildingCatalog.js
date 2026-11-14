// @ts-nocheck
import { byId as old } from './cityLegacyArt.js';
// Declared design coefficients, not measured demographic statistics. Tile side is 5 model metres.
const defs = [
    ['detached', '단독주택', 'housing', [[3, 3, 2], [3, 4, 2]], 1, 0, .35], ['rowhouse', '연립주택', 'housing', [[4, 3, 3], [4, 4, 3]], 1, 0, .20], ['villa', '빌라', 'housing', [[4, 4, 4], [3, 4, 3]], 1, 0, .22], ['low-apartment', '저층 아파트', 'housing', [[4, 4, 5], [4, 5, 6]], 1, 0, .20], ['high-apartment', '고층 아파트', 'housing', [[5, 5, 18], [6, 6, 24]], 1, 0, .16], ['mixed-residence', '주상복합', 'housing', [[6, 6, 16], [5, 6, 20]], .65, .30, .12],
    ['convenience', '편의점', 'commerce', [[3, 3, 1], [3, 3, 2]], 0, .85, .08], ['restaurant', '음식점', 'commerce', [[4, 3, 2], [3, 4, 2]], 0, .80, .12], ['small-retail', '소형 상가', 'commerce', [[3, 3, 2], [4, 3, 2]], 0, .90, .07], ['shophouse', '상가주택', 'commerce', [[4, 4, 4], [3, 4, 5]], .55, .40, .12], ['large-retail', '대형 상가', 'commerce', [[6, 5, 4], [6, 6, 5]], 0, .85, .12], ['department', '백화점', 'commerce', [[7, 7, 7], [8, 7, 8]], 0, .85, .10], ['shopping-mall', '쇼핑몰', 'commerce', [[8, 8, 5], [8, 7, 6]], 0, .80, .18],
    ['small-office', '소형 사무실', 'enterprise', [[4, 3, 4], [3, 4, 3]], 0, .95, .10], ['mid-office', '중형 오피스', 'enterprise', [[5, 5, 8], [5, 6, 10]], 0, .95, .12], ['high-office', '고층 업무 빌딩', 'enterprise', [[6, 6, 22], [6, 7, 28]], 0, .95, .10], ['corporate', '기업 사옥', 'enterprise', [[7, 7, 6], [8, 8, 12]], 0, .85, .20],
    ['hotel', '호텔', 'tourism', [[6, 6, 10], [5, 6, 18]], 0, .45, .20], ['tourist-info', '관광안내소', 'tourism', [[3, 3, 1], [4, 3, 1]], 0, .65, .25], ['observation', '전망대', 'tourism', [[5, 5, 5], [4, 4, 8]], 0, .35, .25], ['attraction', '관광 명소', 'tourism', [[6, 6, 2], [7, 6, 3]], 0, .35, .40], ['tourist-complex', '복합 관광시설', 'tourism', [[8, 8, 8], [8, 7, 12]], 0, .45, .30],
    ['library', '도서관', 'culture', [[6, 5, 3], [5, 6, 4]], 0, .22, .25], ['theater', '공연장', 'culture', [[7, 7, 3], [8, 7, 4]], 0, .25, .20], ['exhibition', '전시관', 'culture', [[6, 6, 2], [6, 5, 3]], 0, .25, .25], ['museum', '박물관', 'culture', [[7, 7, 4], [7, 8, 3]], 0, .25, .25], ['culture-center', '문화센터', 'culture', [[8, 8, 4], [8, 7, 5]], 0, .25, .30],
    ['school', '학교', 'public', [[7, 7, 3], [8, 6, 4]], 0, .15, .30], ['hospital', '병원', 'public', [[6, 6, 8], [7, 7, 10]], 0, .45, .15], ['fire', '소방서', 'public', [[5, 4, 2], [4, 5, 3]], 0, .40, .12], ['civic', '공공청사', 'public', [[6, 6, 4], [7, 6, 5]], 0, .50, .22],
    ['park', '공원', 'leisure', [[8, 8, 1], [7, 7, 1]], 0, .03, .90], ['plaza', '광장', 'leisure', [[7, 7, 1], [8, 6, 1]], 0, .03, .45], ['sports', '체육시설', 'leisure', [[8, 7, 2], [8, 8, 2]], 0, .15, .35], ['garden', '정원', 'leisure', [[6, 6, 1], [5, 6, 1]], 0, .05, .95], ['logistics', '물류센터', 'enterprise', [[8, 6, 2], [7, 7, 3]], 0, .65, .08]
];
export const groups = { housing: '주거', commerce: '상업', enterprise: '업무·기업', tourism: '관광', culture: '문화', public: '공공', leisure: '여가' };
export const assumptions = { tileMetres: 5, usableFloorShare: .65, residentM2: 32, jobM2: 28, occupancy: .82, roadTripsPerTile: 1.2, unit: '평가 주기 모형; 실제 통계·실시간 주민 수 아님' };
export const types = defs.map(([id, name, group, forms, residentialShare, employmentShare, greenShare]) => ({ id, name, group, forms, residentialShare, employmentShare, greenShare }));
export const assets = types.flatMap((t, i) => t.forms.map(([w, h, floors], j) => { const index = i * 2 + j, net = w * h * 25 * floors * .65; return { id: t.id + '-' + (j ? 'b' : 'a'), type: t.id, name: t.name + ' ' + (j ? 'B' : 'A'), group: t.group, w, h, floors, orientation: j ? 'right-street' : 'left-street', sheet: Math.floor(index / 9), cell: index % 9, anchor: [.5, .94], basePixels: 450, kind: 'new', profile: { populationCapacity: Math.floor(net * t.residentialShare / 32), jobs: Math.floor(net * t.employmentShare / 28), retailCapacity: t.group === 'commerce' ? Math.round(net * .16) : t.id === 'mixed-residence' ? Math.round(net * .05) : 0, visitors: t.group === 'tourism' ? Math.round(net * (t.id === 'hotel' ? .08 : .25)) : 0, cultureCapacity: t.group === 'culture' ? Math.round(net * .25) : 0, schoolSeats: t.id === 'school' ? Math.round(net * .6 / 3) : 0, hospitalBeds: t.id === 'hospital' ? Math.round(net * .4 / 30) : 0, fireCoverage: t.id === 'fire' ? 2500 : 0, civicCoverage: t.id === 'civic' ? 5000 : 0, greenArea: w * h * 25 * t.greenShare }, constructionCost: Math.max(20000, Math.round(net * 120 / 10000) * 10000), redevelopmentStage: floors >= 15 ? 3 : floors >= 5 ? 2 : 1 }; }));
const brandIds = ['main', 'commerce-branch', 'tourism-branch', 'culture-branch', 'brand-hq-1', 'brand-hq-2', 'brand-hq-3'];
for (const id of brandIds) {
    const a = old[id];
    assets.push({ ...a, id, type: id.startsWith('brand-hq') ? 'brand-hq' : id === 'main' ? 'brand-main' : 'brand-branch', group: 'brand', kind: 'legacy', legacySheet: a.sheet ?? 'original', floors: id === 'brand-hq-3' ? 18 : id === 'brand-hq-2' ? 8 : 3, orientation: 'approved', profile: { populationCapacity: 0, jobs: id === 'main' ? 100 : id.startsWith('brand-hq') ? 180 : 25, retailCapacity: id === 'main' ? 150 : 60, visitors: 0, cultureCapacity: 0, schoolSeats: 0, hospitalBeds: 0, fireCoverage: 0, civicCoverage: 0, greenArea: a.w * a.h * 25 * .25 }, constructionCost: null, redevelopmentStage: id === 'brand-hq-3' ? 3 : id === 'brand-hq-2' ? 2 : 1 });
}
export const byId = Object.fromEntries(assets.map(a => [a.id, a]));
export function setSheets(meta) { for (const a of assets)
    if (a.kind === 'new') {
        const s = meta.find(s => s.index === a.sheet);
        if (!s)
            throw Error('Missing source sheet ' + a.sheet);
        const col = a.cell % 3, row = Math.floor(a.cell / 3);
        a.frame = { x: Math.floor(col * s.width / 3), y: Math.floor(row * s.height / 3), w: Math.floor((col + 1) * s.width / 3) - Math.floor(col * s.width / 3), h: Math.floor((row + 1) * s.height / 3) - Math.floor(row * s.height / 3) };
        a.basePixels = a.frame.w * .88;
    } }
export const iso = (x, y) => ({ x: (x - y) * 24, y: (x + y) * 12 });
export const uniso = (x, y) => ({ x: (x / 24 + y / 12) / 2, y: (y / 12 - x / 24) / 2 });
export function artRect(b) { const a = byId[b.variantId]; if (!a?.frame)
    throw Error('Unloaded sprite ' + b.variantId); const base = iso(b.x + a.w, b.y + a.h), w = (a.w + a.h) * 24 * a.frame.w / a.basePixels, h = w * a.frame.h / a.frame.w; return { x: base.x - w * a.anchor[0], y: base.y - h * a.anchor[1], w, h }; }
