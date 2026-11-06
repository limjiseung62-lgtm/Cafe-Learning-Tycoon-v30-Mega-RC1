import { sceneWalkable, scenePath } from './villageNavigation.js?v=level-seats-83d02b666a1c';
export const cityDistricts = [{ id: 'commerce', name: '햇살 상업 거리', tile: 2, x: 350, y: 450, activity: '장터 물건 보기' }, { id: 'tourism', name: '바람결 관광 지구', tile: 7, x: 1250, y: 450, activity: '전망 산책' }, { id: 'culture', name: '별빛 문화 지구', tile: 4, x: 350, y: 1020, activity: '공방·거리 공연' }, { id: 'housing', name: '온기 주거 골목', tile: 6, x: 1250, y: 1020, activity: '이웃 대화' }];
/** Reserved public avenues never run through future plots; plot doors share their actual collision geometry. */
export function enterpriseCity(v) {
    const s = { id: 'town', city: true, roadHalfWidth: 55, name: '함께 크는 브랜드 도시', start: 'plaza', progressionStage: 5, buildings: [], nodes: { plaza: [775, 720], east: [900, 720], north: [900, 530], south: [900, 1100], hq: [775, 420] }, edges: [['plaza', 'east'], ['east', 'north'], ['east', 'south'], ['north', 'hq']], residents: [], extraProps: [] };
    const add = (id, name, tile, x, y, w = 160) => { s.buildings.push({ id, name, tile, x, y, w, stage: 1, door: { x, y: y + 35 }, footprint: { x: x - w * .37, y: y - w * .16, w: w * .74, h: w * .16 } }); s.nodes[id] = [x, y + 35]; };
    add('hq', v.enterprise?.name || '프랜차이즈 본부', 0, 775, 350, 260);
    s.nodes.hq = [775, 420];
    for (const [di, d] of cityDistricts.entries()) {
        const tier = v.investments[d.id], roadY = d.y + 80;
        s.nodes[d.id] = [d.x, roadY];
        s.nodes[d.id + '-junction'] = [900, roadY];
        s.edges.push([d.y < 700 ? 'north' : 'south', d.id + '-junction'], [d.id + '-junction', d.id]);
        const positions = [[d.x, d.y], [d.x - 210, d.y], [d.x + 210, d.y], [d.x, d.y - 220], [d.x - 210, d.y - 220], [d.x + 210, d.y - 220]];
        for (let i = 0; i <= tier; i++) {
            const [x, y] = positions[i], id = d.id + '-plot-' + i;
            add(id, i === 0 ? d.name : d.name + ' ' + (i + 1) + '구역', d.tile, x, y, 160);
            const road = id + '-road';
            s.nodes[road] = [x, y + 80];
            s.edges.push([id, road]);
            if (i < 3)
                s.edges.push([d.id, road]);
            else {
                const north = d.id + '-upper';
                s.nodes[north] = [900, y + 80];
                s.edges.push([d.id + '-junction', north], [north, road]);
            }
            s.extraProps.push({ tile: i % 2 ? 3 : 1, x: x + 95, y: y, w: 55, solid: false });
        }
        for (let i = 0; i < Math.min(6, 1 + tier); i++)
            s.residents.push([d.id + '-resident-' + i, ['상인', '여행객', '공예가', '이웃'][di] + (i + 1), ['traveler', 'painter', 'office', 'bookworm'][di], d.x + (i % 3 - 1) * 24, roadY + Math.floor(i / 3) * 20]);
    }
    return s;
}
export function citySafePoint(scene, p) { if (sceneWalkable(scene, p))
    return { ...p }; return Object.values(scene.nodes).map(([x, y]) => ({ x, y })).filter(q => sceneWalkable(scene, q)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] ?? { x: 775, y: 720 }; }
export function cityRoutes(scene) { return cityDistricts.map(d => ({ field: d.id, path: scenePath(scene, citySafePoint(scene, { x: 775, y: 720 }), citySafePoint(scene, { x: d.x, y: d.y + 80 })) })); }
