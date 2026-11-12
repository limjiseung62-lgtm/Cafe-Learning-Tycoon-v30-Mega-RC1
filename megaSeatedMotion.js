import { iso } from './megaSpace.js?v=v31-5d872fe24674';
/** Presentation only: face the actual table, never the last walking direction. */
export function seatedDirection(chair, table) {
    const dx = table.x - chair.x, dy = table.y - chair.y;
    return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'SE' : 'NW' : dy > 0 ? 'SW' : 'NE';
}
export function eatingPose(seconds, id, reduced = false) {
    const t = reduced ? 0 : ((seconds + id * .137) % 2.4) / 2.4;
    const bite = reduced ? 0 : Math.sin(Math.PI * Math.min(1, Math.max(0, (t - .12) / .65)));
    return { bite, lean: reduced ? 0 : Math.sin(t * Math.PI * 2) * .45 };
}
/** Separate seated hand/utensil rig, not a walking frame or a simulation state mutation. */
export function paintEatingMotion(c, chair, table, seconds, id, reduced) {
    const pose = eatingPose(seconds, id, reduced), target = iso(table), sign = target.x < chair.x ? -1 : 1;
    c.save();
    c.translate(chair.x, chair.y);
    c.lineCap = 'round';
    const x = sign * (8 - 4 * pose.bite), y = -8 - 7 * pose.bite;
    c.strokeStyle = '#705348';
    c.lineWidth = 2.3;
    c.beginPath();
    c.moveTo(sign * 5, -6);
    c.lineTo(x, y);
    c.stroke();
    c.fillStyle = '#eac5a3';
    c.beginPath();
    c.ellipse(x, y, 1.7, 1.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#d9ded8';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + sign * 3, y - 3);
    c.stroke();
    c.fillStyle = '#eec181';
    c.beginPath();
    c.ellipse(x + sign * 3, y - 3, 1.6, .9, -sign * .4, 0, Math.PI * 2);
    c.fill();
    c.restore();
}
