import { enterpriseReady, enterpriseEditable, foundEnterprise, proposeEnterprise } from './enterpriseState.js?v=v31-5d872fe24674';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=v31-5d872fe24674';
import { escapeText as esc } from './questionRenderer.js?v=v31-5d872fe24674';
import { managerCatalog } from './managerState.js?v=v31-5d872fe24674';
export const franchiseDeployment = () => typeof document !== 'undefined' && ['v30e-city-integrated-local', 'v30e-common-local', 'v30e-v31-local'].includes(document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '');
export function enterpriseAction(host, repo, save, refresh) { if (!franchiseDeployment() || !enterpriseReady(save))
    return; const b = document.createElement('button'); b.className = 'primary'; b.textContent = save.v26?.enterprise?.status === 'founded' ? '프랜차이즈 본부 · 도시' : '매니저의 제안 · 프랜차이즈 본부'; b.onclick = () => { void openEnterprise(repo, refresh); }; host.append(b); if (!save.v26?.enterprise)
    setTimeout(() => { if (b.isConnected)
        b.click(); }, 0); }
export async function openEnterprise(repo, onClose) {
    if (!await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' || !enterpriseReady(read.save))
        return;
    let base = read.save, message = '';
    if (!base.v26?.enterprise && enterpriseEditable(base)) {
        const next = structuredClone(base);
        proposeEnterprise(next);
        const w = repo.write(next, base);
        if (!w.ok)
            return;
        base = next;
    }
    const box = document.createElement('section');
    box.className = 'mode-confirm enterprise-dialog';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', '프랜차이즈 본부');
    document.body.append(box);
    const edit = (fn) => { const next = structuredClone(base); if (!fn(next)) {
        message = '영업 종료 여부·조건·보유금을 확인해 주세요.';
        paint();
        return;
    } const w = repo.write(next, base); message = w.ok ? '안전하게 저장했어요.' : w.message; if (w.ok)
        base = next; paint(); };
    function paint() { const e = base.v26?.enterprise, manager = managerCatalog.find(m => m.id === base.mega?.manager?.selected); box.innerHTML = `<div><button data-close>닫기 · 내 카페</button><h2>${e?.status === 'founded' ? esc(e.name) + ' 본부' : '우리 브랜드의 다음 꿈'}</h2><p>${manager.name}: ${e?.status === 'founded' ? '본점은 그대로! 지역마다 어울리는 가게와 도시를 함께 키워봐요.' : '64×48 메가 카페를 완성했어요. 이제 우리만의 프랜차이즈 본부를 세워볼까요?'}</p><p>보유금 ${base.money.toLocaleString()}원 · 본점과 직원·가구·학습 기록은 그대로 유지돼요.</p>${e?.status === 'founded' ? `<p>브랜드: ${{ neighborhood: '이웃과 함께', destination: '여행의 목적지', creative: '창의적인 디저트' }[e.brand]}</p><div id="enterprise-content"></div>` : `<label>기업 이름 <input data-name maxlength="24" placeholder="예: 햇살 카페" autocomplete="off"></label><label>브랜드 방향 <select data-brand><option value="neighborhood">이웃과 함께 · 주거</option><option value="destination">여행의 목적지 · 관광</option><option value="creative">창의적인 디저트 · 문화</option></select></label><p>본부 설립은 무료이며 분점 창업·채용·투자는 각각 비용을 확인하고 결정해요.</p><button data-found ${!enterpriseEditable(base) ? 'disabled' : ''}>이 이름으로 본부 설립</button><button data-later>나중에 결정</button>`}<p role="status">${esc(message)}</p></div>`; box.querySelector('[data-close]').addEventListener('click', () => { box.remove(); onClose(); }); box.querySelector('[data-later]')?.addEventListener('click', () => { edit(s => proposeEnterprise(s)); box.remove(); onClose(); }); box.querySelector('[data-found]')?.addEventListener('click', () => { const name = box.querySelector('[data-name]').value, brand = box.querySelector('[data-brand]').value; edit(s => foundEnterprise(s, name, brand)); }); if (e?.status === 'founded')
        void import('./enterpriseOperationsUi.js?v=v31-5d872fe24674').then(m => { if (box.isConnected)
            m.paintEnterpriseOperations(box.querySelector('#enterprise-content'), base, edit, repo, () => { box.remove(); onClose(); }); }); }
    paint();
}
