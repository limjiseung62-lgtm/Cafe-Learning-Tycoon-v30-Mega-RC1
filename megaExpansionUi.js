import { finishManagerConstructionInRepository } from './managerUi.js?v=mega-d152ad969955';
import { megaLateForecast } from './megaLateForecast.js?v=mega-d152ad969955';
import { adoptInterior, isShopDeployment } from './megaInventory.js?v=mega-d152ad969955';
import { environmentPlacements, paintEnvironment } from './megaArt.js?v=mega-d152ad969955';
import { expansionForecast } from './megaExpansionForecast.js?v=mega-d152ad969955';
import { AudioManager } from './audioManager.js?v=mega-d152ad969955';
import { deploymentLocalStorage } from './deploymentStorage.js?v=mega-d152ad969955';
import { adoptPaidSpace, expansionQuote, prepareExpansion } from './megaExpansion.js?v=mega-d152ad969955';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=mega-d152ad969955';
import { paintMegaFloor, paintMegaTable, paintMegaChair } from './megaView.js?v=mega-d152ad969955';
import { ensureMegaPlan, megaDimensions, megaChairs, iso } from './megaSpace.js?v=mega-d152ad969955';
export function expansionAction(container, repo, source, refresh) {
    if (!source.mega || !document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content')?.match(/^v30[cde]-/))
        return;
    const button = document.createElement('button');
    button.textContent = '매장 증축 · 면적과 비용 비교';
    button.className = 'mega-expansion-entry';
    button.onclick = () => {
        const read = repo.read();
        if (read.status !== 'ready')
            return;
        const persisted = read.save, original = adoptPaidSpace(isShopDeployment() ? adoptInterior(persisted) : persisted), q = expansionQuote(original), next = q.next, warehouse = original.warehouseLevel >= 3 ? 3 : 1, strength = warehouse === 3 && original.staffOwned.length > 0 && original.staffOwned.every(id => (original.staffLevels[id] ?? 1) >= 3) ? 3 : 1, forecast = expansionForecast.find(f => f.to === next?.level && f.crew === original.staffOwned.length && f.warehouse === warehouse && f.strength === strength), late = original.mega?.extended ? megaLateForecast.find(f => f.to === next?.level) : undefined, projection = late ? '가구 완비·직원' + late.fromCrew + '→' + late.toCrew + '명 · 느림/평균/빠름 3시드 총' + late.n + '쌍 비교. 15분 추가 현금 ' + late.min.toLocaleString() + '~' + late.max.toLocaleString() + '원 (중앙값 ' + late.median.toLocaleString() + '원). 증축·추가 가구·직원·강화 ' + late.totalCapital.toLocaleString() + '원 기준 단순 회수 약' + late.payback.toFixed(1) + '회. 자격 레벨 비용은 별도이며 빈 증축만으로 이 수익이 생기지 않아요.' : original.mega?.inventory ? '증축만으로 좌석이나 메뉴가 늘지는 않아요. 추가 가구 구매·배치 후 실제 이용량에 따라 달라져요. Phase1D 경제 비교 보고서를 함께 확인해 주세요.' : forecast ? 'Lv.10 · 창고' + warehouse + ' · 직원강화' + strength + ' 대조 실험 ' + forecast.n + '회 · 15분 현금 증가 차이 ' + forecast.min.toLocaleString() + '~' + forecast.max.toLocaleString() + '원 · 중앙값 ' + forecast.median.toLocaleString() + '원 · 투자 회수 ' + (forecast.payback ? forecast.payback.toFixed(1) + '회 예상' : '추정 불가(순증 현금 음수)') : '현재 직원 수의 비교 표본이 없어요.', dialog = document.createElement('dialog');
        dialog.className = 'mega-expansion';
        dialog.style.cssText = 'max-width:900px;width:calc(100% - 40px);max-height:90vh;overflow:auto;border-radius:18px;background:#fff9ec;color:#354737;word-break:keep-all;overflow-wrap:anywhere';
        dialog.innerHTML = '<h2>내 카페를 더 넓게!</h2><p>레벨은 증축 자격이에요. 원할 때만 돈을 내고 넓힐 수 있어요.</p><p>현재 ' + q.size.join('×') + ' · ' + q.size[0] * q.size[1] + '칸 → ' + (next ? next.size.join('×') + ' · ' + next.size[0] * next.size[1] + '칸' : '현재 최대 공간') + '</p><p>필요 레벨 ' + (next?.requiredLevel ?? '-') + ' · 비용 ' + (next?.cost ?? 0).toLocaleString() + '원 · 보유 ' + original.money.toLocaleString() + '원 · 부족 ' + q.shortage.toLocaleString() + '원</p><p>' + (original.mega?.inventory ? (next?.level === 4 ? '최대 8좌석 배치 가능 · 자동 추가 가구 0개' : next?.level === 10 ? '최대 14좌석 배치 가능 · 자동 추가 가구 0개' : next?.level === 20 ? '최대48좌석 · 구역별 홀·테라스 · 자동 추가 가구0개' : next?.level === 30 ? '최대96좌석 · 복합 홀·정원·행사 공간 · 자동 추가 가구0개' : '현재 최대 매장') : next?.level === 4 ? '최대 8좌석과 두 번째 주방 구역' : next?.level === 10 ? '최대 14좌석과 넓은 홀' : '향후 확장 설계 · 실제 운영 미구현') + ' · 좌석과 통로를 활용해야 매출이 생겨요.</p><p>' + (original.mega?.extended && next && next.level >= 20 ? (next.level >= 30 ? '4개 이상 구역·32석' : '2개 이상 구역·12석') + '에 좌석과 준비대를 갖추면 해당 구역 일반 주문 운영가 +' + (next.level >= 30 ? '18' : '8') + '%. 빈 증축·미가동 구역·특별 행사 고정 보상에는 적용하지 않아요.' : '') + '</p><p>예상 매출·회수 기간: ' + projection + '<br>학습 속도·재고·배치에 따라 수익이 줄 수도 있어요. 창고와 직원 강화도 함께 확인해요. 개인 수익을 보장하는 수치가 아니에요.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><canvas width="400" height="300" aria-label="현재 매장 조감도"></canvas><canvas width="400" height="300" aria-label="증축 후 미리보기"></canvas></div><p role="status">' + (q.active ? '영업을 마친 뒤 증축할 수 있어요.' : next && next.level > (original.mega?.extended ? 30 : 10) ? '이후 공간은 설계 미리보기예요. 이번 버전에서는 증축할 수 없어요.' : q.shortage ? '부족한 금액을 모아 주세요.' : '조건이 되면 아래에서 비용을 확인하고 선택해요.') + '</p><button data-confirm ' + (!q.eligible || q.shortage ? 'disabled' : '') + '>비용 확인 · 증축 결제</button> <button data-close>닫기</button>';
        for (const b of dialog.querySelectorAll('button'))
            b.style.cssText = 'min-height:44px;padding:10px;margin:4px;font:inherit';
        for (const c of dialog.querySelectorAll('canvas'))
            c.style.cssText = 'width:min(100%,400px);height:auto';
        document.body.append(dialog);
        dialog.showModal();
        const preview = adoptPaidSpace(original), before = ensureMegaPlan(preview.mega, original.cafeLevel, original.growthBranch?.active ?? undefined), result = prepareExpansion({ ...original, cafeLevel: Math.max(original.cafeLevel, next?.requiredLevel ?? 1), money: Math.max(original.money, next?.cost ?? 0), campaign: undefined }, q.level), after = result.ok ? ensureMegaPlan(result.save.mega, original.cafeLevel, original.growthBranch?.active ?? undefined) : before;
        for (const [c, p] of [...dialog.querySelectorAll('canvas')].map((c, i) => [c, i ? after : before])) {
            const ctx = c.getContext('2d');
            if (c === dialog.querySelectorAll('canvas')[1] && next && next.level > (original.mega?.extended ? 30 : 10)) {
                ctx.fillStyle = '#e9e3cd';
                ctx.fillRect(20, 40, 360, 220);
                ctx.fillStyle = '#425a43';
                ctx.font = '18px system-ui';
                ctx.fillText(next.size.join('×') + ' 규모 설계 예고', 40, 110);
                ctx.font = '14px system-ui';
                ctx.fillText('실제 바닥·운영은 미구현', 40, 150);
                continue;
            }
            const [w, h] = megaDimensions[p.level - 1], scale = Math.min(360 / ((w + h) * 24 + 80), 230 / ((w + h) * 12 + 100));
            ctx.translate(200 - (w - h) * 12 * scale, 85);
            ctx.scale(scale, scale);
            paintMegaFloor(ctx, p);
            for (const env of environmentPlacements(p)) {
                const q = iso(env);
                paintEnvironment(ctx, env.id, q.x, q.y, env.width, env.baseRise, env.flip);
            }
            for (const t of p.tables) {
                for (const ch of megaChairs(t))
                    paintMegaChair(ctx, t, { ...ch.chair, rear: ch.rear });
                paintMegaTable(ctx, t);
            }
        }
        let committed = false;
        const exit = () => { dialog.remove(); if (committed)
            refresh(); };
        dialog.querySelector('[data-close]').addEventListener('click', exit);
        dialog.addEventListener('cancel', e => { e.preventDefault(); exit(); });
        let busy = false;
        dialog.querySelector('[data-confirm]').onclick = async () => { if (busy)
            return; busy = true; if (!await ensureGrowthWriteLock()) {
            busy = false;
            dialog.querySelector('[role=status]').textContent = '다른 창의 저장을 보호하고 있어요.';
            return;
        } const checked = prepareExpansion(original, q.level); if (!checked.ok) {
            busy = false;
            dialog.querySelector('[role=status]').textContent = checked.reason;
            return;
        } const written = repo.write(checked.save, persisted); if (!written.ok) {
            busy = false;
            dialog.querySelector('[role=status]').textContent = written.message;
            return;
        } committed = true; const audio = new AudioManager(deploymentLocalStorage); void audio.unlock().then(() => audio.effect('purchase')); const status = dialog.querySelector('[role=status]'); status.textContent = '공사 시작! 새 공간을 준비하고 있어요.'; const construction = document.createElement('progress'); construction.max = 3; construction.value = 1; construction.setAttribute('aria-label', '증축 공사 진행'); dialog.append(construction); const preview = dialog.querySelectorAll('canvas')[1]; preview.style.opacity = '.25'; preview.style.transition = 'opacity 2s ease,transform 2s ease'; preview.style.transform = 'scale(.92)'; setTimeout(() => { if (dialog.isConnected) {
            construction.value = 2;
            status.textContent = '공사 중 · 바닥과 벽을 넓히고 있어요.';
            preview.style.opacity = '.65';
        } }, 1800); setTimeout(() => { if (dialog.isConnected) {
            finishManagerConstructionInRepository(repo);
            construction.value = 3;
            status.textContent = '새 공간 공개! 기존 가구는 그대로예요. 원하는 공간으로 꾸며 보세요.';
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
            void audio.effect('levelup');
        } }, 3800); dialog.querySelector('[data-confirm]').disabled = true; const skip = document.createElement('button'); skip.textContent = '완공 보기 · 연출 건너뛰기'; skip.style.minHeight = '44px'; skip.onclick = () => { finishManagerConstructionInRepository(repo); dialog.remove(); refresh(); }; dialog.append(skip); setTimeout(() => { if (dialog.isConnected) {
            dialog.remove();
            refresh();
        } }, 6000); };
    };
    container.append(button);
}
