import { deploymentLocalStorage as storage, deploymentPrefix } from './deploymentStorage.js?v=commerce-6afe2d573839';
import { loadCommonRuntime } from './commonBankLoader.js?v=commerce-6afe2d573839';
import { CommonCafeFlow } from './commonCafeFlow.js?v=commerce-6afe2d573839';
/** An additive envelope: native café JSON remains byte-for-byte inside cafe. */
export function commonDeployment() { return ['cafe-v30-mega-common-rc1/', 'cafe-v31-franchise-local/'].includes(deploymentPrefix()); }
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
        return { native: text, install: async () => { } };
    if (!commonDeployment() || !Array.isArray(value.records) || value.records.length > 300)
        throw Error('이 테스트판의 학습 백업이 아니에요.');
    const rows = [];
    for (const row of value.records) {
        if (typeof row.raw !== 'string' || row.raw.length > 4000000)
            throw Error('학습 기록 크기를 확인해 주세요.');
        const body = JSON.parse(row.raw)?.body;
        if (!body || !['math', 'science'].includes(body.subject) || row.key !== 'common-record/' + body.learningRecordId || !/^LR-[a-z0-9-]+$/i.test(body.learningRecordId) || rows.some(r => r.key === row.key))
            throw Error('학습 기록 연결이 달라요.');
        const loaded = await loadCommonRuntime(body.subject), cp = await loaded.module.decode(row.raw), flow = new CommonCafeFlow(loaded, cp.choices, cp);
        await flow.restore(cp);
        const old = storage.getItem(row.key);
        if (old && old !== row.raw)
            throw Error('이 기기의 같은 학습 기록이 이미 갱신됐어요. 덮어쓰지 않아요. 새 테스트 저장 공간에서 복원해 주세요.');
        rows.push({ ...row, item: { id: cp.learningRecordId, subject: cp.subject, at: new Date().toISOString(), scope: cp.choices.map((c) => c.unitLabel).join(', ') } });
    }
    return { native: JSON.stringify(value.cafe), install: async () => { if (!navigator.locks)
            throw Error('안전한 복원을 위해 최신 HTTPS 브라우저를 사용해 주세요.'); await navigator.locks.request(deploymentPrefix() + 'common-archive-index', async () => { for (const r of rows) {
            const old = storage.getItem(r.key);
            if (old && old !== r.raw)
                throw Error('다른 창에서 학습 기록을 변경했어요. 복원을 멈췄어요.');
        } const index = JSON.parse(storage.getItem('common-record-index') ?? '[]'); if (!Array.isArray(index))
            throw Error('기존 기록 목록을 보존했어요. JSON 백업을 확인해 주세요.'); for (const r of rows) {
            storage.setItem(r.key, r.raw);
            if (!index.some((i) => i.id === r.item.id))
                index.push(r.item);
        } storage.setItem('common-record-index', JSON.stringify(index)); }); } };
}
