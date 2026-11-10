// @ts-nocheck
import { cityInvestmentServices, cityFactorBounds, cityPriceBands, cityTrafficPrices } from './cityInvestmentBalance.js?v=mega-5d509fb5dbfc';
import { byId } from './cityBuildingCatalog.js?v=mega-5d509fb5dbfc';
import { makeCity, districts } from './cityDistrictModel.js?v=mega-5d509fb5dbfc';
import { analyze, branchEffect, clamp } from './cityIndicatorModel.js?v=mega-5d509fb5dbfc';
import { modernCityFor, mainSite, hqSite, publicSites, cityRegions } from './modernCity.js?v=mega-5d509fb5dbfc';
import { foundFranchise, branchYield } from './progressiveEconomy.js?v=mega-5d509fb5dbfc';
export { analyze, districts };
const cityField = a => a.group === 'public' || a.group === 'leisure' ? 'housing' : a.group;
const legacyVariants = { commerce: ['small-retail-a', 'large-retail-a', 'shopping-mall-a'], housing: ['detached-a', 'low-apartment-a', 'high-apartment-a'], tourism: ['garden-a', 'hotel-a', 'tourist-complex-a'], culture: ['library-a', 'theater-a', 'culture-center-a'], enterprise: ['logistics-a', 'mid-office-a', 'corporate-a'] };
const scenes = new Map();
function scene(region) { if (!scenes.has(region))
    scenes.set(region, makeCity(region - 1)); return scenes.get(region); }
/** Canonical plot IDs survive. Environment is deterministic context, never a free owned asset or a direct payout. Existing blocks retain their first-opened visual context. */
export function urbanCityView(v) {
    const c = modernCityFor(v), source = scene(c.region), parcels = source.parcels.map(p => ({ ...p })), buildings = [], landscapes = [];
    for (const p of parcels) {
        const birth = p.row < 5 && p.col < 7 ? 1 : p.row < 7 && p.col < 8 ? 2 : 3, old = scene(birth);
        const reserved = [mainSite, hqSite, ...Object.values(c.branchSites)].includes(p.id), owned = c.plots[p.id];
        p.vacant = !reserved && !owned && !publicSites.includes(p.id) && (p.row + p.col * 2) % 4 === 0;
        if (!reserved && !owned && !p.vacant) {
            buildings.push(...old.buildings.filter(b => b.parcelId === p.id && !b.brandLink).map(b => ({ ...b, owner: 'environment', constructionCost: 0 })));
            landscapes.push(...old.landscapes.filter(l => l.parcelId === p.id));
        }
    }
    const put = (site, variantId, extra = {}) => { const p = parcels.find(p => p.id === site), a = byId[variantId]; if (!p || !a)
        return; buildings.push({ id: site + '/runtime', parcelId: site, type: a.type, variantId, x: p.x + (p.w - a.w) / 2, y: p.y + (p.h - a.h) / 2, w: a.w, h: a.h, orientation: a.orientation, owner: 'environment', development: 1, occupancy: .82, redevelopmentStage: a.redevelopmentStage, constructionCost: 0, region: p.district, saveLink: 'v26.enterprise.modernCity.plots.' + site, ...extra }); };
    for (const p of parcels)
        p.protected = publicSites.includes(p.id) || [mainSite, hqSite, ...Object.values(c.branchSites)].includes(p.id);
    for (const [site, p] of Object.entries(c.plots))
        put(site, c.urban?.variants[site] ?? legacyVariants[p.field][p.tier - 1], { owner: p.legacy ? 'legacy-environment' : 'player', constructionCost: p.legacy ? 0 : (c.receipts.findLast(r => r.action.startsWith('build:' + site + ':'))?.cost ?? 0) });
    put(mainSite, 'main', { owner: 'brand', brandLink: { kind: 'main', name: '본점' } });
    put(hqSite, 'brand-hq-' + c.region, { owner: 'brand', brandLink: { kind: 'hq', name: '본부' } });
    for (const b of v.branches) {
        const site = c.branchSites[b.id];
        put(site, b.region === 'tourism' ? 'tourism-branch' : b.region === 'culture' ? 'culture-branch' : 'commerce-branch', { owner: 'brand', brandLink: { kind: 'branch', branchId: b.id, name: b.id + '호점' } });
    }
    for (const id of [mainSite, hqSite, ...Object.values(c.branchSites)]) {
        const p = parcels.find(p => p.id === id);
        if (p)
            landscapes.push({ parcelId: id, x: p.x, y: p.y + p.h - 1, w: p.w, h: 1, kind: 'brand-plaza', greenShare: .1 });
    }
    return { version: 'city-urban-runtime-v1', stage: source.stage, stageIndex: c.region - 1, width: source.width, height: source.height, parcels, roads: source.roads, buildings, landscapes, trafficInvestment: c.urban?.traffic ?? 0, revision: c.revision, brand: { name: v.enterprise?.name ?? '나의 카페', color: { neighborhood: '#28765f', destination: '#3c728c', creative: '#9d617e' }[v.enterprise?.brand] ?? '#28765f' } };
}
export function adoptUrbanCity(source) { const s = structuredClone(source); if (s.mode !== 'CAFE_GROWTH' || s.v26?.enterprise?.status !== 'founded')
    return s; const c = modernCityFor(s.v26); c.urban ??= { version: 1, traffic: 0, variants: {}, history: [] }; s.v26.enterprise.modernCity = c; return s; }
