const valid=/^[a-f0-9]{64}$/;
export async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function assertOperationalManifest(manifest,readAsset,consumer){
 const fail=(x,m)=>{if(!x)throw Error(m);},ref=manifest.operationalApprovalRecord;
 fail(manifest.operationalApproval===true&&ref&&ref.path==='operational-approval.json'&&valid.test(ref.sha256),'OPERATIONAL_APPROVAL_RECORD_REQUIRED');
 const bytes=await readAsset(ref.path);fail(await digest(bytes)===ref.sha256,'OPERATIONAL_APPROVAL_RECORD_HASH');const approval=JSON.parse(new TextDecoder().decode(bytes));
 fail(approval.schemaVersion==='common-learning-operational-approval/1'&&approval.status==='APPROVED_EXACT_SCOPE'&&approval.scope.subject==='math'&&approval.allowedConsumers.includes(consumer),'OPERATIONAL_SCOPE_OR_CONSUMER');
 const s=approval.scope,asset=manifest.files.find(f=>f.role==='approved-data');fail(asset&&s.packId===manifest.packId&&s.dataVersion===manifest.dataVersion&&s.stableContentVersion===manifest.catalogDigest&&s.transportDataSHA256===asset.sha256&&s.transportBytes===asset.bytes,'OPERATIONAL_ARTIFACT_BINDING');
 fail(approval.teacherReview.status==='verified-existing-exact-scope'&&approval.rights.status==='cleared-project-original-exact-assets'&&approval.exclusions.quarantineConditions===59&&approval.exclusions.heldBundles===1&&approval.exclusions.internalArchiveRecords===33,'OPERATIONAL_EVIDENCE_REQUIRED');
 fail(s.objects===manifest.counts.objects&&s.groups===manifest.counts.groups&&s.objects===49233&&s.groups===943,'OPERATIONAL_COUNTS');
 fail(manifest.policyImplementationDigest===approval.engineABI.implementationHash&&manifest.engineABIFile==='legacy/runtime.mjs','ENGINE_ABI_BINDING');
 fail(manifest.engineABIDataSHA256===s.sourceContentArtifactSHA256&&manifest.engineABIDataSHA256===s.stableContentVersion,'ENGINE_ABI_DATA_BINDING');
 for(const file of approval.runtimeFiles){fail(valid.test(file.sha256)&&/^[a-zA-Z0-9_./-]+$/.test(file.path)&&!file.path.includes('..'),'UNSAFE_APPROVED_RUNTIME');const b=await readAsset(file.path);fail(b.byteLength===file.bytes&&await digest(b)===file.sha256,'APPROVED_RUNTIME_HASH:'+file.path);}
 return approval;
}
