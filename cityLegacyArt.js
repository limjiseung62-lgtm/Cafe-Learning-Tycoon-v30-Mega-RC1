// @ts-nocheck
// @ts-nocheck
/** Design-only model. Never reads or writes a game save. Tile sizes describe exterior city parcels, not cafe interior cells. */
export const WORLD = { width: 130, height: 118, tileHalfWidth: 24, tileHalfHeight: 12 };
export const districts = { commerce: { name: '햇살 상업 지구', color: '#d6a065', effect: '유동 수요·단체 주문·상권 가치' }, tourism: { name: '바람결 관광 지구', color: '#61a9ae', effect: '관광객·특별 주문·관광 분점' }, culture: { name: '별빛 문화 지구', color: '#a18ab4', effect: '공연·전시·브랜드 평판' }, housing: { name: '온기 주거 지구', color: '#96a36b', effect: '지역 고객·단골·안정 수요' }, enterprise: { name: '브랜드 업무 지구', color: '#467d76', effect: '본부·물류·분점 운영 효율' } };
const defs = [
    ['shop', '소형 상가', 3, 3, 260, 'commerce', '작은 골목의 베이커리와 생활 상점'],
    ['arcade', '중형 상업시설', 6, 6, 264, 'commerce', '채광 아케이드와 여러 점포'],
    ['mall', '쇼핑몰', 8, 8, 270, 'commerce', '대형 유리 쇼핑몰·옥상 정원'],
    ['house', '저층 주택', 3, 3, 260, 'housing', '현대적인 벽돌 타운하우스'],
    ['apartment', '아파트', 4, 4, 220, 'housing', '발코니와 공동 정원을 갖춘 중층 주거'],
    ['tower', '고층 주거단지', 6, 6, 170, 'housing', '높은 주거 타워·지역 수요의 중심'],
    ['hotel', '호텔', 6, 6, 258, 'tourism', '루프탑 테라스와 관광객 숙박'],
    ['attraction', '관광시설', 6, 6, 260, 'tourism', '유리 온실·전망 정원'],
    ['theater', '공연장', 7, 7, 266, 'culture', '곡선 지붕·대형 공연 홀'],
    ['library', '도서관', 6, 6, 266, 'culture', '책과 전시가 있는 개방형 문화시설'],
    ['park', '도시 공원', 8, 8, 270, 'housing', '분수·쉼터·그늘·산책 정원'],
    ['office', '업무용 빌딩', 5, 5, 204, 'enterprise', '유리 오피스·옥상 정원'],
    ['hq', '프랜차이즈 본부', 8, 8, 268, 'enterprise', '잎사귀 브랜드·기업 관리 중심'],
    ['logistics', '물류센터', 7, 7, 266, 'enterprise', '하역장·배송 차량·운영 지원'],
    ['main', '메가 카페 본점', 8, 8, 270, 'commerce', '유리 온실 홀·정원·테라스·대표 간판'],
    ['branch', '일반 분점', 5, 5, 266, 'commerce', '벽돌·초록 차양·공통 브랜드'],
    ['commerce-branch', '상업 특화 분점', 5, 5, 266, 'commerce', '테이크아웃 창구·도심형 매장'],
    ['tourism-branch', '관광 특화 분점', 6, 6, 266, 'tourism', '옥상 좌석·전망 테라스'],
    ['culture-branch', '문화 특화 분점', 5, 5, 266, 'culture', '전시 창·곡선 창문·작은 공연'],
    ['transit', '교통 광장', 7, 7, 268, 'commerce', '정류장·보행 광장·도시 접근성']
];
export const buildings = defs.map(([id, name, w, h, basePixels, district, description], index) => ({ id, name, w, h, basePixels, district, description, index, frame: { x: Math.floor(index % 4 * 1122 / 4), y: Math.floor(Math.floor(index / 4) * 1402 / 5), w: Math.floor((index % 4 + 1) * 1122 / 4) - Math.floor(index % 4 * 1122 / 4), h: Math.floor((Math.floor(index / 4) + 1) * 1402 / 5) - Math.floor(Math.floor(index / 4) * 1402 / 5) }, anchor: [.5, .95], approvedForGame: false }));
export const byId = Object.fromEntries(buildings.map(b => [b.id, b]));
export const stages = [{ id: 'early', name: '초기 · 우리 동네의 중심', description: '작은 상업 지구와 주택, 공원. 메가 카페 본점이 동네의 랜드마크예요.', cols: 5, rows: 4 }, { id: 'middle', name: '중기 · 커지는 상업도시', description: '아파트·문화·관광 지구와 2·3호점. 도로와 상권이 연결돼요.', cols: 7, rows: 5 }, { id: 'late', name: '후기 · 프랜차이즈 도시', description: '업무 지구·쇼핑몰·고층 주거·본부·지역 특화 분점이 함께 자라요.', cols: 7, rows: 5 }];
export const parcels = Array.from({ length: 35 }, (_, i) => { const row = Math.floor(i / 7), col = i % 7; const district = col >= 5 ? 'tourism' : row >= 2 && col <= 1 ? 'housing' : row >= 3 ? (col <= 2 ? 'housing' : 'culture') : row <= 1 && col >= 2 ? 'enterprise' : 'commerce'; return { id: 'parcel-' + row + '-' + col, row, col, x: 6 + 12 * col, y: 6 + 12 * row, w: 9, h: 9, district, roadFrontage: true }; });
const specials = { '3-1': { asset: 'main', brand: 'main' }, '1-3': { asset: 'hq', brand: 'hq' }, '1-1': { asset: 'branch', branchId: 2 }, '1-5': { asset: 'tourism-branch', branchId: 3 }, '4-4': { asset: 'culture-branch', branchId: 4 }, '4-5': { asset: 'logistics' }, '2-6': { asset: 'attraction' }, '0-6': { asset: 'hotel' }, '4-2': { asset: 'library' }, '4-3': { asset: 'theater' }, '0-4': { asset: 'park' }, '3-0': { asset: 'park' }, '3-6': { asset: 'transit' } };
export function cityFor(stageId) {
    const stage = stages.find(s => s.id === stageId);
    if (!stage)
        throw Error('Unknown design stage');
    const result = [];
    const put = (p, asset, x, y, extra = {}) => result.push({ id: p.id + '-' + result.filter(b => b.parcelId === p.id).length, parcelId: p.id, asset, x, y, variant: (p.col + p.row) % 3, ...extra });
    for (const p of parcels) {
        if (p.col >= stage.cols || p.row >= stage.rows)
            continue;
        const special = specials[p.row + '-' + p.col];
        if (special) {
            if (special.brand === 'hq' && stageId === 'early')
                continue;
            if (special.branchId && (stageId === 'early' || special.branchId === 4 && stageId !== 'late'))
                continue;
            if (stageId === 'early' && ['logistics', 'hotel', 'attraction', 'transit', 'theater', 'library'].includes(special.asset))
                continue;
            let asset = special.asset;
            if (special.branchId === 2 && stageId === 'late')
                asset = 'commerce-branch';
            put(p, asset, p.x + .5, p.y + .5, special);
            result.at(-1).asset = asset;
            continue;
        }
        if (stageId === 'early') {
            if ((p.row + p.col) % 3 === 0)
                continue;
            put(p, p.district === 'housing' ? 'house' : p.district === 'enterprise' ? (p.col === 2 ? 'arcade' : 'shop') : p.col === 4 ? 'attraction' : 'shop', p.x + 1, p.y + 1);
            if (p.district === 'housing')
                put(p, 'house', p.x + 5, p.y + 4);
        }
        else if (stageId === 'middle') {
            const asset = p.district === 'housing' ? 'apartment' : p.district === 'enterprise' ? 'office' : p.district === 'tourism' ? 'hotel' : p.district === 'culture' ? 'library' : 'arcade';
            put(p, asset, p.x + .8, p.y + .8);
            if (p.district === 'housing')
                put(p, 'house', p.x + 5.5, p.y + 5);
        }
        else {
            const asset = p.district === 'housing' ? ((p.col + p.row) % 2 ? 'tower' : 'apartment') : p.district === 'enterprise' ? 'office' : p.district === 'tourism' ? (p.row % 2 ? 'hotel' : 'attraction') : p.district === 'culture' ? (p.col % 2 ? 'theater' : 'library') : p.row === 2 ? 'mall' : 'arcade';
            put(p, asset, p.x, p.y);
            if (['enterprise', 'housing'].includes(p.district))
                put(p, 'shop', p.x + 6, p.y + 6);
            else if (p.district === 'commerce' && asset !== 'mall')
                put(p, 'house', p.x + 6, p.y + 6);
        }
    }
    return { stage, parcels: parcels.filter(p => p.col < stage.cols && p.row < stage.rows), buildings: result };
}
export const iso = (x, y) => ({ x: (x - y) * WORLD.tileHalfWidth, y: (x + y) * WORLD.tileHalfHeight });
export const uniso = (x, y) => ({ x: (x / WORLD.tileHalfWidth + y / WORLD.tileHalfHeight) / 2, y: (y / WORLD.tileHalfHeight - x / WORLD.tileHalfWidth) / 2 });
export function artRect(b) { const a = byId[b.asset], base = iso(b.x + a.w, b.y + a.h), width = (a.w + a.h) * 24 * a.frame.w / a.basePixels, height = width * a.frame.h / a.frame.w; return { x: base.x - width * a.anchor[0], y: base.y - height * a.anchor[1], w: width, h: height }; }
export function previewPlacement(city, parcelId, asset) {
    const p = city.parcels.find(p => p.id === parcelId), a = byId[asset];
    if (!p || !a || a.w > p.w || a.h > p.h)
        return { ok: false, reason: '이 부지에는 맞지 않아요.' };
    if (a.district !== p.district && !['park', 'branch', 'commerce-branch', 'tourism-branch', 'culture-branch'].includes(asset))
        return { ok: false, reason: '이 지역의 용도에 맞는 시설을 골라 주세요.' };
    if (city.buildings.some(b => b.parcelId === parcelId && (b.brand || b.branchId)))
        return { ok: false, reason: '본점·본부·기존 분점은 시안에서도 자동 철거하지 않아요.' };
    return { ok: true, building: { id: 'preview-' + parcelId, parcelId, asset, x: p.x + (p.w - a.w) / 2, y: p.y + (p.h - a.h) / 2, preview: true } };
}
// Additional original generated architecture; discrete images, never scaled copies of one stage.
for (const [index, id, name, w, h, district] of [[0, 'brand-hq-1', '브랜드 본부', 5, 5, 'enterprise'], [1, 'brand-hq-2', '확장 프랜차이즈 본부', 7, 7, 'enterprise'], [2, 'brand-hq-3', '메가 기업 본부', 8, 8, 'enterprise'], [3, 'culture-small', '동네 예술·도서 공간', 4, 4, 'culture'], [4, 'culture-center', '대형 문화센터', 8, 8, 'culture'], [5, 'tourism-complex', '복합 관광단지', 8, 8, 'tourism']]) {
    const a = { id, name, w, h, district, basePixels: 480, sheet: 'expansion', frame: { x: (index % 3) * 512, y: Math.floor(index / 3) * 512, w: 512, h: 512 }, anchor: [.5, .96], approvedForGame: true };
    buildings.push(a);
    byId[id] = a;
}
