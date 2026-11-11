import { webAsset } from './webAsset.js?v=mega-d152ad969955';
/** A small lazy decoder pool, not a full-roster preload. Bitmaps are closed on eviction/scene teardown. */
export class ActorSheetCache {
    decode;
    limit;
    parallel;
    clock;
    entries = new Map();
    queue = [];
    busy = 0;
    idle = [];
    metrics = { requests: 0, decoded: 0, closed: 0, failed: 0, peakParallel: 0 };
    constructor(decode, limit = 32, parallel = 2, clock = () => Date.now()) {
        this.decode = decode;
        this.limit = limit;
        this.parallel = parallel;
        this.clock = clock;
    }
    get(file, width, height) { let e = this.entries.get(file); if (e) {
        e.used = this.clock();
        if (e.failedAt !== undefined && this.clock() - e.failedAt > 5000) {
            this.entries.delete(file);
            e = undefined;
        }
        else
            return e.bitmap;
    } e = { file, width, height, used: this.clock(), controller: new AbortController() }; this.entries.set(file, e); this.queue.push(e); this.metrics.requests++; this.pump(); return undefined; }
    pump() { while (this.busy < this.parallel && this.queue.length) {
        const e = this.queue.shift();
        if (this.entries.get(e.file) !== e)
            continue;
        this.busy++;
        this.metrics.peakParallel = Math.max(this.metrics.peakParallel, this.busy);
        void this.decode(e.file, e.width, e.height, e.controller.signal).then(b => { if (this.entries.get(e.file) !== e) {
            b.close();
            this.metrics.closed++;
            return;
        } e.bitmap = b; this.metrics.decoded++; this.trim(); }).catch(() => { if (this.entries.get(e.file) === e) {
            e.failedAt = this.clock();
            this.metrics.failed++;
        } }).finally(() => { this.busy--; this.pump(); if (!this.busy && !this.queue.length)
            for (const resolve of this.idle.splice(0))
                resolve(); });
    } }
    trim() { const ready = [...this.entries.values()].filter(e => e.bitmap).sort((a, b) => a.used - b.used); while (ready.length > this.limit) {
        const e = ready.shift();
        e.bitmap.close();
        this.metrics.closed++;
        this.entries.delete(e.file);
    } }
    get diagnostics() { return { ...this.metrics, ready: [...this.entries.values()].filter(e => e.bitmap).length, bytes: [...this.entries.values()].reduce((n, e) => n + (e.bitmap ? e.bitmap.width * e.bitmap.height * 4 : 0), 0), pending: this.busy, queued: this.queue.length }; }
    whenIdle() { return this.busy || this.queue.length ? new Promise(resolve => this.idle.push(resolve)) : Promise.resolve(); }
    clear() { for (const e of this.entries.values()) {
        e.controller.abort();
        if (e.bitmap) {
            e.bitmap.close();
            this.metrics.closed++;
        }
    } this.entries.clear(); this.queue = []; }
}
export const finalActorCache = new ActorSheetCache(async (file, width, height, signal) => { if (!file.startsWith('assets/art/final-roster/'))
    throw Error('Unknown actor asset'); const response = await fetch(webAsset(file), { signal }); if (!response.ok)
    throw Error('Actor asset load failed'); const blob = await response.blob(), scale = Math.min(1, 768 / Math.max(width, height)); return createImageBitmap(blob, { resizeWidth: Math.max(1, Math.round(width * scale)), resizeHeight: Math.max(1, Math.round(height * scale)), resizeQuality: 'high' }); });
/** Upload only the requested cell to the renderer, not an entire multi-character sheet. */
export const finalActorFrameCache = new ActorSheetCache(async (key) => { const { file, width, height, box } = JSON.parse(key); const atlas = finalActorCache.get(file, width, height); if (!atlas)
    throw Error('Atlas not ready'); const sx = atlas.width / width, sy = atlas.height / height; return createImageBitmap(atlas, Math.round(box[0] * sx), Math.round(box[1] * sy), Math.max(1, Math.round(box[2] * sx)), Math.max(1, Math.round(box[3] * sy))); }, 256, 2);
export function finalActorBitmap(file, width, height, box) { if (!finalActorCache.get(file, width, height))
    return undefined; return finalActorFrameCache.get(JSON.stringify({ file, width, height, box }), width, height); }
