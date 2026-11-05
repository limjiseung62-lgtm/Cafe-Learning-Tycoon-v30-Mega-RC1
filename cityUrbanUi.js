// @ts-nocheck
import { FrameHistogram } from './frameHistogram.js?v=stability-97670d28ea8d';
import { ArtCache, CityView } from './cityAnalyticsCanvas.js?v=stability-97670d28ea8d';
import { assets, byId, setSheets } from './cityBuildingCatalog.js?v=stability-97670d28ea8d';
import { indicatorMeta } from './cityIndicatorModel.js?v=stability-97670d28ea8d';
import { urbanNextGoal, urbanInvestmentNotes, urbanImpact, urbanCityView, adoptUrbanCity, urbanBuildQuote, urbanTransaction, urbanAdvice, urbanRoadCosts, analyze, districts, urbanBranchFactor } from './cityUrbanEconomy.js?v=stability-97670d28ea8d';
import { modernCityFor, cityRegions, publicSites } from './modernCity.js?v=stability-97670d28ea8d';
import { branchYield, branchRequirement, progressiveEconomyConfig } from './progressiveEconomy.js?v=stability-97670d28ea8d';
import { exportGrowth } from './growthBackup.js?v=stability-97670d28ea8d';
import { wrapCommonBackup } from './commonBackup.js?v=stability-97670d28ea8d';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=stability-97670d28ea8d';
import { escapeText as esc } from './questionRenderer.js?v=stability-97670d28ea8d';
const num = n => Math.round(n).toLocaleString(), keys = Object.keys(indicatorMeta);
let cachePromise;
async function art() { if (!cachePromise)
    cachePromise = (async () => { const meta = await fetch('assets/city-urban/sheets.json').then(r => { if (!r.ok)
        throw Error('도시 아트 목록을 불러오지 못했어요.'); return r.json(); }); setSheets(meta); return new ArtCache(meta); })(); return cachePromise; }
