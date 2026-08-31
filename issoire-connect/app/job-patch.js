(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
S.jobApplications=S.jobApplications||[];
S.receivedJobApplications=S.receivedJobApplications||[];
const _loadPrivateJobs=loadPrivate;
const _jobCardJobs=typeof jobCard==='function'?jobCard:null;
const _accountPageJobs=accountPage;
const _proAccountJobs=proAccount;

const statusLabel=s=>s==='accepted'?'✅ Retenue':s==='rejected'?'❌ Non retenue':s==='viewed'?'👀 Vue':'📨 Envoyée';
const myApp=jobId=>S.jobApplications.find(a=>a.job_id===jobId);
const ownedBusinessIds=()=>new Set((S.myBusinesses||[]).map(b=>b.id));
const ownedJob=id=>{const j=(S.jobs||[]).find(x=>x.id===id);return j&&ownedBusinessIds().has(j.business_id)?j:null};

loadPrivate=async function(){
 await _loadPrivateJobs();
 if(!S.session){S.jobApplications=[];S.receivedJobApplications=[];return}
 const uid=S.session.user.id;
 const [mine,received]=await Promise.all([
  sb.from('ic_job_applications').select('*').eq('applicant_id',uid).order('created_at',{ascending:false}),
  sb.rpc('ic_get_my_received_job_applications')
 ]);
 S.jobApplications=mine.data||[];
 S.receivedJobApplications=received.data||[];
};

function applyAction(job){
 if(!job?.id)return '';
 const a=myApp(job.id);
 if(a)return `<div class="notice" style="margin-top:8px"><b>${statusLabel(a.status)}</b> — candidature déjà enregistrée</div>`;
 return `<div class="actions" style="margin-top:8px"><button class="btn brand" onclick="event.stopPropagation();openJobApplication('${E(job.id)}')">💼 Postuler</button></div>`;
}

if(_jobCardJobs){
 jobCard=function(j){
  let h=_jobCardJobs(j);
  if(!h.includes('openJobApplication'))h=h.replace('</article>',`${applyAction(j)}</article>`);
  return h;
 };
}

window.openJobApplication=function(jobId){
 const j=(S.jobs||[]).find(x=>x.id===jobId);if(!j)return say('Offre introuvable.');
 if(!S.session){say('Connectez-vous pour postuler à cette offre.');authModal('jobs');return}
 if(ownedJob(jobId))return say('Vous ne pouvez pas postuler à une offre de votre propre établissement.');
 const existing=myApp(jobId);
 if(existing)return openModal(`<h2>💼 Ma candidature</h2><p><b>${E(j.title)}</b></p><div class="notice">Statut : <b>${statusLabel(existing.status)}</b><br>Envoyée le ${new Date(existing.created_at).toLocaleString('fr-FR')}</div>${existing.message?`<p>${E(existing.message)}</p>`:''}`);
 openModal(`<h2>💼 Postuler — ${E(j.title)}</h2><p class="muted">Votre candidature sera visible uniquement par vous, l’entreprise concernée et l’administration Issoire Connect.</p><div class="form"><label>Message de candidature</label><textarea id="jobApplyMessage" rows="6" maxlength="3000" placeholder="Présentez-vous brièvement, indiquez vos disponibilités et, si vous le souhaitez, vos coordonnées de contact."></textarea><button class="btn brand" onclick="submitJobApplication('${E(jobId)}')">📨 Envoyer ma candidature</button></div>`)
};

window.submitJobApplication=async function(jobId){
 if(!S.session)return authModal('jobs');
 if(myApp(jobId))return say('Vous avez déjà postulé à cette offre.');
 if(ownedJob(jobId))return say('Vous ne pouvez pas postuler à votre propre offre.');
 const message=$('#jobApplyMessage')?.value.trim()||null;
 const {data,error}=await sb.from('ic_job_applications').insert({job_id:jobId,applicant_id:S.session.user.id,message,status:'sent'}).select('*').single();
 if(error){if(/duplicate|unique/i.test(error.message||''))return say('Vous avez déjà postulé à cette offre.');return say(error.message)}
 S.jobApplications.unshift(data);closeModal();say('Candidature envoyée. Vous pouvez suivre son statut dans votre compte.');
};

function myApplicationsSection(){
 const rows=S.jobApplications||[];
 return `<div class="sectionhead"><div><h2>💼 Mes candidatures</h2><p>Suivez l’état de vos candidatures envoyées.</p></div><span class="pill">${rows.length}</span></div>${rows.length?`<div class="cards">${rows.map(a=>{const j=(S.jobs||[]).find(x=>x.id===a.job_id);return `<article class="card"><span class="pill">${statusLabel(a.status)}</span><h3>${E(j?.title||'Offre d’emploi')}</h3><div class="muted">${E(j?.location||'Issoire')} · ${new Date(a.created_at).toLocaleDateString('fr-FR')}</div>${a.message?`<p>${E(a.message)}</p>`:''}</article>`}).join('')}</div>`:'<div class="empty">Vous n’avez envoyé aucune candidature.</div>'}`;
}

function receivedApplicationsSection(){
 const rows=S.receivedJobApplications||[];
 return `<div class="sectionhead"><div><h2>📥 Candidatures reçues</h2><p>Consultez et traitez les candidatures de vos propres offres.</p></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(a=>{const j=(S.jobs||[]).find(x=>x.id===a.job_id);return `<article class="card" style="margin-bottom:10px"><div class="row between"><div><span class="pill">${statusLabel(a.status)}</span><h3>${E(a.applicant_name||'Candidat')}</h3></div><div class="muted">${new Date(a.created_at).toLocaleString('fr-FR')}</div></div><div><b>${E(j?.title||'Offre d’emploi')}</b></div>${a.message?`<p>${E(a.message)}</p>`:'<p class="muted">Aucun message joint.</p>'}<div class="actions"><button class="btn" onclick="setJobApplicationStatus('${E(a.application_id)}','viewed')">👀 Vue</button><button class="btn green" onclick="setJobApplicationStatus('${E(a.application_id)}','accepted')">✅ Retenir</button><button class="btn" onclick="setJobApplicationStatus('${E(a.application_id)}','rejected')">❌ Refuser</button></div></article>`}).join(''):'<div class="empty">Aucune candidature reçue pour le moment.</div>'}`;
}

window.setJobApplicationStatus=async function(applicationId,status){
 if(!S.session)return;
 if(!['viewed','accepted','rejected'].includes(status))return say('Statut invalide.');
 const row=S.receivedJobApplications.find(x=>x.application_id===applicationId);if(!row)return say('Candidature introuvable.');
 if(!ownedJob(row.job_id))return say('Accès refusé.');
 const {error}=await sb.from('ic_job_applications').update({status}).eq('id',applicationId);
 if(error)return say(error.message);
 S.receivedJobApplications=S.receivedJobApplications.map(x=>x.application_id===applicationId?{...x,status}:x);say('Statut de candidature mis à jour.');go('account');
};

accountPage=function(){
 const out=_accountPageJobs();
 if(!S.session||S.profile?.role==='admin')return out;
 try{main.insertAdjacentHTML('beforeend',myApplicationsSection())}catch(e){console.error('Issoire Connect applicant account render',e)}
 return out;
};

proAccount=function(){
 const out=_proAccountJobs();
 if(!S.session)return out;
 try{main.insertAdjacentHTML('beforeend',receivedApplicationsSection())}catch(e){console.error('Issoire Connect received applications render',e)}
 return out;
};
})();
