export const architectureStyles = ['wood', 'brick', 'glass', 'brand'];
export const appearanceSlots = ['wall', 'window', 'door', 'floor', 'sign', 'light'];
export const styleNames = { wood: '포근한 목재', brick: '빈티지 벽돌', glass: '모던 유리', brand: '고급 브랜드' };
export const appearanceCatalog = architectureStyles.flatMap((style, i) => appearanceSlots.map(slot => ({ id: slot + ':' + style, slot, style, name: styleNames[style] + ' ' + ({ wall: '외벽', window: '창문', door: '출입문', floor: '바닥', sign: '간판', light: '조명' }[slot]), level: i === 0 ? 1 : i === 1 ? 6 : i === 2 ? 10 : slot === 'sign' ? 24 : 20, cost: i === 0 ? 0 : Math.round([0, 35000, 120000, 400000][i] * ({ wall: 1, window: .65, door: .6, floor: .8, sign: .5, light: .3 }[slot])) })));
export const newAppearance = () => ({ version: 1, selected: { wall: 'wood', window: 'wood', door: 'wood', floor: 'wood', sign: 'wood', light: 'wood' }, owned: appearanceSlots.map(s => s + ':wood'), receipts: [] });
export function validAppearance(v) { try {
    const s = v;
    return s.version === 1 && Object.keys(s).every(k => ['version', 'selected', 'owned', 'receipts'].includes(k)) && s.selected && Object.keys(s.selected).length === appearanceSlots.length && appearanceSlots.every(slot => architectureStyles.includes(s.selected[slot]) && s.owned.includes(slot + ':' + s.selected[slot])) && Array.isArray(s.owned) && new Set(s.owned).size === s.owned.length && s.owned.length <= 24 && s.owned.every(id => appearanceCatalog.some(x => x.id === id)) && appearanceSlots.every(slot => s.owned.includes(slot + ':wood')) && Array.isArray(s.receipts) && s.receipts.length === s.owned.filter(id => !id.endsWith(':wood')).length && s.receipts.every((r, i) => r.id === 'appearance-' + (i + 1) && appearanceCatalog.some(x => x.id === r.item && x.cost === r.cost && r.cost > 0) && s.owned.includes(r.item)) && new Set(s.receipts.map(r => r.item)).size === s.receipts.length;
}
catch {
    return false;
} }
