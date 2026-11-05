import { byId } from './cityBuildingCatalog.js?v=stability-97670d28ea8d';
export const cityFactorBounds = { min: .90, max: 1.32 };
export const cityPriceBands = { housing: [20000, 90000, 280000], commerce: [30000, 120000, 360000], enterprise: [45000, 150000, 480000], tourism: [50000, 160000, 440000], culture: [100000, 320000, 900000], public: [70000, 200000, 550000], leisure: [35000, 100000, 300000] };
export const cityTrafficPrices = [60000, 180000, 480000];
const affinities = { commerce: [1.25, .9, .75, .7, .7], housing: [.7, 1.3, .6, .7, 1.1], tourism: [.8, .7, 1.35, 1, 1.15], culture: [.8, .8, 1.05, 1.35, 1] };
/** Enterprise-owned facilities route their real service capacity to nearby branches.
 * No facility creates rent. Diminishing returns are recomputed from current assets;
 * the result is applied by the original single business-completion settlement. */
export function cityInvestmentServices(city, id, region) {
    const b = city.buildings.find((b) => b.brandLink?.branchId === id), p = city.parcels.find((p) => p.id === b?.parcelId), capacity = [0, 0, 0, 0, 0];
    if (!p)
        return { bonus: 0, capacity, contributions: [0, 0, 0, 0, 0] };
    for (const facility of city.buildings) {
        if (facility.owner !== 'player')
            continue;
        const q = city.parcels.find((q) => q.id === facility.parcelId), a = byId[facility.variantId];
        if (!q || !a)
            continue;
        const distance = Math.abs(q.row - p.row) + Math.abs(q.col - p.col);
        if (distance > 2)
            continue;
        const weight = 1 / (1 + distance * .5), r = a.profile;
        if (a.group === 'commerce' || a.group === 'enterprise')
            capacity[0] += (r.jobs + (r.retailCapacity ?? 0) * .2) * weight;
        if (a.group === 'housing')
            capacity[1] += r.populationCapacity * .5 * weight;
        if (a.group === 'tourism')
            capacity[2] += r.visitors * .5 * weight;
        if (a.group === 'culture')
            capacity[3] += r.cultureCapacity * .5 * weight;
        if (a.group === 'leisure' || a.group === 'public')
            capacity[4] += (r.greenArea / 30 + r.schoolSeats / 30 + r.hospitalBeds / 3 + r.fireCoverage / 500 + r.civicCoverage / 1000) * weight;
    }
    const weights = affinities[region] ?? affinities.commerce, limits = [.10, .07, .07, .045, .05], scales = [55, 55, 180, 180, 60], contributions = capacity.map((n, i) => limits[i] * weights[i] * (1 - Math.exp(-n / scales[i])));
    return { capacity, contributions, bonus: contributions.reduce((a, b) => a + b, 0) };
}
