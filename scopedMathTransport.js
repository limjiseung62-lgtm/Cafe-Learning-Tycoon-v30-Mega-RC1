import { scopedMathIndexSHA256 } from './scopedMathPin.js?v=mega-d152ad969955';
const digest = async (b) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(b).buffer)), n => n.toString(16).padStart(2, '0')).join('');
const base = () => new URL('assets/cafe-scoped-math/', document.baseURI);
async function bytes(file) { if (!/^(index\.json|runtime\.mjs|scoped-core\.mjs|unit-\d{2}\.json\.gz)$/.test(file))
    throw Error('분할 자료 경로가 달라요.'); const r = await fetch(new URL(file, base())); if (!r.ok)
    throw Error('선택 단원 자료를 불러오지 못했어요.'); return new Uint8Array(await r.arrayBuffer()); }
let indexPromise;
export async function scopedMathIndex() { if (!indexPromise)
    indexPromise = (async () => { const b = await bytes('index.json'); if (await digest(b) !== scopedMathIndexSHA256)
        throw Error('분할 인덱스 해시가 달라요.'); const x = JSON.parse(new TextDecoder().decode(b)); if (x.format !== 'cafe-approved-math-slices/1' || x.sourceObjects !== 49233 || x.sourceGroups !== 943 || x.parts.length !== 48 || new Set(x.parts.map((p) => p.key)).size !== 48)
        throw Error('분할 공급 범위가 달라요.'); return x; })().catch(e => { indexPromise = undefined; throw e; }); return indexPromise; }
export function scopedMathKey(scope) { if (!Array.isArray(scope) || !scope.length || scope.length > 48 || scope.some(c => typeof c?.semesterKey !== 'string' || typeof c?.unitId !== 'string'))
    throw Error('수학 학습 범위를 먼저 선택해 주세요.'); return [...new Set(scope.map(c => c.semesterKey + '/' + c.unitId))].sort(); }
export async function verifyScopedMathCode() { const index = await scopedMathIndex(); for (const f of index.files)
    if (await digest(await bytes(f.file)) !== f.sha256)
        throw Error('파생 로더 코드 해시가 달라요.'); return new URL('runtime.mjs', base()).href; }
export async function loadScopedMathData({ manifest, manifestSHA256, scope }) {
    const index = await scopedMathIndex(), keys = scopedMathKey(scope), source = manifest.files.find((f) => f.role === 'approved-data');
    if (index.sourceManifestSHA256 !== manifestSHA256 || index.sourceDataSHA256 !== source?.sha256 || index.packId !== manifest.packId || index.dataVersion !== manifest.dataVersion || index.catalogDigest !== manifest.catalogDigest || index.sourceGroups !== manifest.counts.groups || index.sourceObjects !== manifest.counts.objects)
        throw Error('원본과 분할 공급 계약이 달라요.');
    const objects = new Map(), groups = new Map();
    let header;
    for (const key of keys) {
        const p = index.parts.find((p) => p.key === key);
        if (!p)
            throw Error('승인된 학습 단원을 확인해 주세요.');
        const raw = await bytes(p.file);
        if (raw.length !== p.transportBytes || await digest(raw) !== p.transportSHA256)
            throw Error('단원 운송 해시가 달라요.');
        const stream = new Blob([new Uint8Array(raw).buffer]).stream().pipeThrough(new DecompressionStream('gzip')), b = new Uint8Array(await new Response(stream).arrayBuffer());
        if (b.length !== p.bytes || await digest(b) !== p.sha256)
            throw Error('단원 원본 해시가 달라요.');
        const data = JSON.parse(new TextDecoder().decode(b));
        if (data.objects.length !== p.objects || data.groups.length !== p.groups || data.groups.some((g) => g.semesterKey !== p.semesterKey || g.unitId !== p.unitId))
            throw Error('단원 범위가 달라요.');
        header ??= { ...data, objects: undefined, groups: undefined };
        for (const o of data.objects) {
            const old = objects.get(o.objectId);
            if (old && JSON.stringify(old) !== JSON.stringify(o))
                throw Error('문항 ID가 충돌해요.');
            objects.set(o.objectId, o);
        }
        for (const g of data.groups) {
            if (groups.has(g.groupId))
                throw Error('중복 학습 그룹이에요.');
            groups.set(g.groupId, g);
        }
    }
    return { ...header, objects: [...objects.values()], groups: [...groups.values()] };
}
