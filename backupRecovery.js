import { parseGrowthBackup, exportGrowth, checkBackupRun } from './growthBackup.js?v=mega-d152ad969955';
import { unpackCommonBackup, wrapCommonBackup } from './commonBackup.js?v=mega-d152ad969955';
import { questionCatalog } from './questionPack.js?v=mega-d152ad969955';
export const backupLimit = 32000000;
export function backupFilename(date = new Date()) { return '내-카페-백업-' + date.toISOString().replace(/[:.]/g, '-') + '.json'; }
export function checkedGrowthBackup(save) { const native = exportGrowth(save), parsed = parseGrowthBackup(native); if (JSON.stringify(parsed) !== JSON.stringify(save))
    throw Error('백업 데이터가 카페 기록과 달라요. 다운로드하지 않았어요.'); return wrapCommonBackup(native); }
export async function prepareGrowthRestore(text, repo, preflight = checkBackupRun) { if (text.length > backupLimit)
    throw Error('백업은32MB까지 확인할 수 있어요. 기존 기록은 유지돼요.'); const bundle = await unpackCommonBackup(text), save = parseGrowthBackup(bundle.native), raw = JSON.parse(bundle.native), date = typeof raw.exportedAt === 'string' && Number.isFinite(Date.parse(raw.exportedAt)) ? raw.exportedAt : save.updatedAt; questionCatalog.prepareResume(save.campaign?.run); await preflight(save); const expected = JSON.stringify(repo.read()); let done = false; return { save, date, current: repo.read(), restore: async () => { if (done)
        return { ok: false, message: '이 파일은 이미 복원했어요. 이어하기를 눌러 주세요.' }; if (JSON.stringify(repo.read()) !== expected)
        return { ok: false, message: '카페 기록이 바뀌었어요. 파일을 다시 선택해 비교해 주세요. 기존 기록은 유지돼요.' }; const result = await bundle.restore(() => repo.replace(save, true)); if (result.ok)
        done = true; return result; } }; }