export const urbanEnabled = v => !!v?.enterprise?.modernCity?.urban;
const branchFactorCache = new WeakMap();
export function urbanBranchFactor(v, b) { if (!urbanEnabled(v))
    return 1; const c = v.enterprise.modernCity, key = JSON.stringify([c.region, c.revision, c.plots, c.branchSites, c.urban.traffic, c.urban.variants, v.branches.map(b => [b.id, b.region]), v.enterprise.name, v.enterprise.brand]), old = branchFactorCache.get(v), state = old?.key === key ? old : { key, model: urbanCityView(v), factors: new Map() }, id = b.id + ':' + b.region; branchFactorCache.set(v, state); if (state.factors.has(id))
    return state.factors.get(id); const model = state.model, e = branchEffect(model, b.id, 1); if (!e)
    return 1; const factor = clamp(e.factor + .015 * (1 - Math.exp(-e.local.density / 12000)) + .0015 * (e.local.access - 86) + cityInvestmentServices(model, b.id, b.region).bonus, cityFactorBounds.min, cityFactorBounds.max); state.factors.set(id, factor); return factor; }
const bands = cityPriceBands;
export function urbanBuildQuote(v, site, variant) { const c = modernCityFor(v), model = urbanCityView(v), p = model.parcels.find(p => p.id === site), a = byId[variant], old = c.plots[site]; if (!p || !a || a.kind !== 'new' || [mainSite, hqSite, ...publicSites, ...Object.values(c.branchSites)].includes(site) || a.w > p.w || a.h > p.h || a.redevelopmentStage > c.region || c.urban?.variants[site] === variant)
    return null; const same = old && byId[c.urban?.variants[site]]?.type === a.type, price = Math.round(bands[a.group][a.redevelopmentStage - 1] * (.85 + .15 * a.w * a.h / 36) / 10000) * 10000, cost = Math.round(price * (same ? .8 : 1) / 10000) * 10000; return { site, variant, field: cityField(a), tier: a.redevelopmentStage, cost, name: a.name, old, footprint: a.w + '×' + a.h, kind: old ? '재개발' : '건설' }; }
