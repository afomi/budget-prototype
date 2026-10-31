(() => {
'use strict';
const $=id=>document.getElementById(id),c=JSON.parse($('city-case').textContent),execution=JSON.parse($('flow-fixture').textContent),github=JSON.parse($('city-github').textContent),F=BudgetFlow;
const escape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2,minimumFractionDigits:0}).format(n/100),url=p=>(document.body.dataset.siteRoot||'/')+p.replace(/^\//,'');
const key='budget-case:'+c.id,labels={appropriation:'Work-package limit',apportionment:'Period release',reapportionment:'Revised release',allotment:'Work order',obligation:'Commitment',disbursement:'Payment'};
const reviewLabels={not_submitted:'Not submitted',awaiting_review:'Awaiting independent review',ready_to_merge:'Reviewed; merge pending',approved:'Document approved',merged_unverified:'Merged; approval unverified',closed:'Closed without approval'};
let demo=null,bundle=null,busy=false;
function save(name,value){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function message(s,error=false){if($('city-message')){$('city-message').textContent=s;$('city-message').className='flow-message'+(error?' error':'');}}
function persist(){bundle={...demo.bundle(),document_head_sha:github.pull_request?.head_commit_sha||null};try{localStorage.setItem(key,JSON.stringify(bundle));}catch{}publish();}
function records(){return bundle?.source_records.filter(s=>s.accepted).map(s=>s.record)||[];}
function describeNode(id){
 if(id==='Task_Formulate')return 'Request package prepared; no funding approval asserted.';
 if(id==='Task_OpenPR')return github.pull_request?'Real GitHub PR #'+github.pull_request.number+' · '+reviewLabels[github.status]:'GitHub PR not submitted yet.';
 if(['Task_Review','Task_Merge'].includes(id))return 'GitHub: '+reviewLabels[github.status]+'. Snapshot '+(github.fetched_at||'not fetched')+'.';
 const stage=c.stages.find(s=>s.element===id),recordId=id==='Task_Adjust'?'AP-002':stage?.record_id;
 if(recordId)return records().some(r=>r.id===recordId)?'Recorded in the local simulated replay · '+recordId+'.':'Pending in the local replay · '+recordId+'.';
 if(['Task_Accept','Task_Pay'].includes(id))return records().some(r=>r.id==='PAY-001')?'Accepted work/payment represented by the simulated PAY-001 record.':'Simulated work acceptance/payment pending.';
 return 'Pending / illustrative step. This browser does not execute a government workflow.';
}
function publish(){render();window.dispatchEvent(new CustomEvent('city-case:change'));}
function render(){
 document.querySelectorAll('[data-review-status]').forEach(el=>el.textContent=reviewLabels[github.status]);
 if(!$('case-stages'))return;
 $('case-review-detail').textContent=github.pull_request?'PR #'+github.pull_request.number+' · '+github.pull_request.head_commit_sha.slice(0,12)+'. Review and merge evidence are fetched from GitHub; local replay controls do not change this status.':'The request is prepared. GitHub review has not been submitted yet.';
 $('case-review-blockers').innerHTML=github.blockers.map(s=>'<li>'+escape(s)+'</li>').join('');$('case-review-asof').textContent=github.fetched_at?'GitHub snapshot fetched '+github.fetched_at:'No GitHub snapshot yet.';
 if(github.pull_request)$('case-pr-link').href=github.pull_request.url;
 $('case-export-approval').disabled=!github.approval_manifest;
 const currentState=!github.pull_request?'request':github.status!=='approved'?'review':c.stages.find(s=>s.record_id&&!records().some(r=>r.id===s.record_id))?.id||'closeout';
 for(const s of c.stages){const done=s.record_id&&records().some(r=>r.id===s.record_id),label=s.status==='github'?reviewLabels[github.status]:s.status==='prepared'?'Prepared':done?'Recorded · simulation':'Pending';document.querySelectorAll('[data-case-state-list] [data-state-id="'+s.id+'"]').forEach(a=>{a.querySelector('[data-state-status]').textContent=label;if(s.id===currentState)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');if(s.artifact==='github'&&github.pull_request)a.href=github.pull_request.url;});}
 const rs=records(),latestRelease=[...rs].reverse().find(r=>['apportionment','reapportionment'].includes(r.type));const values={appropriation:rs.find(r=>r.type==='appropriation')?.amount_cents||0,apportionment:latestRelease?.amount_cents||0,allotment:rs.filter(r=>r.type==='allotment').reduce((n,r)=>n+r.amount_cents,0),obligation:rs.filter(r=>r.type==='obligation').reduce((n,r)=>n+r.amount_cents,0),disbursement:rs.filter(r=>r.type==='disbursement').reduce((n,r)=>n+r.amount_cents,0)};
 $('city-balances').innerHTML=Object.entries(values).map(([t,n])=>'<div class="flow-stage"><span>'+labels[t]+'</span><strong>'+money(n)+'</strong><small>SIMULATED</small></div>').join('');
 $('city-records').innerHTML=rs.map(r=>'<tr><td>'+escape(r.id)+'</td><td>'+labels[r.type]+'</td><td>'+money(r.amount_cents)+'</td><td>'+escape(r.authority_id||'Request '+c.id)+'</td><td>'+escape(r.revises||'—')+'</td></tr>').join('');
 $('city-trace').innerHTML=execution.records.filter(r=>rs.some(s=>s.id===r.id)).map(r=>'<span><strong>'+r.id+'</strong> · '+labels[r.type]+'</span>').join('<span aria-hidden="true">→</span>');
 $('city-exception-count').textContent=bundle?.exceptions.length||0;$('city-exceptions').innerHTML=bundle?.exceptions.length?bundle.exceptions.map(e=>'<article class="exception"><strong>'+escape(e.event_id)+'</strong><p>'+escape(e.reason)+'</p><small>Flagged · no receipt appended</small></article>').join(''):'<p class="micro">No exceptions. Try the excessive commitment after starting a replay.</p>';
 $('city-adjust').disabled=busy||!demo||rs.some(r=>r.id==='AP-002');$('city-invalid').disabled=busy||!demo;$('city-run').disabled=busy;$('city-audit').disabled=busy||!bundle;
 ['city-export-evidence','city-export-sources'].forEach(id=>$(id).disabled=!bundle);
}
function action(fn){return async()=>{if(busy)return;busy=true;render();try{await fn();}catch(e){message(e.message,true);}finally{busy=false;publish();}};}
async function init(){
 try{const saved=localStorage.getItem(key);if(saved){const candidate=JSON.parse(saved);if(candidate.instance_id!==c.id||candidate.document_head_sha!==(github.pull_request?.head_commit_sha||null))throw Error('Saved replay belongs to another case or document version.');await F.audit(candidate);bundle=candidate;message('Saved replay verified. Start a fresh replay to make new simulated decisions.');}else message('GitHub approval is separate. Start a local replay to inspect the proposed execution.');}catch{try{localStorage.removeItem(key);}catch{}message('Saved replay could not be verified. Start a fresh replay.',true);}
 publish();
 if(!$('city-run'))return;
 $('city-run').addEventListener('click',action(async()=>{demo=await F.createDemo({roles:execution.roles,definition:execution});for(const r of execution.records){const result=await demo.submit(r);if(!result.accepted)throw Error(result.exception.reason);}persist();message('Five simulated records verified. Trace PAY-001 to the work-package limit. GitHub approval remains '+reviewLabels[github.status]+'.');}));
 $('city-adjust').addEventListener('click',action(async()=>{const result=await demo.submit(execution.authorized_adjustment);if(!result.accepted)throw Error(result.exception.reason);persist();message('AP-002 recorded: $2,500 → $3,000. AP-001 and its receipt remain in the history.');}));
 $('city-invalid').addEventListener('click',action(async()=>{const attempt={...execution.invalid_obligation,id:'FLAG-'+String(demo.exceptions.length+1).padStart(3,'0')};const r=await demo.submit(attempt);persist();message('Flagged: '+r.exception.reason,true);}));
 $('city-audit').addEventListener('click',action(async()=>{const result=await F.audit(bundle);message(result.verified+' simulated receipts verified against the source records and demo public-key registry.');}));
 $('city-export-sources').addEventListener('click',()=>save(c.id+'-source-records.json',bundle.source_records));
 $('city-export-evidence').addEventListener('click',()=>{const {source_records,...evidence}=bundle;save(c.id+'-evidence.json',{...evidence,document_reference:github.pull_request,document_hashes:github.document_hashes||[],real_document_approval:github.approval_manifest,approval_mode:'Local replay approval signatures are simulated; consult real_document_approval separately.'});});
 $('case-export-review').addEventListener('click',()=>save(c.id+'-github-snapshot.json',github));$('case-export-approval').addEventListener('click',()=>{if(github.approval_manifest)save(c.id+'-approval.json',github.approval_manifest);});
 $('city-clear').addEventListener('click',()=>{try{localStorage.removeItem(key);}catch{}demo=null;bundle=null;publish();message('Saved replay cleared. GitHub review status is unchanged.');});
}
window.addEventListener('message',event=>{const frame=$('case-process-frame');if(event.origin!==location.origin||event.source!==frame?.contentWindow||event.data?.type!=='budget-case-node')return;const el=$('case-diagram-selection');if(el)el.textContent=describeNode(event.data.node_id);});
window.CityCase={case:c,execution,github,describeNode,get bundle(){return bundle;},get records(){return records();},ready:null};window.CityCase.ready=init();
})();
