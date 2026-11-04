// Adapted from the existing sq-math-launch/1 and Phase2A URL codec.
// Transport never grants approval. The installed supplier remains authoritative.
export const VERSION='school-quest-launch/1', TTL=4*60*60*1000, MAX=6000;
export const fail=message=>{throw Error(message);};
function keys(o,list){if(!o||Array.isArray(o)||typeof o!=='object'||Object.keys(o).length!==list.length||Object.keys(o).some(k=>!list.includes(k)))fail('허용되지 않은 설정 필드가 있어요.');}
export function validateLaunch(e,catalog,now=Date.now()){
 keys(e,['schemaVersion','launchId','issuedAt','expiresAt','gameId','intent','providerId','releaseRef','manifestSHA256','subject','scopes']);
 if(e.schemaVersion!==VERSION||!['cafe','survival','math-defense','magic-library'].includes(e.gameId)||e.intent!=='new-study-session'||e.providerId!=='common-public')fail('지원하지 않는 실행 규격이나 게임이에요.');
 if(typeof e.launchId!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(e.launchId))fail('실행 식별자가 올바르지 않아요.');
 if(!Number.isSafeInteger(e.issuedAt)||!Number.isSafeInteger(e.expiresAt)||e.issuedAt>now+300000||e.expiresAt<=now||e.expiresAt-e.issuedAt!==TTL)fail('실행 링크의 유효 시간이 지났거나 올바르지 않아요.');
 if(!catalog.providers[e.subject])fail('등록된 승인 문항팩이 없는 교과예요.');
 const provider=catalog.providers[e.subject].games?.[e.gameId]??catalog.providers[e.subject];
 if(e.releaseRef!==provider.releaseRef||e.manifestSHA256!==provider.manifestSHA256)fail('사이트와 게임의 문제은행 버전이 달라요.');
 if(!Array.isArray(e.scopes)||e.scopes.length!==1)fail('이번 Pilot에서는 단원 하나를 선택해 주세요.');
 const s=e.scopes[0];keys(s,['sourceId','grade','semester','unitId','learningObjectiveIds','levels']);
 const unit=catalog.units.find(u=>u.sourceId===s.sourceId&&u.grade===s.grade&&u.semester===s.semester&&u.id===s.unitId&&u.subject===e.subject);
 if(!unit)fail('학년·학기·단원의 소속을 확인할 수 없어요.');
 const ids=s.learningObjectiveIds;
 if(!Array.isArray(ids)||!ids.length||ids.length>40||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!unit.objectives.some(o=>o.id===id)))fail('학습목표 ID가 선택한 단원에 없어요.');
 if(['korean-literacy','social-studies'].includes(e.subject)&&JSON.stringify([...s.levels].sort())!==JSON.stringify([...unit.levels].sort()))fail('국어·사회는 난이도 제한 없이 모든 수준을 함께 사용해요.');
 if(!Array.isArray(s.levels)||!s.levels.length||new Set(s.levels).size!==s.levels.length||s.levels.some(n=>!Number.isInteger(n)||!unit.levels.includes(n)))fail('공급하지 않는 학습 난이도예요.');
 if(ids.some(id=>!unit.objectives.find(o=>o.id===id).levels.some(n=>s.levels.includes(n))))fail('일부 학습목표에는 선택한 난이도 문항이 없어요.');
 return structuredClone(e);
}
export function makeLaunch(unit,ids,catalog,now=Date.now(),id=crypto.randomUUID()){
 const levels=['korean-literacy','social-studies'].includes(unit.subject)?[...unit.levels]:[...new Set(unit.objectives.filter(o=>ids.includes(o.id)).flatMap(o=>o.levels))].sort();
 const provider=catalog.providers[unit.subject];
 return validateLaunch({schemaVersion:VERSION,launchId:id,issuedAt:now,expiresAt:now+TTL,gameId:'cafe',intent:'new-study-session',providerId:'common-public',releaseRef:provider.releaseRef,manifestSHA256:provider.manifestSHA256,subject:unit.subject,scopes:[{sourceId:unit.sourceId,grade:unit.grade,semester:unit.semester,unitId:unit.id,learningObjectiveIds:[...ids],levels}]},catalog,now);
}
export function encodeLaunch(e,catalog,now=Date.now()){
 const bytes=new TextEncoder().encode(JSON.stringify(validateLaunch(e,catalog,now)));if(bytes.length>4500)fail('선택 범위가 너무 커요.');
 const data=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');if(data.length>MAX)fail('실행 링크가 너무 길어요.');return '#sqLaunch='+data;
}
// Reject duplicate JSON keys, including escaped spellings. JSON.parse alone loses them.
function uniqueJSONKeys(text){
 let i=0;const ws=()=>{while(/\s/.test(text[i]??'')&&i<text.length)i++;};
 const str=()=>{const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"')return JSON.parse(text.slice(start,i));}fail('JSON 문자열이 잘못됐어요.');};
 const value=()=>{ws();const ch=text[i];if(ch==='{'){i++;ws();const seen=new Set();if(text[i]==='}'){i++;return;}while(i<text.length){ws();const k=str();if(seen.has(k))fail('중복된 JSON 필드는 허용하지 않아요.');seen.add(k);ws();i++;value();ws();if(text[i++]==='}')return;}}else if(ch==='['){i++;ws();if(text[i]===']'){i++;return;}while(i<text.length){value();ws();if(text[i++]===']')return;}}else if(ch==='"')str();else{while(i<text.length&&!/[\s,}\]]/.test(text[i]))i++;}};value();
}
export function decodeLaunch({hash='',href=''},catalog,now=Date.now()){
 if(!hash.startsWith('#sqLaunch')){if(/^#sq(?:math)?=/.test(hash))fail('이전 시험판 링크예요. 포털에서 다시 선택해 주세요.');return null;}
 if((href&&href.length>8192)||!/^#sqLaunch=[A-Za-z0-9_-]+$/.test(hash)||hash.length>MAX+10)fail('실행 링크의 인코딩이나 길이가 올바르지 않아요.');
 const data=hash.slice(10);if(data.length%4===1)fail('실행 링크의 인코딩이 잘못됐어요.');
 let text,e;try{const bytes=Uint8Array.from(atob(data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));if(bytes.length>4500)fail('설정이 너무 커요.');const canonical=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');if(canonical!==data)fail('비정규 인코딩이에요.');text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);e=JSON.parse(text);}catch{fail('설정을 해독하지 못했어요.');}
 uniqueJSONKeys(text);return validateLaunch(e,catalog,now);
}

export function forGame(e,gameId,catalog,now=Date.now()){const p=catalog.providers[e.subject]?.games?.[gameId]??catalog.providers[e.subject];if(!p)fail('등록되지 않은 공급자예요.');return validateLaunch({...structuredClone(e),gameId,releaseRef:p.releaseRef,manifestSHA256:p.manifestSHA256},catalog,now);}