const table = (heads, rows) => '<div class="urban-scroll"><table><tr>' + heads.map(x => '<th>' + x + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(x => '<td>' + x + '</td>').join('') + '</tr>').join('') + '</table></div>';
export async function openUrbanCity(repo, onClose, { readOnly = false } = {}) {
    if (!readOnly && !await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' || read.save.mode !== 'CAFE_GROWTH' || read.save.v26?.enterprise?.status !== 'founded')
        return;
    let base = read.save, selected = null, pending = null, busy = false, viewer, closed = false, selectionVersion = 0, message = '빈 부지나 건물을 선택해 우리 도시를 계획해요.', analysis = '', dashboard = false;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'city-urban.css';
    if (!document.querySelector('link[href="city-urban.css"]'))
        document.head.append(link);
    const box = document.createElement('section');
    box.className = 'urban-city';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '현대 도시 실제 경영');
    box.innerHTML = `<header><button data-close>본점으로</button><h2>${esc(base.v26.enterprise.name)}의 도시</h2><button data-hq>본부·분점</button><button data-backup>JSON 백업</button></header><div class="urban-metrics" data-metrics></div><section data-achievement class="urban-achievement" hidden></section><div class="urban-toolbar"><label>분석 <select data-analysis><option value="">건물 보기</option><option value="density">인구밀도</option><option value="traffic">교통</option><option value="economy">상권</option><option value="environment">환경</option><option value="attraction">문화·관광</option></select></label><button data-dashboard>지표·경영 대시보드</button><button data-fit>전체 보기</button><button data-plus aria-label="도시 확대">＋</button><button data-minus aria-label="도시 축소">−</button><label><input type="checkbox" data-brand-only>브랜드만</label></div><p data-legend></p><div class="urban-workspace"><div class="urban-map-pane"><canvas tabindex="0" aria-label="현대 도시 지도. 빈 부지·건물 선택, 드래그 이동, 휠 확대"></canvas><div data-brands class="urban-brands"></div><p data-message role="status"></p><div class="urban-options"><button data-expand>새 구역 개방</button><button data-road>도로·교통 투자</button><button data-measure>3분 카메라 성능 검사</button></div><details><summary>매니저 조언과 도시 지표 설명</summary><p data-advice></p><p>인구는 실제 저장된 건물·용도·설계 수용량에서 계산한 도시 추정치예요. 학교 기기 성능은 별도 검증이 필요해요.</p></details><details><summary>가시 화면 성능 측정</summary><output data-perf>측정 중</output></details></div><aside class="urban-panel" hidden><button data-panel-close>선택 정보 닫기</button><label>부지 목록 <select data-parcels></select></label><div data-info></div></aside></div>`;
    document.body.append(box);
    const $ = s => box.querySelector(s);
    const close = () => { if (closed)
        return; closed = true; cancelAnimationFrame(raf); viewer?.destroy(); document.removeEventListener('visibilitychange', visibility); box.remove(); onClose(); };
    let raf = 0, last = 0, frames = 0, elapsed = 0, maxFrame = 0, drawStats = new FrameHistogram(), startHeap = performance.memory?.usedJSHeapSize ?? null, frameStats = new FrameHistogram(), benchUntil = 0, benchCamera = null;
    const visibility = () => { last = 0; };
    document.addEventListener('visibilitychange', visibility);
    $('[data-close]').onclick = close;
    $('[data-panel-close]').onclick = () => { selected = null; pending = null; dashboard = false; viewer.preview = null; $('.urban-panel').hidden = true; viewer.selected = null; viewer.draw(); };
    $('[data-hq]').onclick = () => { close(); void import('./enterpriseUi.js?v=stability-97670d28ea8d').then(m => m.openEnterprise(repo, onClose)); };
    $('[data-backup]').onclick = () => { const a = document.createElement('a'), u = URL.createObjectURL(new Blob([wrapCommonBackup(exportGrowth(base))], { type: 'application/json' })); a.href = u; a.download = 'cafe-urban-city-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
    try {
        if (!readOnly && !base.campaign?.run?.closed && base.campaign?.run)
            readOnly = true;
        if (!readOnly && !base.v26.enterprise.modernCity?.urban) {
            const next = adoptUrbanCity(base), w = repo.write(next, base);
            if (!w.ok) {
                message = w.message;
                readOnly = true;
            }
            else
                base = next;
        }
        const cache = await art();
        if (closed)
            return;
        viewer = new CityView($('canvas'), cache, urbanCityView(base.v26), { onSelect: (id) => select(id), interactive: true });
        await viewer.setCity(urbanCityView(base.v26));
    }
    catch (error) {
        $('[data-message]').textContent = error instanceof Error ? error.message : '도시를 열지 못했어요. 기존 저장은 보존됐어요.';
        return;
    }
    function totals(v) { return v.branches.reduce((n, b) => n + branchYield(v, b), 0); }
    function applyAnalysis() { const data = analyze(viewer.city); viewer.analysis = analysis; viewer.analysisData = data; const values = Object.values(data.blocks).map(a => a[analysis]); viewer.range = analysis ? [Math.min(...values), Math.max(...values)] : [0, 100]; viewer.brandOnly = $('[data-brand-only]').checked; viewer.draw(); $('[data-legend]').innerHTML = analysis ? `${indicatorMeta[analysis].name} <span class="urban-gradient"></span> 낮음 ${num(viewer.range[0])} → 높음 ${num(viewer.range[1])} · 블록별 상대 범례` : '건물 또는 빈 부지를 누르세요. 환경 건물은 내 소유 자산이나 자동 임대 수익으로 집계하지 않아요.'; }
    async function refresh() { const camera = viewer ? { ...viewer.camera } : null, oldWidth = viewer?.city.width; await viewer.setCity(urbanCityView(base.v26)); viewer.brand = { ...viewer.city.brand }; viewer.selected = selected; if (camera && oldWidth === viewer.city.width)
        viewer.camera = camera; applyAnalysis(); const a = analyze(viewer.city).total, c = modernCityFor(base.v26); $('[data-metrics]').innerHTML = [['도시 인구', num(a.population) + '명'], ['인구밀도', num(a.density) + '명/㎢'], ['도시 만족도', num(a.satisfaction) + '/100'], ['기업 보유금', num(base.money) + '원']].map(([k, v]) => `<div>${k}<strong>${v}</strong></div>`).join(''); $('[data-message]').textContent = message; $('[data-advice]').textContent = urbanAdvice(base, base.mega?.manager?.selected); $('[data-parcels]').innerHTML = '<option value="">지도에서 선택</option>' + viewer.city.parcels.map(p => `<option value="${p.id}">${districts[p.district].name} · ${p.id}${p.vacant ? ' · 빈 부지' : ''}</option>`).join(''); $('[data-parcels]').value = selected ?? ''; $('[data-brands]').innerHTML = viewer.city.buildings.filter(b => b.brandLink).map(b => `<button data-focus="${b.id}">${b.brandLink.name} 보기</button>`).join(''); $('[data-brands]').querySelectorAll('button').forEach(b => b.onclick = () => viewer.focus(b.dataset.focus)); const next = cityRegions[c.region]; $('[data-expand]').textContent = next ? `${next.cols * next.rows}개 부지로 확장 · ${num(next.cost)}원` : '90개 부지 개방 완료'; $('[data-expand]').disabled = readOnly || !next; $('[data-road]').textContent = c.urban?.traffic >= 3 ? '교통3단계 완료' : `교통 ${(c.urban?.traffic ?? 0) + 1}단계 · ${num(urbanRoadCosts[c.urban?.traffic ?? 0])}원`; $('[data-road]').disabled = readOnly || (c.urban?.traffic ?? 0) >= 3; if (selected || dashboard)
        paintInfo(); }
    async function commit() { if (!pending || busy || readOnly)
        return; busy = true; const chosen = pending, impact = urbanImpact(base, pending.revision, pending.action); pending = null; const current = repo.read(); if (current.status !== 'ready' || JSON.stringify(current.save) !== JSON.stringify(base)) {
        message = '다른 창에서 저장이 변경됐어요. 도시를 다시 열어 주세요.';
        busy = false;
        paintInfo();
        return;
    } const r = urbanTransaction(base, chosen.revision, chosen.action); if (!r.ok) {
        message = r.reason;
        busy = false;
        paintInfo();
        return;
    } const w = repo.write(r.save, base); if (!w.ok) {
        message = w.message;
        busy = false;
        paintInfo();
        return;
    } base = r.save; viewer.preview = null; message = `${num(r.cost)}원 1회 결제·저장 완료. 건물과 지표가 갱신됐어요.`; await refresh(); busy = false; showAchievement(chosen, impact); const note = document.createElement('div'); note.className = 'urban-construction'; note.innerHTML = '<b>공사 중 → 새 공간 공개!</b><button>연출 건너뛰기</button>'; box.append(note); note.querySelector('button').onclick = () => note.remove(); setTimeout(() => note.remove(), 1400); }
    function showAchievement(chosen, impact) { if (!impact.ok)
        return; const h = $('[data-achievement]'), goal = urbanNextGoal(base), manager = { yuna: '유나: 투자 성과를 함께 확인해요!', hajun: '하준: 우리 동네와 손님이 반길 변화예요!', soi: '소이: 새 공간에 우리 브랜드의 색이 더해졌어요!' }[base.mega?.manager?.selected] ?? '투자 결과를 확인해요!'; h.hidden = false; h.innerHTML = '<h3>' + esc(chosen.label) + ' 완료!</h3><p>분점 순수익 ' + num(impact.beforeIncome) + ' → ' + num(impact.afterIncome) + '원/영업 · 변화 ' + num(impact.delta) + '원</p><p>' + esc(urbanInvestmentNotes(impact)) + '</p><p>' + esc(manager) + '</p>' + (goal ? '<p>다음 비교 목표: ' + esc(goal.label) + ' · ' + num(goal.cost) + '원 · 부족 ' + num(goal.shortfall) + '원. ' + esc(goal.reason) + '</p>' : '') + '<button data-fold-achievement>성과 안내 접기</button>'; h.querySelector('button').onclick = () => h.hidden = true; if (chosen.action.kind === 'build')
        viewer.focus(chosen.action.site + '/runtime'); }
    function pendingBlock(host) { if (!pending)
        return; const impact = urbanImpact(base, pending.revision, pending.action); const preview = impact.ok ? `<p>분점 순수익 ${num(impact.beforeIncome)} → ${num(impact.afterIncome)}원/영업 · 변화 ${num(impact.delta)}원</p><p>분점 증가분 기준 회수: ${impact.payback === null ? '직접 수익 증가 없음' : impact.payback + '회 정상 영업 예상'} (본점 매출·다른 투자비는 제외)</p>` + table(['지표', '현재 → 투자 후'], ['population', 'traffic', 'economy', 'environment', 'attraction', 'satisfaction'].map(k => [indicatorMeta[k].name, num(impact.before[k]) + ' → ' + num(impact.after[k])])) : `<p>${esc(impact.reason)}</p>`; host.insertAdjacentHTML('beforeend', `<section class="urban-confirm"><h4>투자를 결정할까요?</h4><p>${esc(pending.label)}</p>${preview}<p>${esc(urbanInvestmentNotes(impact))}</p><p>현재 ${num(base.money)}원 → 결제 후 ${num(base.money - pending.cost)}원</p><button data-confirm ${readOnly || busy || base.money < pending.cost ? 'disabled' : ''}>확인 · ${num(pending.cost)}원 결제</button><button data-cancel>취소 · 결제 안 함</button></section>`); host.querySelector('[data-confirm]').onclick = () => void commit(); host.querySelector('[data-cancel]').onclick = () => { pending = null; viewer.preview = null; message = '취소했어요. 기업 자금은 그대로예요.'; paintInfo(); viewer.draw(); }; }
    function paintDashboard(host) { const data = analyze(viewer.city), c = modernCityFor(base.v26); host.innerHTML = '<h3>도시 경영 대시보드</h3>' + table(['지표', '현재'], keys.map(k => [indicatorMeta[k].name, num(data.total[k]) + indicatorMeta[k].unit])) + table(['지역', '인구', '상권', '교통', '환경', '만족'], Object.entries(data.districts).map(([k, v]) => [districts[k].name, ...['population', 'economy', 'traffic', 'environment', 'satisfaction'].map(k => num(v[k]))])) + '<h4>실제 분점 정산 예상</h4>' + table(['분점', '도시 계수', '영업당 순수익'], base.v26.branches.map(b => [b.id + '호점', urbanBranchFactor(base.v26, b).toFixed(3), num(branchYield(base.v26, b)) + '원'])) + '<h4>최근 실제 정산</h4>' + table(['영업 완료 ID', '실제 순수익'], (base.v26.enterprise.history ?? []).slice(-5).map(r => [esc(r.id), num(r.net) + '원'])) + '<p>기존 분점 매출·직원 비용 계산에 도시 계수를 한 번만 적용해요. 정상15분 영업 완료 ID로 한 번만 정산돼요.</p><h4>개발 전후 변화</h4>' + table(['거래', '인구 전→후', '교통 전→후', '환경 전→후'], (c.urban?.history ?? []).slice(-10).map(h => [esc(h.action), ...['population', 'traffic', 'environment'].map(k => num(h.before[k]) + '→' + num(h.after[k]))])) + '<p>' + ((c.urban?.history ?? []).length ? '직접 저장한 거래만 표시해요.' : '아직 개발 이력이 없어요. 임의의 과거 추이는 만들지 않아요.') + '</p><h4>원인·개선 제안</h4><p>일자리 ' + num(data.total.raw.jobs) + ' · 소비 수요 ' + num(data.total.raw.consumerDemand) + ' · 상업 수용 ' + num(data.total.raw.retailCapacity) + ' · 녹지 ' + num(data.total.raw.greenArea) + '㎡</p><p>' + esc(urbanAdvice(base, base.mega?.manager?.selected)) + '</p>'; pendingBlock(host); }
    function paintInfo() {
        if (closed)
            return;
        $('.urban-panel').hidden = false;
        $('[data-message]').textContent = message;
        const host = $('[data-info]'), c = modernCityFor(base.v26), p = viewer.city.parcels.find(p => p.id === selected);
        if (dashboard || !p) {
            paintDashboard(host);
            return;
        }
        const brands = viewer.city.buildings.find(b => b.parcelId === selected && b.brandLink), metrics = analyze(viewer.city).blocks[p.id], owned = c.plots[p.id];
        host.innerHTML = `<h3>${districts[p.district].name}</h3><p>${p.id} · ${p.w}×${p.h}칸 · ${brands ? brands.brandLink.name : owned ? (owned.legacy ? '이전 투자·환경 기록 보존' : ('내 시설 · ' + (byId[c.urban?.variants[p.id]]?.name ?? '기존 시설'))) : p.vacant ? '빈 부지' : '도시 환경 블록'}</p>` + table(['인구', '밀도', '상권', '교통', '환경', '관광문화'], [['population', 'density', 'economy', 'traffic', 'environment', 'attraction'].map(k => num(metrics[k]))]);
        if (brands) {
            host.insertAdjacentHTML('beforeend', '<p>브랜드 건물은 일반 건설로 덮어쓰지 않아요.</p><button data-brand-open>' + (brands.brandLink.kind === 'main' ? '본점으로 이동' : '본부·분점 관리로 이동') + '</button>');
            host.querySelector('[data-brand-open]').onclick = () => { const main = brands.brandLink.kind === 'main'; close(); if (!main)
                void import('./enterpriseUi.js?v=stability-97670d28ea8d').then(m => m.openEnterprise(repo, onClose)); };
            pendingBlock(host);
            return;
        }
        if (publicSites.includes(p.id)) {
            host.insertAdjacentHTML('beforeend', '<p>공공 보호 부지예요. 환경과 주민을 위해 보존해요.</p>');
            pendingBlock(host);
            return;
        }
        const choices = assets.filter(a => a.kind === 'new' && a.w <= p.w && a.h <= p.h && a.redevelopmentStage <= c.region);
        const current = pending?.action.kind === 'build' ? pending.action.variant : c.urban?.variants[p.id];
        host.insertAdjacentHTML('beforeend', `<label>건설·재개발할 건물<select data-building>${choices.map(a => `<option value="${a.id}" ${a.id === current ? 'selected' : ''}>${a.name} · ${a.w}×${a.h}</option>`).join('')}</select></label><div data-quote></div><button data-plan ${readOnly ? 'disabled' : ''}>건물 미리보기 · 투자 검토</button><button data-branch ${readOnly ? 'disabled' : ''}>이 위치에 다음 분점 창업</button><p>건물 외형은 선택한 개별 자산으로 바뀌어요. 환경 건물은 직접 수익이나 소유 자산으로 자동 전환하지 않아요.</p>`);
        const quote = () => { const q = urbanBuildQuote(base.v26, p.id, host.querySelector('[data-building]').value); host.querySelector('[data-quote]').innerHTML = q ? `<p>${esc(q.name)} · ${q.footprint} · ${q.kind}비 ${num(q.cost)}원<br>보유 ${num(base.money)}원 · 부족 ${num(Math.max(0, q.cost - base.money))}원</p>` : '<p>현재와 같은 외형이거나 건설 조건이 맞지 않아요.</p>'; host.querySelector('[data-plan]').disabled = readOnly || !q; return q; };
        quote();
        host.querySelector('[data-building]').onchange = () => { pending = null; viewer.preview = null; quote(); viewer.draw(); };
        host.querySelector('[data-plan]').onclick = async () => { const q = quote(); if (!q)
            return; pending = { revision: c.revision, action: { kind: 'build', site: p.id, variant: q.variant }, cost: q.cost, label: q.name + ' ' + q.kind }; const a = byId[q.variant], token = ++selectionVersion; const im = await viewer.cache.image(a); if (closed || token !== selectionVersion)
            return; viewer.images.set(viewer.cache.key(a), im); viewer.preview = { id: 'urban-preview', variantId: a.id, x: p.x + (p.w - a.w) / 2, y: p.y + (p.h - a.h) / 2, w: a.w, h: a.h }; viewer.draw(); paintInfo(); };
        host.querySelector('[data-branch]').onclick = () => { const id = [2, 3, 4].find(id => !base.v26.branches.some(b => b.id === id)); if (!id) {
            message = '2~4호점은 이미 운영 중이에요.';
            paintInfo();
            return;
        } if (owned || !branchRequirement(base, id)) {
            message = '빈 부지와 기존 분점 창업 조건·마을 발전 단계를 확인해 주세요.';
            paintInfo();
            return;
        } pending = { revision: c.revision, action: { kind: 'branch', id, site: p.id }, cost: progressiveEconomyConfig.branchCosts[id - 2], label: id + '호점 · 선택한 입지에 창업' }; paintInfo(); };
        pendingBlock(host);
    }
    function select(id) { selectionVersion++; selected = id; dashboard = false; pending = null; viewer.preview = null; $('[data-parcels]').value = id; paintInfo(); }
    $('[data-parcels]').onchange = e => select(e.target.value);
    $('[data-analysis]').onchange = e => { analysis = e.target.value; applyAnalysis(); };
    $('[data-brand-only]').onchange = applyAnalysis;
    $('[data-fit]').onclick = () => viewer.fit();
    $('[data-plus]').onclick = () => viewer.zoom(1.25);
    $('[data-minus]').onclick = () => viewer.zoom(.8);
    $('[data-dashboard]').onclick = () => { dashboard = true; pending = null; paintInfo(); };
    $('[data-road]').onclick = () => { const c = modernCityFor(base.v26), cost = urbanRoadCosts[c.urban?.traffic ?? 0]; if (cost === undefined)
        return; dashboard = true; pending = { revision: c.revision, action: { kind: 'road' }, cost, label: '교통 접근성 ' + ((c.urban?.traffic ?? 0) + 1) + '단계' }; paintInfo(); };
    $('[data-expand]').onclick = () => { const c = modernCityFor(base.v26), next = cityRegions[c.region]; if (!next)
        return; dashboard = true; pending = { revision: c.revision, action: { kind: 'expand' }, cost: next.cost, label: next.cols * next.rows + '개 부지로 도시 확장 · 기존 블록 보존' }; paintInfo(); };
    $('[data-measure]').onclick = () => { benchUntil = performance.now() + 180000; benchCamera = { ...viewer.camera }; };
    function observe(now) { if (closed)
        return; if (!document.hidden) {
        if (last) {
            const dt = now - last;
            elapsed += dt;
            frames++;
            frameStats.add(dt);
            maxFrame = Math.max(maxFrame, dt);
        }
        if (benchCamera) {
            if (now < benchUntil) {
                const start = performance.now();
                viewer.camera.x = benchCamera.x + Math.sin(now / 1500) * 120;
                viewer.draw();
                drawStats.add(performance.now() - start);
            }
            else {
                viewer.camera = benchCamera;
                benchCamera = null;
                viewer.draw();
            }
        }
        if (frames % 60 === 0) {
            const q = r => frameStats.quantile(r), heap = performance.memory?.usedJSHeapSize;
            $('[data-perf]').textContent = `가시 관찰 ${(elapsed / 1000).toFixed(1)}초 · ${(1000 * frames / (elapsed || 1)).toFixed(1)}FPS · p95 ${q(.95).toFixed(1)}ms · p99 ${q(.99).toFixed(1)}ms · 최대 ${maxFrame.toFixed(1)}ms · heap ${heap ? (heap / 1048576).toFixed(1) : '미지원'}MiB / 변화 ${heap && startHeap ? ((heap - startHeap) / 1048576).toFixed(1) : '미지원'}MiB · 건물 ${viewer.drawn.length}/${viewer.city.buildings.length} · 카메라 그리기 p95 ${drawStats.quantile(.95)}ms / 최대 ${drawStats.max.toFixed(1)}ms (${drawStats.count}회) · 분위수1ms · 이미지 디코딩 추정 ${(viewer.cache.memoryEstimate().decodedImageBytes / 1048576).toFixed(1)}MiB (GPU 제외)`;
        }
    } last = document.hidden ? 0 : now; raf = requestAnimationFrame(observe); }
    await refresh();
    raf = requestAnimationFrame(observe);
}
