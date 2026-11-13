const valid=/^[a-f0-9]{64}$/;
export async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function assertOperationalManifest(manifest,readAsset,consumer){
 const fail=(x,m)=>{if(!x)throw Error(m);},ref=manifest.operationalApprovalRecord,subject=manifest.subjectId;
 fail(['math','science'].includes(subject),'SUBJECT_NOT_OPERATIONALLY_APPROVED');
 const expectedPath=subject==='math'?'operational-approval.json':'science-operational-approval.json';
 fail(manifest.operationalApproval===true&&ref&&ref.path===expectedPath&&valid.test(ref.sha256),'OPERATIONAL_APPROVAL_RECORD_REQUIRED');
 const bytes=await readAsset(ref.path);fail(await digest(bytes)===ref.sha256,'OPERATIONAL_APPROVAL_RECORD_HASH');const approval=JSON.parse(new TextDecoder().decode(bytes));
 fail(approval.schemaVersion==='common-learning-operational-approval/1'&&approval.status==='APPROVED_EXACT_SCOPE'&&approval.scope.subject===subject&&approval.allowedConsumers.includes(consumer),'OPERATIONAL_SCOPE_OR_CONSUMER');
 const s=approval.scope,asset=manifest.files.find(f=>f.role==='approved-data');fail(asset&&asset.path===subject+'-data.json'&&s.packId===manifest.packId&&s.dataVersion===manifest.dataVersion&&s.stableContentVersion===manifest.catalogDigest&&s.transportDataSHA256===asset.sha256&&s.transportBytes===asset.bytes,'OPERATIONAL_ARTIFACT_BINDING');
 fail(approval.teacherReview.status==='verified-existing-exact-scope'&&approval.rights.status==='cleared-project-original-exact-assets'&&approval.exclusions.unknownRightsAssetsAllowed===0,'OPERATIONAL_EVIDENCE_REQUIRED');
 const counts=subject==='math'?[49233,943]:[104,26];fail(s.objects===manifest.counts.objects&&s.groups===manifest.counts.groups&&s.objects===counts[0]&&s.groups===counts[1],'OPERATIONAL_COUNTS');
 if(subject==='math')fail(approval.exclusions.quarantineConditions===59&&approval.exclusions.heldBundles===1&&approval.exclusions.internalArchiveRecords===33,'MATH_EXCLUSIONS_REQUIRED');
 else fail(s.sourcePackId==='qb-science-g4-s2-u2-ecosystems'&&s.sourceVersion==='0.1.3'&&s.sourcePackSHA256==='edc88815e37327e5740bcb1f75a6a67674b6d8e98af4f8e6d557f6c235f4c9fb'&&approval.exclusions.openEndedGenerationAllowed===false,'SCIENCE_EXACT_104_SCOPE_REQUIRED');
 fail(manifest.policyImplementationDigest===approval.engineABI.implementationHash&&manifest.engineABIFile==='legacy/runtime.mjs','ENGINE_ABI_BINDING');
 fail(manifest.engineABIDataSHA256===s.sourceContentArtifactSHA256&&manifest.engineABIDataSHA256===s.stableContentVersion,'ENGINE_ABI_DATA_BINDING');
 for(const file of approval.runtimeFiles){fail(valid.test(file.sha256)&&/^[a-zA-Z0-9_./-]+$/.test(file.path)&&!file.path.includes('..'),'UNSAFE_APPROVED_RUNTIME');const b=await readAsset(file.path);fail(b.byteLength===file.bytes&&await digest(b)===file.sha256,'APPROVED_RUNTIME_HASH:'+file.path);}
 return approval;
}
