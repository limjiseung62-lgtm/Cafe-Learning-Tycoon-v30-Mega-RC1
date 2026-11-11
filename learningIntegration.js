import { deploymentLocalStorage } from './deploymentStorage.js?v=mega-d152ad969955';
import { JsonQuestionProvider, legacyQuestions } from './questionPack.js?v=mega-d152ad969955';
import { LearningSession, LearningProgressRepository } from './learningSession.js?v=mega-d152ad969955';
import { LocalProblemRepository } from './problems.js?v=mega-d152ad969955';
let storage = null;
try {
    if (typeof deploymentLocalStorage !== 'undefined')
        storage = deploymentLocalStorage;
}
catch { }
export let learningProgressRepository = new LearningProgressRepository(storage);
export function providerForPool(pool) { const first = pool[0]; if (first?.commonChoice)
    return { packId: first.packId, list: () => structuredClone(pool), twin: () => null }; if (first?.packId && first.questionId) {
    return new JsonQuestionProvider({ schemaVersion: 1, packId: first.packId, title: first.unit, subject: first.subject, grade: first.grade, semester: first.semester, unit: first.unit, version: first.packVersion ?? '1.0.0', source: first.sourceFile ?? 'JSON', questions: pool, templates: [] });
} const questions = legacyQuestions(pool); return { packId: 'legacy-demo', list: () => structuredClone(questions), twin: () => null }; }
export function createLearning(pool, persistent, random = Math.random, options = {}) { const provider = providerForPool(pool ?? new LocalProblemRepository().list()); return new LearningSession(provider, random, persistent ? learningProgressRepository.read(provider.packId) : undefined, undefined, options); }
export function configureLearningRepository(repository) { learningProgressRepository = repository; }