export const urbanRoadCosts = cityTrafficPrices;
/** Pure transaction; repository CAS commits money and city changes together. No background rent or separate currency ledger. */
export function urbanTransaction(source, revision, action) {
    if (source.mode !== 'CAFE_GROWTH' || source.v26?.enterprise?.status !== 'founded' || source.campaign?.run && !source.campaign.run.closed)
        return { ok: false, reason: 'GROWTH 영업을 마친 뒤 도시를 경영해요.' };
    const s = adoptUrbanCity(source), c = s.v26.enterprise.modernCity;
    if (c.revision !== revision || revision >= 10000)
        return { ok: false, reason: '다른 거래가 먼저 저장됐어요. 다시 선택해 주세요.' };
    const before = analyze(urbanCityView(s.v26)).total;
    let cost = 0, label = '';
    if (action.kind === 'build') {
        const q = urbanBuildQuote(s.v26, action.site, action.variant);
        if (!q)
            return { ok: false, reason: '부지 크기·구역 해금·보호 건물·동일 외형을 확인해 주세요.' };
        cost = q.cost;
        if (s.money < cost)
            return { ok: false, reason: (cost - s.money).toLocaleString() + '원이 부족해요.' };
        c.plots[q.site] = { field: q.field, tier: q.tier, legacy: false };
        c.urban.variants[q.site] = q.variant;
        label = 'build:' + q.site + ':' + q.variant;
    }
    else if (action.kind === 'road') {
        cost = urbanRoadCosts[c.urban.traffic];
        if (cost === undefined)
            return { ok: false, reason: '교통 투자3단계를 완료했어요.' };
        if (s.money < cost)
            return { ok: false, reason: (cost - s.money).toLocaleString() + '원이 부족해요.' };
        c.urban.traffic++;
        label = 'road';
    }
    else if (action.kind === 'expand') {
        cost = cityRegions[c.region]?.cost;
        if (cost === undefined)
            return { ok: false, reason: '모든 구역이 열렸어요.' };
        if (s.money < cost)
            return { ok: false, reason: (cost - s.money).toLocaleString() + '원이 부족해요.' };
        c.region++;
        label = 'expand';
    }
    else if (action.kind === 'branch') {
        const model = urbanCityView(s.v26), p = model.parcels.find(p => p.id === action.site), id = action.id;
        if (![2, 3, 4].includes(id) || !p || c.plots[p.id] || [mainSite, hqSite, ...publicSites, ...Object.values(c.branchSites)].includes(p.id) || s.v26.branches.some(b => b.id === id))
            return { ok: false, reason: '이 부지에는 신규 분점을 창업할 수 없어요.' };
        const region = ['commerce', 'housing', 'tourism', 'culture'].includes(p.district) ? p.district : 'commerce', cash = s.money;
        if (!foundFranchise(s, id, region))
            return { ok: false, reason: '기존 분점 창업 조건·마을 발전·보유금을 확인해 주세요.' };
        cost = cash - s.money;
        c.branchSites[id] = p.id;
        label = 'branch:' + id + ':' + p.id;
        s.money += cost;
    }
    else
        return { ok: false, reason: '알 수 없는 도시 거래예요.' };
    s.money -= cost;
    c.receipts.push({ id: c.revision, action: label, cost });
    c.revision++;
    s.v26.enterprise.modernCity = c;
    const after = analyze(urbanCityView(s.v26)).total;
    const metric = x => Object.fromEntries(['population', 'density', 'traffic', 'economy', 'environment', 'attraction', 'satisfaction', 'brand'].map(k => [k, x[k]]));
    c.urban.history = [...c.urban.history, { revision: c.revision, action: label, cost, before: metric(before), after: metric(after) }].slice(-60);
    return { ok: true, save: s, cost };
}
export function urbanAdvice(s, manager) { const m = analyze(urbanCityView(s.v26)).total, cash = s.money.toLocaleString(); if (manager === 'hajun')
    return `하준: 혼잡 ${m.traffic.toFixed(0)}, 접근성 ${m.access.toFixed(0)}이에요. 밀도 ${Math.round(m.density).toLocaleString()}명/㎢와 분점 주변 수요를 함께 살펴봐요.`; if (manager === 'soi')
    return `소이: 환경 ${m.environment.toFixed(0)}, 문화·관광 ${m.attraction.toFixed(0)}, 브랜드 ${m.brand.toFixed(0)}이에요. 녹지와 문화시설도 우리 브랜드를 알리는 선택이에요.`; return `유나: 기업 보유금 ${cash}원, 상권 ${m.economy.toFixed(0)}예요. 투자 전후 분점 순수익과 회수 기간을 비교해요. 자동 수익은 정상15분 영업 완료 때만 정산돼요.`; }
