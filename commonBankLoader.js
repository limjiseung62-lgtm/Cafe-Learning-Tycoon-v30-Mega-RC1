import { commonBankPins } from './commonBankPins.js?v=v30-rc1-0dab56eed3a7';
const cache = new Map();
async function digest(b) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(b).buffer)), x => x.toString(16).padStart(2, '0')).join(''); }
/** Transport compression is lossless. Supplier manifest/data/reference hashes remain unchanged. */
export function loadCommonRuntime(subject) {
    if (!cache.has(subject))
        cache.set(subject, (async () => {
            const p = commonBankPins.find(p => p.subject === subject);
            if (!p)
                throw Error('지원하지 않는 과목이에요.');
            const loaded = new Map();
            const readAsset = (name) => { if (!loaded.has(name))
                loaded.set(name, (async () => { const f = p.files.find(f => f.path === name); if (!f)
                    throw Error('승인 목록에 없는 자산이에요: ' + name); const r = await fetch(p.base + f.url); if (!r.ok)
                    throw Error('공통 학습 자료를 불러오지 못했어요.'); let b = new Uint8Array(await r.arrayBuffer()); if (b.length !== f.transportBytes || await digest(b) !== f.transportSHA256)
                    throw Error('공통 학습 운송 해시가 달라요.'); if (f.gzip) {
                    const stream = new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'));
                    b = new Uint8Array(await new Response(stream).arrayBuffer());
                } if (b.length !== f.bytes || await digest(b) !== f.sha256)
                    throw Error('승인된 원본 해시가 달라요.'); return b; })()); return loaded.get(name); };
            // Verify fixed code pins before importing any supplier module. No admin/demo UI or styles are mounted.
            await Promise.all(p.files.filter(f => f.path.endsWith('.mjs')).map(f => readAsset(f.path)));
            const base = new URL(p.base, document.baseURI);
            const module = await import(new URL(p.runtime, base).href);
            const runtime = await module.loadCommonBank({ manifestBytes: await readAsset(p.manifest), expectedManifestSHA256: p.manifestSHA256, readAsset, consumer: 'cafe-learning-tycoon', purpose: subject === 'math' ? 'operational-supply' : 'candidate-integration-test' });
            const [reports, reportPort, png] = await Promise.all(['report.mjs', 'report-port.mjs', 'png.mjs'].map(f => import(new URL(f, base).href)));
            return { subject, module, runtime, reports, reportPort, png, manifestSHA256: p.manifestSHA256 };
        })().catch(error => { cache.delete(subject); throw error; }));
    return cache.get(subject);
}
