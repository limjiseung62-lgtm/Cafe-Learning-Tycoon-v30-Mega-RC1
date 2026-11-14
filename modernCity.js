import { validUrbanMeta } from './cityUrbanSchema.js';
export const cityRegions = [{ cols: 7, rows: 5, cost: 0 }, { cols: 8, rows: 7, cost: 1000000 }, { cols: 10, rows: 9, cost: 4000000 }];
export const cityFacilities = {
    commerce: { names: ['소형 상가', '중형 상업시설', '대형 쇼핑몰'], assets: ['shop', 'arcade', 'mall'], costs: [100000, 250000, 700000], effect: '지역 소비 수요·본점 매출' },
    housing: { names: ['저층 주택', '아파트', '고층 주거단지'], assets: ['house', 'apartment', 'tower'], costs: [80000, 200000, 600000], effect: '고객 기반·대기 여유' },
    tourism: { names: ['방문객 정원', '관광 호텔', '복합 관광명소'], assets: ['park', 'hotel', 'tourism-complex'], costs: [120000, 300000, 900000], effect: '관광 수요·본점 방문 간격' },
    culture: { names: ['작은 동네 서점', '지역 도서관', '대형 공연 문화센터'], assets: ['culture-small', 'library', 'culture-center'], costs: [60000, 180000, 420000], effect: '문화 손님·분점 브랜드 수요' },
    enterprise: { names: ['물류 지원 시설', '업무 지원 빌딩', '기업 운영 센터'], assets: ['logistics', 'office', 'hq'], costs: [100000, 250000, 600000], effect: '분점 운영 효율' }
};
export const fields = Object.keys(cityFacilities);
export function cityParcels(region) { const a = cityRegions[region - 1]; return Array.from({ length: a.cols * a.rows }, (_, i) => { const row = Math.floor(i / a.cols), col = i % a.cols; const field = col >= 5 && row < 4 ? 'tourism' : row >= 4 && col >= 4 ? 'culture' : row >= 2 && col <= 2 ? 'housing' : row < 2 && col >= 2 ? 'enterprise' : 'commerce'; return { id: `parcel-${row}-${col}`, row, col, x: 6 + 12 * col, y: 6 + 12 * row, w: 9, h: 9, district: field, roadFrontage: true }; }); }
export const mainSite = 'parcel-3-1', hqSite = 'parcel-1-3';
export const publicSites = ['parcel-4-0', 'parcel-6-7', 'parcel-8-9'];
export function modernCityFor(v) {
    if (v.enterprise?.modernCity) {
        const c = structuredClone(v.enterprise.modernCity);
        for (const b of v.branches)
            if (!c.branchSites[b.id]) {
                const p = cityParcels(c.region).find(p => p.district === b.region && !c.plots[p.id] && ![mainSite, hqSite, ...publicSites, ...Object.values(c.branchSites)].includes(p.id)) ?? cityParcels(c.region).find(p => !c.plots[p.id] && ![mainSite, hqSite, ...publicSites, ...Object.values(c.branchSites)].includes(p.id));
                if (p)
                    c.branchSites[b.id] = p.id;
            }
        return c;
    }
    const c = { version: 1, region: 1, revision: 0, plots: {}, branchSites: {}, receipts: [] };
    const parcels = cityParcels(1);
    const reserved = new Set([mainSite, hqSite, ...publicSites, 'parcel-1-1', 'parcel-1-5', 'parcel-4-4']);
    for (const field of fields.filter(f => f !== 'enterprise')) {
        let left = v.investments[field] + 1;
        for (const p of [...parcels.filter(p => p.district === field), ...parcels.filter(p => p.district !== field)].filter(p => !reserved.has(p.id) && !c.plots[p.id])) {
            if (!left--)
                break;
            c.plots[p.id] = { field, tier: Math.min(3, 1 + Math.floor(v.investments[field] / 2)), legacy: true };
        }
    }
    for (const b of v.branches)
        c.branchSites[b.id] = { '2': 'parcel-1-1', '3': 'parcel-1-5', '4': 'parcel-4-4' }[b.id];
    return c;
}
export function validModernCity(c) { try {
    if (!c || (c.urban !== undefined && !validUrbanMeta(c.urban, c)) || c.version !== 1 || ![1, 2, 3].includes(c.region) || !Number.isSafeInteger(c.revision) || c.revision < 0 || c.revision > 10000 || !c.plots || !c.branchSites || !Array.isArray(c.receipts) || c.receipts.length !== c.revision)
        return false;
    const ps = new Set(cityParcels(c.region).map(p => p.id));
    return Object.entries(c.plots).length <= 90 && Object.entries(c.plots).every(([id, b]) => ps.has(id) && id !== mainSite && id !== hqSite && fields.includes(b.field) && Number.isInteger(b.tier) && b.tier >= 1 && b.tier <= 3 && typeof b.legacy === 'boolean') && Object.entries(c.branchSites).length <= 3 && new Set(Object.values(c.branchSites)).size === Object.values(c.branchSites).length && Object.entries(c.branchSites).every(([id, p]) => ['2', '3', '4'].includes(id) && ps.has(p) && p !== mainSite && p !== hqSite && !publicSites.includes(p) && !c.plots[p]) && c.receipts.every((r, i) => r.id === i && typeof r.action === 'string' && r.action.length < 100 && Number.isSafeInteger(r.cost) && r.cost >= 0);
}
catch {
    return false;
} }
const editable = (s) => s.mode === 'CAFE_GROWTH' && s.v26?.enterprise?.status === 'founded' && (!s.campaign?.run || s.campaign.run.closed);
export function cityPower(v, field) { const c = v?.enterprise?.modernCity; if (!c)
    return 0; return Math.min(10, Object.values(c.plots).filter(p => p.field === field && !p.legacy).reduce((a, p) => a + p.tier, 0)); }
