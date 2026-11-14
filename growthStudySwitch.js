import { validBusinessStudies } from './growthBusinessStudies.js';
import { restoreGrowthRun, studyRecord } from './growthCampaign.js';
import { LearningSession } from './learningSession.js';
import { LearningAnalyticsV1 } from './learningAnalytics.js';
import { providerForPool } from './learningIntegration.js';
import { CommonCafeFlow } from './commonCafeFlow.js';
import { loadCommonRuntime } from './commonBankLoader.js';
import { deploymentLocalStorage as storage } from './deploymentStorage.js';
import { unpackCommonBackup } from './commonBackup.js';
/** Read-only preparation: keep the business/clock/cargo/settlement identity, replace only its study. */
export async function prepareGrowthStudySwitch(source, oldPool, pool) {
    const run = source.campaign?.run;
    if (!run || run.closed)
        throw Error('진행 중인 카페 학습만 변경할 수 있어요.');
    const next = structuredClone(source), c = next.campaign, r = c.run;
    let old;
    try {
        old = restoreGrowthRun(run, oldPool, run.startAt + (run.elapsed ?? 0) * 1000);
    }
    catch (error) {
        const carrier = new LearningSession(providerForPool(oldPool)), a = new LearningAnalyticsV1(run.packId);
        throw Error('이전 학습 확인: ' + (carrier.restoreCheckpoint(run.learning.session) ? '학습 OK' : '학습 연결 오류') + ' / ' + (a.restore(run.learning.analytics) ? '통계 OK' : '통계 연결 오류') + ' · ' + (error instanceof Error ? error.message : String(error)));
    }
    c.studies[run.packId] = studyRecord(old.learning, run.studyBase);
    const provider = providerForPool(pool), engine = new LearningSession(provider), analytics = new LearningAnalyticsV1(provider.packId);
    const setup = pool[0]?.commonChoice;
    if (!setup)
        throw Error('승인된 새 학습 범위를 확인해 주세요.');
    const loaded = await loadCommonRuntime(setup.subject, setup.choices), flow = new CommonCafeFlow(loaded, setup.choices);
    engine.common = await flow.snapshot();
    const carry = [...r.learning.businessStudies ?? [], { packId: run.packId, attempts: structuredClone(old.learning.attempts), ...run.studyBase ? { previous: structuredClone(run.studyBase) } : {} }];
    if (!validBusinessStudies(carry))
        throw Error('한 영업의 학습 범위 변경 기록이 너무 많아요. 현재 영업을 마친 뒤 다시 선택해 주세요.');
    r.packId = provider.packId;
    r.learning = { businessStudies: carry, session: engine.checkpoint(), analytics: analytics.checkpoint(), readVisits: [], specialAttempt: run.learning.specialAttempt ?? null };
    if (c.studies[r.packId])
        r.studyBase = structuredClone(c.studies[r.packId]);
    else
        delete r.studyBase;
    const records = [], oldCommon = run.learning.session.common;
    if (oldCommon) {
        const key = 'common-record/' + oldCommon.learningRecordId;
        const existing = storage.getItem(key);
        if (!existing) {
            const bank = await loadCommonRuntime(oldCommon.subject, oldCommon.choices);
            const archived = new CommonCafeFlow(bank, oldCommon.choices, oldCommon);
            await archived.restore(oldCommon);
            records.push({ key, raw: await bank.module.encode(oldCommon) });
        }
    }
    const bundle = await unpackCommonBackup(JSON.stringify({ format: 'cafe-common-complete-v1', cafe: next, records }));
    return { save: next, commit: async (repo) => bundle.restore(() => { const current = repo.read(); if (current.status !== 'ready' || JSON.stringify(current.save) !== JSON.stringify(source))
            return { ok: false, message: '카페 기록이 바뀌었어요. 다시 열어 주세요.' }; return repo.write(next, source); }) };
}
