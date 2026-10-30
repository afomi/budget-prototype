(() => {
"use strict";
const F=BudgetFlow,$=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=cents=>"$"+(cents/100).toFixed(2);
const lifecycleDefinition=JSON.parse($("lifecycle-definition").textContent);
function artifactIcon(name){
 return '<svg class="artifact-glyph" aria-hidden="true"><use href="#artifact-'+esc(name)+'"></use></svg>';
}
function renderArtifact(activity){
 const a=activity.artifact;
 let html='<div class="artifact-preview '+(a.kind==="screen"?"artifact-screen":"")+'"><div class="artifact-preview-heading">'+artifactIcon(a.icon)+'<div><span class="artifact-sample">FICTIONAL SAMPLE</span><h4>'+esc(a.title)+'</h4></div></div><p class="artifact-reference">'+esc(a.reference)+'</p>';
 if(a.files)html+='<div class="artifact-files">'+a.files.map(file=>'<a href="'+esc(file.path)+'" download>'+artifactIcon("document")+'<span><strong>'+esc(file.title)+'</strong><small>'+esc(file.format)+'</small></span><span aria-hidden="true">↓</span></a>').join("")+'</div>';
 if(a.kind==="decision"){
  const d=a.decision;
  html+='<div class="decision-tree"><div class="decision-node">'+esc(d.start)+'</div><span class="decision-arrow" aria-hidden="true">↓</span><div class="decision-question">'+esc(d.question)+'</div><div class="decision-branches"><div><span>Yes ↓</span><div class="decision-node">'+esc(d.yes)+'</div></div><div><span>No ↓</span><div class="decision-node decision-hold">'+esc(d.no)+'</div></div></div><p>'+esc(d.remainder)+'</p></div>';
 }else{
  html+='<table class="artifact-table"><tbody>'+a.rows.map(([label,value])=>'<tr><th>'+esc(label)+'</th><td>'+esc(value)+'</td></tr>').join("")+'</tbody></table>';
  if(a.decisions)html+='<div class="artifact-directions">'+a.decisions.map(([issue,direction])=>'<p><strong>'+esc(issue)+'</strong> '+esc(direction)+'</p>').join("")+'</div>';
  html+='<p class="artifact-body">'+esc(a.body)+'</p>';
 }
 html+='<details class="artifact-draft"><summary>Read sample draft</summary><pre>'+esc(a.draft)+'</pre></details><a class="artifact-download" href="'+esc(a.download)+'" download>Download sample draft (.md) ↓</a></div>';
 $("lifecycle-artifact").innerHTML=html;
 $("lifecycle-example-format").textContent=a.format;
 $("lifecycle-example-source").innerHTML=a.source_url?'<a href="'+esc(a.source_url)+'" target="_blank" rel="noreferrer">'+esc(a.source_label)+' ↗</a>':"";
}
function selectActivity(index){
 const activity=lifecycleDefinition.activities[index];if(!activity)return;
 document.querySelectorAll("[data-activity-id]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.activityId===activity.id)));
 $("lifecycle-example-step").textContent="EXAMPLE "+(index+1)+" OF "+lifecycleDefinition.activities.length+" · BRIDGE-REPAIR PROGRAM";
 $("lifecycle-example-title").textContent=activity.name;
 $("lifecycle-example-text").textContent=activity.example;
 $("lifecycle-example-document").textContent=activity.example_document;
 renderArtifact(activity);
}
document.querySelectorAll("[data-activity-id]").forEach(button=>button.addEventListener("click",()=>{
 selectActivity(lifecycleDefinition.activities.findIndex(activity=>activity.id===button.dataset.activityId));
}));
selectActivity(0);
const diagramLink=$("open-lifecycle-diagram"),diagramModal=$("lifecycle-diagram-modal");
diagramLink.addEventListener("click",event=>{
 if(typeof diagramModal.showModal!=="function")return;
 event.preventDefault();diagramModal.showModal();
 diagramLink.setAttribute("aria-expanded","true");document.documentElement.classList.add("modal-open");
});
$("close-lifecycle-diagram").addEventListener("click",()=>diagramModal.close());
diagramModal.addEventListener("click",event=>{
 if(event.target!==diagramModal)return;
 const bounds=diagramModal.getBoundingClientRect();
 if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)diagramModal.close();
});
diagramModal.addEventListener("close",()=>{
 diagramLink.setAttribute("aria-expanded","false");document.documentElement.classList.remove("modal-open");
 diagramLink.focus({preventScroll:true});
});

let demo,selected="PAY-001",attempt=0,busy=false;
function message(text,error=false){$("flow-message").textContent=text;$("flow-message").className=error?"flow-message error":"flow-message";}
function save(name,value){
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+"\n"],{type:"application/json"})),link=document.createElement("a");
 link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const labels={appropriation:"Appropriation",apportionment:"Apportionment",allotment:"Allotment",obligation:"Obligation",disbursement:"Payment"};