/** Runs the exact pure transaction on a copy. Cancelling a preview cannot spend or append a stored receipt. */
export function urbanImpact(s, revision, action) { const next = urbanTransaction(s, revision, action); if (!next.ok)
    return { ok: false, reason: next.reason }; const income = v => v.branches.reduce((n, b) => n + branchYield(v, b), 0), beforeIncome = income(s.v26), afterIncome = income(next.save.v26), delta = afterIncome - beforeIncome, before = analyze(urbanCityView(s.v26)).total, after = analyze(urbanCityView(next.save.v26)).total; return { ok: true, cost: next.cost, before, after, beforeIncome, afterIncome, delta, payback: delta > 0 ? Math.ceil(next.cost / delta) : null, branchChanges: next.save.v26.branches.map(b => ({ id: b.id, before: s.v26.branches.some(old => old.id === b.id) ? branchYield(s.v26, s.v26.branches.find(old => old.id === b.id)) : 0, after: branchYield(next.save.v26, b), factor: urbanBranchFactor(next.save.v26, b) })), indirect: { population: after.population - before.population, jobs: after.raw.jobs - before.raw.jobs, greenArea: after.raw.greenArea - before.raw.greenArea, cultureCapacity: after.raw.cultureCapacity - before.raw.cultureCapacity, visitors: after.raw.visitors - before.raw.visitors } }; }
export function urbanInvestmentNotes(impact) { if (!impact.ok)
    return impact.reason; const n = x => Math.round(x).toLocaleString(), i = impact.indirect; return `인구 ${n(i.population)}명 · 일자리 ${n(i.jobs)} · 녹지 ${n(i.greenArea)}㎡ · 문화 수용 ${n(i.cultureCapacity)} · 방문 수용 ${n(i.visitors)} 변화. ` + (impact.delta <= 0 ? '현재 분점의 직접 증가 수익이 없어요. 공공·환경·문화 효과를 보고 선택해요.' : impact.payback > 80 ? '직접 회수가 긴 투자예요. 먼저 분점 강화·가까운 부지와 비교해요.' : '현재 입지에서는 비교적 빠른 경제 효과가 예상돼요.') + ' 예상은 현재 배치·분점 단계 기준이며, 다음 영업의 학습·운영 결과에 따라 달라져요. 시설 보너스는 현재 소유 시설에서 다시 계산하며 계속 곱해 쌓이지 않아요.'; }
export function urbanNextGoal(s) { const model = urbanCityView(s.v26), m = analyze(model).total, c = modernCityFor(s.v26); if (m.traffic > 35 && (c.urban?.traffic ?? 0) < 3) {
    const cost = urbanRoadCosts[c.urban?.traffic ?? 0];
    return { label: '도로·교통 개선', cost, shortfall: Math.max(0, cost - s.money), reason: '현재 혼잡을 줄일 수 있는지 비교해요.' };
} const variants = m.environment < 55 ? ['garden-a', 'park-a'] : m.population < 500 ? ['detached-a', 'low-apartment-a'] : ['small-retail-a', 'small-office-a'], branchParcels = Object.values(c.branchSites).map(id => model.parcels.find(p => p.id === id)), distance = p => Math.min(...branchParcels.map(q => Math.abs(q.row - p.row) + Math.abs(q.col - p.col)), 99), choices = model.parcels.toSorted((a, b) => distance(a) - distance(b)).flatMap(p => variants.map(id => urbanBuildQuote(s.v26, p.id, id))).filter(Boolean); const q = choices[0]; return q ? { label: q.name + ' · ' + q.site, cost: q.cost, shortfall: Math.max(0, q.cost - s.money), reason: '현재 도시에서 부족한 기능과 분점 주변 입지를 먼저 비교해요.' } : null; }
