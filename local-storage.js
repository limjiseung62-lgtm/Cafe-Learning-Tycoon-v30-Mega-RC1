// Runs before any v3 module. Original deployment feature gates and save format stay intact.
const prefix='schoolquest.approved400.cafe.local.v1/';
if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('이 복제본은 로컬 Pilot 주소에서만 실행해요.');
const p=Storage.prototype,read=p.getItem,write=p.setItem,remove=p.removeItem,key=p.key;
p.getItem=function(k){return read.call(this,prefix+k);};
p.setItem=function(k,v){write.call(this,prefix+k,v);};
p.removeItem=function(k){remove.call(this,prefix+k);};
p.key=function(index){const keys=[];for(let n=0;n<this.length;n++){const k=key.call(this,n);if(k?.startsWith(prefix))keys.push(k.slice(prefix.length));}return keys[index]??null;};
p.clear=function(){const keys=[];for(let n=0;n<this.length;n++){const k=key.call(this,n);if(k?.startsWith(prefix))keys.push(k);}for(const k of keys)remove.call(this,k);};
const open=indexedDB.open.bind(indexedDB);indexedDB.open=(name,version)=>open(prefix+name,version);
addEventListener('storage',e=>{if(e.key?.startsWith(prefix))dispatchEvent(new StorageEvent('storage',{key:e.key.slice(prefix.length),oldValue:e.oldValue,newValue:e.newValue,url:e.url,storageArea:e.storageArea}));});
