(() => {
  "use strict";
  const R=BudgetReview,$=id=>document.getElementById(id);
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2,minimumFractionDigits:cents%100?2:0}).format(cents/100);
  let state=R.createDemo(),evidence=null,timer;
  function notice(message,error=false){clearTimeout(timer);$("notice").textContent=message;$("notice").className=error?"error":"";$("notice").hidden=false;timer=setTimeout(()=>$("notice").hidden=true,6000);}
  const handle=fn=>async event=>{event.preventDefault();try{await fn(event);}catch(error){notice(error.message,true);}};
  const options=(id,values)=>$(id).innerHTML=values.map(value=>'<option value="'+esc(value.value??value)+'">'+esc(value.label??value)+"</option>").join("");
  function download(name,content){
    const url=URL.createObjectURL(new Blob([content],{type:"application/json"})),link=document.createElement("a");
    link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function sha256(bytes){
    if(!globalThis.crypto?.subtle)throw new Error("Open the app through localhost to calculate SHA-256.");
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(bytes))),byte=>byte.toString(16).padStart(2,"0")).join("");
  }
  function highlight(text){
    const tokens=/("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+)/g;
    let output="",cursor=0,match;
    while((match=tokens.exec(text))){
      output+=esc(text.slice(cursor,match.index))+'<span class="'+(match[1]?"json-key":match[2]?"json-string":"json-number")+'">'+esc(match[0])+"</span>";cursor=tokens.lastIndex;
    }
    return output+esc(text.slice(cursor));
  }
  function renderDiff(){
    const before=R.serialize(state.base).trimEnd().split("\n"),after=R.serialize(state.proposal).trimEnd().split("\n");
    const changed=after.map((line,index)=>line!==before[index]);
    let itemId="",hidden=0,html="";
    const gap=()=>{if(hidden){html+='<tr class="gap"><td colspan="4">··· '+hidden+" unchanged lines ···</td></tr>";hidden=0;}};
    function row(text,index,type,old,newLine){
      const number=itemId&&newLine?'<button type="button" data-item="'+esc(itemId)+'" aria-label="Review '+esc(itemId)+', line '+newLine+'">'+newLine+"</button>":newLine;
      return '<tr class="'+type+'"><td>'+old+"</td><td>"+number+"</td><td>"+(type==="add"?"+":type==="remove"?"−":"")+"</td><td>"+highlight(text)+"</td></tr>";
    }
    // The lean editor changes amounts and justifications only; schema and item IDs stay fixed.
    after.forEach((line,index)=>{
      const match=line.match(/"id": "([^"]+)"/);if(match)itemId=match[1];
      const context=changed.some((isChanged,n)=>isChanged&&Math.abs(n-index)<=3);
      if(context||!changed.some(Boolean)){gap();if(changed[index])html+=row(before[index],index,"remove",index+1,"");html+=row(line,index,changed[index]?"add":"",changed[index]?"":index+1,index+1);}
      else hidden++;
      if(/^\s{4}\}/.test(line))itemId="";
    });
    gap();$("diff-body").innerHTML=html;
  }
  function render(){
    const closed=state.status==="merged",blockers=state.threads.filter(t=>t.blocking&&!t.resolved).length;
    $("base-total").textContent=money(R.total(state.base));$("proposal-total").textContent=money(R.total(state.proposal));
    const delta=R.total(state.proposal)-R.total(state.base);$("delta").textContent=(delta>=0?"+":"−")+money(Math.abs(delta));
    $("revision").textContent="Revision "+state.revision;
    $("request-status").textContent=closed?"Merged locally":"Open";$("request-status").className="pill"+(closed?" merged":"");
    $("checks").innerHTML=R.roles.map(role=>{
      const ok=state.approvals.some(a=>a.role===role&&a.revision===state.revision);
      return '<div class="check '+(ok?"done":"")+'"><span>'+(ok?"✓":"")+"</span><div>"+esc(role)+"<small>"+(ok?"Approved revision "+state.revision:"Approval required")+"</small></div></div>";
    }).join("")+'<div class="check '+(blockers?"":"done")+'"><span>'+(blockers?"!":"✓")+"</span><div>"+blockers+" unresolved blocker"+(blockers===1?"":"s")+"<small>Resolve before approving</small></div></div>";
    $("approve").disabled=closed||blockers>0;$("merge").disabled=!R.ready(state);$("approval-role").disabled=closed;
    $("merge").textContent=closed?"Merged locally ✓":"Merge approved request ↗";
    document.querySelectorAll("form input,form select,form textarea,form button").forEach(element=>element.disabled=closed);
    $("thread-count").textContent=state.threads.length+" thread"+(state.threads.length===1?"":"s");
    $("threads").innerHTML=state.threads.map(thread=>'<article class="thread '+(thread.resolved?"resolved":"")+'"><div class="thread-meta"><strong>'+esc(thread.author)+'</strong><code>'+esc(thread.itemId)+'</code><span class="muted">rev '+thread.revision+"</span></div><p>"+esc(thread.body)+'</p><div class="thread-bottom"><span>'+(thread.resolved?"✓ Resolved":thread.blocking?"● Blocking":"Comment")+'</span><button type="button" class="text-button" data-resolve="'+thread.id+'" '+(closed?"disabled":"")+">"+(thread.resolved?"Reopen":"Resolve thread")+"</button></div></article>").join("");
    renderDiff();$("merge-evidence").hidden=!evidence;
    if(evidence){
      $("merge-evidence").innerHTML='<p class="eyebrow">APPROVED DOCUMENT · LOCAL EVIDENCE</p><h3>The exact approved JSON has a reference digest.</h3><code>'+evidence.budget_sha256+"</code><p>SHA-256 · revision "+evidence.revision+' · includes final LF. No signature or blockchain anchor has been created.</p><button type="button" id="export-evidence">↓ Export approval evidence</button>';
      $("export-evidence").addEventListener("click",()=>download("approval-evidence.json",JSON.stringify(evidence,null,2)+"\n"));
    }
  }
  function loadEditor(){const item=state.proposal.line_items.find(item=>item.id===$("edit-item").value);$("edit-amount").value=(item.amount_cents/100).toFixed(2);$("edit-reason").value=item.justification;}
  const items=state.proposal.line_items.map(item=>({value:item.id,label:item.description}));
  options("comment-item",items);options("edit-item",items);options("comment-role",R.roles);options("approval-role",R.roles);
  $("diff-body").addEventListener("click",event=>{const line=event.target.closest("[data-item]");if(line){$("comment-item").value=line.dataset.item;$("comment-body").focus();}});
  $("threads").addEventListener("click",handle(event=>{const button=event.target.closest("[data-resolve]");if(button){state=R.resolve(state,Number(button.dataset.resolve));render();}}));
  $("comment-form").addEventListener("submit",handle(()=>{
    state=R.comment(state,$("comment-item").value,$("comment-role").value,$("comment-body").value,$("blocking").checked);
    $("comment-body").value="";$("blocking").checked=false;render();notice("Comment added to this line item.");
  }));
  $("edit-item").addEventListener("change",loadEditor);
  $("edit-form").addEventListener("submit",handle(()=>{
    const raw=$("edit-amount").value.trim();
    if(!/^\d+(\.\d{1,2})?$/.test(raw))throw new Error("Enter dollars with up to two decimal places, without commas.");
    const [dollars,cents=""]=raw.split("."),amount=Number(dollars)*100+Number(cents.padEnd(2,"0"));
    const previous=state.revision;state=R.edit(state,$("edit-item").value,amount,$("edit-reason").value);
    render();notice(previous===state.revision?"No content changed.":"Revision committed locally. Previous approvals cleared.");
  }));
  $("approve").addEventListener("click",handle(()=>{
    state=R.approve(state,$("approval-role").value);
    const next=R.roles.find(role=>!state.approvals.some(a=>a.role===role&&a.revision===state.revision));
    if(next)$("approval-role").value=next;render();notice("Demo approval recorded for revision "+state.revision+".");
  }));
  $("merge").addEventListener("click",handle(async()=>{
    if(!R.ready(state))throw new Error("Both reviewers must approve this revision and all blockers must be resolved.");
    const snapshot=state,bytes=R.serialize(snapshot.proposal),hash=await sha256(bytes);
    if(state!==snapshot)throw new Error("The proposal changed. Review the current revision.");
    state=R.merge(snapshot);
    evidence={schema_version:1,simulation:true,request_id:state.proposal.request_id,revision:state.revision,
      type:"approved_budget_document",budget_sha256:hash,hash_algorithm:"SHA-256",
      serialization:"budget-json-v1: schema field order; line-item ID order; NFC; 2 spaces; UTF-8; LF; final LF",
      approvals:state.approvals,review_threads:state.threads,budget:state.proposal,git_commit:null,signatures:[],blockchain_anchor:null};
    render();notice("Approved request merged locally. Reference digest calculated.");
  }));
  $("export-json").addEventListener("click",()=>download("budget.json",R.serialize(state.proposal)));
  $("reset").addEventListener("click",()=>{state=R.createDemo();evidence=null;render();loadEditor();notice("Demo reset.");});
  render();loadEditor();
})();
