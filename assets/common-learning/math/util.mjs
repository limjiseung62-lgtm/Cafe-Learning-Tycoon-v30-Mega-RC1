export const canonical=v=>JSON.stringify(sort(v));function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,sort(x)])):v;}
export const clone=v=>structuredClone(v);export function requireThat(v,m){if(!v)throw Error(m);}
export async function sha(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof v==='string'?v:canonical(v)));return [...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');}
// Same percentage rule as the existing common LearningAnalytics helper.
export const accuracy=c=>c.attempted?Math.round(c.correct/c.attempted*1000)/10:null;
export const safeId=v=>typeof v==='string'&&/^[a-zA-Z0-9:_-]{4,160}$/.test(v);
export function text(v,max=300){requireThat(typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f]/.test(v),'INVALID_SCOPE_TEXT');return v;}
export function noIdentity(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){requireThat(!['studentName','className','studentId','email','displayIdentity'].includes(k),'IDENTITY_IS_DISPLAY_ONLY');noIdentity(x);}}
export const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]??0),0);
