/** GROWTH-only demand policy. Staff, money and stock never gate admission.
 * Occupancy is actual seated lifecycle, not painted actors or reserved entrances.
 * Low/high are soft targets: all available physical seats may still be occupied.
 */
export const seatedGuestStates = new Set(['ORDERING', 'WAITING_FOR_FOOD', 'PREPARING', 'SERVING', 'EATING', 'PAYING']);
export const waitingGuestStates = new Set(['WAITING_FOR_FOOD', 'PREPARING', 'SERVING']);
export const growthArrivalPolicy = { version: 1, target: .70, lateTarget: .60, low: .60, high: .80, minSeconds: .5, maxSeconds: 12 };
export const growthTarget = (seats) => seats > 30 ? growthArrivalPolicy.lateTarget : growthArrivalPolicy.target;
export function growthArrivalInterval(operatingSeats, seated) {
    if (!Number.isFinite(operatingSeats) || operatingSeats <= 0)
        return 4;
    const seats = Math.max(1, Math.min(100, Math.floor(operatingSeats))), occupied = Math.max(0, Number.isFinite(seated) ? seated : 0);
    const base = Math.max(growthArrivalPolicy.minSeconds, Math.min(4, 48 / Math.min(80, seats)));
    const pressure = Math.max(.6, Math.min(16, Math.exp(30 * (occupied / seats - growthTarget(seats)))));
    return Math.max(growthArrivalPolicy.minSeconds, Math.min(growthArrivalPolicy.maxSeconds, base * pressure));
}
