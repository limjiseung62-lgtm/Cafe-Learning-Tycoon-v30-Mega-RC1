import { adoptInterior, isShopDeployment } from './megaInventory.js?v=v30-rc1-5973f32a35f5';
import { adoptPaidSpace } from './megaExpansion.js?v=v30-rc1-5973f32a35f5';
import { isPaidDeployment } from './megaSpace.js?v=v30-rc1-5973f32a35f5';
import { newClassState, seededStep } from './classRandom.js?v=v30-rc1-5973f32a35f5';
import { createManagement } from './managementState.js?v=v30-rc1-5973f32a35f5';
import { growthMenuDefinitions } from './menuResearch.js?v=v30-rc1-5973f32a35f5';
import { desiredLakeMini } from './lakeDistrict.js?v=v30-rc1-5973f32a35f5';
import { recruitById } from "./recruitConfig.js?v=v30-rc1-5973f32a35f5";
import { CafeGame } from './game.js?v=v30-rc1-5973f32a35f5';
import { policyFor } from './sessionModes.js?v=v30-rc1-5973f32a35f5';
import { createGrowthSave, validateGrowthSave } from './growthSave.js?v=v30-rc1-5973f32a35f5';
const growthExpected = new WeakMap();
export const setGrowthExpected = (g, s) => growthExpected.set(g, structuredClone(s));
export const growthExpectedFor = (g) => growthExpected.get(g);
const growthBases = new WeakMap();
export function growthBaseFor(game) { return growthBases.get(game); }
export function createProgressiveClassMatch(random = Math.random) { return new CafeGame(900, random, 300, { mode: 'CLASS_MATCH', progressive: true }); }
export function createClassMatch(seconds = policyFor().sessionSeconds, random = Math.random) { return new CafeGame(seconds, random, 300, { mode: 'CLASS_MATCH', phase4: true }); }
export function createGrowthSession(save = createGrowthSave(), random = Math.random, seconds = save.eventState && !save.eventState.closed ? Math.max(1, save.eventState.duration - save.eventState.now) : policyFor('CAFE_GROWTH').sessionSeconds) { if (!validateGrowthSave(save))
    throw Error('Invalid growth save'); if (isPaidDeployment() && save.mega)
    save = adoptPaidSpace(save); if (isShopDeployment() && save.mega)
    save = adoptInterior(save); if (typeof document !== 'undefined' && document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content')?.startsWith('v30e-') && save.mega) {
    save = structuredClone(save);
    save.mega.extended = true;
} const g = new CafeGame(seconds, random, 300, { mode: 'CAFE_GROWTH', phase4: true, progressive: !!save.v26 }); g.progressiveState = structuredClone(save.v26); g.management = structuredClone(save.management); if (save.v26 && save.cafeLevel >= 8) {
    g.management ??= createManagement();
    g.management.strategy ??= 'care';
} if (g.management && save.v26)
    g.management.progressiveLevel = save.cafeLevel; g.growthCafeId = save.portfolio?.activeCafeId ?? 'cafe-1'; g.lakeMini = desiredLakeMini(save); g.village = structuredClone(save.village); if (g.village && save.v26)
    g.village.progressiveLevel = save.cafeLevel; g.miniCollection = structuredClone(save.miniCollection); g.specialization = structuredClone(save.specialization); g.mega = structuredClone(save.mega); g.freeLayouts = structuredClone(save.freeLayouts); g.layouts = structuredClone(save.layouts); g.roster = structuredClone(save.roster); g.cafeLevel = save.cafeLevel; g.growthBranch = structuredClone(save.growthBranch); g.money = save.money; g.warehouseLevel = save.warehouseLevel; g.menus = growthMenuDefinitions(save.cafeLevel, save.management).filter(m => save.unlockedMenuIds.includes(m.menuId)).map(m => ({ ...m, currentLevel: save.menuLevels[m.menuId], stock: Math.min(g.warehouse.capacity, save.v26?.stock?.[m.menuId] ?? 0), maxStock: g.warehouse.capacity })); g.service.maxPaid = g.staffLimit; for (const id of save.staffOwned) {
    const w = g.service.hire(save.roster ? recruitById(id) : undefined);
    if (w.staffId !== id)
        throw Error('Invalid staff order');
    while (w.level < save.staffLevels[id])
        g.service.upgrade(w, 0);
    w.upgradeFeedbackUntil = 0;
} g.regularMemory = structuredClone(save.regularMemory); g.updateServiceLayout(); g.telemetry.snapshots = []; g.telemetry.record(g.snapshot); if (save.eventState)
    g.events.restore(save.eventState); growthBases.set(g, structuredClone(save)); return g; }
export function createRandomClassMatch(seconds = 900, seed = Math.floor(Math.random() * 4294967296), now = Date.now(), id = crypto.randomUUID()) { const state = newClassState(seconds, seed, now, id); const g = new CafeGame(seconds, () => seededStep(state), 300, { mode: "CLASS_MATCH", progressive: true }); g.classRandom = state; return g; }
