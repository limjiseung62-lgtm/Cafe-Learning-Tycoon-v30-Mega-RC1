export const menuQualityEnabled = (g) => g.mode === 'CAFE_GROWTH' && g.mega?.finalGrowth?.renewal?.menuPolicy === 2;
export const menuEnhancementCap = (level) => level <= 5 ? 3 : level <= 10 ? 5 : level <= 15 ? 7 : level <= 20 ? 10 : level <= 25 ? 13 : 15;
export const menuStoredLevelLimit = (g) => menuQualityEnabled(g) ? Math.max(5, menuEnhancementCap(g.cafeLevel) + 1) : 5;
export function refreshMenuQuality(g) { if (!menuQualityEnabled(g))
    return; for (const m of g.menus) {
    m.maxLevel = Math.max(m.currentLevel, menuEnhancementCap(g.cafeLevel) + 1);
    m.renewalQuality = true;
} }
/** Earned sale prices stay identical; late gains are additive, not repeated specialization bonuses. */
export function qualityPriceMultiplier(level, legacy) { return level <= legacy.length ? legacy[level - 1] : legacy[legacy.length - 1] + .1 * (level - legacy.length); }
/** Original purchase costs restored; earned levels and sale prices require no migration. */
export function qualityUpgradeMultiplier(level, legacy) { return level <= legacy.length ? legacy[level - 1] : legacy[legacy.length - 1] * (1 + .35 * (level - legacy.length)) ** 1.6; }
export function qualityDecoration(plus) { return plus >= 15 ? 'master' : plus >= 10 ? 'premium' : plus >= 5 ? 'artisan' : plus >= 3 ? 'select' : 'basic'; }
