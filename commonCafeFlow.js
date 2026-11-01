/** Game adapter: selection/assessment/review/reporting stay in the supplier engine.
 * The café owns only the per-basic-delivery production ledger, not a question-wide reward cap.
 * snapshot() belongs in the SAME atomic game checkpoint as stock and money, never a second key.
 */
export class CommonCafeFlow {
    loaded;
    choices;
    learningRecordId;
    gameSessionId;
    sources = new Map();
    sessions = [];
    pendingTwins = [];
    turn = 0;
    current = null;
    awards = [];
    answered = false;
    firstReport;
    gameSpecific;
    constructor(loaded, choices, ids) {
        this.loaded = loaded;
        this.choices = choices;
        if (!choices.length)
            throw Error('학습 범위를 골라 주세요.');
        this.learningRecordId = ids?.learningRecordId ?? 'LR-' + crypto.randomUUID();
        this.gameSessionId = ids?.gameSessionId ?? 'CAFE-' + crypto.randomUUID();
        for (const semesterKey of new Set(choices.map(c => c.semesterKey))) {
            const bank = loaded.runtime.createBank({ semesterKey, learningRecordId: this.learningRecordId });
            this.sources.set(semesterKey, { bank, engine: bank.createReviewEngine(loaded.module.memoryStorage()), sessionIds: [] });
        }
        for (const c of choices) {
            const scope = this.scope(c);
            if (c.skillIds?.some(id => !scope.skillIds.includes(id)) || c.levels?.some(n => !scope.levels.includes(n)))
                throw Error('승인 범위 밖의 학습 요소예요.');
        }
    }
    difficulty;
    setDifficulty(get) { this.difficulty = get; }
    levelCache = new Map();
    target(c) { if (!this.levelCache.has(c)) {
        const bank = this.sources.get(c.semesterKey).bank;
        this.levelCache.set(c, [...new Set(bank.getCandidates(this.selectedScope(c)).map((r) => bank.getQuestion(r.questionRef).metadata.difficulty))].sort((a, b) => a - b));
    } const levels = this.levelCache.get(c); return this.difficulty ? levels.reduce((best, n) => Math.abs(n - this.difficulty()) < Math.abs(best - this.difficulty()) ? n : best, levels[0]) : undefined; }
    scope(c) { return this.sources.get(c.semesterKey).bank.defaultScope(c.unitId); }
    selectedScope(c) { const s = this.scope(c); return { ...s, skillIds: c.skillIds ?? s.skillIds, levels: c.levels ?? s.levels }; }
    async newSession(choice) { const c = this.choices[choice], s = this.sources.get(c.semesterKey), level = this.target(c), session = await s.engine.openSession({ ...this.selectedScope(c), ...(level === undefined ? {} : { levels: [level] }) }); s.sessionIds.push(session.sessionId); const row = { sourceId: c.semesterKey, choice, id: session.sessionId, ...(level === undefined ? {} : { level }) }; this.sessions.push(row); return row; }
    async next() {
        if (this.current && !this.answered)
            return { status: 'question', delivery: this.current.delivery, question: this.question() };
        for (const pending of [...this.pendingTwins]) {
            const s = this.sources.get(pending.sourceId), r = await s.engine.requestEquivalentTwin(pending.sessionId);
            if (r.status === 'question') {
                this.pendingTwins = this.pendingTwins.filter(p => p !== pending);
                this.current = { sourceId: pending.sourceId, sessionId: pending.sessionId, delivery: r.delivery };
                this.answered = false;
                return { ...r, question: this.question() };
            }
        }
        for (let n = 0; n < this.choices.length; n++) {
            const choice = this.turn++ % this.choices.length, c = this.choices[choice], s = this.sources.get(c.semesterKey);
            let session = this.sessions.filter(t => t.choice === choice && (this.difficulty === undefined || t.level === this.target(c)) && !this.pendingTwins.some(p => p.sessionId === t.id)).at(-1) ?? await this.newSession(choice);
            let r = await s.engine.nextQuestion(session.id);
            if (r.status === 'exhausted') {
                session = await this.newSession(choice);
                r = await s.engine.nextQuestion(session.id);
            }
            if (r.status === 'question') {
                this.current = { sourceId: c.semesterKey, sessionId: session.id, delivery: r.delivery };
                this.answered = false;
                return { ...r, question: this.question() };
            }
        }
        this.current = null;
        return { status: 'held', reason: '선택한 범위에서 사용할 동등 문제가 부족해요. 기록은 유지되며 다른 개념으로 바꿔 채우지 않아요.' };
    }
    question() { return this.current ? this.sources.get(this.current.sourceId).bank.getQuestion(this.current.delivery.questionRef) : null; }
    async answer(response, seconds = 0, attemptId = 'attempt-' + this.current?.delivery.id) {
        if (!this.current)
            throw Error('출제 기회를 먼저 확인해 주세요.');
        const { sourceId, delivery, sessionId } = this.current, s = this.sources.get(sourceId);
        const result = await s.engine.applyAttemptEvent({ attemptId, deliveryId: delivery.id, response, seconds });
        if (result.status === 'invalid')
            return { ...result, productionAllowed: false };
        this.answered = true;
        const raw = await this.loaded.module.decode(await s.engine.serialize()), stored = raw.deliveries.find((d) => d.id === delivery.id);
        if (!stored)
            throw Error('출제 연결을 확인해 주세요.');
        if (stored.role === 'base' && result.status === 'incorrect' && !this.pendingTwins.some(p => p.sessionId === sessionId))
            this.pendingTwins.unshift({ sourceId, sessionId });
        let flowId = stored.role === 'base' ? delivery.id : null;
        if (stored.role === 'instant-twin') {
            const parent = raw.attempts.find((a) => a.id === stored.parentBaseAttemptId);
            if (!parent)
                throw Error('원 기본형 응답 연결을 확인해 주세요.');
            flowId = parent.deliveryId;
        }
        const productionAllowed = result.status === 'correct' && flowId !== null && !this.awards.some(a => a.sourceId === sourceId && a.flowId === flowId);
        if (productionAllowed)
            this.awards.push({ sourceId, flowId, attemptId: result.acceptedAttemptId });
        return { ...result, flowId, productionAllowed, question: this.question() };
    }
    async snapshot() { const sources = []; for (const [id, s] of this.sources)
        sources.push({ id, backup: await s.engine.serialize(), sessionIds: [...s.sessionIds] }); return { version: 1, subject: this.loaded.subject, manifestSHA256: this.loaded.manifestSHA256, learningRecordId: this.learningRecordId, gameSessionId: this.gameSessionId, choices: structuredClone(this.choices), sources, sessions: structuredClone(this.sessions), pendingTwins: structuredClone(this.pendingTwins), turn: this.turn, current: this.current ? { ...structuredClone(this.current), answered: this.answered } : null, awards: structuredClone(this.awards), ...this.gameSpecific ? { gameSpecific: this.gameSpecific } : {}, ...this.firstReport ? { firstReport: this.firstReport } : {} }; }
    async restore(c) {
        if (c.version !== 1 || c.subject !== this.loaded.subject || c.manifestSHA256 !== this.loaded.manifestSHA256 || c.learningRecordId !== this.learningRecordId || c.gameSessionId !== this.gameSessionId || (await this.loaded.module.encode(c.choices)) !== (await this.loaded.module.encode(this.choices)) || !Number.isSafeInteger(c.turn) || c.turn < 0 || c.awards.length > 2000 || new Set(c.awards.map(a => a.sourceId + ':' + a.flowId)).size !== c.awards.length)
            throw Error('공통 학습 백업 계약이 달라요. 원본은 유지돼요.');
        if (c.awards.some(a => !this.sources.has(a.sourceId)))
            throw Error('음식 생산 원천이 달라요.');
        if (c.sources.length !== this.sources.size)
            throw Error('학습 범위가 달라요.');
        for (const source of c.sources) {
            const s = this.sources.get(source.id);
            if (!s)
                throw Error('다른 학기 자료예요.');
            await s.engine.restore(source.backup);
            const raw = await this.loaded.module.decode(await s.engine.serialize());
            if (source.sessionIds.some(id => !raw.sessions.some((t) => t.id === id)))
                throw Error('세션 연결이 달라요.');
            s.sessionIds = [...source.sessionIds];
            for (const award of c.awards.filter(a => a.sourceId === source.id)) {
                const attempt = raw.attempts.find((a) => a.id === award.attemptId), delivery = attempt && raw.deliveries.find((d) => d.id === attempt.deliveryId);
                if (!attempt || attempt.status !== 'correct' || !delivery || !['base', 'instant-twin'].includes(delivery.role))
                    throw Error('음식 생산 응답 연결이 달라요.');
                const parent = delivery.role === 'base' ? delivery.id : raw.attempts.find((a) => a.id === delivery.parentBaseAttemptId)?.deliveryId;
                if (parent !== award.flowId)
                    throw Error('음식 생산 기회가 달라요.');
            }
        }
        this.sessions = structuredClone(c.sessions);
        this.pendingTwins = structuredClone(c.pendingTwins);
        this.turn = c.turn;
        this.current = structuredClone(c.current);
        this.answered = !!c.current?.answered;
        this.awards = structuredClone(c.awards);
        this.firstReport = structuredClone(c.firstReport);
        this.gameSpecific = structuredClone(c.gameSpecific);
        if (this.current) {
            const s = this.sources.get(this.current.sourceId);
            if (!s)
                throw Error('출제 원천을 확인해 주세요.');
            const raw = await this.loaded.module.decode(await s.engine.serialize()), d = raw.deliveries.find((d) => d.id === this.current.delivery.id);
            if (!d || d.role !== this.current.delivery.role || (Object.keys(d.ref).length !== Object.keys(this.current.delivery.questionRef ?? {}).length || Object.entries(d.ref).some(([key, value]) => this.current.delivery.questionRef[key] !== value)) || !!d.answeredAttemptId !== this.answered)
                throw Error('현재 출제 기회 연결이 달라요.');
            s.bank.getQuestion(d.ref);
        }
    }
    async reviewQueue() { const out = []; for (const [sourceId, s] of this.sources)
        for (const row of await s.engine.getReviewQueue())
            out.push({ ...row, sourceId }); return out; }
    async startChallenge(sourceId, entryId) { return this.sources.get(sourceId).engine.startChallenge(entryId); }
    async nextChallenge(sourceId, challengeId) { const s = this.sources.get(sourceId), r = await s.engine.nextChallenge(challengeId); if (r.status === 'question') {
        this.current = { sourceId, sessionId: challengeId, delivery: r.delivery };
        this.answered = false;
        return { ...r, question: this.question() };
    } return r; }
    async report() {
        const sources = [];
        const selectedScopes = [];
        for (const [sourceId, s] of this.sources)
            sources.push({ sourceId, bank: this.loaded.reportPort.createReportPort(s.bank, s.engine), backup: await s.engine.serialize(), sessionIds: [...s.sessionIds] });
        for (const c of this.choices) {
            const s = this.selectedScope(c);
            selectedScopes.push({ sourceId: c.semesterKey, subject: s.subject, grade: s.grade, semester: s.semester, unitId: s.unitId, unitLabel: c.unitLabel, packId: s.packId, packVersion: s.packVersion, contentVersion: s.contentVersion, skills: s.skillIds.map((id) => ({ id, label: c.skillLabels?.[id] ?? c.unitLabel })), levels: s.levels });
        }
        const context = { learningRecordId: this.learningRecordId, gameSessionId: this.gameSessionId, gameName: '카페 학습 타이쿤', subject: this.loaded.subject, subjectLabel: this.loaded.subject === 'math' ? '수학' : '과학', selectedScopes: this.firstReport?.selectedScopes ?? selectedScopes, generatedAt: new Date().toISOString(), ...this.gameSpecific ? { gameSpecific: this.gameSpecific } : {} };
        const first = this.choices[0], scope = this.scope(first);
        const r = await this.loaded.reports.fromEquivalentTwo(this.loaded.reports.fromMixedEquivalentTwo ? { sources, context, baseline: this.firstReport } : { bank: sources[0].bank, backup: sources[0].backup, sessionIds: sources[0].sessionIds, context: { ...context, grade: scope.grade, semester: scope.semester, unitId: scope.unitId, unitLabel: first.unitLabel, selectedSkills: this.firstReport?.selectedSkills ?? scope.skillIds.map((id) => ({ id, label: first.skillLabels?.[id] ?? first.unitLabel })) }, baseline: this.firstReport });
        return r;
    }
}
