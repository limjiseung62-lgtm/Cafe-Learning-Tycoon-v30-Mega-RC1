import { urbanBranchFactor } from './cityUrbanEconomy.js?v=backup-p0-b5b501b25d27';
import { validModernCity, cityBranchBonus } from './modernCity.js?v=backup-p0-b5b501b25d27';
const brands = ['neighborhood', 'destination', 'creative'];
export const enterpriseReady = (s) => s.mode === 'CAFE_GROWTH' && s.cafeLevel >= 30 && (s.mega?.paid?.spaceLevel ?? 0) >= 30 && !!s.mega?.manager?.selected;
export const enterpriseEditable = (s) => !s.campaign?.run || s.campaign.run.closed;
export function validEnterprise(x, v) { try {
    const e = x, n = (x) => Number.isSafeInteger(x) && x >= 0;
    return !!e && (e.modernCity === undefined || validModernCity(e.modernCity) && Object.keys(e.modernCity.branchSites).every(id => v.branches.some(b => b.id === Number(id)))) && e.version === 1 && ['deferred', 'founded'].includes(e.status) && typeof e.name === 'string' && e.name.length <= 24 && !/[<>\u0000-\u001f]/.test(e.name) && brands.includes(e.brand) && (e.status === 'founded' ? !!e.name.trim() && typeof e.foundedAt === 'string' && Number.isFinite(Date.parse(e.foundedAt)) : e.foundedAt === null) && !!e.branches && Object.keys(e.branches).length <= 3 && new Set(Object.values(e.branches).filter(b => b.manager).map(b => b.manager)).size === Object.values(e.branches).filter(b => b.manager).length && Object.entries(e.branches).every(([id, b]) => v.branches.some(a => a.id === Number(id)) && typeof b.manager === 'string' && /^(?:|branch-manager-[1-3])$/.test(b.manager) && typeof b.menu === 'string' && b.menu.length <= 80 && n(b.employees) && b.employees <= 5 && n(b.reputation) && b.reputation <= 100) && (e.totals === undefined || n(e.totals.gross) && n(e.totals.cost) && n(e.totals.net) && e.totals.gross - e.totals.cost === e.totals.net) && Array.isArray(e.history) && e.history.length <= 100 && new Set(e.history.map(r => r.id)).size === e.history.length && e.history.every(r => typeof r.id === 'string' && r.id.length <= 128 && n(r.gross) && n(r.cost) && n(r.net) && r.gross - r.cost === r.net) && !!e.city && Number.isFinite(e.city.x) && Number.isFinite(e.city.y) && e.city.x >= 10 && e.city.x <= 1590 && e.city.y >= 10 && e.city.y <= 1190 && Array.isArray(e.milestones) && e.milestones.length <= 10 && new Set(e.milestones).size === e.milestones.length && e.milestones.every(x => ['headquarters', 'first-branch', 'city-complete'].includes(x));
}
catch {
    return false;
} }
export function proposeEnterprise(s) { if (!enterpriseReady(s) || !s.v26 || s.v26.enterprise)
    return false; s.v26.enterprise = { version: 1, status: 'deferred', name: '', brand: 'neighborhood', foundedAt: null, branches: {}, totals: { gross: 0, cost: 0, net: 0 }, history: [], city: { x: 775, y: 660 }, milestones: [] }; return true; }
export function foundEnterprise(s, name, brand, now = new Date().toISOString()) { if (!enterpriseEditable(s) || !enterpriseReady(s) || !brands.includes(brand) || !Number.isFinite(Date.parse(now)))
    return false; name = name.trim(); if (!name || name.length > 24 || /[<>\u0000-\u001f]/.test(name))
    return false; proposeEnterprise(s); const e = s.v26.enterprise; if (e.status === 'founded')
    return false; e.status = 'founded'; e.name = name; e.brand = brand; e.foundedAt = now; e.milestones.push('headquarters'); return true; }
export const branchManagers = [{ id: 'branch-manager-1', name: '지점장 민서', focus: 'commerce' }, { id: 'branch-manager-2', name: '지점장 도윤', focus: 'tourism' }, { id: 'branch-manager-3', name: '지점장 지우', focus: 'culture' }];
export const branchHireCost = 6000;
export const regionalMenus = { commerce: ['coffee', 'sandwich', 'pizza'], tourism: ['strawberry-latte', 'icecream', 'bingsu'], culture: ['cake', 'pudding', 'parfait'], housing: ['cookie', 'bread', 'pancake'] };
export function configureBranch(s, id, manager, menu, employees) { const e = s.v26?.enterprise; if (!enterpriseEditable(s) || e?.status !== 'founded' || !s.v26.branches.some(b => b.id === id) || !['', ...branchManagers.map(m => m.id)].includes(manager) || !s.unlockedMenuIds.includes(menu) || !Number.isSafeInteger(employees) || employees < 0 || employees > 5)
    return false; if (manager && Object.entries(e.branches).some(([key, b]) => key !== String(id) && b.manager === manager))
    return false; const old = e.branches[id], cost = Math.max(0, employees - (old?.employees ?? 0)) * branchHireCost; if (s.money < cost)
    return false; s.money -= cost; e.branches[id] = { manager, menu, employees, reputation: old?.reputation ?? 50 }; if (!e.milestones.includes('first-branch'))
    e.milestones.push('first-branch'); return true; }
/** Same canonical branch IDs and original settlement receipt; no offline or separate credit path. */
export function branchOperatingReport(v, b, base) { const e = v.enterprise, o = e?.status === 'founded' ? e.branches[b.id] : undefined; if (!o) {
    const gross = Math.round(base * (1 + cityBranchBonus(v, b.region)) * urbanBranchFactor(v, b));
    return { gross, cost: 0, net: gross };
} const m = branchManagers.find(m => m.id === o.manager), brandMatch = (e.brand === 'neighborhood' && b.region === 'housing') || (e.brand === 'destination' && b.region === 'tourism') || (e.brand === 'creative' && b.region === 'culture'); const bonus = (m?.focus === b.region?.toString() ? .04 : 0) + (regionalMenus[b.region].includes(o.menu) ? .025 : .01) + o.employees * .018 + (brandMatch ? .02 : 0) + (o.reputation - 50) * .0004; const gross = Math.round(base * (1 + Math.max(0, Math.min(.18, bonus)) + cityBranchBonus(v, b.region)) * urbanBranchFactor(v, b)), cost = o.employees * 80; return { gross, cost, net: Math.max(0, gross - cost) }; }
