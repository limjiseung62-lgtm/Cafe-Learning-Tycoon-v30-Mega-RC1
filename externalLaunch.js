import{portalURL}from'./sq-learning/portal-url.mjs';
import {decodeLaunch,validateLaunch} from './sq-learning/launch.mjs';
import {nativeChoices,checkResume,checkStart} from './sq-learning/cafe-policy.mjs';
import pin from './sq-learning/catalog-pin.json' with {type:'json'};
import {loadCommonRuntime} from './commonBankLoader.js?v=sq-approved400-20261104';
let launch=null,catalog=null,choices=null,nativeCatalog=null,unit=null,lease=false,releaseLease=null,lastError='',preflight=null,lastProbe=0,lastProbeState='';
// Fragment edits must revalidate. Page teardown uses v3's native checkpoint handlers.
addEventListener('hashchange',()=>{if(launch||location.hash.startsWith('#sq'))location.reload();});
const key=()=> 'sq-cafe-launch/'+launch.launchId;
const journal=()=>{const raw=localStorage.getItem(key());return raw?JSON.parse(raw):null;};
export function manualReturn(){location.replace(location.pathname+location.search);}
function banner(error=''){
 let box=document.getElementById('sq-cafe-summary');if(!box){box=document.createElement('aside');box.id='sq-cafe-summary';box.setAttribute('aria-label','School Quest 학습 설정');document.body.prepend(box);}
 box.replaceChildren();const title=document.createElement('strong'),p=document.createElement('p'),button=document.createElement('button'),back=document.createElement('a');title.textContent=error?'학습 설정을 적용하지 않았어요':'School Quest × Cafe v3.0 · 공통 문제은행';p.textContent=error||`${unit.grade}학년 · ${({'math':'수학','science':'과학','korean-literacy':'국어','social-studies':'사회'}[launch.subject])} · ${unit.semester}학기 · ${unit.title} · ${launch.scopes[0].learningObjectiveIds.length}개 학습목표`;p.setAttribute('role',error?'alert':'status');button.textContent='기존 수동 선택으로 돌아가기';button.onclick=manualReturn;back.textContent='포털에서 학습 변경';back.href=portalURL();box.append(title,p,button,back);if(error)box.dataset.error='true';else delete box.dataset.error;
}
function reject(error){lastError=error instanceof Error?error.message:String(error);banner(lastError);throw Error(lastError);}
async function acquire(){if(!navigator.locks)throw Error('이 브라우저는 중복 실행 잠금을 지원하지 않아요. 수동 선택으로 이용해 주세요.');await new Promise((resolve,reject)=>{navigator.locks.request('sq-cafe-active/'+launch.launchId,{ifAvailable:true},async lock=>{if(!lock){reject(Error('같은 링크가 다른 탭에서 실행 중이에요. 기존 탭으로 돌아가 주세요.'));return;}lease=true;resolve();await new Promise(r=>releaseLease=r);lease=false;}).catch(reject);});}
addEventListener('pagehide',()=>{releaseLease?.();releaseLease=null;lease=false;});
addEventListener('pageshow',event=>{if(event.persisted&&launch)void acquire().catch(reject);});
export async function attachExternal(c){
 nativeCatalog=c;
 if(!location.hash.startsWith('#sq'))return;
 try{
  const r=await fetch('./sq-learning/catalog.json',{cache:'no-store'});if(!r.ok)throw Error('Pilot 학습 목록을 읽지 못했어요.');const bytes=new Uint8Array(await r.arrayBuffer());const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(digest!==pin.sha256)throw Error('Pilot 학습 목록 해시가 달라요.');catalog=JSON.parse(new TextDecoder().decode(bytes));
  launch=decodeLaunch(location,catalog);if(!launch)return;if(launch.gameId!=='cafe')throw Error('다른 게임용 학습 링크예요.');
  const version=await (await fetch('version.json',{cache:'no-store'})).json();if(version.version!=='3.0.0-mega-rc.1')throw Error('Cafe v3.0 실행 버전과 Pilot 기준 버전이 달라요.');
  const s=launch.scopes[0];unit=catalog.units.find(u=>u.subject===launch.subject&&u.sourceId===s.sourceId&&u.id===s.unitId);choices=nativeChoices(launch,catalog);
  await acquire();const original=c.prepareResume.bind(c);
  c.prepareResume=value=>{try{if(value&&!value.learning?.session?.common)throw Error('공통 문제은행 연결 전의 저장은 외부 학습 설정으로 덮어쓸 수 없어요.');checkResume(launch,choices,value?.learning?.session?.common,journal());original(value);c.setChoices(launch.subject,choices);}catch(error){reject(error);}};
  c.setChoices(launch.subject,choices);banner();
 }catch(error){reject(error);}
}
export function applyExternalPicker(select){if(!launch||lastError)return;nativeCatalog.setChoices(launch.subject,choices);select.value=nativeCatalog.subjects.find(s=>s.subject===launch.subject).packId;select.dispatchEvent(new Event('change'));select.parentElement.querySelector('.cafe-study-picker')?.setAttribute('hidden','');select.hidden=true;const title=document.getElementById('study-title');if(title)title.textContent='포털에서 선택한 학습 · '+unit.title;}
export async function preflightExternal(resume){if(!launch)return;try{if(lastError)throw Error(lastError);validateLaunch(launch,catalog);if(!lease)throw Error('이 실행 링크의 탭 잠금이 해제됐어요. 새로고침 후 이어해 주세요.');checkStart(journal(),!!resume);checkResume(launch,choices,resume?.learning?.session?.common,journal());
 if(!preflight)preflight=(async()=>{const loaded=await loadCommonRuntime(launch.subject);if(loaded.manifestSHA256!==launch.manifestSHA256)throw Error('공급자 manifest가 일치하지 않아요.');for(const c of choices){const bank=loaded.runtime.createBank({semesterKey:c.semesterKey,learningRecordId:'SQ-CAFE-PREFLIGHT'}),scope=bank.defaultScope(c.unitId);for(const id of c.skillIds){const rows=bank.getCandidates({...scope,skillIds:[id],levels:c.levels});if(!rows.length)throw Error('선택한 학습목표에 공급 가능한 문항이 없어요.');}}})();await preflight;
 const select=document.getElementById('study-pack');if(select)applyExternalPicker(select);
 }catch(error){reject(error);}}
