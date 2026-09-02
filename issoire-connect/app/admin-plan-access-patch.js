(()=>{
if(typeof S==='undefined')return;

function isIcAdmin(){return S.profile?.role==='admin'}
function elevateAdminPlans(){
  for(const key of ['myBusinesses','businesses']){
    for(const b of (S[key]||[])){
      if(!b)continue;
      if(isIcAdmin()){
        if(b.plan!=='proplus'){
          try{Object.defineProperty(b,'__icAdminOriginalPlan',{value:b.plan||'free',writable:true,configurable:true,enumerable:false})}catch(_){b.__icAdminOriginalPlan=b.plan||'free'}
          b.plan='proplus';
        }
      }else if(Object.prototype.hasOwnProperty.call(b,'__icAdminOriginalPlan')){
        b.plan=b.__icAdminOriginalPlan||'free';
        try{delete b.__icAdminOriginalPlan}catch(_){}
      }
    }
  }
}

const wrapNames=['newProduct','newOffer','newJob','newBusinessEvent','newAd','reserveOffer','orderProduct','openIcPlans'];
for(const name of wrapNames){
  const base=window[name];
  if(typeof base==='function')window[name]=function(...args){elevateAdminPlans();return base.apply(this,args)};
}

if(typeof window.proAccount==='function'){
  const baseProAccount=window.proAccount;
  window.proAccount=function(...args){
    elevateAdminPlans();
    const r=baseProAccount.apply(this,args);
    setTimeout(elevateAdminPlans,0);
    return r;
  };
}

if(typeof window.setIcBusinessRadius==='function'){
  const baseSetRadius=window.setIcBusinessRadius;
  window.setIcBusinessRadius=async function(id,km){
    elevateAdminPlans();
    if(!isIcAdmin())return baseSetRadius(id,km);
    km=Number(km);
    if(![2,5,10,20,30,50].includes(km))return typeof say==='function'?say('Rayon invalide.'):null;
    if(typeof sb==='undefined')return typeof say==='function'?say('Connexion indisponible.'):null;
    const {data,error}=await sb.rpc('ic_set_business_visibility_radius',{p_business_id:id,p_radius:km});
    if(error)return typeof say==='function'?say(error.message):null;
    for(const key of ['myBusinesses','businesses']){
      const b=(S[key]||[]).find(x=>x.id===id);
      if(b){b.visibility_radius_km=Number(data||km);b.plan='proplus'}
    }
    if(typeof say==='function')say(`Rayon administrateur réglé sur ${Number(data||km)} km.`);
    if(typeof proAccount==='function')proAccount();
    return data;
  };
}

window.icAdminHasAllPlans=()=>isIcAdmin();
elevateAdminPlans();
setInterval(elevateAdminPlans,1000);
})();
