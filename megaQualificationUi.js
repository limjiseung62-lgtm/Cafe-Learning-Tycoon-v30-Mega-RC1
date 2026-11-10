import { megaDimensions } from './megaSpace.js?v=mega-5d509fb5dbfc';
/** Qualification must never index the legacy fifteen-level room catalog or promise an automatic paid-floor expansion. */
export function megaQualificationNotice(g) { if (!g.mega?.extended || g.mode !== 'CAFE_GROWTH')
    return null; const level = g.mega.paid?.spaceLevel ?? 1, [w, h] = megaDimensions[level - 1], space = g.serviceSpace; return { level, width: w, height: h, area: w * h, tables: space?.tables.length ?? 0, seats: space?.seats.length ?? 0, label: '현재 결제한 매장 ' + w + '×' + h + ' · ' + w * h + '칸 · 실제 ' + (space?.seats.length ?? 0) + '좌석. 성장 단계는 증축 자격이며 바닥·가구가 자동으로 늘어나지 않아요. 영업을 마친 뒤 매장 증축에서 별도 비용을 확인하고 선택해요.' }; }
