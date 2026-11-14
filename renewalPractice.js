import { recruitById } from './recruitConfig.js';
import { recruitCost } from './staffRecruitment.js';
import { appearanceQuote } from './renewalAppearance.js';
import { expansionQuote } from './megaExpansion.js';
import { inventorySku } from './megaInventory.js';
import { finalSpecializationOffers } from './finalSpecializationState.js';
import { prepareRenewalDoor } from './renewalFacilities.js';
import { completeManagerConstruction, selectManager } from './managerState.js';
import { LocalSaveRepository } from './saveRepository.js';
import { commitAppearance } from './renewalAppearance.js';
import { createRenewalGrowthSave } from './renewalMigration.js';
import { createGrowthSession } from './sessionFactory.js';
import { captureGrowth } from './growthSession.js';
import { prepareExpansion } from './megaExpansion.js';
import { openRecruitment, hireCandidate } from './staffRecruitment.js';
import { buyInterior, saveInteriorLayout } from './megaShop.js';
import { ensureMegaPlan, megaDimensions } from './megaSpace.js';
import { chooseFinalSpecialization } from './finalSpecialization.js';
import { configureFinalSupply } from './finalSupply.js';
import { operatingSeatContract } from './finalGrowth.js';
import { foundEnterprise } from './enterpriseState.js';
/** Entirely in-memory lesson. No repository, storage, real learning ledger, or download writes. */
export class RenewalPractice {
    level;
    save;
    game;
    done = false;
    constructor(level) {
        this.level = level;
        const initial = createRenewalGrowthSave(), g = createGrowthSession(initial, () => 0);
        g.money = 1e9;
        while (g.cafeLevel < (level === 1 ? 1 : Math.max(3, level)))
            g.expandCafe();
        this.save = captureGrowth(g, initial);
        const target = level >= 30 ? 30 : level >= 20 ? 20 : level >= 9 ? 10 : level === 5 ? 1 : 4;
        while ((this.save.mega.paid.spaceLevel) < target) {
            const r = prepareExpansion(this.save, this.save.mega.paid.spaceLevel);
            if (!r.ok)
                break;
            this.save = r.save;
        }
        this.save.money = 1000000;
        this.game = createGrowthSession(this.save, () => 0);
    }
    summary() { const g = this.game, p = g.serviceSpace?.megaPlan; return '연습 Lv.' + g.cafeLevel + ' · ' + megaDimensions[this.save.mega.paid.spaceLevel - 1].join('×') + ' · ' + g.money.toLocaleString() + '원 · 직원 ' + g.service.paid.length + '명 · 좌석 ' + operatingSeatContract(g).operating + ' · 서빙대 ' + (p?.fixtures?.length ?? 0) + '개'; }
    reload() { this.game = createGrowthSession(this.save, () => 0); }
    options() { if (this.level !== 3)
        return []; openRecruitment(this.save); return (this.save.roster?.offer?.ids ?? []).map(id => ({ id, name: recruitById(id).name })); }
    quote(choice = "mass") { return this.level === 3 ? recruitCost(this.save, choice) ?? 0 : this.level === 5 ? expansionQuote(this.save).next?.cost ?? 0 : this.level === 6 ? appearanceQuote(this.save, "wall:brick").cost : this.level === 11 ? finalSpecializationOffers[choice === "brand" ? "brand" : "mass"].cost : this.level === 13 ? inventorySku("service-prep").cost : this.level === 16 ? 75000 : 0; }
    hire(preferred) { if (this.save.roster?.owned.length)
        return true; if (!openRecruitment(this.save))
        return false; const id = preferred ?? this.save.roster.offer.ids[0]; if (!hireCandidate(this.save, id))
        return false; this.reload(); return true; }
    act(choice = 'mass', point) {
        if (this.done)
            return '이미 마친 연습이에요.';
        const g = this.game;
        let message = '';
        switch (this.level) {
            case 3:
                if (!this.hire(choice === 'mass' ? undefined : choice))
                    throw Error('연습 지원자를 준비하지 못했어요.');
                message = '실제 채용 절차로 직원 ' + this.save.staffOwned[0] + '을 고용했어요.';
                break;
            case 5: {
                const r = prepareExpansion(this.save, 1);
                if (!r.ok)
                    throw Error(r.reason);
                this.save = r.save;
                this.reload();
                message = '연습 비용 100,000원을 지불하고 8×6 → 12×10이 됐어요.';
                break;
            }
            case 6: {
                const data = new Map(), repo = new LocalSaveRepository({ getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } });
                if (!repo.replace(this.save, true).ok)
                    throw Error('연습 상태 검증 실패');
                const result = commitAppearance(repo, this.save, 'wall:brick');
                if (!result.ok)
                    throw Error(result.message);
                const read = repo.read();
                if (read.status !== 'ready')
                    throw Error('연습 외관 검증 실패');
                this.save = read.save;
                this.reload();
                message = '실제 외관 거래를 연습했어요. 벽돌 외벽을 구매·적용했어요.';
                break;
            }
            case 9: {
                if (!this.hire())
                    throw Error('직원 준비 실패');
                const r = this.game.upgradeStaff(this.game.service.paid[0].staffId);
                if (!r.ok)
                    throw Error(r.reason);
                message = '실제 교육으로 연습 직원 Lv.' + this.game.service.paid[0].level + ' · 트레이 ' + this.game.service.paid[0].carryCapacity + '개';
                break;
            }
            case 11: {
                const r = chooseFinalSpecialization(g, choice === 'brand' ? 'brand' : 'mass');
                if (!r.ok)
                    throw Error(r.reason);
                message = '선택한 전문화 적용 · 메뉴별 생산 ' + g.productionAmount + '개 · 메뉴 ' + g.menus.length + '종';
                break;
            }
            case 13: {
                const bought = buyInterior(this.save, 'service-prep', this.save.mega.inventory.next);
                if (!bought.ok)
                    throw Error(bought.reason);
                const p = structuredClone(ensureMegaPlan(bought.save.mega, bought.save.cafeLevel)), id = bought.save.mega.inventory.receipts.at(-1).items[0];
                if (!point)
                    throw Error('연습 바닥에서 설치할 칸을 선택해요.');
                p.fixtures ??= [];
                p.fixtures.push({ id, sku: 'service-prep', ...point, rotation: 0 });
                const r = saveInteriorLayout(bought.save, p);
                if (!r.ok)
                    throw Error(r.reason);
                this.save = r.save;
                this.reload();
                configureFinalSupply(this.game);
                message = '실제 통로 검사 통과 · 보조 서빙대 설치와 공급 지점을 등록했어요.';
                break;
            }
            case 14:
            case 23: {
                if (!this.hire())
                    throw Error('직원 준비 실패');
                const w = this.game.service.paid[0], role = this.level === 23 ? 'zone-manager' : 'floor';
                this.game.mega.finalGrowth.crew ??= {};
                this.game.mega.finalGrowth.crew[w.staffId] = { role, zone: 'all', home: { ...w.position }, locked: true };
                configureFinalSupply(this.game);
                message = w.name + '에게 ' + (this.level === 23 ? '구역 책임자' : '홀 담당') + ' 역할과 대기 위치를 지정했어요.';
                break;
            }
            case 16: {
                const p = ensureMegaPlan(this.save.mega, this.save.cafeLevel), count = p.doors?.length ?? 1;
                const r = prepareRenewalDoor(this.save, count, 'south', point?.x ?? 10);
                if (!r.ok)
                    throw Error(r.reason);
                this.save = r.save;
                this.reload();
                message = '실제 75,000원 거래와 통로 검사를 거쳐 출입구를 추가했어요.';
                break;
            }
            case 20: {
                const before = g.menus[0].stock;
                g.recordAnswer(true, 1, 1);
                g.tick(60);
                message = '연습 정답 1회 → 생산 ' + g.productionAmount + '개 · ' + Math.round(g.elapsedTime) + '초 실제 주문 시뮬레이션 · 재고 ' + before + ' → ' + g.menus[0].stock;
                break;
            }
            case 30: {
                completeManagerConstruction(this.save.mega, Date.now(), true);
                selectManager(this.save.mega, 'yuna');
                if (!foundEnterprise(this.save, '연습 카페 기업', 'neighborhood'))
                    throw Error('본부 설립 조건을 확인해요.');
                this.reload();
                message = '연습 기업 본부가 설립됐어요. 실제 기업 자금과 분점에는 영향이 없어요.';
                break;
            }
            default: throw Error('문제풀이 연습은 승인 문제에서 진행해요.');
        }
        this.done = true;
        return message;
    }
}
