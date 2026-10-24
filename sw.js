/* 読書帳 service worker: アプリ本体を端末に保存し、電波がなくても開けるようにする */
const VERSION='dokushocho-v6';
const SHELL=['./','index.html','zxing.min.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!=='dk-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  // フォントは一度読み込んだら保存
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open('dk-fonts').then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r.ok||r.type==='opaque')c.put(e.request,r.clone());return r}catch{return new Response('',{status:503})}}));return;
  }
  if(u.origin!==location.origin)return; // 本の情報APIは常にネットへ
  // アプリ本体：ネット優先（更新を反映）→ だめなら保存分
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cl=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cl))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
