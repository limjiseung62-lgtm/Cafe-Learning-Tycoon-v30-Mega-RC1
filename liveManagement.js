import { supplyLayoutChangeError } from './finalSupply.js?v=mega-5d509fb5dbfc';
import { validInteriorSale } from './interiorCommerce.js?v=mega-5d509fb5dbfc';
import { longStateFor } from './longGrowthUi.js?v=mega-5d509fb5dbfc';
import { createLongGrowth } from './longGrowth.js?v=mega-5d509fb5dbfc';
import { inventorySku } from './megaInventory.js?v=mega-5d509fb5dbfc';
import { guestPose } from './spatial.js?v=mega-5d509fb5dbfc';
import { createMegaSpace, ensureMegaPlan, megaPointClear, megaRoute } from './megaSpace.js?v=mega-5d509fb5dbfc';
export let liveManagementOpen = false;
const managementVersion = (s) => { const m = structuredClone(s.mega); if (m?.finalGrowth) {
    delete m.finalGrowth.supply;
    delete m.finalGrowth.payroll;
} return JSON.stringify([s.money, m, s.cafeLevel]); };
const projection = (s) => { const p = structuredClone(s); delete p.campaign; return p; };
export function liveManagementRepository(g, c) {
    return { read: () => ({ status: 'ready', save: projection(c.current()) }), replace: () => ({ ok: false, message: '영업 중에는 카페를 교체할 수 없어요.' }), write: (next, expected) => {
            const current = projection(c.current()), fail = (message) => ({ ok: false, message });
            if (g.mode !== 'CAFE_GROWTH' || g.status !== 'RUNNING')
                return fail('영업 상태가 바뀌었어요. 카페로 돌아가 확인해 주세요.');
            const run = c.current().campaign?.run;
            if (run && Date.now() >= run.endAt)
                return fail('영업 종료 시각이 되었어요. 먼저 결과를 확인해 주세요.');
            if (!expected || managementVersion(current) !== managementVersion(expected))
                return fail('카페가 변경됐어요. 관리 화면을 다시 열어 주세요.');
            if (!next.mega || next.cafeLevel !== g.cafeLevel || next.money > g.money && !validInteriorSale(current, next) || next.money < 0)
                return fail('구매 정보를 확인해 주세요.');
            const proposed = structuredClone(next.mega), plan = ensureMegaPlan(proposed, g.cafeLevel, g.branchId), space = createMegaSpace(plan, proposed.finalGrowth ? g.staffLimit + 1 : undefined), oldSpace = g.serviceSpace;
            if (proposed.finalGrowth && g.mega?.finalGrowth?.supply)
                proposed.finalGrowth.supply = structuredClone(g.mega.finalGrowth.supply);
            if (proposed.finalGrowth && g.mega?.finalGrowth?.payroll)
                proposed.finalGrowth.payroll = structuredClone(g.mega.finalGrowth.payroll);
            if (proposed.finalGrowth && space.staffWaitingPoints.length < g.service.workers.length)
                return fail('직원들이 안전하게 기다릴 통로와 공간을 남겨 주세요.');
            const supplyError = supplyLayoutChangeError(g, plan);
            if (supplyError)
                return fail(supplyError);
            const indices = [];
            for (const guest of g.guests) {
                const old = oldSpace?.seats[guest.seat], index = space.seats.findIndex(s => s.seatId === old?.seatId), seat = space.seats[index];
                if (!old || !seat || JSON.stringify([old.x, old.y, old.facing, old.servicePoint]) !== JSON.stringify([seat.x, seat.y, seat.facing, seat.servicePoint]))
                    return fail('손님이 사용하는 테이블·의자는 퇴장 후 옮겨 주세요.');
                if (['ENTERING', 'MOVING_TO_SEAT', 'LEAVING'].includes(guest.state)) {
                    const a = guestPose(guest, oldSpace), b = guestPose({ ...guest, seat: index }, space);
                    if (Math.hypot(a.x - b.x, a.y - b.y) > .1)
                        return fail('손님이 입구와 통로를 이동 중이에요. 잠시 뒤 다시 시도해 주세요. 결제하지 않았어요.');
                }
                indices.push(index);
            }
            for (const w of g.service.workers) {
                if (!megaPointClear(plan, w.position))
                    return fail('직원이 서 있는 곳은 비워 주세요.');
                try {
                    for (const p of space.pickupSlots)
                        megaRoute(plan, w.position, p);
                    if (w.orderId !== null) {
                        const guest = g.guests.find(v => v.id === w.orderId);
                        if (guest)
                            megaRoute(plan, w.position, space.seats[indices[g.guests.indexOf(guest)]].servicePoint);
                    }
                }
                catch {
                    return fail('직원의 주방·좌석 이동 경로를 막는 배치예요.');
                }
            }
            const oldMoney = g.money, oldMega = g.mega, oldSeats = g.guests.map(v => v.seat), oldBaseLong = c.base.longTerm ? structuredClone(c.base.longTerm) : undefined, liveLong = longStateFor(g), oldOwned = liveLong?.owned.slice();
            // The runtime's long-growth state enriches every save. Merge only inventory-backed
            // decoration ownership; replacing the whole snapshot would lose live visitor/mission progress.
            const target = liveLong ?? (c.base.longTerm ??= createLongGrowth());
            target.owned = [...new Set([...target.owned, ...(proposed.inventory?.items ?? []).filter(i => inventorySku(i.sku)?.type === 'decor').map(i => i.sku.slice(6))])];
            g.money = next.money;
            g.mega = proposed;
            g.guests.forEach((v, i) => v.seat = indices[i]);
            g.updateServiceLayout();
            const result = c.save();
            if (!result.ok) {
                g.money = oldMoney;
                g.mega = oldMega;
                c.base.longTerm = oldBaseLong;
                if (liveLong && oldOwned)
                    liveLong.owned = oldOwned;
                g.guests.forEach((v, i) => v.seat = oldSeats[i]);
                g.updateServiceLayout();
            }
            return result;
        } };
}
export function setLiveManagementOpen(value) { liveManagementOpen = value; }
