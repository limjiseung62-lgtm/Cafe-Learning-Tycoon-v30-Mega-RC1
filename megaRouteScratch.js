/** Reusable scratch buffers for synchronous dynamic route searches. No routes or occupancy survive reset. */
export class MegaRouteScratch {
    size;
    blocked;
    parent;
    score;
    ids;
    priorities;
    length = 0;
    constructor(size) {
        this.size = size;
        this.blocked = new Uint8Array(size);
        this.parent = new Int32Array(size);
        this.score = new Float64Array(size);
        this.ids = new Int32Array(Math.min(1024, size));
        this.priorities = new Float64Array(this.ids.length);
    }
    reset() { this.blocked.fill(0); this.parent.fill(-1); this.score.fill(Infinity); this.length = 0; return this; }
    push(id, priority) { if (this.length === this.ids.length) {
        const n = Math.min(this.size * 4, Math.max(1, this.length * 2));
        if (n <= this.length)
            throw Error('Route search heap capacity exceeded');
        const ids = new Int32Array(n), priorities = new Float64Array(n);
        ids.set(this.ids);
        priorities.set(this.priorities);
        this.ids = ids;
        this.priorities = priorities;
    } let i = this.length++; while (i) {
        const j = (i - 1) >> 1;
        if (this.priorities[j] <= priority)
            break;
        this.ids[i] = this.ids[j];
        this.priorities[i] = this.priorities[j];
        i = j;
    } this.ids[i] = id; this.priorities[i] = priority; }
    pop() { const id = this.ids[0], priority = this.priorities[0], lastId = this.ids[--this.length], lastPriority = this.priorities[this.length]; if (this.length) {
        let i = 0;
        while (i * 2 + 1 < this.length) {
            let c = i * 2 + 1;
            if (c + 1 < this.length && this.priorities[c + 1] < this.priorities[c])
                c++;
            if (this.priorities[c] >= lastPriority)
                break;
            this.ids[i] = this.ids[c];
            this.priorities[i] = this.priorities[c];
            i = c;
        }
        this.ids[i] = lastId;
        this.priorities[i] = lastPriority;
    } return { id, priority }; }
    get bytes() { return this.blocked.byteLength + this.parent.byteLength + this.score.byteLength + this.ids.byteLength + this.priorities.byteLength; }
}
