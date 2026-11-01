import{assertOperationalManifest}from './approval-gate.mjs';
var I = (o2) => JSON.stringify(ce(o2));
function ce(o2) {
  return Array.isArray(o2) ? o2.map(ce) : o2 && typeof o2 == "object" ? Object.fromEntries(Object.entries(o2).sort(([e], [n]) => e.localeCompare(n)).map(([e, n]) => [e, ce(n)])) : o2;
}
async function H(o2) {
  let e = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(typeof o2 == "string" ? o2 : I(o2)));
  return Array.from(new Uint8Array(e), (n) => n.toString(16).padStart(2, "0")).join("");
}
function l(o2, e) {
  if (!o2) throw Error(e);
}
var h = (o2) => structuredClone(o2), C = (o2) => Number.isFinite(Date.parse(o2)), K = () => crypto.randomUUID();
var Te = "qb-review:math-hero-survival:equivalent-two:review-1.0.2";
async function W(o2) {
  return I({ envelopeVersion: 1, body: o2, checksum: await H(o2) });
}
async function G(o2) {
  l(typeof o2 == "string" && o2.length <= 1e7, "BACKUP_SIZE_LIMIT");
  let e;
  try {
    e = JSON.parse(o2);
  } catch {
    throw Error("CORRUPT_JSON_PRESERVED");
  }
  return l(e && Object.keys(e).every((n) => ["envelopeVersion", "body", "checksum"].includes(n)) && e.envelopeVersion === 1 && e.body && typeof e.checksum == "string" && await H(e.body) === e.checksum, "CHECKSUM_MISMATCH_PRESERVED"), e.body;
}
function ee(o2, e = {}) {
  let n = e.key ?? Te, t = e.maxBytes ?? 8e6, s = async () => {
    let i = o2.getItem(n);
    return i === null ? null : G(i);
  };
  return { load: s, async commit(i, r) {
    l(e.atomic, "ATOMIC_LOCK_UNAVAILABLE_READ_ONLY"), await e.atomic(async () => {
      let d = await s();
      l((d?.revision ?? 0) === r, "MULTI_TAB_CONFLICT"), l(i.revision === r + 1, "REVISION_CONFLICT");
      let u = await W(i);
      l(new TextEncoder().encode(u).length <= t, "STORAGE_CAPACITY_EXPORT_REQUIRED");
      try {
        let a = o2.getItem(n);
        a !== null && o2.setItem(n + ":previous", a), o2.setItem(n, u);
      } catch {
        throw Error("STORAGE_WRITE_FAILED_OLD_STATE_RETAINED");
      }
    });
  }, async previousBackup() {
    let i = o2.getItem(n + ":previous");
    return i !== null && await G(i), i;
  } };
}
function ge(o2 = {}) {
  let e = /* @__PURE__ */ new Map(), n = Promise.resolve();
  return ee({ getItem: (t) => e.get(t) ?? null, setItem: (t, s) => {
    if (o2.failWrites) throw Error("QUOTA");
    e.set(t, s);
  } }, { maxBytes: o2.maxBytes, atomic: (t) => {
    let s = n.then(t);
    return n = s.then(() => {
    }, () => {
    }), s;
  } });
}
function de(o2) {
  let e = typeof o2 == "object" ? JSON.stringify(o2) : String(o2 ?? "");
  return /^[=+@\-\t\r]/.test(e) && (e = "'" + e), '"' + e.replaceAll('"', '""') + '"';
}
var je = [["korean-literacy", "\uAD6D\uC5B4"], ["math", "\uC218\uD559"], ["english", "\uC601\uC5B4"], ["social-studies", "\uC0AC\uD68C"], ["science", "\uACFC\uD559"]].map(([o2, e]) => ({ id: o2, name: e, description: "", icon: "", active: true, builtin: true })), Fe = Object.freeze({ id: "SCHOOL-QUEST-UNIFIED-LEARNING-v1.0", core: "equivalent-two/1.0.0", firstWrong: "instant-equivalent", confirmedWrong: "only-root-after-two-errors", challenge: "two-distinct-consecutive-correct", exhaustion: "hold-preserve-no-other-concept", scienceSupplement: { normalGap: [3, 5], masteryGap: [6, 10], replacesInstant: false }, reports: ["after-game", "after-review-same-record"], firstAccuracy: "base-first-only", rewardOwner: "game", crossOriginStorageShared: false });
function le(o2, e) {
  let n = o2.answer, t = false;
  if (["single-choice", "boolean", "data-interpretation", "listening", "generated-family"].includes(o2.questionType)) {
    if (typeof e != "string" || !o2.options.some((s) => s.id === e)) return { status: "invalid" };
    t = e === n.choiceId;
  } else if (o2.questionType === "multiple-choice") {
    if (!Array.isArray(e) || new Set(e).size !== e.length || e.some((s) => !o2.options.some((i) => i.id === s))) return { status: "invalid" };
    t = I([...e].sort()) === I([...n.choiceIds].sort());
  } else if (o2.questionType === "short") {
    if (typeof e != "string") return { status: "invalid" };
    let s = (i) => i.normalize("NFKC").trim().replace(/\s+/g, " ");
    t = n.accepted.some((i) => s(i) === s(e));
  } else if (o2.questionType === "ordering") {
    if (!Array.isArray(e) || e.length !== o2.options.length || new Set(e).size !== e.length || e.some((s) => !o2.options.some((i) => i.id === s))) return { status: "invalid" };
    t = I(e) === I(n.order);
  } else if (o2.questionType === "matching") {
    if (!Array.isArray(e) || e.length !== n.pairs.length || e.some((s) => !Array.isArray(s) || s.length !== 2 || s.some((i) => !o2.options.some((r) => r.id === i))) || new Set(e.map((s) => s[0])).size !== e.length) return { status: "invalid" };
    t = I(e.map((s) => I(s)).sort()) === I(n.pairs.map((s) => I(s)).sort());
  } else return { status: "invalid" };
  return { status: t ? "correct" : "incorrect" };
}
var q = class o {
  numerator;
  denominator;
  constructor(e, n = 1n) {
    if (typeof e == "number" && !Number.isSafeInteger(e) || typeof n == "number" && !Number.isSafeInteger(n)) throw Error("Safe integer constructor operands");
    let t = BigInt(e), s = BigInt(n);
    if (!s) throw Error("Zero denominator");
    s < 0n && (t = -t, s = -s);
    let i = o.gcd(t, s);
    this.numerator = t / i, this.denominator = s / i;
  }
  static gcd(e, n) {
    for (e = e < 0n ? -e : e, n = n < 0n ? -n : n; n; ) [e, n] = [n, e % n];
    return e;
  }
  static parse(e) {
    let n = String(e);
    if (n.length > 100) throw Error("Bounded exact literal");
    let t = /^([+-]?\d+)(?:\.(\d+))?(?:\/(\d+))?$/.exec(n);
    if (!t) throw Error("Exact numeric literal required");
    let s = t[2] ?? "", i = t[1].startsWith("-") ? -1n : 1n;
    return new o(BigInt(t[1].replace(/^[+-]/, "") + s) * i, 10n ** BigInt(s.length) * BigInt(t[3] ?? 1));
  }
  normalize() {
    return this;
  }
  add(e) {
    return new o(this.numerator * e.denominator + e.numerator * this.denominator, this.denominator * e.denominator);
  }
  subtract(e) {
    return new o(this.numerator * e.denominator - e.numerator * this.denominator, this.denominator * e.denominator);
  }
  multiply(e) {
    return new o(this.numerator * e.numerator, this.denominator * e.denominator);
  }
  divide(e) {
    return new o(this.numerator * e.denominator, this.denominator * e.numerator);
  }
  compare(e) {
    let n = this.numerator * e.denominator - e.numerator * this.denominator;
    return n > 0n ? 1 : n < 0n ? -1 : 0;
  }
  equals(e) {
    return this.compare(e) === 0;
  }
  toMixedNumber() {
    let e = this.numerator < 0n ? -1n : 1n, n = this.numerator * e;
    return { sign: String(e), whole: String(n / this.denominator), numerator: String(n % this.denominator), denominator: String(this.denominator) };
  }
  toDisplayString(e = "auto") {
    if (this.denominator === 1n) return String(this.numerator);
    if (e === "mixed") {
      let n = this.toMixedNumber();
      return `${n.sign === "-1" ? "-" : ""}${n.whole === "0" ? "" : n.whole + " "}${n.numerator}/${n.denominator}`;
    }
    if (e !== "fraction") {
      let n = this.denominator;
      for (; n % 2n === 0n; ) n /= 2n;
      for (; n % 5n === 0n; ) n /= 5n;
      if (n === 1n) {
        let t = this.numerator < 0n ? -this.numerator : this.numerator, s = t % this.denominator, i = "";
        for (; s; ) if (s *= 10n, i += String(s / this.denominator), s %= this.denominator, i.length > 64) throw Error("Display decimal exceeds precision policy");
        return `${this.numerator < 0n ? "-" : ""}${t / this.denominator}.${i}`;
      }
      if (e === "decimal") throw Error("Nonterminating decimal needs explicit rounding model");
    }
    return `${this.numerator}/${this.denominator}`;
  }
};
function Ee(o2) {
  if (typeof o2 != "string" || o2.length > 80) throw Error("Bounded school number");
  let e = /^(\d+)\s+(\d+)\/(\d+)$/.exec(o2.trim());
  if (e) {
    let [s, i, r] = e.slice(1).map(BigInt);
    if (r <= 0n || i >= r) throw Error("Proper remainder required");
    return { value: new q(s * r + i, r), format: "mixed", numerator: i, denominator: r };
  }
  let n = /^(\d+)(?:\.(\d+))?(?:\/(\d+))?$/.exec(o2.trim());
  if (!n) throw Error("School number syntax");
  let t = q.parse(o2.trim());
  return { value: t, format: n[3] ? "fraction" : n[2] ? "decimal" : "integer", numerator: n[3] ? BigInt(n[1]) : t.numerator, denominator: n[3] ? BigInt(n[3]) : t.denominator };
}
function ue(o2, e, n, t) {
  try {
    if (!n || !["value", "fraction", "mixed", "decimal"].includes(n.format) || n.decimalPlaces !== void 0 && (!Number.isInteger(n.decimalPlaces) || n.decimalPlaces < 0 || n.decimalPlaces > 6)) return { status: "invalid" };
    let s = Ee(o2), i = Ee(e);
    return n.unit && t !== n.unit ? { status: "incorrect", reason: "unit" } : s.value.equals(i.value) ? n.format === "mixed" && i.value.denominator !== 1n && i.value.numerator > i.value.denominator && i.format !== "mixed" ? { status: "incorrect", reason: "mixed-format" } : n.format === "mixed" && i.format === "mixed" && (i.value.numerator < i.value.denominator || i.numerator === 0n) ? { status: "incorrect", reason: "zero-whole" } : n.format === "fraction" && i.format !== "fraction" ? { status: "incorrect", reason: "fraction-format" } : n.format === "decimal" && !["decimal", "integer"].includes(i.format) ? { status: "incorrect", reason: "decimal-format" } : n.decimalPlaces !== void 0 && (e.trim().split(".")[1]?.length ?? 0) !== n.decimalPlaces ? { status: "incorrect", reason: "decimal-places" } : n.simplified && q.gcd(i.numerator, i.denominator) !== 1n ? { status: "incorrect", reason: "simplify" } : { status: "correct" } : { status: "incorrect", reason: "value" };
  } catch {
    return { status: "invalid" };
  }
}
function ye(o2) {
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(o2.trim())) return;
  let e = o2.trim(), n = e.startsWith("-"), t = e.replace(/^[+-]/, ""), [s, i = ""] = t.split(".");
  return [BigInt(s + i) * (n ? -1n : 1n), 10n ** BigInt(i.length)];
}
function ve(o2) {
  let e = BigInt(o2.numerator) + BigInt(o2.whole ?? 0) * BigInt(o2.denominator), n = BigInt(o2.denominator), t = e < 0n ? -e : e, s = n;
  for (; s; ) [t, s] = [s, t % s];
  return `${e / (t || 1n)}/${n / (t || 1n)}`;
}
function te(o2, e) {
  let n = o2.answer;
  if (o2.answerFormat && (n.kind === "number" || n.kind === "fraction")) {
    let s = n.kind === "number" ? n.value : `${n.value.numerator + (n.value.whole ?? 0) * n.value.denominator}/${n.value.denominator}`;
    if (typeof e == "string") return { status: ue(s, e, o2.answerFormat).status };
    let i = e;
    if (!i || typeof i != "object") return { status: "invalid" };
    let r = typeof i.value == "string" ? i.value : Number.isSafeInteger(i.numerator) && Number.isSafeInteger(i.denominator) ? i.whole !== void 0 ? `${i.whole} ${i.numerator}/${i.denominator}` : `${i.numerator}/${i.denominator}` : void 0;
    return r === void 0 ? { status: "invalid" } : { status: ue(s, r, o2.answerFormat, i.unit).status };
  }
  let t = false;
  if (n.kind === "single-choice") {
    if (typeof e != "string" || !o2.choices?.some((s) => s.id === e)) return { status: "invalid" };
    t = e === n.choiceId;
  } else if (n.kind === "number") {
    let s = typeof e == "string" ? { value: e } : e;
    if (!s || typeof s.value != "string") return { status: "invalid" };
    let i = ye(s.value), r = ye(n.value);
    if (!i || !r) return { status: "invalid" };
    if (n.unit && typeof s.unit != "string") return { status: "invalid" };
    t = i[0] * r[1] === r[0] * i[1] && (!n.unit || [n.unit, ...n.acceptedUnits ?? []].includes(s.unit));
  } else if (n.kind === "fraction") {
    let s = e;
    if (!s || !Number.isSafeInteger(s.numerator) || !Number.isSafeInteger(s.denominator) || s.denominator <= 0 || s.whole !== void 0 && !Number.isSafeInteger(s.whole)) return { status: "invalid" };
    if (t = ve(s) === ve(n.value), n.requireSimplified) {
      let i = Math.abs(s.numerator), r = s.denominator;
      for (; r; ) [i, r] = [r, i % r];
      t &&= i === 1;
    }
  } else if (n.kind === "text") {
    if (typeof e != "string") return { status: "invalid" };
    let s = (i) => (n.normalization.trim && (i = i.trim()), n.normalization.separator === "comma" && (i = i.replace(/\s*,\s*/g, ",")), n.normalization.separator === "colon" && (i = i.replace(/\s*:\s*/g, ":")), n.normalization.collapseSpaces && (i = i.replace(/\s+/g, " ")), n.normalization.caseSensitive ? i : i.toLowerCase());
    t = n.accepted.some((i) => s(i) === s(e));
  } else {
    if (!Array.isArray(e) || e.some((s) => typeof s != "string")) return { status: "invalid" };
    t = JSON.stringify(e) === JSON.stringify(n.tokenIds);
  }
  return { status: t ? "correct" : "incorrect" };
}
var ne = class {
  constructor(e, n, t = "student", s = () => Date.now()) {
    this.store = e, this.provider = n, this.mode = t, this.clock = s;
  }
  now() {
    return new Date(this.clock()).toISOString();
  }
  async recordWrongAnswer(e) {
    l(Object.keys(e).every((r) => ["idempotencyKey", "gameId", "source", "selectedAnswer", "occurredAt"].includes(r)), "UNKNOWN_EVENT_FIELD"), l(/^[a-z0-9:-]{8,160}$/i.test(e.idempotencyKey) && /^[a-z0-9-]{2,80}$/i.test(e.gameId), "INVALID_EVENT_KEY"), l(await this.provider.verify(e.source), "UNVERIFIED_SNAPSHOT"), l((this.provider.grade ? this.provider.grade(e.source, e.selectedAnswer) : te(e.source.question, e.selectedAnswer)).status === "incorrect", "EVENT_IS_NOT_A_WRONG_ANSWER");
    let n = await this.store.load(), t = n.events.find((r) => r.idempotencyKey === e.idempotencyKey);
    if (t) return l(t.source.contentHash === e.source.contentHash && I(t.selectedAnswer) === I(e.selectedAnswer) && t.gameId === e.gameId, "IDEMPOTENCY_CONFLICT"), { eventId: t.id, duplicate: true };
    l(n.events.length < 200, "EVENT_CAP_EXPORT_REQUIRED");
    let s = h(e.source);
    delete s.question.qualityReview, s.question.review = { status: s.question.review.status };
    let i = { id: K(), idempotencyKey: e.idempotencyKey, gameId: e.gameId, occurredAt: e.occurredAt ?? this.now(), source: s, selectedAnswer: e.selectedAnswer, status: "pending", sessionIds: [], dueAt: null };
    return n.events.push(i), await this.store.commit(n, n.revision), { eventId: i.id, duplicate: false };
  }
};
var Ae = () => ({ schemaVersion: 1, revision: 0, events: [], sessions: [], recent: [] });
function pe(o2) {
  l(o2 && typeof o2 == "object" && !Array.isArray(o2), "INVALID_STATE");
  let e = o2;
  l(Object.keys(e).every((r) => ["schemaVersion", "revision", "events", "sessions", "recent"].includes(r)), "UNKNOWN_STATE_FIELD"), l(e.schemaVersion === 1 && Number.isInteger(e.revision) && e.revision >= 0 && Array.isArray(e.events) && e.events.length <= 200 && Array.isArray(e.sessions) && e.sessions.length <= 200 && Array.isArray(e.recent) && e.recent.length <= 1e4, "INVALID_STATE");
  let n = /* @__PURE__ */ new Set(), t = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  for (let r of e.events) {
    l(r && Object.keys(r).every((u) => ["id", "idempotencyKey", "gameId", "occurredAt", "source", "selectedAnswer", "status", "sessionIds", "dueAt"].includes(u)), "UNKNOWN_EVENT_FIELD"), l(typeof r.id == "string" && !n.has(r.id) && typeof r.idempotencyKey == "string" && !s.has(r.idempotencyKey) && C(r.occurredAt) && ["pending", "in-progress", "completed"].includes(r.status) && Array.isArray(r.sessionIds) && r.sessionIds.length <= 200 && (r.dueAt === null || C(r.dueAt)), "INVALID_EVENT"), n.add(r.id), t.add(r.id), s.add(r.idempotencyKey);
    let d = r.source;
    l(d && Object.keys(d).every((u) => ["question", "conceptId", "familyId", "templateId", "seed", "parameters", "contentFingerprint", "structureFingerprint", "contentHash", "task", "scene", "validation", "approval"].includes(u)) && typeof d.contentHash == "string" && /^[a-f0-9]{64}$/.test(d.contentHash) && typeof d.conceptId == "string" && typeof d.question?.subject == "string" && Number.isInteger(d.question.grade) && d.question.grade >= 1 && d.question.grade <= 12 && d.question.question.length <= 6e3 && typeof d.question.explanation == "string" && d.question.explanation.length <= 6e3 && (d.question.choices?.length ?? 0) <= 8 && I(r.selectedAnswer).length <= 3e3, "INVALID_SNAPSHOT"), l(!d.question.qualityReview && !d.question.review.reviewedBy && !d.question.review.reviewedAt, "PERSONAL_REVIEW_DATA_NOT_STORED");
  }
  n.clear();
  for (let r of e.sessions) {
    l(r && Object.keys(r).every((u) => ["id", "eventId", "status", "mode", "count", "timeMinutes", "startedAt", "activeSeconds", "current", "attempts", "notices", "dueAt"].includes(u)), "UNKNOWN_SESSION_FIELD"), l(!n.has(r.id) && t.has(r.eventId) && ["student", "author-preview"].includes(r.mode) && ["in-progress", "paused", "completed"].includes(r.status) && Number.isInteger(r.count) && r.count >= 3 && r.count <= 20 && [null, 5, 10, 15].includes(r.timeMinutes) && C(r.startedAt) && Number.isFinite(r.activeSeconds) && r.activeSeconds >= 0 && Array.isArray(r.attempts) && r.attempts.length <= 20 && Array.isArray(r.notices) && r.notices.length <= 40, "INVALID_SESSION"), n.add(r.id);
    let d = /* @__PURE__ */ new Set();
    for (let u of r.attempts) l(u && Object.keys(u).every((a) => ["deliveryId", "phase", "contentFingerprint", "familyId", "status", "hintUsed", "seconds", "answeredAt"].includes(a)) && !d.has(u.deliveryId) && ["original", "similar", "application"].includes(u.phase) && ["correct", "incorrect", "skipped"].includes(u.status) && typeof u.hintUsed == "boolean" && Number.isFinite(u.seconds) && u.seconds >= 0 && u.seconds <= 86400 && C(u.answeredAt), "INVALID_ATTEMPT"), d.add(u.deliveryId);
    l(r.current === null || r.current && typeof r.current.id == "string" && ["original", "similar", "application"].includes(r.current.phase) && r.current.item && typeof r.current.item.contentHash == "string" && typeof r.current.hintUsed == "boolean" && typeof r.current.explained == "boolean", "INVALID_CURRENT");
  }
  for (let r of e.recent) l(Object.keys(r).every((d) => ["fingerprint", "familyId"].includes(d)) && /^[a-f0-9]{64}$/.test(r.fingerprint) && typeof r.familyId == "string", "INVALID_HISTORY");
  let i = (r) => {
    if (!(!r || typeof r != "object")) for (let [d, u] of Object.entries(r)) l(!["studentName", "className", "studentId", "email", "phone", "learnerName", "reviewer", "reviewedBy"].includes(d), "PERSONAL_FIELD_FORBIDDEN"), i(u);
  };
  i(e);
}
var J = { version: "recent-distinct-12/1.0.0", window: 12, unit: "distinct delivered semantic math conditions across bank sessions", mandatory: ["root", "latest-instant-for-challenge", "unanswered-deliveries", "active-or-paused-challenge-reservations"], ledgerTruncated: false, olderReuseAllowedForEquivalentReview: true, baseStillUniqueWithinSession: true };
function Oe(o2, e, n = [], t = "recent-window-12") {
  let s = e.map((a) => o2.resolve(a)), i = /* @__PURE__ */ new Set(), r = [];
  for (let a = s.length - 1; a >= 0; a--) {
    let p = s[a], y = o2.semanticKey(p);
    i.has(y) || (i.add(y), (t === "strict-all" || r.length < J.window) && r.push(p));
  }
  let d = n.map((a) => o2.resolve(a));
  return { exclusions: [...new Set([...r, ...d].map((a) => a.contentFingerprint))], audit: { mode: t, policyVersion: J.version, deliveredHistoryEntries: s.length, distinctHistoryConditions: i.size, protectedRecentConditions: r.length, reservedConditions: new Set(d.map((a) => o2.semanticKey(a))).size, eligibleOlderConditionCount: t === "strict-all" ? 0 : Math.max(0, i.size - r.length), protectedRecent: r.map((a) => o2.ref(a)), mandatory: d.map((a) => o2.ref(a)), historyRemoved: false } };
}
function se(o2, e, n = []) {
  let t = [...e.deliveries.filter((s) => !s.answeredAttemptId).map((s) => s.ref), ...e.challenges.filter((s) => s.status === "in-progress" || s.status === "paused").flatMap((s) => s.plan)];
  return [.../* @__PURE__ */ new Set([...Oe(o2, e.deliveries.map((s) => s.ref), t).exclusions, ...n])];
}
var j = (o2, e) => l(o2 && typeof o2 == "object" && !Array.isArray(o2) && Object.keys(o2).every((n) => e.includes(n)), "UNKNOWN_POLICY_FIELD"), ie = class {
  constructor(e, n, t = () => Date.now()) {
    this.supply = e;
    this.storage = n;
    this.clock = t;
    this.lock = e.runtimePins, this.pins = { learningRecordId: this.lock.learningRecordId, consumer: this.supply.consumer, packSha256: this.lock.packSha256, contentVersion: this.lock.contentVersion, engineVersion: this.lock.engineVersion, implementationHash: this.lock.implementationHash, policyVersion: this.lock.policyVersion, historyPolicyVersion: J.version, blocked: [...e.blocked].sort() };
  }
  pins;
  lock;
  now() {
    return new Date(this.clock()).toISOString();
  }
  initial() {
    return { schemaVersion: this.lock.schemaVersion, revision: 0, pins: h(this.pins), r1: Ae(), sessions: [], deliveries: [], attempts: [], entries: [], challenges: [] };
  }
  row(e) {
    return this.supply.resolve(e);
  }
  decodeState(e) {
    let n = h(e);
    return this.validate(n), n;
  }
  validate(e) {
    j(e, ["schemaVersion", "revision", "pins", "r1", "sessions", "deliveries", "attempts", "entries", "challenges"]), l(e.schemaVersion === this.lock.schemaVersion && Number.isSafeInteger(e.revision) && e.revision >= 0 && I(e.pins) === I(this.pins), "POLICY_OR_PACK_VERSION_MISMATCH"), pe(e.r1);
    for (let [t, s] of [["sessions", 200], ["deliveries", 3e3], ["attempts", 2e3], ["entries", 200], ["challenges", 400]]) {
      let i = e[t];
      l(Array.isArray(i) && i.length <= s && new Set(i.map((r) => r.id)).size === i.length, "POLICY_CAP_OR_DUPLICATE_ID");
    }
    l(new Set(e.entries.map((t) => I(t.root))).size === e.entries.length && new Set(e.entries.map((t) => t.r1EventId)).size === e.entries.length, "DUPLICATE_ROOT_REVIEW_ENTRY");
    let n = (t) => {
      if (!(!t || typeof t != "object")) for (let [s, i] of Object.entries(t)) l(!["studentName", "studentId", "className", "email", "phone", "reviewer", "reviewedAt"].includes(s), "PERSONAL_FIELD_FORBIDDEN"), n(i);
    };
    n(e);
    for (let t of e.r1.events) {
      let s = this.supply.find(t.source);
      l(s, "R1_SNAPSHOT_NOT_CURRENT"), l(this.supply.assessment(this.supply.ref(s), t.selectedAnswer).status === "incorrect", "R1_EVENT_IS_NOT_WRONG");
    }
    l(e.r1.sessions.length === 0, "POLICY_MIXING_FORBIDDEN");
    for (let t of e.sessions) j(t, ["id", "scope", "phase", "current", "root", "baseAttemptId", "used", "counts"]), this.supply.scope(t.scope), l(["idle", "base-issued", "needs-twin", "twin-issued", "limited"].includes(t.phase) && Array.isArray(t.used) && new Set(t.used).size === t.used.length, "INVALID_GAME_SESSION"), t.root && this.row(t.root), t.current && l(e.deliveries.some((s) => s.id === t.current && s.ownerId === t.id && !s.answeredAttemptId), "INVALID_GAME_CURRENT");
    for (let t of e.deliveries) {
      j(t, ["id", "ownerId", "role", "ref", "root", "parentBaseAttemptId", "challengeId", "answeredAttemptId"]);
      let s = this.row(t.ref), i = this.row(t.root);
      if (l(["base", "instant-twin", "challenge"].includes(t.role), "INVALID_ROLE"), t.role !== "base" && l(this.supply.candidates(i).some((r) => r.contentFingerprint === s.contentFingerprint), "TWIN_NOT_EQUIVALENT"), t.role === "instant-twin") {
        let r = e.attempts.find((d) => d.id === t.parentBaseAttemptId);
        l(r?.role === "base" && r.status === "incorrect" && I(r.questionRef) === I(t.root), "NO_ACTUAL_FIRST_ERROR");
      }
      if (t.role === "challenge") l(e.challenges.some((r) => r.id === t.challengeId && r.id === t.ownerId), "UNKNOWN_CHALLENGE");
      else {
        let r = e.sessions.find((d) => d.id === t.ownerId);
        if (l(r, "UNKNOWN_GAME_SESSION"), l(this.supply.rows(r.scope).some((d) => d.questionId === s.questionId), "DELIVERY_OUTSIDE_SESSION_SCOPE"), t.role === "base" && l(I(t.ref) === I(t.root) && !t.parentBaseAttemptId, "INVALID_BASE_ROOT"), t.parentBaseAttemptId) {
          let d = e.attempts.find((a) => a.id === t.parentBaseAttemptId), u = d && e.deliveries.find((a) => a.id === d.deliveryId);
          l(u?.ownerId === t.ownerId, "CROSS_SESSION_TWIN_PARENT");
        }
      }
      t.answeredAttemptId && l(e.attempts.some((r) => r.id === t.answeredAttemptId && r.deliveryId === t.id), "MISSING_SUBMISSION");
    }
    for (let t of e.attempts) {
      j(t, ["id", "deliveryId", "questionRef", "rootQuestionRef", "role", "response", "status", "seconds", "at", "challengeId", "reviewEntryId"]);
      let s = e.deliveries.find((i) => i.id === t.deliveryId);
      l(s && s.answeredAttemptId === t.id && I(s.ref) === I(t.questionRef) && I(s.root) === I(t.rootQuestionRef) && s.role === t.role && Number.isFinite(t.seconds) && t.seconds >= 0 && t.seconds <= 86400 && C(t.at), "INVALID_ATTEMPT"), l(this.supply.assessment(t.questionRef, t.response).status === t.status, "FORGED_CORRECTNESS");
    }
    for (let t of e.challenges) {
      j(t, ["id", "entryId", "status", "plan", "attemptIds", "current", "consecutiveCorrect", "startedAt", "completedAt", "excludedInstant"]);
      let s = e.entries.find((a) => a.id === t.entryId);
      l(s && ["in-progress", "paused", "failed", "completed", "interrupted"].includes(t.status) && t.plan.length === 2 && t.attemptIds.length <= 2 && new Set(t.attemptIds).size === t.attemptIds.length && C(t.startedAt), "INVALID_CHALLENGE");
      let i = this.row(s.root), r = t.plan.map((a) => this.row(a));
      l(r[0].contentFingerprint !== r[1].contentFingerprint && r.every((a) => a.contentFingerprint !== this.row(t.excludedInstant).contentFingerprint && this.supply.candidates(i).some((p) => p.contentFingerprint === a.contentFingerprint)), "CHALLENGE_CONDITION_DUPLICATE");
      let d = t.attemptIds.map((a) => e.attempts.find((p) => p.id === a));
      l(d.every((a, p) => a?.challengeId === t.id && a?.reviewEntryId === s.id && I(a.questionRef) === I(t.plan[p])), "CHALLENGE_ATTEMPT_MISMATCH");
      let u = d.some((a) => a.status === "incorrect") ? 0 : d.length;
      l(t.consecutiveCorrect === u, "FORGED_CONSECUTIVE_SUCCESS"), t.status === "completed" && l(u === 2 && C(t.completedAt ?? ""), "FALSE_REVIEW_COMPLETION"), t.status === "failed" && l(d.some((a) => a?.status === "incorrect"), "FALSE_FAILURE"), ["in-progress", "paused", "interrupted"].includes(t.status) && l(u < 2 && d.every((a) => a?.status === "correct"), "CHALLENGE_STATUS_CONFLICT"), t.current && l(e.deliveries.some((a) => a.id === t.current && a.challengeId === t.id && !a.answeredAttemptId && I(a.ref) === I(t.plan[t.attemptIds.length]) && I(a.root) === I(s.root)), "INVALID_CHALLENGE_CURRENT");
    }
    for (let t of e.entries) {
      j(t, ["id", "root", "r1EventId", "lastFailureAttemptId", "latestInstant", "status", "createdAt", "updatedAt", "completedAt", "completions"]), l(e.challenges.filter((p) => p.entryId === t.id && ["in-progress", "paused"].includes(p.status)).length <= 1, "MULTIPLE_ACTIVE_CHALLENGES");
      let s = this.row(t.root), i = e.attempts.find((p) => p.id === t.lastFailureAttemptId), r = i && e.deliveries.find((p) => p.id === i.deliveryId)?.parentBaseAttemptId;
      l(["needsReview", "completed"].includes(t.status) && i?.role === "instant-twin" && i.status === "incorrect" && e.attempts.some((p) => p.id === r && p.role === "base" && p.status === "incorrect") && I(i.rootQuestionRef) === I(t.root) && I(i.questionRef) === I(t.latestInstant), "TWO_ACTUAL_ERRORS_REQUIRED"), l(e.r1.events.some((p) => p.id === t.r1EventId && p.source.contentHash === s.contentHash) && C(t.createdAt) && C(t.updatedAt), "INVALID_ROOT_LEDGER");
      let d = e.challenges.filter((p) => p.entryId === t.id && p.status === "completed"), u = e.attempts.findIndex((p) => p.id === t.lastFailureAttemptId), a = d.some((p) => e.attempts.findIndex((y) => y.id === p.attemptIds[1]) > u);
      l(I(t.completions) === I(d.map((p) => p.id)) && t.status === "completed" === a, "ROOT_COMPLETION_CONFLICT"), t.status === "completed" && l(C(t.completedAt ?? ""), "MISSING_COMPLETION_TIME");
    }
  }
  async load() {
    let e = await this.storage.load(), n = e === null ? this.initial() : e;
    return this.validate(n), h(n);
  }
  async save(e) {
    let n = e.revision;
    e.revision++, this.validate(e), await this.storage.commit(e, n);
  }
  delivery(e) {
    let n = this.row(e.ref);
    return { id: e.id, sessionId: e.ownerId, role: e.role, questionRef: h(e.ref), rootQuestionRef: h(e.root), metadata: this.supply.metadata(n), render: this.supply.view(n), consumer: this.supply.consumer, operational: true, policyVersion: this.lock.policyVersion };
  }
  issue(e, n, t, s, i, r = {}) {
    l(e.deliveries.length < 3e3, "DELIVERY_CAP_EXPORT_REQUIRED");
    let d = { id: K(), ownerId: n, role: i, ref: h(t), root: h(s), ...r };
    return e.deliveries.push(d), d;
  }
  async openSession(e) {
    let n = this.supply.scope(e), t = await this.load();
    l(t.sessions.length < 200, "SESSION_CAP_EXPORT_REQUIRED");
    let s = K();
    return t.sessions.push({ id: s, scope: n, phase: "idle", current: null, root: null, baseAttemptId: null, used: [], counts: {} }), await this.save(t), { sessionId: s };
  }
  async nextQuestion(e) {
    let n = await this.load(), t = n.sessions.find((a) => a.id === e);
    if (l(t, "UNKNOWN_SESSION"), t.current) return { status: "question", delivery: this.delivery(n.deliveries.find((a) => a.id === t.current)) };
    if (t.phase === "needs-twin") return { status: "action-required", reason: "REQUEST_INSTANT_EQUIVALENT_TWIN" };
    if (t.phase === "limited") return { status: "held", reason: "INSTANT_TWIN_UNAVAILABLE_NO_SECOND_ERROR_RECORDED" };
    let s = se(this.supply, n), i = this.supply.rows(t.scope).filter((a) => !this.supply.isExcluded(a, t.used) && !this.supply.isExcluded(a, s));
    i.sort((a, p) => (t.counts[a.templateId] ?? 0) - (t.counts[p.templateId] ?? 0) || a.exampleId.localeCompare(p.exampleId));
    let r = i[0];
    if (!r) {
      let a = this.supply.rows(t.scope).some((p) => !this.supply.isExcluded(p, t.used));
      return { status: a ? "held" : "exhausted", reason: a ? "APPROVED_BASES_EXCLUDED_BY_RECENT_OR_RESERVED" : "NO_UNUSED_APPROVED_MATH_CONDITION" };
    }
    let d = this.supply.ref(r), u = this.issue(n, e, d, d, "base");
    return t.current = u.id, t.root = d, t.phase = "base-issued", t.baseAttemptId = null, t.used.push(r.contentFingerprint), t.counts[r.templateId] = (t.counts[r.templateId] ?? 0) + 1, await this.save(n), { status: "question", delivery: this.delivery(u) };
  }
  async requestEquivalentTwin(e) {
    let n = await this.load(), t = n.sessions.find((d) => d.id === e);
    if (l(t, "UNKNOWN_SESSION"), t.phase === "twin-issued" && t.current) return { status: "question", delivery: this.delivery(n.deliveries.find((d) => d.id === t.current)) };
    if (t.phase === "limited") {
      let d = n.attempts.find((a) => a.id === t.baseAttemptId), u = d && n.deliveries.find((a) => a.id === d.deliveryId);
      l(d?.status === "incorrect" && u?.ownerId === e && I(d.questionRef) === I(t.root) && !n.deliveries.some((a) => a.parentBaseAttemptId === d.id && a.role === "instant-twin"), "NO_UNISSUED_ACTUAL_ERROR_TO_RETRY"), t.phase = "needs-twin";
    }
    l(t.phase === "needs-twin" && t.root && t.baseAttemptId, "INSTANT_TWIN_NOT_REQUIRED");
    let s = this.row(t.root), i = await this.supply.twin(s, se(this.supply, n), e + ":instant");
    if (!i) return t.phase = "limited", await this.save(n), { status: "held", reason: this.supply.candidates(s).length ? "APPROVED_EQUIVALENTS_EXCLUDED_BY_RECENT_OR_RESERVED" : "NO_APPROVED_EQUIVALENT_INSTANT_TWIN_NO_NOTE_ADDED", available: 0, required: 1 };
    let r = this.issue(n, e, this.supply.ref(i), t.root, "instant-twin", { parentBaseAttemptId: t.baseAttemptId });
    return t.current = r.id, t.phase = "twin-issued", t.used.includes(i.contentFingerprint) || t.used.push(i.contentFingerprint), await this.save(n), { status: "question", delivery: this.delivery(r) };
  }
  async activate(e, n, t) {
    let s = this.row(n.root), i = e.attempts.find((_) => _.id === n.parentBaseAttemptId);
    l(i?.status === "incorrect", "NO_FIRST_ERROR");
    let r = "review-" + (await H(n.root)).slice(0, 40), d = e.entries.find((_) => _.id === r), u = { load: async () => h(e.r1), commit: async (_, N) => (l(e.r1.revision === N, "R1_REVISION_CONFLICT"), pe(_), e.r1 = { ...h(_), revision: N + 1 }, h(e.r1)), exportBackup: async () => W(e.r1), importBackup: async () => {
      throw Error("R1_IMPORT_NOT_EXPOSED_BY_POLICY");
    } }, a = new ne(u, this.supply.provider(), "student", this.clock), p = d ? { eventId: d.r1EventId } : await a.recordWrongAnswer({ idempotencyKey: "survival-review:" + r.slice(7), gameId: this.supply.consumer, source: s.reviewItem, selectedAnswer: i.response, occurredAt: i.at });
    if (!d) l(e.entries.length < 200, "ENTRY_CAP_EXPORT_REQUIRED"), d = { id: r, root: h(n.root), r1EventId: p.eventId, lastFailureAttemptId: t, latestInstant: h(n.ref), status: "needsReview", createdAt: this.now(), updatedAt: this.now(), completedAt: null, completions: [] }, e.entries.push(d);
    else {
      d.lastFailureAttemptId = t, d.latestInstant = h(n.ref), d.status = "needsReview", d.updatedAt = this.now(), d.completedAt = null;
      for (let _ of e.challenges.filter((N) => N.entryId === r && ["in-progress", "paused"].includes(N.status))) _.status = "interrupted", _.current = null;
    }
    let y = e.r1.events.find((_) => _.id === p.eventId);
    return y.status = "pending", d.id;
  }
  async applyAttemptEvent(e) {
    j(e, ["attemptId", "deliveryId", "response", "seconds"]), l(typeof e.attemptId == "string" && /^[a-z0-9:-]{8,160}$/i.test(e.attemptId) && typeof e.response == "string" && Number.isFinite(e.seconds) && e.seconds >= 0 && e.seconds <= 86400, "INVALID_ATTEMPT_INPUT");
    let n = await this.load(), t = n.deliveries.find((u) => u.id === e.deliveryId);
    l(t, "UNKNOWN_DELIVERY");
    let s = n.attempts.find((u) => u.id === e.attemptId) || n.attempts.find((u) => u.deliveryId === t.id);
    if (s) return l(s.deliveryId === t.id && s.response === e.response && s.seconds === e.seconds, "IDEMPOTENCY_CONFLICT"), { ...this.supply.assessment(t.ref, e.response), duplicate: true, acceptedAttemptId: s.id, reviewEntryId: s.reviewEntryId ?? null, noteAction: "none" };
    let i = this.supply.assessment(t.ref, e.response);
    if (i.status === "invalid") return { ...i, duplicate: false, acceptedAttemptId: "", reviewEntryId: null, noteAction: "none" };
    l(n.attempts.length < 2e3, "ATTEMPT_CAP_EXPORT_REQUIRED");
    let r = null, d = "none";
    if (t.role === "challenge") {
      let u = n.challenges.find((a) => a.id === t.challengeId);
      l(u?.status === "in-progress" && u.current === t.id, "CHALLENGE_NOT_ACTIVE"), r = u.entryId;
    } else {
      let u = n.sessions.find((a) => a.id === t.ownerId);
      l(u && u.current === t.id && ["base-issued", "twin-issued"].includes(u.phase), "SESSION_NOT_ACTIVE");
    }
    if (n.attempts.push({ id: e.attemptId, deliveryId: t.id, questionRef: h(t.ref), rootQuestionRef: h(t.root), role: t.role, response: e.response, status: i.status, seconds: e.seconds, at: this.now(), ...t.challengeId ? { challengeId: t.challengeId, reviewEntryId: r } : {} }), t.answeredAttemptId = e.attemptId, t.role === "challenge") {
      let u = n.challenges.find((p) => p.id === t.challengeId), a = n.entries.find((p) => p.id === u.entryId);
      u.attemptIds.push(e.attemptId), u.current = null, i.status === "incorrect" ? (u.consecutiveCorrect = 0, u.status = "failed", n.r1.events.find((p) => p.id === a.r1EventId).status = "pending") : (u.consecutiveCorrect++, u.consecutiveCorrect === 2 && (u.status = "completed", u.completedAt = this.now(), a.status = "completed", a.completedAt = this.now(), a.completions.push(u.id), n.r1.events.find((p) => p.id === a.r1EventId).status = "completed", d = "completed")), a.updatedAt = this.now();
    } else {
      let u = n.sessions.find((a) => a.id === t.ownerId);
      u.current = null, t.role === "base" ? (u.baseAttemptId = e.attemptId, u.phase = i.status === "incorrect" ? "needs-twin" : "idle") : (i.status === "incorrect" && (r = await this.activate(n, t, e.attemptId), d = "needsReview", n.attempts.at(-1).reviewEntryId = r), u.phase = "idle");
    }
    return await this.save(n), { ...i, duplicate: false, acceptedAttemptId: e.attemptId, reviewEntryId: r, noteAction: d };
  }
  async getReviewQueue(e = {}) {
    let n = await this.load();
    return n.entries.filter((t) => e.includeCompleted || t.status === "needsReview").map((t) => {
      let s = n.challenges.find((i) => i.entryId === t.id && ["in-progress", "paused"].includes(i.status));
      return { reviewEntryId: t.id, rootQuestionRef: h(t.root), status: t.status, label: t.status === "completed" ? "\uC815\uD574\uC9C4 \uC5F0\uC2B5\uC744 \uB9C8\uCCE4\uC5B4\uC694" : "\uBCF5\uC2B5\uC774 \uD544\uC694\uD55C \uBB38\uC81C", createdAt: t.createdAt, updatedAt: t.updatedAt, completedAt: t.completedAt, challengeAttemptCount: n.attempts.filter((i) => i.reviewEntryId === t.id && i.role === "challenge").length, consecutiveCorrect: s?.consecutiveCorrect ?? (t.status === "completed" ? 2 : 0), basic: this.supply.view(this.row(t.root)), assessment: this.supply.assessment(t.root, this.row(t.root).assessment.answer.choiceId), history: n.attempts.filter((i) => I(i.rootQuestionRef) === I(t.root)).map((i) => ({ ...h(i), metadata: this.supply.metadata(this.row(i.questionRef)) })) };
    });
  }
  async startChallenge(e) {
    let n = await this.load(), t = n.entries.find((y) => y.id === e);
    l(t && t.status === "needsReview", "ACTIVE_REVIEW_ENTRY_REQUIRED");
    let s = n.challenges.find((y) => y.entryId === e && ["in-progress", "paused"].includes(y.status));
    if (s) return { status: "resumed", challengeId: s.id };
    let i = this.row(t.root), r = se(this.supply, n, [this.row(t.latestInstant).contentFingerprint]), d = this.supply.candidates(i, r).length;
    if (d < 2) return { status: "held", reason: this.supply.candidates(i, [this.row(t.latestInstant).contentFingerprint]).length >= 2 ? "APPROVED_CHALLENGES_EXCLUDED_BY_RECENT_OR_RESERVED" : "TWO_DISTINCT_EQUIVALENT_CHALLENGE_VARIANTS_UNAVAILABLE", available: d, required: 2 };
    let u = await this.supply.twin(i, r, e + ":challenge"), a = u && await this.supply.twin(i, [...r, u.contentFingerprint], e + ":challenge:2");
    l(u && a, "BOUNDED_SELECTOR_EXHAUSTED"), l(n.challenges.length < 400, "CHALLENGE_CAP_EXPORT_REQUIRED");
    let p = { id: K(), entryId: e, status: "in-progress", excludedInstant: h(t.latestInstant), plan: [this.supply.ref(u), this.supply.ref(a)], attemptIds: [], current: null, consecutiveCorrect: 0, startedAt: this.now(), completedAt: null };
    return n.challenges.push(p), n.r1.events.find((y) => y.id === t.r1EventId).status = "in-progress", await this.save(n), { status: "started", challengeId: p.id };
  }
  async nextChallenge(e) {
    let n = await this.load(), t = n.challenges.find((r) => r.id === e);
    if (l(t, "UNKNOWN_CHALLENGE"), t.status === "paused") return { status: "held", reason: "CHALLENGE_PAUSED_NOT_INCORRECT" };
    if (t.status === "completed") return { status: "completed", reason: "TWO_DISTINCT_EQUIVALENT_CORRECT_ANSWERS" };
    if (t.status === "interrupted") return { status: "held", reason: "CHALLENGE_SUPERSEDED_NO_ERROR_RECORDED" };
    if (t.status === "failed") return { status: "held", reason: "CHALLENGE_RETRY_REQUIRED_CONSECUTIVE_RESET" };
    if (t.current) return { status: "question", delivery: this.delivery(n.deliveries.find((r) => r.id === t.current)) };
    let s = n.entries.find((r) => r.id === t.entryId), i = this.issue(n, t.id, t.plan[t.attemptIds.length], s.root, "challenge", { challengeId: t.id });
    return t.current = i.id, await this.save(n), { status: "question", delivery: this.delivery(i) };
  }
  async pauseChallenge(e) {
    let n = await this.load(), t = n.challenges.find((s) => s.id === e);
    l(t && ["in-progress", "paused"].includes(t.status), "CHALLENGE_NOT_ACTIVE"), t.status !== "paused" && (t.status = "paused", await this.save(n));
  }
  async resumeChallenge(e) {
    let n = await this.load(), t = n.challenges.find((s) => s.id === e);
    return l(t && ["paused", "in-progress"].includes(t.status), "CHALLENGE_NOT_RESUMABLE"), t.status === "paused" && (t.status = "in-progress", await this.save(n)), this.nextChallenge(e);
  }
  async getReviewSummary() {
    let e = await this.load();
    return { schemaVersion: "qb-survival-result/1", engineVersion: this.lock.engineVersion, implementationHash: this.lock.implementationHash, historyPolicy: J, policyVersion: this.lock.policyVersion, packVersion: this.lock.packVersion, contentVersion: this.lock.contentVersion, reviewEntries: await this.getReviewQueue({ includeCompleted: true }), attempts: h(e.attempts), challengeHistory: h(e.challenges), active: e.entries.filter((n) => n.status === "needsReview").length, completed: e.entries.filter((n) => n.status === "completed").length, learningClaim: "\uC815\uD574\uC9C4 \uC5F0\uC2B5 \uC870\uAC74 \uCDA9\uC871 \uAE30\uB85D\uC774\uBA70 \uC644\uC804 \uC219\uB2EC \uC778\uC99D\uC740 \uC544\uB2D9\uB2C8\uB2E4", studentPIIIncluded: false, serverUpload: false };
  }
  async serialize() {
    return W(await this.load());
  }
  async restore(e, n = {}) {
    let t = await G(e);
    this.validate(t);
    let s = await this.load();
    n.expectedRevision !== void 0 && l(s.revision === n.expectedRevision, "MULTI_TAB_CONFLICT"), I({ ...s, revision: 0 }) !== I({ ...t, revision: 0 }) && (l(n.mode === "replace" || s.sessions.length === 0 && s.entries.length === 0, "BACKUP_CONFLICT_EXPLICIT_REPLACE_REQUIRED"), t.revision = s.revision, await this.save(t));
  }
  async exportResults(e) {
    let n = await this.load(), t = await this.getReviewSummary();
    if (e === "json") return JSON.stringify({ ...t, sourceSnapshots: n.r1.events.map((r) => ({ reviewEntryId: n.entries.find((d) => d.r1EventId === r.id)?.id, event: h(r) })) }, null, 2);
    let s = ["reviewEntryId", "rootQuestionRef", "questionRef", "role", "response", "status", "seconds", "at", "challengeId", "metadata"], i = n.attempts.map((r) => ({ ...r, reviewEntryId: r.reviewEntryId ?? n.entries.find((d) => I(d.root) === I(r.rootQuestionRef))?.id ?? "", metadata: this.supply.metadata(this.row(r.questionRef)) }));
    return "\uFEFF" + [s.join(","), ...i.map((r) => s.map((d) => de(r[d])).join(","))].join(`\r
`);
  }
};
function _e(o2, e) {
  let n = /* @__PURE__ */ new Map();
  for (let t of e) n.set(t.ref.questionId, (n.get(t.ref.questionId) ?? 0) + 1);
  return o2.sort((t, s) => (n.get(t.questionId) ?? 0) - (n.get(s.questionId) ?? 0));
}
function re(o2) {
  let e = new TextEncoder().encode(typeof o2 == "string" ? o2 : JSON.stringify(o2)), n = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298], t = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225], s = Math.ceil((e.length + 9) / 64) * 64, i = new Uint8Array(s);
  i.set(e), i[e.length] = 128;
  let r = new DataView(i.buffer);
  r.setUint32(s - 8, Math.floor(e.length / 536870912)), r.setUint32(s - 4, e.length * 8);
  let d = (a, p) => a >>> p | a << 32 - p, u = new Int32Array(64);
  for (let a = 0; a < s; a += 64) {
    for (let A = 0; A < 16; A++) u[A] = r.getInt32(a + 4 * A);
    for (let A = 16; A < 64; A++) {
      let b = u[A - 15], f = u[A - 2];
      u[A] = u[A - 16] + (d(b, 7) ^ d(b, 18) ^ b >>> 3) + u[A - 7] + (d(f, 17) ^ d(f, 19) ^ f >>> 10) | 0;
    }
    let [p, y, _, N, D, k, x, F] = t;
    for (let A = 0; A < 64; A++) {
      let b = F + (d(D, 6) ^ d(D, 11) ^ d(D, 25)) + (D & k ^ ~D & x) + n[A] + u[A] | 0, f = (d(p, 2) ^ d(p, 13) ^ d(p, 22)) + (p & y ^ p & _ ^ y & _) | 0;
      F = x, x = k, k = D, D = N + b | 0, N = _, _ = y, y = p, p = b + f | 0;
    }
    [p, y, _, N, D, k, x, F].forEach((A, b) => t[b] = t[b] + A | 0);
  }
  return t.map((a) => (a >>> 0).toString(16).padStart(8, "0")).join("");
}
function gt(o2, e) {
  if (!e?.key?.startsWith("sq-unified")) throw Error("EXPLICIT_UNIFIED_STORAGE_KEY_REQUIRED");
  return ee(o2, e);
}
var me = "common-public-runtime/1.1.0-unified-candidate", X = (o2) => I(o2), g = (o2, e) => l(o2, e), we = ["common-bank", "math-hero-survival", "random-defense", "cafe-learning-tycoon", "school-quest"], Se = async (o2) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", o2)), (e) => e.toString(16).padStart(2, "0")).join("");
async function Ce({ manifestBytes: o2, expectedManifestSHA256: e, readAsset: n, consumer: t = "common-bank", purpose: s }) {
  g(["operational-supply","candidate-integration-test"].includes(s), "EXPLICIT_OPERATIONAL_USE_REQUIRED"), g(we.includes(t), "UNSUPPORTED_CONSUMER"), g(/^[a-f0-9]{64}$/.test(e) && await Se(o2) === e, "MANIFEST_HASH_MISMATCH");
  let i = JSON.parse(new TextDecoder().decode(o2));
  g(i.schemaVersion === "common-public-runtime-manifest/1" && i.operationalApproval === true, "WRONG_MANIFEST_CONTRACT");
  await assertOperationalManifest(i,n,t);
  let r = i.files.find((f) => f.role === "approved-data"), d = i.files.find((f) => f.role === "native-reference-map");
  g(r && d, "DATA_CONTRACT_REQUIRED");
  let u = async (f) => {
    g(/^[a-zA-Z0-9_./-]+$/.test(f.path) && !f.path.includes(".."), "UNSAFE_ASSET_PATH");
    let S = await n(f.path);
    return g(S.byteLength === f.bytes && await Se(S) === f.sha256, "ASSET_HASH_MISMATCH:" + f.path), S;
  }, a = JSON.parse(new TextDecoder().decode(await u(r))), p = JSON.parse(new TextDecoder().decode(await u(d)));
  g(["common-math-public-data/1", "common-subject-public-data/1"].includes(a.schemaVersion) && a.packId === i.packId && a.version === i.dataVersion, "DATA_VERSION_MISMATCH");
  let y = a.subjectId ?? "math";
  g(!(y !== "math" && ["math-hero-survival", "random-defense"].includes(t)), "CONSUMER_SUBJECT_UNSUPPORTED");
  let _ = new Map(a.objects.map((f) => [f.objectId, f]));
  g(_.size === a.objects.length, "DUPLICATE_OBJECT");
  let N = /* @__PURE__ */ new Map(), D = /* @__PURE__ */ new Map(), k = /* @__PURE__ */ new Map(), x = /* @__PURE__ */ new Map();
  for (let f of a.groups) {
    let S = /^g(\d{1,2})s([012])$/.exec(f.semesterKey);
    g(S, "UNSUPPORTED_GRADE_POOL");
    let M = Number(S[1]), B = S[2] === "0" ? null : Number(S[2]), P = re(f.solutionStructureId), L = [];
    for (let O of f.refs) {
      let w = _.get(O.objectId);
      if (g(w && w.questionId === O.questionId && w.questionVersion === O.version && w.contentHash === O.contentHash, "GROUP_OBJECT_MISMATCH"), g(w.managedQuestion || w.assessment.answer.kind === "single-choice" && w.render.choices.filter((V) => V.id === w.assessment.answer.choiceId).length === 1, "UNSUPPORTED_OR_AMBIGUOUS_FORMAT"), w.managedQuestion) {
        let V = w.assessment.answer.choiceId;
        try {
          ["multiple-choice", "ordering", "matching"].includes(w.managedQuestion.questionType) && (V = JSON.parse(V)), g(le(w.managedQuestion, V).status === "correct", "MANAGED_ANSWER_MODEL_MISMATCH");
        } catch {
          throw Error("MANAGED_ANSWER_MODEL_INVALID");
        }
      }
      let U = { packId: a.packId, packVersion: a.version, contentVersion: i.catalogDigest + ":" + f.groupId, questionId: w.questionId, questionVersion: w.questionVersion, contentHash: w.contentHash }, v = { ...w, grade: M, semester: B, subject: y, unitId: f.unitId, skillId: f.skillId, level: f.level, groupId: f.groupId, templateId: f.solutionStructureId, templateVersion: 1, familyId: f.solutionStructureId, solutionStructureId: f.solutionStructureId, equivalenceKey: f.canonicalKey, semanticConditionKey: O.semanticConditionKey, contentFingerprint: re(O.semanticConditionKey), structureFingerprint: P, exampleId: String(L.length).padStart(6, "0"), reference: U }, $;
      Object.defineProperty(v, "reviewItem", { get() {
        return $ ??= Object.freeze({ question: { id: v.questionId, version: v.questionVersion, subject: v.subject, grade: M, question: v.render.text, choices: v.render.choices, answer: v.assessment.answer, explanation: v.assessment.explanation, review: { status: "approved" } }, conceptId: v.skillId, familyId: v.familyId, templateId: v.templateId, seed: v.seed, parameters: v.parameters, contentFingerprint: v.contentFingerprint, structureFingerprint: v.structureFingerprint, contentHash: v.contentHash, task: { kind: f.groupId, query: v.solutionStructureId, known: {} } });
      } }), g(!D.has(X(U)), "DUPLICATE_CONTEXT_REFERENCE"), D.set(X(U), v), k.set(v.contentFingerprint, v.semanticConditionKey), L.push(v);
    }
    g(new Set(L.map((O) => O.semanticConditionKey)).size >= 1, "MINIMUM_REVIEW_RANGE_NOT_MET"), N.set(f.groupId, L);
    let z = x.get(f.semesterKey) ?? [];
    z.push(...L), x.set(f.semesterKey, z);
  }
  let F = a.groups.map(({ refs: f, ...S }) => h(S)), A = i.catalogDigest;
  function b({ semesterKey: f, groupIds: S, consumer: M = t, learningRecordId: B } = {}) {
    g(/^[a-zA-Z0-9:_-]{4,160}$/.test(B ?? ""), "LEARNING_RECORD_ID_REQUIRED"), g(we.includes(M), "UNSUPPORTED_CONSUMER"), g(!(y !== "math" && ["math-hero-survival", "random-defense"].includes(M)), "CONSUMER_SUBJECT_UNSUPPORTED"), g(x.has(f), "UNKNOWN_SEMESTER"), S && g(Array.isArray(S) && S.length && new Set(S).size === S.length && S.every((c) => N.has(c) && F.find((m) => m.groupId === c).semesterKey === f), "UNKNOWN_GROUP_OR_CROSS_POOL");
    let P = S ? S.flatMap((c) => N.get(c)) : x.get(f), L = new Set(P), z = new Map(P.map((c) => [X(c.reference), c])), [O, w] = [Number(/^g(\d+)s/.exec(f)[1]), f.split("s")[1] === "0" ? null : Number(f.split("s")[1])], U = { packId: a.packId, packVersion: a.version, contentVersion: A }, v = (c) => {
      g(c && Object.keys(c).length === 6 && Object.keys(c).every((E) => ["packId", "packVersion", "contentVersion", "questionId", "questionVersion", "contentHash"].includes(E)), "INVALID_REFERENCE");
      let m = z.get(X(c));
      return g(m, "UNAPPROVED_OR_CHANGED_REFERENCE"), m;
    }, $ = (c) => (g(c && Object.keys(c).every((m) => ["packId", "packVersion", "contentVersion", "subject", "grade", "semester", "unitId", "skillIds", "levels", "style", "groupIds"].includes(m)), "UNKNOWN_SCOPE_FIELD"), g(c.packId === U.packId && c.packVersion === U.packVersion && c.contentVersion === U.contentVersion, "PACK_VERSION_MISMATCH"), g(c.subject === y && c.grade === O && c.semester === w && P.some((m) => m.unitId === c.unitId), "UNSUPPORTED_POOL"), g(Array.isArray(c.skillIds) && c.skillIds.length && new Set(c.skillIds).size === c.skillIds.length && c.skillIds.every((m) => P.some((E) => E.unitId === c.unitId && E.skillId === m)), "EMPTY_OR_UNKNOWN_SKILLS"), g(Array.isArray(c.levels) && c.levels.length && new Set(c.levels).size === c.levels.length && c.levels.every((m) => [1, 2, 3, 4, 5].includes(m)) && c.style === "mixed", "UNSUPPORTED_FILTER"), c.groupIds && g(Array.isArray(c.groupIds) && c.groupIds.length && new Set(c.groupIds).size === c.groupIds.length && c.groupIds.every((m) => P.some((E) => E.groupId === m && E.unitId === c.unitId)), "UNKNOWN_GROUP_FILTER"), g(R.rows(c).length, "NO_APPROVED_CANDIDATE"), h(c)), V = (c) => P.filter((m) => m.unitId === c.unitId && c.skillIds.includes(m.skillId) && c.levels.includes(m.level) && (!c.groupIds || c.groupIds.includes(m.groupId))), Ne = { packSha256: i.engineABIDataSHA256, contentVersion: A, engineVersion: me, implementationHash: i.policyImplementationDigest, policyVersion: "equivalent-two/1.0.0", schemaVersion: "qb-unified-review/1", learningRecordId: B, consumer: M, packVersion: a.version }, R = { consumer: M, runtimePins: Ne, blocked: /* @__PURE__ */ new Set(), ref: (c) => h(c.reference), resolve: v, scope: $, rows: V, semanticKey: (c) => c.semanticConditionKey, historyKey: (c) => (g(k.has(c), "UNKNOWN_HISTORY_FINGERPRINT"), k.get(c)), isExcluded: (c, m) => m.some((E) => R.historyKey(E) === c.semanticConditionKey), candidates: (c, m = []) => {
      let E = /* @__PURE__ */ new Set([c.semanticConditionKey, ...m.map((T) => R.historyKey(T))]);
      return (N.get(c.groupId) ?? []).filter((T) => L.has(T) && !E.has(T.semanticConditionKey) && E.add(T.semanticConditionKey));
    }, find: (c) => {
      let m = (N.get(c?.task?.kind) ?? []).find((E) => L.has(E) && E.questionId === c?.question?.id && E.contentHash === c.contentHash);
      return m && I(m.reviewItem) === I(c) ? m : void 0;
    }, provider: () => ({ grade: (c, m) => {
      let E = R.find(c);
      return E ? R.assessment(R.ref(E), m) : { status: "invalid" };
    }, templates: [], generate: async () => {
      throw Error("OUTSIDE_APPROVED_FINITE_PARAMETERS");
    }, verify: async (c) => !!R.find(c), authorize: async (c) => !!R.find(c) }), view: (c) => h(c.render), metadata: (c) => ({ ...U, learningRecordId: B, questionType: c.render.questionType ?? "single-choice", groupId: c.groupId, templateId: c.templateId, templateVersion: c.templateVersion, familyId: c.familyId, parameters: h(c.parameters), seed: c.seed, grade: O, semester: w, unitId: c.unitId, skillIds: [c.skillId], difficulty: c.level, solutionStructureId: c.solutionStructureId, equivalenceKey: c.equivalenceKey, semanticConditionKey: c.semanticConditionKey, originContentHash: c.contentHash, snapshotContract: "normalized-r1-ledger/origin-hash-not-snapshot-hash/1", nativeNamespace: p.semesters.find((m) => m.semesterKey === f), rendererVersion: i.rendererDigest, generationMode: "ON_DEMAND_APPROVED_FINITE_PARAMETERS", operational: true }), assessment: (c, m) => {
      let E = v(c), T = m;
      if (E.managedQuestion && ["multiple-choice", "ordering", "matching"].includes(E.managedQuestion.questionType)) try {
        T = JSON.parse(m);
      } catch {
        return { status: "invalid", questionRef: h(c) };
      }
      return { status: (E.managedQuestion ? le(E.managedQuestion, T) : te(E.reviewItem.question, m)).status, correctChoiceId: E.assessment.answer.choiceId, explanation: E.assessment.explanation, hint: E.assessment.hint, questionRef: h(c) };
    } }, Ie = (c) => {
      let m = v(c);
      return { questionRef: h(c), questionId: m.questionId, questionVersion: m.questionVersion, contentHash: m.contentHash, parameters: h(m.parameters), render: R.view(m), assessment: h(m.assessment), metadata: R.metadata(m) };
    };
    return { info: { ...U, learningRecordId: B, runtimeVersion: me, policy: "equivalent-two/1.0.0", reusedEngine: "1.0.2", operational: true, publicDeploymentPerformed: false }, defaultScope: (c) => $({ ...U, subject: y, grade: O, semester: w, unitId: c, skillIds: [...new Set(P.filter((m) => m.unitId === c).map((m) => m.skillId))], levels: [1, 2, 3, 4, 5], style: "mixed" }), getCandidates: (c) => V($(c)).map((m) => ({ questionRef: h(m.reference), objectId: m.objectId, groupId: m.groupId, skillId: m.skillId, level: m.level, solutionStructureId: m.solutionStructureId, semanticConditionKey: m.semanticConditionKey })), getQuestion: Ie, gradeAnswer: R.assessment, materialize({ groupId: c, parameters: m, objectId: E }) {
      g(N.has(c), "UNKNOWN_APPROVED_RECIPE");
      let T = N.get(c).filter((Q) => L.has(Q) && (!E || Q.objectId === E) && I(Q.parameters) === I(m));
      return g(T.length, "PARAMETERS_OUTSIDE_APPROVED_RANGE"), g(T.length === 1, "AMBIGUOUS_PARAMETERS_REQUIRE_OBJECT_ID"), Ie(T[0].reference);
    }, getEquivalentCandidates: (c) => R.candidates(v(c)).map((m) => h(m.reference)), createReviewEngine(c) {
      let m = { ...R, twin: async (E, T, Q) => {
        let fe = await c.load(), oe = _e(R.candidates(E, T), fe?.deliveries ?? []);
        if (!oe.length) return null;
        let Z = /* @__PURE__ */ new Map();
        for (let Y of fe?.deliveries ?? []) {
          let ae = z.get(X(Y.ref));
          ae && Z.set(ae.semanticConditionKey, (Z.get(ae.semanticConditionKey) ?? 0) + 1);
        }
        let Re = Math.min(...oe.map((Y) => Z.get(Y.semanticConditionKey) ?? 0)), he = oe.filter((Y) => (Z.get(Y.semanticConditionKey) ?? 0) === Re);
        return he[parseInt(re(Q).slice(0, 8), 16) % he.length];
      } };
      return new ie(m, c);
    }, operationalSupply: () => ({ items: [], status: "held", reason: "EXPLICIT_OPERATIONAL_APPROVAL_AND_GAME_E2E_PENDING" }), getUnits: () => [...new Set(P.map((c) => c.unitId))] };
  }
  return { info: { packId: a.packId, dataVersion: a.version, runtimeVersion: me, manifestSHA256: e, operational: true, subjects: [y], domainAdapter: "finite-approved-domain/1", scienceImported: y === "science" }, get groups() {
    return h(F);
  }, getSemesters: () => [...x.keys()], createBank: b };
}
async function Et(o2, { expectedManifestSHA256: e, consumer: n, purpose: t } = {}) {
  let s = new URL(o2, globalThis.location?.href), i = async (r) => {
    let d = new URL(r, s);
    g(d.origin === s.origin, "CROSS_ORIGIN_ASSET");
    let u = await fetch(d, { cache: "no-store" });
    return g(u.ok, "ASSET_HTTP_FAILURE"), new Uint8Array(await u.arrayBuffer());
  };
  return Ce({ manifestBytes: await i("manifest.json"), expectedManifestSHA256: e, readAsset: i, consumer: n, purpose: t });
}
export {
  me as RUNTIME_VERSION,
  gt as createLocalStorage,
  de as csvCell,
  G as decode,
  W as encode,
  Ce as loadCommonBank,
  Et as loadCommonBankFromURL,
  ge as memoryStorage
};
