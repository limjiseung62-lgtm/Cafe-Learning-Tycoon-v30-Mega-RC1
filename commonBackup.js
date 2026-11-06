import { deploymentLocalStorage as storage, deploymentPrefix } from './deploymentStorage.js?v=backup-p0-b5b501b25d27';
import { loadCommonRuntime } from './commonBankLoader.js?v=backup-p0-b5b501b25d27';
import { CommonCafeFlow } from './commonCafeFlow.js?v=backup-p0-b5b501b25d27';
/** An additive envelope: native café JSON remains byte-for-byte inside cafe. */
export function commonDeployment() { return ['cafe-v30-city-integrated-local/', 'cafe-v30-mega-common-rc1/', 'cafe-v31-franchise-local/'].includes(deploymentPrefix()); }
export function commonRecordEntries() { const out = []; for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith('common-record/')) {
        const raw = storage.getItem(key);
        if (raw)
            out.push({ key, raw });
    }
} return out.sort((a, b) => a.key.localeCompare(b.key)); }
export function wrapCommonBackup(native) { return commonDeployment() ? JSON.stringify({ format: 'cafe-common-complete-v1', cafe: JSON.parse(native), records: commonRecordEntries() }) : native; }
export async function unpackCommonBackup(text) {
    if (text.length > 32000000)
        throw Error('백업은 32MB까지 확인할 수 있어요.');
    const value = JSON.parse(text);
    if (value?.format !== 'cafe-common-complete-v1')
        return commonBundle(text, []);
    if (!commonDeployment() || !Array.isArray(value.records) || value.records.length > 300)
        throw Error('이 테스트판의 학습 백업이 아니에요.');
    const rows = [];
    for (const row of value.records) {
        if (typeof row.raw !== 'string' || row.raw.length > 4000000)
            throw Error('학습 기록 크기를 확인해 주세요.');
        const body = JSON.parse(row.raw)?.body;
        if (!body || !['math', 'science', 'korean-literacy', 'social-studies'].includes(body.subject) || row.key !== 'common-record/' + body.learningRecordId || !/^LR-[a-z0-9-]+$/i.test(body.learningRecordId) || rows.some(r => r.key === row.key))
            throw Error('학습 기록 연결이 달라요.');
        const loaded = await loadCommonRuntime(body.subject, body.choices), cp = await loaded.module.decode(row.raw), flow = new CommonCafeFlow(loaded, cp.choices, cp);
        await flow.restore(cp);
        const old = storage.getItem(row.key);
        if (old && old !== row.raw)
            throw Error('이 기기의 같은 학습 기록이 이미 갱신됐어요. 덮어쓰지 않아요. 새 테스트 저장 공간에서 복원해 주세요.');
        rows.push({ ...row, item: { id: cp.learningRecordId, subject: cp.subject, at: new Date().toISOString(), scope: cp.choices.map((c) => c.unitLabel).join(', ') } });
    }
    return commonBundle(JSON.stringify(value.cafe), rows);
}
function commonBundle(native, rows) {
    const run = async (commit) => { if (!rows.length)
        return commit?.() ?? { ok: true, message: '' }; const apply = () => { const prior = new Map(); for (const key of [...rows.map(r => r.key), 'common-record-index'])
        prior.set(key, storage.getItem(key)); try {
        for (const r of rows) {
            const old = storage.getItem(r.key);
            if (old && old !== r.raw)
                throw Error('다른 창에서 학습 기록을 변경했어요. 기존 기록은 보존돼요.');
        }
        if (rows.length) {
            const index = JSON.parse(prior.get('common-record-index') ?? '[]');
            if (!Array.isArray(index))
                throw Error('기존 학습 기록 목록을 확인해 주세요.');
            for (const r of rows) {
                storage.setItem(r.key, r.raw);
                if (storage.getItem(r.key) !== r.raw)
                    throw Error('학습 기록 저장을 확인하지 못했어요.');
                if (!index.some((i) => i.id === r.item.id))
                    index.push(r.item);
            }
            storage.setItem('common-record-index', JSON.stringify(index));
        }
        const result = commit?.() ?? { ok: true, message: '' };
        if (!result.ok)
            throw Error(result.message);
        return result;
    }
    catch (error) {
        let failed = false;
        for (const [key, raw] of prior)
            try {
                if (raw === null)
                    storage.removeItem(key);
                else
                    storage.setItem(key, raw);
            }
            catch {
                failed = true;
            }
        throw Error((error instanceof Error ? error.message : '복원 실패') + (failed ? ' · 학습 기록 되돌리기를 확인하지 못했어요. 파일을 보관하고 카페를 다시 열어 주세요.' : ''));
    } }; if (!rows.length)
        return apply(); if (typeof navigator === 'undefined' || !navigator.locks)
        throw Error('안전한 학습 기록 복원을 위해 최신 HTTPS 브라우저를 사용해 주세요.'); return navigator.locks.request(deploymentPrefix() + 'common-archive-index', apply); };
    return { native, install: async () => { await run(); }, restore: (commit) => run(commit) };
}
