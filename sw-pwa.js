const OLD_PREFIX='signal-deal-pwa-';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  try{
    for(const key of await caches.keys()) if(key.startsWith(OLD_PREFIX)) await caches.delete(key);
  }catch{}
  try{await self.registration.unregister()}catch{}
  try{const clients=await self.clients.matchAll({type:'window'});for(const client of clients) client.navigate(client.url)}catch{}
})()));
