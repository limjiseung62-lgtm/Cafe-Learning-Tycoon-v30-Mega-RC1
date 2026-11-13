// @ts-nocheck
import { byId, assumptions } from './cityBuildingCatalog.js?v=v31-final-636a93f6f215';
export const indicatorMeta = { population: { name: '도시 인구', unit: '명' }, density: { name: '인구밀도', unit: '명/㎢' }, traffic: { name: '교통 혼잡', unit: '/100' }, economy: { name: '상권 활성', unit: '/100' }, environment: { name: '환경', unit: '/100' }, attraction: { name: '문화·관광', unit: '/100' }, satisfaction: { name: '도시 만족', unit: '/100' }, brand: { name: '브랜드 영향', unit: '/100' } };
export const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
const area = r => Math.max(0, r.w) * Math.max(0, r.h);
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
export function roadArea(city) { const v = city.roads.filter(r => r.id.startsWith('v-')), h = city.roads.filter(r => r.id.startsWith('h-')); return city.roads.reduce((n, r) => n + area(r), 0) - v.reduce((n, a) => n + h.reduce((m, b) => m + overlap(a, b), 0), 0); }
function summarize(city, list, areaTiles, roadTiles, landscapes = []) {
    const raw = { population: 0, jobs: 0, retailCapacity: 0, visitors: 0, cultureCapacity: 0, schoolSeats: 0, hospitalBeds: 0, fireCoverage: 0, civicCoverage: 0, greenArea: 0, brandCount: 0, hqStage: 0 };
    for (const b of list) {
        const a = byId[b.variantId];
        if (!a)
            throw Error('Unknown building ' + b.variantId);
        const progress = clamp(b.development ?? 1, 0, 1);
        for (const k of Object.keys(a.profile))
            if (k !== 'populationCapacity')
                raw[k] += a.profile[k] * progress;
        raw.population += Math.floor(a.profile.populationCapacity * clamp(b.occupancy ?? assumptions.occupancy, 0, 1) * progress);
        if (b.brandLink && progress > 0) {
            raw.brandCount++;
            if (b.brandLink.kind === 'hq')
                raw.hqStage = a.redevelopmentStage;
        }
    }
    for (const p of landscapes)
        raw.greenArea += area(p) * 25 * (p.greenShare ?? 0);
    delete raw.populationCapacity;
    const areaM2 = Math.max(1, areaTiles * 25), density = raw.population / (areaM2 / 1000000), trips = raw.population * .22 + raw.jobs * .30 + raw.visitors * .08, roadCapacity = Math.max(1, roadTiles * assumptions.roadTripsPerTile * (1 + city.trafficInvestment * .20));
    const traffic = clamp(100 * (trips / roadCapacity - .35) / 1.2), access = clamp(86 - traffic * .55 + city.trafficInvestment * 4.5), consumerDemand = raw.population * .3 + raw.jobs * .2 + raw.visitors * .08;
    const economy = clamp(Math.min(25, 25 * Math.log1p(raw.jobs / 100) / Math.log(20)) + 40 * Math.min(1, raw.retailCapacity / Math.max(50, consumerDemand)) + 20 * (1 - traffic / 100) + 15 * Math.min(1, consumerDemand / Math.max(1, raw.retailCapacity)));
    const environment = clamp(48 + raw.greenArea / areaM2 * 125 - traffic * .22 - Math.min(20, raw.jobs / 700) + city.trafficInvestment * 1.5);
    const serviceDemand = Math.max(1, raw.population + raw.jobs * .25), schoolCoverage = Math.min(1, raw.schoolSeats / Math.max(1, raw.population * .18)), medicalCoverage = Math.min(1, raw.hospitalBeds / Math.max(1, serviceDemand * .02)), fireCoverage = Math.min(1, raw.fireCoverage / serviceDemand), civicCoverage = Math.min(1, raw.civicCoverage / serviceDemand), services = 100 * (schoolCoverage + medicalCoverage + fireCoverage + civicCoverage) / 4;
    const culture = clamp(100 * (1 - Math.exp(-raw.cultureCapacity / Math.max(100, raw.population * .25 + raw.jobs * .05)))), tourism = clamp(100 * (1 - Math.exp(-raw.visitors / Math.max(100, raw.population * .20 + raw.jobs * .08)))), attraction = (culture + tourism) / 2;
    const jobsBalance = clamp(100 * raw.jobs / Math.max(1, raw.population * .45)), satisfaction = clamp(environment * .25 + access * .20 + services * .30 + jobsBalance * .15 + culture * .10), brand = clamp(raw.brandCount * 10 + raw.hqStage * 3 + attraction * .15 + economy * .10);
    return { population: raw.population, density, traffic, economy, environment, attraction, satisfaction, brand, culture, tourism, access, services, raw: { ...raw, areaM2, roadAreaM2: roadTiles * 25, trips, roadCapacity, consumerDemand, schoolCoverage, medicalCoverage, fireCoverage, civicCoverage }, model: true };
}
export function analyze(city) { const allArea = city.width * city.height, roads = roadArea(city), total = summarize(city, city.buildings, allArea, roads, city.landscapes); const districts = {}, blocks = {}; for (const id of ['commerce', 'housing', 'enterprise', 'tourism', 'culture']) {
    const p = city.parcels.filter(p => p.district === id), ids = new Set(p.map(p => p.id)), portion = p.reduce((n, p) => n + area(p), 0) / city.parcels.reduce((n, p) => n + area(p), 0);
    districts[id] = summarize(city, city.buildings.filter(b => ids.has(b.parcelId)), allArea * portion, roads * portion, city.landscapes.filter(l => ids.has(l.parcelId)));
} for (const p of city.parcels) {
    const share = area(p) / city.parcels.reduce((n, p) => n + area(p), 0);
    blocks[p.id] = summarize(city, city.buildings.filter(b => b.parcelId === p.id), allArea * share, roads * share, city.landscapes.filter(l => l.parcelId === p.id));
} return { total, districts, blocks, assumptions }; }
export function branchEffect(city, id, base) {
    const b = city.buildings.find(b => b.brandLink?.branchId === id);
    if (!b)
        return null;
    const p = city.parcels.find(p => p.id === b.parcelId), ids = new Set(city.parcels.filter(q => Math.abs(q.row - p.row) + Math.abs(q.col - p.col) <= 2).map(p => p.id)), areaFraction = ids.size / city.parcels.length;
    const local = summarize(city, city.buildings.filter(b => ids.has(b.parcelId)), city.width * city.height * areaFraction, roadArea(city) * areaFraction, city.landscapes.filter(l => ids.has(l.parcelId))), global = analyze(city).total;
    const factor = clamp(.88 + local.economy * .001 + local.tourism * .0004 + local.culture * .0004 + local.environment * .0003 - local.traffic * .0006 + global.brand * .0003, .90, 1.15);
    return { id, base, factor, forecast: Math.round(base * factor), delta: Math.round(base * factor) - base, local, previewOnly: true };
}
export function advice(city, manager = 'yuna') { const a = analyze(city), t = a.total; const worst = Object.entries(a.districts).toSorted((a, b) => a[1].satisfaction - b[1].satisfaction)[0]; if (manager === 'hajun')
    return t.traffic > 55 ? `하준: 교통 혼잡이 ${t.traffic.toFixed(0)}점이에요. 도로 접근성을 먼저 살피면 손님과 직원의 이동 부담을 줄일 수 있어요.` : `하준: ${worst[0]} 구역의 만족도가 ${worst[1].satisfaction.toFixed(0)}점이에요. 학교·의료·소방 서비스의 부족한 용량을 확인해요.`; if (manager === 'soi')
    return t.environment < 50 ? `소이: 환경 지수가 ${t.environment.toFixed(0)}점이에요. 공원과 정원으로 녹지를 보완해 볼까요?` : `소이: 문화·관광 매력이 ${t.attraction.toFixed(0)}점이에요. 우리 브랜드 주변에 전시·공연·녹지를 함께 계획해요.`; return `유나: 상권 활성 ${t.economy.toFixed(0)}점, 소비 수요 ${t.raw.consumerDemand.toFixed(0)}와 상업 수용량 ${t.raw.retailCapacity.toFixed(0)}를 비교해요. 예측 수익은 보장 수익이 아니에요.`; }