export function cityBranchBonus(v, field) { return v.enterprise?.modernCity?.urban ? 0 : Math.min(.25, cityPower(v, field) * .04 + cityPower(v, 'enterprise') * .04); }
export function cityQuote(c, plot) { const p = cityParcels(c.region).find(p => p.id === plot), old = c.plots[plot]; if (!p || [mainSite, hqSite, ...Object.values(c.branchSites)].includes(plot) || publicSites.includes(plot) && !old)
    return null; const tier = old?.tier ?? 0; if (tier >= 3)
    return null; const field = old?.field ?? p.district; return { field, tier: tier + 1, cost: cityFacilities[field].costs[tier], asset: cityFacilities[field].assets[tier], name: cityFacilities[field].names[tier] }; }
/** A revision is a permanent transaction sequence. Repository CAS owns cross-tab atomicity. */
export function transactCity(s, revision, action, plot = '') { if (!editable(s))
    return false; const c = modernCityFor(s.v26); if (c.revision !== revision || c.revision >= 10000)
    return false; let cost = 0; if (action === 'expand') {
    if (c.region >= 3)
        return false;
    cost = cityRegions[c.region].cost;
    if (s.money < cost)
        return false;
    c.region = (c.region + 1);
}
else {
    const q = cityQuote(c, plot);
    if (!q || s.money < q.cost)
        return false;
    cost = q.cost;
    c.plots[plot] = { field: q.field, tier: q.tier, legacy: false };
} s.money -= cost; c.receipts.push({ id: c.revision, action: action + ':' + plot, cost }); c.revision++; s.v26.enterprise.modernCity = c; return true; }
export function setCityBranch(s, id, plot, revision) { if (!editable(s) || !s.v26.branches.some(b => b.id === id))
    return false; const c = s.v26.enterprise.modernCity ? structuredClone(s.v26.enterprise.modernCity) : modernCityFor(s.v26); if (c.revision !== revision || c.branchSites[id] || c.plots[plot] || [mainSite, hqSite, ...publicSites, ...Object.values(c.branchSites)].includes(plot) || !cityParcels(c.region).some(p => p.id === plot))
    return false; c.branchSites[id] = plot; c.receipts.push({ id: c.revision, action: 'branch:' + id, cost: 0 }); c.revision++; s.v26.enterprise.modernCity = c; return true; }
export function cityView(v) { const c = modernCityFor(v), a = cityRegions[c.region - 1], parcels = cityParcels(c.region), buildings = []; const put = (site, asset, extra = {}) => { const p = parcels.find(p => p.id === site); if (p)
    buildings.push({ id: site, parcelId: site, asset, x: p.x + .4, y: p.y + .4, variant: (p.col + p.row) % 3, ...extra }); }; for (const [id, p] of Object.entries(c.plots))
    put(id, cityFacilities[p.field].assets[p.tier - 1]); for (const site of publicSites)
    if (!c.plots[site] && !Object.values(c.branchSites).includes(site))
        put(site, 'park', { public: true }); put(mainSite, 'main', { brand: 'main' }); put(hqSite, 'brand-hq-' + c.region, { brand: 'hq' }); for (const b of v.branches) {
    const site = c.branchSites[b.id];
    if (site)
        put(site, b.region === 'tourism' ? 'tourism-branch' : b.region === 'culture' ? 'culture-branch' : b.region === 'commerce' ? 'commerce-branch' : 'branch', { branchId: b.id });
} return { stage: { ...a, id: ['early', 'middle', 'late'][c.region - 1] }, parcels, buildings }; }
