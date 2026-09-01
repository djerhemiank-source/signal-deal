(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .sd-radar-status{margin:14px 0;padding:13px 15px;border:1px solid #2f466a;background:linear-gradient(135deg,#0f2138,#0c192c);border-radius:13px;color:#d8e6fb;font-size:10px;line-height:1.5}
    .sd-radar-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.sd-radar-head strong{font-size:12px;color:#9fe3ff}.sd-radar-total{font-size:18px;font-weight:950;color:#5be39d}.sd-radar-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.sd-radar-tag{border:1px solid #334c70;background:#12223c;border-radius:999px;padding:5px 8px}.sd-radar-time{color:#8ea4c5;margin-top:7px}.sd-radar-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#5be39d;margin-right:5px}
  `;
  document.head.appendChild(style);

  function esc(v){try{return escapeHtml(String(v??''))}catch(e){return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]))}}
  function target(){return document.getElementById('sdPersonal')||document.getElementById('dashboard')?.querySelector('.dashhead')||null}
  function fmtDate(v){if(!v)return 'indisponible';const d=new Date(v);if(Number.isNaN(d.getTime()))return 'indisponible';return d.toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}

  async function load(){
    if(!session?.user?.id)return;
    const {data,error}=await client.rpc('get_radar_status');
    if(error)return;
    const r=Array.isArray(data)?data[0]:data;if(!r)return;
    const host=target();if(!host)return;
    let el=document.getElementById('sdRadarStatus');if(!el){el=document.createElement('div');el.id='sdRadarStatus';el.className='sd-radar-status';host.insertAdjacentElement('afterend',el)}
    el.innerHTML='<div class="sd-radar-head"><strong><span class="sd-radar-dot"></span>Radar ZoneProspect 360 opérationnel</strong><span class="sd-radar-total">'+Number(r.unique_active||0).toLocaleString('fr-FR')+' signaux actifs uniques</span></div>'+
      '<div class="sd-radar-tags"><span class="sd-radar-tag">BOAMP : '+esc(r.boamp_unique||0)+'</span><span class="sd-radar-tag">TED : '+esc(r.ted_unique||0)+'</span><span class="sd-radar-tag">DECP : '+esc(r.decp_unique||0)+' renouvellements probables</span><span class="sd-radar-tag">Actualisation auto : toutes les 6 h</span></div>'+
      '<div class="sd-radar-time">Dernière ingestion détectée : '+esc(fmtDate(r.last_ingested_at))+'. Les doublons et échéances dépassées sont exclus du total.</div>';
  }

  let lastUser='';
  function init(){if(!session?.user?.id)return;if(lastUser===session.user.id&&document.getElementById('sdRadarStatus'))return;lastUser=session.user.id;load()}
  const obs=new MutationObserver(init);obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  setInterval(init,1800);setTimeout(init,700);
})();