import{loadCommonBank as coreLoad}from './approved-core.mjs';
import{assertOperationalManifest,digest}from './approval-gate.mjs';
export{memoryStorage,createLocalStorage,encode,decode,csvCell}from './legacy/runtime.mjs';
export const RUNTIME_VERSION='common-public-runtime/1.1.2-operational';
export async function loadCommonBank(options){
 if(!options||!['operational-supply','candidate-integration-test'].includes(options.purpose))throw Error('EXPLICIT_OPERATIONAL_USE_REQUIRED');
 if(await digest(options.manifestBytes)!==options.expectedManifestSHA256)throw Error('MANIFEST_HASH_MISMATCH');
 const manifest=JSON.parse(new TextDecoder().decode(options.manifestBytes)),cached=new Map(),readAsset=path=>{if(!cached.has(path))cached.set(path,Promise.resolve(options.readAsset(path)));return cached.get(path);},consumer=options.consumer??'common-bank',approval=await assertOperationalManifest(manifest,readAsset,consumer),core=await coreLoad({...options,readAsset});
 if(core.groups.length!==approval.scope.groups||core.info.subjects.join(',')!==approval.scope.subject)throw Error('UNAPPROVED_DOMAIN_OR_GROUPS');
 const metadata={runtimeVersion:RUNTIME_VERSION,operational:true,operationalApproval:true,approvalId:approval.approvalId,engineABIPreserved:true};
 const wrap=bank=>({...bank,info:{...bank.info,...metadata},getQuestion(ref){const q=bank.getQuestion(ref);return{...q,metadata:{...q.metadata,...metadata}};},operationalSupply(scope){if(!scope)throw Error('EXPLICIT_SELECTED_SCOPE_REQUIRED');return{status:'approved',subject:approval.scope.subject,approvalId:approval.approvalId,items:bank.getCandidates(scope).map(c=>this.getQuestion(c.questionRef))};}});
 return{...core,info:{...core.info,...metadata},createBank:options=>wrap(core.createBank(options))};
}
export async function loadCommonBankFromURL(baseURL,{expectedManifestSHA256,consumer,purpose,subject='math',manifestPath}={}){
 if(!['math','science'].includes(subject))throw Error('SUBJECT_NOT_OPERATIONALLY_APPROVED');
 const base=new URL(baseURL,globalThis.location?.href),readAsset=async path=>{if(!/^[a-zA-Z0-9_./-]+$/.test(path)||path.includes('..'))throw Error('UNSAFE_ASSET_PATH');const url=new URL(path,base);if(url.origin!==base.origin)throw Error('CROSS_ORIGIN_ASSET');const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('ASSET_HTTP_FAILURE');return new Uint8Array(await response.arrayBuffer());};
 const runtime=await loadCommonBank({manifestBytes:await readAsset(manifestPath??subject+'-manifest.json'),expectedManifestSHA256,readAsset,consumer,purpose});if(runtime.info.subjects.join(',')!==subject)throw Error('SELECTED_SUBJECT_MISMATCH');return runtime;
}
