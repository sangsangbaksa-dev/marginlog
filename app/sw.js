var V='marginlog-v11',F=['./','index.html','style.css','config.js','core.js','ai.js','i18n.js','license.js','app.js','manifest.json','../icon.svg','../icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(F)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==V}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
/* Successful same-origin GET responses only. /api is excluded so a license status is never served from this cache. */
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url;try{url=new URL(e.request.url)}catch(err){return}
  if(url.origin!==self.location.origin)return;
  if(url.pathname==='/api'||url.pathname.indexOf('/api/')===0)return;
  e.respondWith(fetch(e.request).then(function(r){
    if(r&&r.ok&&r.type==='basic'){var c=r.clone();caches.open(V).then(function(x){return x.put(e.request,c)}).catch(function(){})}
    return r;
  }).catch(function(){return caches.match(e.request)}));
});
