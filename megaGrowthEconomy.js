import { cafeGrowthBalance } from './modeBalance.js?v=mega-5d509fb5dbfc';
/** Local mega saves opt in. CLASS and ordinary GROWTH retain their original policies. */
export const megaGrowthBalance = { ...cafeGrowthBalance,
    cafes: [...cafeGrowthBalance.cafes, ...Array.from({ length: 15 }, (_, i) => { const level = i + 16; return { ...cafeGrowthBalance.cafes[14], level, name: level < 20 ? '넓은 홀을 꿈꾸는 카페' : level < 30 ? '복합 카페' : '그랜드 메가 카페', maxCustomers: level < 20 ? 14 : level < 30 ? 24 : 40, expansionCost: 100000 + (level - 16) * 20000 }; })],
    staff: { ...cafeGrowthBalance.staff, limits: [...cafeGrowthBalance.staff.limits, ...Array.from({ length: 15 }, (_, i) => i + 16 >= 30 ? 12 : i + 16 >= 20 ? 8 : 5)] },
    special: { ...cafeGrowthBalance.special, itemPriceMultipliers: [...(cafeGrowthBalance.special.itemPriceMultipliers ?? []), ...Array(15).fill(34)] }
};
export const megaSpawnSeconds = (spaceLevel) => 4;