export async function runExternalStart(resuming,operation){if(!launch)return operation();try{return await navigator.locks.request('sq-cafe-start/'+launch.launchId,{ifAvailable:true},async lock=>{if(!lock)throw Error('게임을 시작하는 중이에요. 중복 실행하지 않았어요.');checkStart(journal(),resuming);await operation();});}catch(error){reject(error);}}
export function commitExternal(flow,game){if(!launch)return;if(!flow)reject(Error('공통 문제은행 학습 세션이 생성되지 않았어요.'));const old=journal();if(old?.recordId&&old.recordId!==flow.learningRecordId)reject(Error('이 링크의 학습 기록이 변경됐어요.'));localStorage.setItem(key(),JSON.stringify({status:game.status==='CLOSED'?'completed':'started',recordId:flow.learningRecordId,gameSessionId:flow.gameSessionId,mode:game.mode,subject:launch.subject,manifestSHA256:launch.manifestSHA256,choices,startedAt:old?.startedAt??Date.now()}));}
export async function finalizeExternal(flow,game,flush){if(!launch)return;if(!await flush())reject(Error('시작 상태를 저장하지 못했어요. 기존 저장을 보관하고 수동 선택으로 돌아가 주세요.'));commitExternal(flow,game);}
// Local, read-only QA metadata. No answer keys and no setters/control hooks are exposed.
export function observeExternalGame(game,flow){if(!game)return;if(launch&&flow&&game.status==='CLOSED'){const j=journal();if(j&&j.status!=='completed')localStorage.setItem(key(),JSON.stringify({...j,status:'completed'}));}if(!new URLSearchParams(location.search).has('pilotQa')||(lastProbeState===game.status&&performance.now()-lastProbe<500))return;lastProbe=performance.now();lastProbeState=game.status;let probe=document.getElementById('sq-cafe-qa');if(!probe){probe=document.createElement('pre');probe.id='sq-cafe-qa';probe.hidden=true;document.body.append(probe);}const q=flow?.current?flow.question():null;probe.textContent=JSON.stringify({mode:game.mode,status:game.status,money:game.money,stats:game.stats,stock:game.menus.map(m=>({id:m.menuId,stock:m.stock,maxStock:m.maxStock})),workers:game.service?.workers,guests:game.guests.length,paidStaff:game.service?.paid,level:game.cafeLevel,subject:flow?.loaded.subject,choices:flow?.choices,recordId:flow?.learningRecordId,gameSessionId:flow?.gameSessionId,awards:flow?.awards,turn:flow?.turn,current:flow?.current?{role:flow.current.delivery.role,questionId:q.questionId,metadata:q.metadata,answered:flow.answered}:null});}
