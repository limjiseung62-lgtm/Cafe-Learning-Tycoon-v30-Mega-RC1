/** A deadline rather than an elapsed-time threshold avoids 60/90/120Hz aliasing. Simulation is never paced here. */
export class MegaFramePacer {
    next = 0;
    period = 1000 / 60;
    reset() { this.next = 0; }
    accept(now) { if (this.next && now + .5 < this.next)
        return false; this.next = !this.next || now - this.next > this.period ? now + this.period : this.next + this.period; return true; }
}
