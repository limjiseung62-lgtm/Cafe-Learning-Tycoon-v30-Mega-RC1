import { enterpriseCity, cityDistricts, citySafePoint } from './enterpriseCity.js?v=kitchen-707cb8cb607b';
import { sceneEnvironment } from './villageSceneArt.js?v=kitchen-707cb8cb607b';
import { VillageExplorer } from './villageExplorer.js?v=kitchen-707cb8cb607b';
import { scenePath } from './villageNavigation.js?v=kitchen-707cb8cb607b';
import { investVillage, progressiveEconomyConfig } from './progressiveEconomy.js?v=kitchen-707cb8cb607b';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=kitchen-707cb8cb607b';
import { customerPoseArt, selectCustomerPose } from './customerPoses.js?v=kitchen-707cb8cb607b';
export async function openEnterpriseCity(repo, onClose, readOnly = false) {
    if (!readOnly && !await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' || read.save.v26?.enterprise?.status !== 'founded')
        return;
    let base = read.save, explorer, selected = 'commerce', message = '길을 눌러 이동하거나 방향 버튼을 사용해요.', dirty = false;
    const box = document.createElement('section');
    box.className = 'mode-confirm enterprise-city';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', '브랜드 도시');
    document.body.append(box);
    const times = [];
    let last = performance.now(), frames = 0, visibleMs = 0, lastReport = 0, maxFrame = 0;
    const savePosition = () => { if (readOnly || !dirty || !explorer)
        return; const next = structuredClone(base); next.v26.enterprise.city = explorer.point; const w = repo.write(next, base); if (w.ok) {
        base = next;
        dirty = false;
    }
    else
        message = w.message; };
    const close = () => { savePosition(); explorer?.destroy(); box.remove(); onClose(); };
    function draw() {
        explorer?.destroy();
        const scene = enterpriseCity(base.v26), point = citySafePoint(scene, base.v26.enterprise.city);
        box.innerHTML = `<div><button data-close>도시 닫기 · 카페 준비 화면</button><h2>함께 크는 브랜드 도시</h2><p>기업 ${base.v26.enterprise.name.replace(/[<>]/g, '')} · 보유금 ${base.money.toLocaleString()}원</p><div class="city-controls">${cityDistricts.map(d => `<button data-district="${d.id}">${d.name} ${base.v26.investments[d.id]}/5</button>`).join('')}<button data-overview>전체 보기 / 따라가기</button></div><div class="city-viewport"><div class="city-map">${sceneEnvironment(scene, true)}${scene.residents.map(([id, name, key, x, y]) => `<span class="scene-resident" data-city-resident="${id}" style="left:${x}px;top:${y}px;z-index:${y}">${customerPoseArt(selectCustomerPose(key, 'ENTERING', 'right'))}<b>${name}</b></span>`).join('')}<div class="village-player scene-player">${customerPoseArt(selectCustomerPose('child', 'ENTERING', 'right'))}<b>나</b></div><div class="scene-destination" hidden></div></div></div><div class="city-controls"><button data-village-dir="up">↑</button><button data-village-dir="left">←</button><button data-village-dir="down">↓</button><button data-village-dir="right">→</button><button data-invest>선택 지구 투자</button></div><p data-info role="status"></p><details><summary>성능 측정 · 실제 주민</summary><output data-perf></output></details></div>`;
        const map = box.querySelector('.city-map'), viewport = box.querySelector('.city-viewport'), info = box.querySelector('[data-info]');
        map.querySelectorAll('[data-resident]').forEach(b => b.removeAttribute('data-resident'));
        const agents = scene.residents.map(([id, , key, x, y], i) => { return { id, key, el: map.querySelector(`[data-city-resident="${id}"]`), p: citySafePoint(scene, { x, y }), path: [], target: 0, wait: i * .6 }; });
        const updateInfo = () => { const d = cityDistricts.find(d => d.id === selected), tier = base.v26.investments[selected], cost = progressiveEconomyConfig.investmentCosts[tier]; info.textContent = d.name + ' · ' + d.activity + ' · ' + (cost === undefined ? '최고 단계' : cost.toLocaleString() + '원 → 실제 건물 1동·연결 길·주민 활동 추가') + ' · ' + message; const b = box.querySelector('[data-invest]'); b.disabled = readOnly || cost === undefined || base.money < cost; b.textContent = cost === undefined ? '완성' : d.name + ' 투자 ' + cost.toLocaleString() + '원'; };
        explorer = new VillageExplorer({ centerOverview: true, scene, map, viewport, controls: box, position: point, onPosition: () => { dirty = true; }, onCheckpoint: savePosition, onArrive: () => { message = '도착했어요. 지구를 선택해 투자 효과를 확인하세요.'; updateInfo(); }, onReject: () => { message = '건물·화단은 통과할 수 없어요. 연결된 길을 선택해 주세요.'; updateInfo(); }, onFrame: dt => { const now = performance.now(); if (!document.hidden) {
                const frame = now - last;
                frames++;
                visibleMs += frame;
                maxFrame = Math.max(maxFrame, frame);
                times.push(frame);
                if (times.length > 3600)
                    times.shift();
                for (const a of agents) {
                    if (!a.el)
                        continue;
                    if (a.wait > 0) {
                        a.wait -= dt;
                        a.el.classList.remove('walking');
                        continue;
                    }
                    if (!a.path.length) {
                        const d = cityDistricts.find(d => a.id.startsWith(d.id)), nodes = Object.entries(scene.nodes).filter(([id]) => id.startsWith(d.id));
                        const dest = nodes[a.target++ % nodes.length][1];
                        a.path = scenePath(scene, a.p, citySafePoint(scene, { x: dest[0], y: dest[1] }));
                        if (!a.path.length) {
                            a.wait = 2;
                            continue;
                        }
                    }
                    const n = a.path[0], dx = n.x - a.p.x, dy = n.y - a.p.y, len = Math.hypot(dx, dy), step = Math.min(len, dt * 48);
                    a.p = { x: a.p.x + dx / (len || 1) * step, y: a.p.y + dy / (len || 1) * step };
                    a.el.style.left = a.p.x + 'px';
                    a.el.style.top = a.p.y + 'px';
                    a.el.style.zIndex = String(Math.floor(a.p.y));
                    a.el.hidden = !explorer?.visible(a.p, 180);
                    a.el.classList.toggle('walking', step > 0);
                    if (len <= step + .01) {
                        a.path.shift();
                        if (!a.path.length)
                            a.wait = 2;
                    }
                    if (a.el.dataset.facing !== (dx < 0 ? 'left' : 'right')) {
                        a.el.dataset.facing = dx < 0 ? 'left' : 'right';
                        a.el.querySelector('.guest-art')?.remove();
                        a.el.insertAdjacentHTML('afterbegin', customerPoseArt(selectCustomerPose(a.key, 'ENTERING', dx < 0 ? 'left' : 'right')));
                    }
                }
                if (now - lastReport >= 1000) {
                    lastReport = now;
                    const sorted = times.slice().sort((a, b) => a - b), p95 = sorted[Math.floor(sorted.length * .95)] ?? 0;
                    box.querySelector('[data-perf]').textContent = `${frames} 프레임 · 실제 관찰 ${(visibleMs / 1000).toFixed(1)}초 · 평균 ${(1000 * frames / visibleMs).toFixed(1)}FPS · 최근 p95 ${p95.toFixed(1)}ms · p99 환산 ${(1000 / (sorted[Math.floor(sorted.length * .99)] || 1)).toFixed(1)}FPS · 최대 ${maxFrame.toFixed(1)}ms · 메모리 ${((performance.memory?.usedJSHeapSize ?? 0) / 1048576).toFixed(1)}MiB · 실제 주민 ${agents.length}`;
                }
            } last = now; } });
        map.addEventListener('click', ev => { const target = ev.target.closest('[data-building]'); if (target) {
            const id = target.dataset.building, b = scene.buildings.find(b => b.id === id);
            const field = cityDistricts.find(d => id.startsWith(d.id));
            if (field)
                selected = field.id;
            explorer.target(citySafePoint(scene, b.door));
            updateInfo();
        }
        else
            explorer.target(explorer.clickPoint(ev)); });
        box.querySelector('[data-close]').addEventListener('click', close);
        box.querySelector('[data-overview]').addEventListener('click', () => explorer.toggleOverview());
        box.querySelectorAll('[data-district]').forEach(b => b.onclick = () => { selected = b.dataset.district; const d = cityDistricts.find(d => d.id === selected); explorer.target(citySafePoint(scene, { x: d.x, y: d.y + 80 })); updateInfo(); });
        box.querySelector('[data-invest]').addEventListener('click', () => { if (readOnly)
            return; savePosition(); const next = structuredClone(base); if (!investVillage(next, selected)) {
            message = '영업을 마친 뒤 투자 조건을 확인해 주세요.';
            updateInfo();
            return;
        } if (Object.values(next.v26.investments).every(t => t === 5) && !next.v26.enterprise.milestones.includes('city-complete'))
            next.v26.enterprise.milestones.push('city-complete'); const scene = enterpriseCity(next.v26); next.v26.enterprise.city = citySafePoint(scene, explorer.point); const w = repo.write(next, base); if (w.ok) {
            base = next;
            dirty = false;
            message = '새 건물과 연결 길이 열렸어요!';
            draw();
        }
        else {
            message = w.message;
            updateInfo();
        } });
        updateInfo();
    }
    draw();
}
