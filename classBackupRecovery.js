import { unpackCommonBackup } from './commonBackup.js?v=v31-final-636a93f6f215';
import { restoreClass, classSaveKey } from './classRuntime.js?v=v31-final-636a93f6f215';
import { deploymentLocalStorage as storage } from './deploymentStorage.js?v=v31-final-636a93f6f215';
import { questionCatalog } from './questionPack.js?v=v31-final-636a93f6f215';
import { loadCommonRuntime } from './commonBankLoader.js?v=v31-final-636a93f6f215';
import { CommonCafeFlow } from './commonCafeFlow.js?v=v31-final-636a93f6f215';
const keys = [classSaveKey, 'class-random-previous', 'class-random-history'];
export const classBackupLimit = 32_000_000;
const snapshot = () => new Map(keys.map(key => [key, storage.getItem(key)]));
const unchanged = (before) => [...before].every(([key, raw]) => storage.getItem(key) === raw);
function rollback(before) {
    let failed = false;
    for (const [key, raw] of before)
        try {
            if (storage.getItem(key) === raw)
                continue;
            if (raw === null)
                storage.removeItem(key);
            else
                storage.setItem(key, raw);
        }
        catch {
            failed = true;
        }
    if (failed || !unchanged(before))
        throw Error('저장 공간 오류로 원본 복원을 확인하지 못했어요. 초기화하지 말고 JSON을 보관해 주세요.');
}
async function load(checkpoint) { questionCatalog.prepareResume(checkpoint); return (await questionCatalog.load(checkpoint.packId)).questions; }
/** Preflight is read-only. Raw CLASS v1 checkpoints from v3.0 remain accepted. */
export async function prepareClassRestore(text, loadPack = load) {
    if (text.length > classBackupLimit || new TextEncoder().encode(text).length > classBackupLimit)
        throw Error('CLASS 백업은32MB까지 확인할 수 있어요. 기존 기록은 유지돼요.');
    const envelope = JSON.parse(text), value = envelope?.format === 'cafe-common-complete-v1' ? envelope.cafe : envelope;
    // Reject the game/envelope before decoding any attached learning records.
    if (envelope?.format !== undefined && envelope.format !== 'cafe-common-complete-v1' || !value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || typeof value.packId !== 'string' || !value.state || typeof value.state.id !== 'string' || !value.cafe || !value.learning || !Array.isArray(value.guests) || !Array.isArray(value.workers) || !Array.isArray(value.purchases))
        throw Error('이 파일은 지원하는 카페 CLASS 백업이 아니에요. 기존 기록은 유지돼요.');
    const bundle = await unpackCommonBackup(text), checkpoint = value, pool = await loadPack(checkpoint);
    restoreClass(checkpoint, pool, checkpoint.state.lastNow);
    const common = checkpoint.learning.session.common;
    if (common) {
        const loaded = await loadCommonRuntime(common.subject, common.choices), flow = new CommonCafeFlow(loaded, common.choices, common);
        await flow.restore(common);
    }
    const expected = snapshot();
    let pending = false, done = false;
    return { checkpoint, pool, restore: async (activate = async () => { }) => {
            if (pending || done)
                throw Error('이미 복원 중이거나 완료한 파일이에요.');
            if (!unchanged(expected))
                throw Error('CLASS 기록이 바뀌었어요. 파일을 다시 확인해 주세요.');
            pending = true;
            try {
                await bundle.restoreAsync(async () => {
                    if (!unchanged(expected))
                        throw Error('다른 창에서 CLASS 기록을 변경했어요. 덮어쓰지 않았어요.');
                    try {
                        const prior = expected.get(classSaveKey), old = prior ? JSON.parse(prior) : null;
                        if (old && old.state?.id !== checkpoint.state.id) {
                            storage.setItem('class-random-previous', prior);
                            const history = JSON.parse(expected.get('class-random-history') ?? '[]');
                            if (!Array.isArray(history))
                                throw Error('기존 CLASS 기록 목록을 확인해 주세요.');
                            if (!history.some((h) => h.id === old.state.id))
                                history.push({ id: old.state.id, duration: old.duration, seed: old.state.seed, level: old.cafe.cafeLevel, revenue: old.cafe.stats.revenue, correct: old.cafe.stats.correct, closed: old.closed });
                            storage.setItem('class-random-history', JSON.stringify(history.slice(-50)));
                        }
                        const raw = JSON.stringify(checkpoint);
                        storage.setItem(classSaveKey, raw);
                        if (storage.getItem(classSaveKey) !== raw)
                            throw Error('CLASS 저장을 확인하지 못했어요.');
                        await activate();
                        return { ok: true, message: 'CLASS 복원 완료' };
                    }
                    catch (error) {
                        rollback(expected);
                        throw error;
                    }
                });
                done = true;
            }
            finally {
                pending = false;
            }
        } };
}
