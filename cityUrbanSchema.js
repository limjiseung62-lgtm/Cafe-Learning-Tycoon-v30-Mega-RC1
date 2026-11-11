import { byId } from './cityBuildingCatalog.js?v=mega-d152ad969955';
export function validUrbanMeta(u, c) { try {
    const keys = ['population', 'density', 'traffic', 'economy', 'environment', 'attraction', 'satisfaction', 'brand'], metrics = (x) => !!x && keys.every(k => Number.isFinite(x[k]) && x[k] >= 0 && (k === 'population' || k === 'density' || x[k] <= 100));
    return !!u && u.version === 1 && Number.isInteger(u.traffic) && u.traffic >= 0 && u.traffic <= 3 && !!u.variants && !Array.isArray(u.variants) && Object.keys(u.variants).length <= 90 && Object.entries(u.variants).every(([id, variant]) => !!c.plots[id] && !!byId[variant] && byId[variant].kind === 'new') && Array.isArray(u.history) && u.history.length <= 60 && u.history.every((r, i) => Number.isSafeInteger(r.revision) && r.revision > 0 && r.revision <= c.revision && (!i || r.revision > u.history[i - 1].revision) && typeof r.action === 'string' && r.action.length <= 100 && Number.isSafeInteger(r.cost) && r.cost >= 0 && metrics(r.before) && metrics(r.after));
}
catch {
    return false;
} }
