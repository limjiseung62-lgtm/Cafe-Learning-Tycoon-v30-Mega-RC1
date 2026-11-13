import { adoptRenewal } from './renewalMigration.js?v=v31-final-636a93f6f215';
import { ensureGrowthWriteLock } from './growthWriteLock.js?v=v31-final-636a93f6f215';
export function renewalMigrationAction(host, repo, save, refresh) { if (document.querySelector('meta[name="cafe-renewal"]')?.getAttribute('content') !== 'v31-candidate' || !save.mega?.finalGrowth || save.mega.finalGrowth.renewal)
    return; const button = document.createElement('button'); button.textContent = 'v3.1 새 경영 적용 · 기존 혜택 보존'; button.style.minHeight = '48px'; button.onclick = async () => { if (!await ensureGrowthWriteLock())
    return; const d = document.createElement('dialog'); d.style.cssText = 'width:min(650px,92vw);max-height:85vh;overflow:auto;background:#fff8ed'; const title = document.createElement('h2'); title.textContent = '이 카페의 사본에 리뉴얼을 적용할까요?'; const details = document.createElement('p'); details.textContent = '현재 Lv.' + save.cafeLevel + ' · ' + save.money.toLocaleString() + '원 · 메뉴 ' + save.unlockedMenuIds.length + '종 · 직원 ' + (save.roster?.owned.length ?? save.staffOwned.length) + '명. 이미 보유한 메뉴·좌석 권한·직원·면적·전문화 혜택은 유지해요. 비용은 차감하지 않아요. 기존 저장 원문을 기기 안에 별도 보관한 뒤 새 규칙을 적용해요.'; const status = document.createElement('p'); status.setAttribute('role', 'status'); const yes = document.createElement('button'); yes.textContent = '확인 · 원본 보관 후 새 경영 적용'; yes.style.minHeight = '48px'; yes.onclick = () => { yes.disabled = true; try {
    const next = adoptRenewal(save), result = repo.write(next, save);
    if (!result.ok) {
        status.textContent = result.message;
        yes.disabled = false;
        return;
    }
    d.remove();
    refresh();
}
catch (e) {
    status.textContent = e instanceof Error ? e.message : '기존 기록은 그대로예요.';
    yes.disabled = false;
} }; const no = document.createElement('button'); no.textContent = '기존 방식 유지'; no.style.minHeight = '48px'; no.onclick = () => d.remove(); d.append(title, details, status, yes, no); document.body.append(d); d.showModal(); }; host.append(button); }
