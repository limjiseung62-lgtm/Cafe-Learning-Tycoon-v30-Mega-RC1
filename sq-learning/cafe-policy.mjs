// Selection/identity checks only. Never selects questions, grades or grants rewards.
export function nativeChoices(launch,catalog){const s=launch.scopes[0],u=catalog.units.find(u=>u.subject===launch.subject&&u.sourceId===s.sourceId&&u.id===s.unitId);return [{semesterKey:u.semesterKey??u.sourceId.replace(/^(korean-literacy|social-studies):/,''),unitId:s.unitId,unitLabel:u.title,skillIds:[...s.learningObjectiveIds],levels:[...s.levels]}];}
const sorted=a=>[...(a??[])].sort();
export function sameChoices(a,b){return JSON.stringify((a??[]).map(c=>[c.semesterKey,c.unitId,sorted(c.skillIds),sorted(c.levels)]).sort())===JSON.stringify((b??[]).map(c=>[c.semesterKey,c.unitId,sorted(c.skillIds),sorted(c.levels)]).sort());}
export function checkResume(launch,choices,saved,journal){
 if(!saved)return;
 if(saved.version!==1||saved.subject!==launch.subject||saved.manifestSHA256!==launch.manifestSHA256||!sameChoices(saved.choices,choices))throw Error('저장된 카페의 학습 범위가 이 링크와 달라요. 저장을 유지한 채 수동 선택으로 돌아가 주세요.');
 if(journal?.recordId&&saved.learningRecordId!==journal.recordId)throw Error('이 링크로 시작했던 학습 기록과 다른 저장이에요. 수동 선택으로 돌아가 주세요.');
}
export function checkStart(journal,resuming){if(journal?.status==='completed')throw Error('이미 종료한 실행 링크예요. 포털에서 새 링크를 만들어 주세요.');if(journal?.recordId&&!resuming)throw Error('이미 시작한 실행 링크예요. 기존 이어하기를 선택하거나 포털에서 새 링크를 만들어 주세요.');}
