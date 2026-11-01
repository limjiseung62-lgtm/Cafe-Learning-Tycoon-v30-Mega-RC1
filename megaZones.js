/** Named floor regions share the real grid and route graph; no invisible walls or fake actors. */
export function megaZones(p) {
    if (p.level < 20)
        return [];
    if (p.level < 30)
        return [
            { id: 'main', name: '메인 홀', x: 2, y: 2, w: 20, h: 14, color: '#e4c19a' },
            { id: 'bakery', name: '베이커리·주방', x: 24, y: 2, w: 14, h: 10, color: '#c4baa0' },
            { id: 'dessert', name: '디저트 살롱', x: 24, y: 14, w: 14, h: 14, color: '#dbb6ad' },
            { id: 'terrace', name: '정원 테라스', x: 2, y: 18, w: 20, h: 10, color: '#b8c397' }
        ];
    return [
        { id: 'main', name: '메인 홀', x: 2, y: 2, w: 26, h: 19, color: '#e4c19a' },
        { id: 'kitchen', name: '대형 주방·베이커리', x: 32, y: 2, w: 28, h: 12, color: '#c4baa0' },
        { id: 'dessert', name: '디저트 살롱', x: 32, y: 18, w: 16, h: 12, color: '#dbb6ad' },
        { id: 'vip', name: 'VIP 라운지', x: 51, y: 18, w: 11, h: 12, color: '#d0b8c5' },
        { id: 'garden', name: '정원 테라스', x: 2, y: 25, w: 26, h: 20, color: '#b8c397' },
        { id: 'event', name: '행사 홀', x: 32, y: 34, w: 30, h: 12, color: '#dac29a' }
    ];
}
