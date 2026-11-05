/** Bounded observation only: quantiles in 1ms bins, outliers retained in max. */
export class FrameHistogram {
    bins = new Uint32Array(2001);
    count = 0;
    total = 0;
    max = 0;
    overflow = 0;
    add(ms) { if (!Number.isFinite(ms) || ms < 0)
        return; this.count++; this.total += ms; this.max = Math.max(this.max, ms); if (ms >= 2001)
        this.overflow++; this.bins[Math.min(2000, Math.floor(ms))]++; }
    quantile(p) { if (!this.count)
        return 0; const rank = Math.max(1, Math.ceil(this.count * Math.max(0, Math.min(1, p)))); let n = 0; for (let i = 0; i < this.bins.length; i++) {
        n += this.bins[i];
        if (n >= rank)
            return i;
    } return 2000; }
    get fps() { return this.count * 1000 / (this.total || 1); }
}
