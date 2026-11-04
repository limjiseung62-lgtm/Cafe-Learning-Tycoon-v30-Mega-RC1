// learning-review-r1/dist/util.js
var canonical = (v) => JSON.stringify(sort(v));
function sort(v) {
  if (Array.isArray(v))
    return v.map(sort);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sort(x)]));
  return v;
}
async function sha(v) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(typeof v === "string" ? v : canonical(v)));
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, "0")).join("");
}
function requireThat(ok, message) {
  if (!ok)
    throw Error(message);
}
var clone = (x) => structuredClone(x);

// qb-ux8/review-store.mjs
var identity = (t) => [t.targetType, t.targetId, t.version, t.contentHash].join(":");
var emptyDB = () => ({ schemaVersion: 2, contextId: crypto.randomUUID(), events: [], importConflicts: [] });
function validateEvent(r) {
  return r && typeof r.eventId === "string" && ["question", "template"].includes(r.targetType) && typeof r.targetId === "string" && Number.isInteger(r.version) && r.version > 0 && /^[a-f0-9]{64}$/.test(r.contentHash) && ["pass", "fail", "revise"].includes(r.verdict) && typeof r.comment === "string" && r.comment.length <= 4e3 && (r.verdict !== "revise" || r.comment.trim().length > 0) && Array.isArray(r.previousEventIds) && r.previousEventIds.every((x) => typeof x === "string") && (r.reviewer === null || typeof r.reviewer === "string") && (r.reviewedAt === null || Number.isFinite(Date.parse(r.reviewedAt))) && typeof r.actualHumanReview === "boolean" && r.productionReady === false;
}
function heads(db, t) {
  const rows = db.events.filter((r) => identity(r) === identity(t)), parents = new Set(rows.flatMap((r) => r.previousEventIds));
  return rows.filter((r) => !parents.has(r.eventId));
}
function stateFor(db, t) {
  const h = heads(db, t);
  if (db.importConflicts.some((c) => !c.resolvedBy && identity(c.existing) === identity(t))) return { verdict: "conflict", heads: h, comment: "\uAC19\uC740 eventId\uC758 \uB0B4\uC6A9\uC774 \uB2E4\uB978 \uAC00\uC838\uC624\uAE30 \uCDA9\uB3CC" };
  if (h.length > 1) return { verdict: "conflict", heads: h, comment: h.map((r) => r.comment).join(" / ") };
  return h[0] ?? { verdict: "pending", heads: [], comment: "" };
}
function decide(db, t, verdict, comment = "", reviewer = null, test = false) {
  if (verdict === "revise" && !comment.trim()) throw Error("\uC218\uC815 \uC758\uACAC\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694");
  const row = { eventId: crypto.randomUUID(), targetType: t.targetType, targetId: t.targetId, questionId: t.targetType === "question" ? t.targetId : null, templateId: t.targetType === "template" ? t.targetId : t.templateId, variantId: t.variantId ?? null, version: t.version, contentHash: t.contentHash, verdict, comment, recordedAt: (/* @__PURE__ */ new Date()).toISOString(), reviewedAt: test ? null : (/* @__PURE__ */ new Date()).toISOString(), reviewer: test ? null : reviewer?.trim() || null, actualHumanReview: !test, recordOrigin: test ? "automated-ui-test" : "local-reviewer-input", previousEventIds: heads(db, t).map((r) => r.eventId), productionReady: false };
  if (!validateEvent(row)) throw Error("INVALID_REVIEW_EVENT");
  return { ...db, events: [...db.events, row], importConflicts: db.importConflicts.map((c) => identity(c.existing) === identity(t) ? { ...c, resolvedBy: row.eventId } : c) };
}
function prepareDecision(db, target2, verdict, comment = "", reviewer = "", { test = false } = {}) {
  const name = typeof reviewer === "string" ? reviewer.trim() : "";
  if (verdict === "pass" && !test && !name) {
    const e = Error("\uAC80\uC218\uC790 \uC774\uB984 \uB610\uB294 \uC2DD\uBCC4\uC790\uB97C \uD55C \uBC88 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    e.field = "reviewer";
    throw e;
  }
  if (verdict === "revise" && !comment.trim()) {
    const e = Error("\uC218\uC815 \uC758\uACAC\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    e.field = "comment";
    throw e;
  }
  const next = decide(db, target2, verdict, comment, name, test), event = { ...next.events.at(-1), humanAttestation: !test };
  return { ...next, events: [...next.events.slice(0, -1), event] };
}

// qb-review-1.0.2/src/storage.ts
var STORAGE_KEY = "qb-review:math-hero-survival:equivalent-two:review-1.0.2";
async function encode(body) {
  return canonical({ envelopeVersion: 1, body, checksum: await sha(body) });
}
async function decode(raw) {
  requireThat(typeof raw === "string" && raw.length <= 1e7, "BACKUP_SIZE_LIMIT");
  let x;
  try {
    x = JSON.parse(raw);
  } catch {
    throw Error("CORRUPT_JSON_PRESERVED");
  }
  requireThat(x && Object.keys(x).every((k) => ["envelopeVersion", "body", "checksum"].includes(k)) && x.envelopeVersion === 1 && x.body && typeof x.checksum === "string" && await sha(x.body) === x.checksum, "CHECKSUM_MISMATCH_PRESERVED");
  return x.body;
}
function createLocalStorage(storage, options = {}) {
  const key = options.key ?? STORAGE_KEY, limit = options.maxBytes ?? 8e6;
  const load = async () => {
    const raw = storage.getItem(key);
    return raw === null ? null : decode(raw);
  };
  return { load, async commit(next, revision) {
    requireThat(options.atomic, "ATOMIC_LOCK_UNAVAILABLE_READ_ONLY");
    await options.atomic(async () => {
      const prior = await load();
      requireThat((prior?.revision ?? 0) === revision, "MULTI_TAB_CONFLICT");
      requireThat(next.revision === revision + 1, "REVISION_CONFLICT");
      const raw = await encode(next);
      requireThat(new TextEncoder().encode(raw).length <= limit, "STORAGE_CAPACITY_EXPORT_REQUIRED");
      try {
        const previous = storage.getItem(key);
        if (previous !== null) storage.setItem(key + ":previous", previous);
        storage.setItem(key, raw);
      } catch {
        throw Error("STORAGE_WRITE_FAILED_OLD_STATE_RETAINED");
      }
    });
  }, async previousBackup() {
    const raw = storage.getItem(key + ":previous");
    if (raw !== null) await decode(raw);
    return raw;
  } };
}
function memoryStorage(options = {}) {
  const values = /* @__PURE__ */ new Map();
  let tail = Promise.resolve();
  return createLocalStorage({ getItem: (k) => values.get(k) ?? null, setItem: (k, v) => {
    if (options.failWrites) throw Error("QUOTA");
    values.set(k, v);
  } }, { maxBytes: options.maxBytes, atomic: (work) => {
    const p = tail.then(work);
    tail = p.then(() => void 0, () => void 0);
    return p;
  } });
}

// qb-universal-subject-manager/core.mjs
var VERSION = "universal-subject-manager/1.0.0-local";
var TYPES = ["single-choice", "multiple-choice", "boolean", "short", "ordering", "data-interpretation", "matching", "listening", "generated-family"];
var DEFAULT_SUBJECTS = [["korean-literacy", "\uAD6D\uC5B4"], ["math", "\uC218\uD559"], ["english", "\uC601\uC5B4"], ["social-studies", "\uC0AC\uD68C"], ["science", "\uACFC\uD559"]].map(([id2, name]) => ({ id: id2, name, description: "", icon: "", active: true, builtin: true }));
var UNIFIED_POLICY = Object.freeze({ id: "SCHOOL-QUEST-UNIFIED-LEARNING-v1.0", core: "equivalent-two/1.0.0", firstWrong: "instant-equivalent", confirmedWrong: "only-root-after-two-errors", challenge: "two-distinct-consecutive-correct", exhaustion: "hold-preserve-no-other-concept", scienceSupplement: { normalGap: [3, 5], masteryGap: [6, 10], replacesInstant: false }, reports: ["after-game", "after-review-same-record"], firstAccuracy: "base-first-only", rewardOwner: "game", crossOriginStorageShared: false });
var check = requireThat;
var id = () => crypto.randomUUID();
var stamp = () => (/* @__PURE__ */ new Date()).toISOString();
var payload = (q) => Object.fromEntries(["subjectId", "grade", "gradeBand", "semester", "unitId", "learningObjectiveId", "familyId", "questionType", "questionText", "options", "answer", "explanation", "hint", "difficulty", "thinkingType", "mediaAssets", "reviewRelations", "extensions"].map((k) => [k, k === "reviewRelations" ? { equivalentIds: [], ...q[k] } : q[k] ?? null]));
var recordDigest = (q) => sha(payload(q));
function initialWorkspace() {
  return { schemaVersion: "universal-workspace/1", revision: 0, subjects: clone(DEFAULT_SUBJECTS), nodes: [], questions: [], reviews: emptyDB(), rightsEvents: [], history: [], importReceipts: [], assets: [] };
}
function validateWorkspace(s) {
  check(s?.schemaVersion === "universal-workspace/1" && Number.isSafeInteger(s.revision) && s.revision >= 0, "INVALID_WORKSPACE");
  for (const [k, max] of [["subjects", 200], ["nodes", 2e4], ["questions", 5e3], ["history", 3e4], ["assets", 2e3], ["rightsEvents", 2e4], ["importReceipts", 2e3]]) check(Array.isArray(s[k]) && s[k].length <= max, "WORKSPACE_CAP:" + k);
  check(new Set(s.subjects.map((s2) => s2.id)).size === s.subjects.length, "DUPLICATE_SUBJECT");
  check(new Set(s.questions.map((q) => q.questionId + "@" + q.version)).size === s.questions.length, "DUPLICATE_QUESTION_VERSION");
  check(s.reviews?.schemaVersion === 2, "REVIEW_SCHEMA");
  for (const q of s.questions) {
    check(s.subjects.some((s2) => s2.id === q.subjectId), "QUESTION_SUBJECT_MISSING");
    check(q.teacherApprovalStatus === "pending" && q.rightsStatus === "pending", "OVERLAY_SELF_APPROVAL_FORBIDDEN");
    check(/^[a-f0-9]{64}$/.test(q.contentHash) && q.contentHash === q.recordHash, "OVERLAY_CONTENT_HASH_MISMATCH");
  }
  return s;
}
function addSubject(s, { name, description = "", icon = "" }) {
  check(name?.trim() && name.length <= 80, "SUBJECT_NAME_REQUIRED");
  const next = clone(s), item = { id: "subject-" + id(), name: name.trim(), description, icon, active: true, builtin: false };
  next.subjects.push(item);
  next.history.push({ action: "create-subject", id: item.id, at: stamp() });
  return { next, item };
}
function updateSubject(s, subjectId, patch) {
  check(Object.keys(patch).every((k) => ["name", "description", "icon", "active"].includes(k)), "SUBJECT_ID_IMMUTABLE");
  const next = clone(s), item = next.subjects.find((x) => x.id === subjectId);
  check(item, "UNKNOWN_SUBJECT");
  if (patch.name && patch.name !== item.name) item.aliases = [.../* @__PURE__ */ new Set([...item.aliases ?? [], item.name])];
  Object.assign(item, patch);
  check(item.name?.trim(), "SUBJECT_NAME_REQUIRED");
  next.history.push({ action: "update-subject", id: subjectId, at: stamp() });
  return next;
}
function putNode(s, input) {
  const next = clone(s);
  check(next.subjects.some((x) => x.id === input.subjectId), "UNKNOWN_SUBJECT");
  check(["grade", "grade-band-reference", "semester", "unit", "objective", "family"].includes(input.kind) && input.name?.trim(), "NODE_KIND_OR_NAME");
  const prior = next.nodes.find((n) => n.id === input.id);
  if (prior) check(prior.subjectId === input.subjectId, "CROSS_SUBJECT_NODE_MOVE_FORBIDDEN");
  if (input.parentId) {
    const p = next.nodes.find((n) => n.id === input.parentId);
    check(p && p.subjectId === input.subjectId, "PARENT_SUBJECT_MISMATCH");
    let cursor = p;
    while (cursor) {
      check(cursor.id !== input.id, "NODE_CYCLE");
      cursor = next.nodes.find((n) => n.id === cursor.parentId);
    }
  }
  const node = { id: prior?.id ?? "node-" + id(), subjectId: input.subjectId, kind: input.kind, name: input.name.trim(), parentId: input.parentId ?? null, grade: input.grade ?? null, gradeBand: input.gradeBand ?? null, semester: input.semester ?? null, order: input.order ?? prior?.order ?? next.nodes.length, active: input.active ?? prior?.active ?? true, referenceId: input.referenceId ?? prior?.referenceId ?? null, referenceIds: input.referenceIds ?? prior?.referenceIds ?? [], officialEvidence: input.officialEvidence ?? prior?.officialEvidence ?? { status: "pending", achievementCodes: [], revision: null, sourceURL: null, textbookMappings: [] }, internalPlacementStatus: "internal-not-official-by-default" };
  if (prior) next.nodes[next.nodes.indexOf(prior)] = node;
  else next.nodes.push(node);
  next.history.push({ action: prior ? "update-node" : "create-node", id: node.id, at: stamp() });
  return { next, node };
}
function linkNodes(s, fromId, toId, { merge = false } = {}) {
  const next = clone(s), a = next.nodes.find((n) => n.id === fromId), b = next.nodes.find((n) => n.id === toId);
  check(a && b && a.id !== b.id && a.subjectId === b.subjectId && a.kind === b.kind, "UNSAFE_NODE_LINK");
  a.referenceIds = [.../* @__PURE__ */ new Set([...a.referenceIds, b.id])];
  if (merge) {
    a.active = false;
    a.aliasOf = b.id;
    for (const q of next.questions) if (q.learningObjectiveId === a.id) q.managementReference = b.id;
  }
  next.history.push({ action: merge ? "merge-node-reference-no-content-rewrite" : "link-node", id: fromId, to: toId, at: stamp() });
  return next;
}
function validateQuestion(q, { specialist = false } = {}) {
  const errors = [], warnings = [];
  if (typeof q.subjectId !== "string" || !q.subjectId || typeof q.learningObjectiveId !== "string" || !q.learningObjectiveId || typeof q.questionText !== "string" || !q.questionText.trim() || typeof q.explanation !== "string" || !q.explanation.trim()) errors.push("REQUIRED_TEXT_OR_OBJECTIVE");
  if (!TYPES.includes(q.questionType)) errors.push("UNSUPPORTED_MANAGED_TYPE");
  if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) errors.push("GRADE_LOCAL_DIFFICULTY");
  if (q.grade !== null && q.grade !== void 0 && (!Number.isInteger(q.grade) || q.grade < 1 || q.grade > 12)) errors.push("INVALID_GRADE");
  if (q.gradeBand && !q.grade) warnings.push("GRADE_BAND_IS_REFERENCE_NOT_INDEPENDENT_STUDENT_POOL");
  if (q.semester !== null && q.semester !== void 0 && ![1, 2].includes(q.semester)) errors.push("INVALID_OPTIONAL_SEMESTER");
  if (q.unitId !== null && q.unitId !== void 0 && typeof q.unitId !== "string") errors.push("UNIT_ID_TYPE");
  const opts = Array.isArray(q.options) ? q.options : [], ids = opts.map((o) => o?.id), texts = opts.map((o) => typeof o?.text === "string" ? o.text.trim() : "");
  if (!Array.isArray(q.options) || opts.length > 8 || ids.some((id2) => typeof id2 !== "string" || !id2)) errors.push("OPTIONS_SHAPE_OR_CAP");
  if (new Set(ids).size !== ids.length || texts.some((t) => !t) || new Set(texts).size !== texts.length) errors.push("DUPLICATE_OR_EMPTY_OPTIONS");
  const select = ["single-choice", "boolean", "data-interpretation", "listening", "generated-family"];
  if (select.includes(q.questionType)) {
    if (opts.length < 2 || opts.length > 8 || !ids.includes(q.answer?.choiceId)) errors.push("UNIQUE_CHOICE_REQUIRED");
    if (q.questionType === "boolean" && opts.length !== 2) errors.push("BOOLEAN_TWO_CHOICES");
  }
  if (q.questionType === "multiple-choice" && (!Array.isArray(q.answer?.choiceIds) || !q.answer.choiceIds.length || new Set(q.answer.choiceIds).size !== q.answer.choiceIds.length || q.answer.choiceIds.some((x) => !ids.includes(x)))) errors.push("MULTI_ANSWER_INVALID");
  if (q.questionType === "short" && (!Array.isArray(q.answer?.accepted) || !q.answer.accepted.length || q.answer.accepted.some((x) => typeof x !== "string" || !x.trim()))) errors.push("EXPLICIT_SHORT_ANSWERS_REQUIRED");
  if (q.questionType === "ordering" && (!Array.isArray(q.answer?.order) || q.answer.order.length !== opts.length || new Set(q.answer.order).size !== opts.length || q.answer.order.some((x) => !ids.includes(x)))) errors.push("ORDER_PERMUTATION_REQUIRED");
  if (q.questionType === "matching" && (!Array.isArray(q.answer?.pairs) || !q.answer.pairs.length || q.answer.pairs.some((x) => !Array.isArray(x) || x.length !== 2 || !ids.includes(x[0]) || !ids.includes(x[1])))) errors.push("MATCH_PAIRS_REQUIRED");
  if (q.questionType === "generated-family" && !q.extensions?.approvedFiniteRangeRef) warnings.push("GENERATOR_RANGE_APPROVAL_REQUIRED");
  for (const a of Array.isArray(q.mediaAssets) ? q.mediaAssets : []) {
    if (!["svg", "image", "audio", "table"].includes(a.kind)) errors.push("MEDIA_KIND");
    if (a.kind === "svg" && /<(?:script|foreignObject|image)\b|\son\w+\s*=|(?:href|src)\s*=|@import|url\((?!#)/i.test(a.content ?? "")) errors.push("UNSAFE_SVG");
    if (a.kind === "svg" && !/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(a.content ?? "")) errors.push("SVG_ROOT_REQUIRED");
    if (a.kind === "image" && !/^data:image\/(?:png|jpeg|webp);base64,/.test(a.content ?? "")) errors.push("IMAGE_DATA_TYPE");
    if (a.kind === "audio" && !/^data:audio\/(?:mpeg|mp3|wav|x-wav|ogg|wave);base64,/.test(a.content ?? "")) errors.push("AUDIO_DATA_TYPE");
    if (a.kind === "table" && (!Array.isArray(a.columns) || !Array.isArray(a.rows) || a.columns.length > 12 || a.rows.length > 30 || a.rows.some((r) => !Array.isArray(r) || r.length !== a.columns.length))) errors.push("TABLE_SHAPE_OR_CAP");
    if (a.kind === "audio" && !a.rightsEvidence) warnings.push("AUDIO_RIGHTS_EVIDENCE_REQUIRED");
  }
  if ((q.questionText?.length ?? 0) > 6e3 || (q.explanation?.length ?? 0) > 6e3) errors.push("TEXT_LENGTH_CAP");
  if (q.questionType === "listening" && !(q.mediaAssets ?? []).some((a) => a.kind === "audio")) errors.push("LISTENING_AUDIO_REQUIRED");
  if (!specialist) warnings.push("SPECIALIST_CONTENT_AND_ANSWER_CONFIRMATION_REQUIRED");
  return { status: errors.length ? "failed" : "basic-pass", errors, warnings, specialistStatus: specialist ? "verified-existing-evidence" : "teacher-confirmation-required", automaticPassIsTeacherApproval: false };
}
async function saveQuestion(s, input, { base = null } = {}) {
  const next = clone(s), same = next.questions.filter((q2) => q2.questionId === input.questionId), prior = same.sort((a, b) => b.version - a.version)[0] ?? base;
  const q = { ...clone(input), questionId: prior?.questionId ?? input.questionId ?? "Q-" + id(), version: prior ? prior.version + 1 : 1, grade: input.grade ?? null, gradeBand: input.gradeBand ?? null, semester: input.semester ?? null, unitId: input.unitId ?? null, familyId: input.familyId ?? null, hint: input.hint ?? "", options: input.options ?? [], mediaAssets: input.mediaAssets ?? [], reviewRelations: input.reviewRelations ?? { equivalentIds: [] }, thinkingType: input.thinkingType ?? "concept", extensions: input.extensions ?? {}, active: true, sourceProvenance: prior ? { kind: "versioned-patch", parentId: prior.questionId, parentVersion: prior.version, parentHash: prior.contentHash, source: prior.sourceProvenance } : { ...input.sourceProvenance?.kind === "draft-from-existing" ? input.sourceProvenance : { kind: "local-author-draft" }, rightsNotAssumed: true }, teacherApprovalStatus: "pending", rightsStatus: "pending", operationalApproval: false, parentHash: prior?.contentHash ?? null, createdAt: stamp() };
  delete q.managementReference;
  delete q.sourceKey;
  q.contentHash = await recordDigest(q);
  if (prior && canonical(payload(prior)) === canonical(payload(q))) return { next: clone(s), q: clone(prior), unchanged: true };
  q.recordHash = q.contentHash;
  q.validationStatus = validateQuestion(q);
  next.questions.push(q);
  next.history.push({ action: prior ? "new-question-version" : "create-question", id: q.questionId, version: q.version, hash: q.contentHash, at: stamp() });
  return { next, q };
}
function cloneQuestionInput(q) {
  const draft = clone(q);
  delete draft.questionId;
  delete draft.version;
  delete draft.contentHash;
  delete draft.recordHash;
  delete draft.sourceKey;
  draft.sourceProvenance = { kind: "draft-from-existing", parent: q.questionId, parentVersion: q.version, parentHash: q.contentHash, rightsNotAssumed: true };
  draft.teacherApprovalStatus = "pending";
  draft.rightsStatus = "pending";
  return draft;
}
function setActive(s, questionId, version, active) {
  const next = clone(s), q = next.questions.find((q2) => q2.questionId === questionId && q2.version === version);
  check(q, "OVERLAY_VERSION_REQUIRED");
  q.active = active;
  next.history.push({ action: active ? "restore-question" : "deactivate-question", id: questionId, version, at: stamp() });
  return next;
}
var target = (q) => ({ targetType: "question", targetId: q.questionId, version: q.version, contentHash: q.contentHash });
function reviewQuestion(s, q, verdict, comment, reviewer, { test = false } = {}) {
  const next = clone(s);
  next.reviews = prepareDecision(next.reviews, target(q), verdict, comment, reviewer, { test });
  return next;
}
function decideRights(s, q, { status, evidence, actor, test = false }) {
  check(["verified", "pending", "excluded"].includes(status) && evidence?.trim() && actor?.trim(), "RIGHTS_EVIDENCE_AND_ACTOR_REQUIRED");
  const next = clone(s);
  next.rightsEvents.push({ id: id(), questionId: q.questionId, version: q.version, contentHash: q.contentHash, status, evidence, actor: test ? null : actor, at: stamp(), actualHumanAttestation: !test });
  return next;
}
function statusFor(s, q) {
  const decision = stateFor(s.reviews, target(q)), right = s.rightsEvents.filter((r) => r.questionId === q.questionId && r.version === q.version && r.contentHash === q.contentHash).at(-1), teacher = decision.verdict === "pending" ? q.teacherApprovalStatus : decision.actualHumanReview ? { pass: "approved", fail: "rejected", revise: "revision-requested" }[decision.verdict] ?? "conflict" : "test-only-no-human-approval";
  return { teacher, rights: right ? right.actualHumanAttestation ? right.status : "test-only-no-rights-attestation" : q.rightsStatus, review: decision };
}
function managementActive(s, q) {
  return s.history.filter((e) => e.id === q.questionId && e.version === q.version && e.hash === q.contentHash && e.action === "management-active").at(-1)?.active ?? q.active;
}
function setQuestionActivity(s, q, active) {
  const next = clone(s);
  next.history.push({ action: "management-active", id: q.questionId, version: q.version, hash: q.contentHash, active, at: stamp() });
  return next;
}
function supplyEligibility(s, q, consumer) {
  const status = statusFor(s, q), reasons = [];
  if (s.subjects.find((x) => x.id === q.subjectId)?.active === false) reasons.push("SUBJECT_INACTIVE");
  if (validateQuestion(q).errors.length) reasons.push("STRUCTURAL_VALIDATION_FAILED");
  for (const node of s.nodes.filter((n) => n.subjectId === q.subjectId && (n.id === q.learningObjectiveId || n.referenceId === q.learningObjectiveId || n.id === q.unitId || n.referenceId === q.unitId))) {
    let n = node;
    const seen = /* @__PURE__ */ new Set();
    while (n && !seen.has(n.id)) {
      seen.add(n.id);
      if (!n.active) {
        reasons.push("LEARNING_SCOPE_INACTIVE");
        break;
      }
      n = s.nodes.find((x) => x.id === n.parentId);
    }
  }
  if (!managementActive(s, q)) reasons.push("INACTIVE");
  if (status.teacher !== "approved") reasons.push("TEACHER_APPROVAL_REQUIRED");
  if (status.rights !== "verified") reasons.push("RIGHTS_REQUIRED");
  if (q.validationStatus?.status === "failed") reasons.push("VALIDATION_FAILED");
  if (q.validationStatus?.specialistStatus !== "verified-existing-evidence" && status.teacher !== "approved") reasons.push("SPECIALIST_CONFIRMATION_REQUIRED");
  if (!q.grade) reasons.push("INDEPENDENT_GRADE_POOL_REQUIRED");
  if (q.extensions?.subjectData?.unmappedSourceMedia) reasons.push("MEDIA_MAPPING_REQUIRED");
  const data = q.extensions?.subjectData ?? {};
  const privateData = (x) => x && typeof x === "object" ? Object.entries(x).some(([k, v]) => ["studentName", "studentId", "className", "email", "phone", "reviewer", "reviewedAt"].includes(k) || privateData(v)) : typeof x === "string" && /file:\/\/|[A-Z]:[\\/]/i.test(x);
  if (privateData(data)) reasons.push("PRIVATE_EXTENSION_DATA_NOT_PUBLIC");
  const caps = consumer ?? { subjects: [q.subjectId], formats: TYPES };
  if (!caps.subjects.includes(q.subjectId)) reasons.push("CONSUMER_SUBJECT_UNSUPPORTED");
  if (!caps.formats.includes(q.questionType)) reasons.push("CONSUMER_FORMAT_UNSUPPORTED");
  if (q.quarantined) reasons.push("QUARANTINED");
  return { eligible: reasons.length === 0, reasons, ...status, operationalApproval: false };
}
async function semanticKey(q) {
  const clean = (t) => String(t ?? "").normalize("NFKC").replace(/\s+/g, ""), option = (id2) => clean(q.options?.find((o) => o.id === id2)?.text ?? id2), a = q.answer ?? {}, answer = a.choiceId ? option(a.choiceId) : a.choiceIds ? a.choiceIds.map(option).sort() : a.order ? a.order.map(option) : a.pairs ? a.pairs.map((p) => p.map(option)).sort((a2, b) => canonical(a2).localeCompare(canonical(b))) : a.accepted ? [...new Set(a.accepted.map(clean))].sort() : a, svg = (s) => String(s).replace(/\s(?:fill|stroke|color|opacity|class|style|font-family|font-size|stroke-width)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/>\s+</g, "><").trim(), media = await Promise.all((q.mediaAssets ?? []).map(async (a2) => ({ kind: a2.kind, hash: await sha(a2.kind === "table" ? { columns: a2.columns, rows: a2.rows } : a2.kind === "svg" ? svg(a2.content) : a2.content ?? a2.sha256 ?? a2.assetId ?? "") })));
  return sha({ subject: q.subjectId, grade: q.grade, text: clean(q.questionText), options: (q.options ?? []).map((o) => clean(o.text)).sort(), answer, media: media.sort((a2, b) => a2.hash.localeCompare(b.hash)), subjectData: q.extensions?.subjectData ?? null });
}
async function previewImport(incoming, existing) {
  check(Array.isArray(incoming) && incoming.length <= 1e3, "IMPORT_QUESTION_CAP");
  const map = /* @__PURE__ */ new Map();
  for (const q of existing) map.set(await semanticKey(q), q);
  const candidates = [];
  for (const q of incoming) {
    const digest = await semanticKey(q), same = map.get(digest);
    candidates.push({ question: q, status: same ? "duplicate" : "new", duplicateOf: same?.questionId, errors: validateQuestion(q).errors });
    map.set(digest, q);
  }
  return candidates;
}
function gradeCommon(q, response) {
  const answer = q.answer;
  let correct = false;
  if (["single-choice", "boolean", "data-interpretation", "listening", "generated-family"].includes(q.questionType)) {
    if (typeof response !== "string" || !q.options.some((o) => o.id === response)) return { status: "invalid" };
    correct = response === answer.choiceId;
  } else if (q.questionType === "multiple-choice") {
    if (!Array.isArray(response) || new Set(response).size !== response.length || response.some((x) => !q.options.some((o) => o.id === x))) return { status: "invalid" };
    correct = canonical([...response].sort()) === canonical([...answer.choiceIds].sort());
  } else if (q.questionType === "short") {
    if (typeof response !== "string") return { status: "invalid" };
    const normalize = (s) => s.normalize("NFKC").trim().replace(/\s+/g, " ");
    correct = answer.accepted.some((x) => normalize(x) === normalize(response));
  } else if (q.questionType === "ordering") {
    if (!Array.isArray(response) || response.length !== q.options.length || new Set(response).size !== response.length || response.some((x) => !q.options.some((o) => o.id === x))) return { status: "invalid" };
    correct = canonical(response) === canonical(answer.order);
  } else if (q.questionType === "matching") {
    if (!Array.isArray(response) || response.length !== answer.pairs.length || response.some((p) => !Array.isArray(p) || p.length !== 2 || p.some((x) => !q.options.some((o) => o.id === x))) || new Set(response.map((p) => p[0])).size !== response.length) return { status: "invalid" };
    correct = canonical(response.map((p) => canonical(p)).sort()) === canonical(answer.pairs.map((p) => canonical(p)).sort());
  } else return { status: "invalid" };
  return { status: correct ? "correct" : "incorrect" };
}
export {
  DEFAULT_SUBJECTS,
  TYPES,
  UNIFIED_POLICY,
  VERSION,
  addSubject,
  cloneQuestionInput,
  createLocalStorage,
  decideRights,
  decode,
  encode,
  gradeCommon,
  initialWorkspace,
  linkNodes,
  managementActive,
  memoryStorage,
  previewImport,
  putNode,
  recordDigest,
  reviewQuestion,
  saveQuestion,
  semanticKey,
  setActive,
  setQuestionActivity,
  statusFor,
  supplyEligibility,
  updateSubject,
  validateQuestion,
  validateWorkspace
};