function render(){
 const balances=demo.balances(),records=demo.accepted(),adjusted=records.some(r=>r.id==="AP-002");
 $("flow-stages").innerHTML=Object.entries(labels).map(([type,label])=>{
  const record=type==="apportionment"&&adjusted?records.find(r=>r.id==="AP-002"):records.find(r=>r.type===type);
  return '<button type="button" class="flow-stage '+(record?"recorded":"")+'" data-select="'+(record?.id||"")+'" '+(!record?"disabled":"")+'><span>'+label+"</span><strong>"+money(balances[type])+"</strong><small>"+(record?esc(record.id):"Pending")+(type==="apportionment"&&adjusted?" · revised from $2.50":"")+"</small></button>";
 }).join("");
 $("exception-count").textContent=demo.exceptions.length;
 $("flow-count").textContent=demo.receipts.length+" verified receipts";
 $("flow-events").innerHTML=demo.receipts.map(receipt=>{
  const source=records.find(r=>r.id===receipt.event_id);
  return '<tr class="'+(selected===source.id?"selected":"")+'"><td><button type="button" class="text-button" data-select="'+source.id+'">'+source.id+"</button></td><td>"+esc(source.type)+"</td><td>"+money(source.amount_cents)+"</td><td>"+esc(source.authority_id||"—")+"</td><td>"+esc(source.revises||"—")+"</td><td>"+esc(receipt.source_signer)+"</td></tr>";
 }).join("");
 $("flow-exceptions").innerHTML=demo.exceptions.length?demo.exceptions.map(item=>'<article class="exception"><strong>'+esc(item.event_id)+" · "+esc(item.event_type)+"</strong><p>"+esc(item.reason)+'</p><small>'+esc(item.source_signer)+" · evidence not appended · needs review</small></article>").join(""):'<p class="micro">No exceptions. Try an invalid event above.</p>';
 const current=records.find(r=>r.id===selected)||records.at(-1);
 if(current){
  selected=current.id;
  const receipt=demo.receipts.find(r=>r.event_id===selected),trace=demo.trace(selected);
  $("trace-title").textContent="Trace "+selected;
  $("flow-trace").innerHTML=trace.map(r=>'<button type="button" data-select="'+r.id+'"><strong>'+r.id+"</strong><span>"+esc(r.type)+"</span><small>"+money(r.amount_cents)+"</small></button>").join('<span class="trace-arrow" aria-hidden="true">→</span>');
  $("source-record").textContent=JSON.stringify(current,null,2);
  $("evidence-record").textContent=JSON.stringify(receipt,null,2);
  $("verification-note").textContent="Source digest and both signatures were checked before this receipt was recorded. "+(current.revises?"This decision revises "+current.revises+"; the original remains in the history.":"Its parent references lead back to the original appropriation.");
 }
 $("run-basic").disabled=busy||F.scenario.every(r=>records.some(old=>old.id===r.id));
 $("apply-adjustment").disabled=busy||!F.scenario.every(r=>records.some(old=>old.id===r.id))||adjusted;
 document.querySelectorAll("[data-invalid]").forEach(button=>button.disabled=busy||!records.some(r=>r.id==="PAY-001"));
 $("audit-flow").disabled=busy;
 ["export-flow","export-sources","reset-flow"].forEach(id=>$(id).disabled=busy);
 $("remainder-note").textContent="Unapportioned: "+money(balances.appropriation-balances.apportionment)+" · Unallotted: "+money(balances.apportionment-balances.allotment)+" · Available allotment: "+money(balances.allotment-balances.obligation)+" · Unpaid obligation: "+money(balances.obligation-balances.disbursement);
}
const act=fn=>async event=>{
 event?.preventDefault();if(busy||!demo)return;busy=true;render();
 try{await fn(event);}catch(error){message(error.message,true);}finally{busy=false;render();}
};
async function remaining(){
 for(const event of F.scenario)if(!demo.accepted().some(old=>old.id===event.id)){
  const result=await demo.submit(event);if(!result.accepted)throw new Error(result.exception.reason);
 }
 selected="PAY-001";
}
$("run-basic").addEventListener("click",act(async()=>{await remaining();message("Basic flow recorded. Select the payment to follow its authority back to the appropriation.");}));
$("apply-adjustment").addEventListener("click",act(async()=>{
 const result=await demo.submit(F.adjustment);
 if(!result.accepted)throw new Error(result.exception.reason);
 selected="AP-002";message("Approved reapportionment recorded: $2.50 → $3.00. AP-001 and its original receipt are preserved.");
}));
document.querySelectorAll("[data-invalid]").forEach(button=>button.addEventListener("click",act(async()=>{
 const kind=button.dataset.invalid,id="FLAG-"+String(++attempt).padStart(3,"0");
 let record,options={};
 if(kind==="excess")record=F.record(id,"obligation",200,"AL-001");
 if(kind==="source"){record=F.record(id,"obligation",10,"AL-001");options={source:"untrusted-importer"};}
 if(kind==="approval"){record=F.record(id,"obligation",10,"AL-001");options={approve:false};}
 if(kind==="tamper"){record=F.record(id,"disbursement",5,"OB-001");options={tamper:true};}
 const result=await demo.submit(record,options);
 message(result.accepted?"Event recorded.":"Flagged: "+result.exception.reason,!result.accepted);
})));
document.addEventListener("click",event=>{const button=event.target.closest("[data-select]");if(button?.dataset.select){selected=button.dataset.select;render();}});
$("audit-flow").addEventListener("click",act(async()=>{
 const result=await F.audit(demo.bundle());
 message(result.verified+" receipts verified using public keys and source records: digests, source permissions, approval signatures, lineage, amounts, and receipt links match. "+demo.exceptions.length+" exceptions still need review.");
}));
$("export-flow").addEventListener("click",()=>{
 if(!demo)return;
 const {source_records,...evidence}=demo.bundle();
 save("verification-evidence.json",evidence);
});
$("export-sources").addEventListener("click",()=>{if(demo)save("source-records.json",demo.bundle().source_records);});
$("reset-flow").addEventListener("click",act(async()=>{
 demo=await F.createDemo();await demo.submit(F.scenario[0]);selected="A-001";attempt=0;
 message("Reset to the $10 appropriation with fresh session keys. Run the remaining events to rebuild the flow.");
}));
(async()=>{
 try{demo=await F.createDemo();await remaining();render();message("Basic flow ready. Select a decision, apply an adjustment, or submit an inconsistent event.");}
 catch(error){message(error.message,true);}
})();
})();
