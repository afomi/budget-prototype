/* Deterministic budget serialization and revision-scoped PR review simulation. */
(function(root){
  "use strict";
  const roles=["Budget reviewer","Document approver"];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const isNode=typeof module!=="undefined"&&module.exports;
  const base=isNode?require("./examples/base-budget.json"):root.BudgetSample.base;
  const exampleProposal=isNode?require("./examples/vacaville-parks-request.json"):root.BudgetSample.proposal;
  function normalize(budget){
    if(!budget||budget.schema_version!==1) throw new Error("Unsupported budget schema.");
    const textFields=["request_id","agency","account","currency","purpose"];
    for(const key of textFields) if(typeof budget[key]!=="string"||!budget[key].trim()) throw new Error("Missing "+key+".");
    if(!Number.isInteger(budget.fiscal_year)||budget.fiscal_year<2000||budget.fiscal_year>2200) throw new Error("Invalid fiscal year.");
    if(budget.currency!=="USD") throw new Error("The demo supports USD only.");
    if(!Array.isArray(budget.line_items)||!budget.line_items.length) throw new Error("At least one line item is required.");
    const seen=new Set();
    const items=budget.line_items.map(item=>{
      if(typeof item.id!=="string"||!/^[-a-z0-9]+$/.test(item.id)||seen.has(item.id)) throw new Error("Line-item IDs must be unique stable identifiers.");
      seen.add(item.id);
      if(!Number.isSafeInteger(item.amount_cents)||item.amount_cents<0) throw new Error("Amounts must be non-negative integer cents.");
      if(typeof item.description!=="string"||!item.description.trim()||typeof item.justification!=="string"||!item.justification.trim())
        throw new Error("Each line item requires a description and justification.");
      return {id:item.id,amount_cents:item.amount_cents,description:item.description.normalize("NFC"),justification:item.justification.normalize("NFC")};
    }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
    if(!Number.isSafeInteger(items.reduce((sum,item)=>sum+item.amount_cents,0))) throw new Error("Budget total exceeds safe integer precision.");
    const result={schema_version:1,request_id:budget.request_id.normalize("NFC"),fiscal_year:budget.fiscal_year,agency:budget.agency.normalize("NFC"),
      account:budget.account.normalize("NFC"),currency:"USD",purpose:budget.purpose.normalize("NFC"),line_items:items};
    const allowed=new Set(Object.keys(result));
    if(Object.keys(budget).some(key=>!allowed.has(key))) throw new Error("Unknown budget field.");
    if(budget.line_items.some(item=>Object.keys(item).some(key=>!["id","amount_cents","description","justification"].includes(key)))) throw new Error("Unknown line-item field.");
    return result;
  }
  function serialize(budget){return JSON.stringify(normalize(budget),null,2)+"\n";}
  function createDemo(){
    const proposal=clone(exampleProposal);
    return {base:normalize(base),proposal:normalize(proposal),revision:1,status:"open",approvals:[],threads:[
      {id:1,itemId:"patwin-park",author:"Budget reviewer",body:"What funds the additional $5,000, and what maintenance scope does it cover?",blocking:true,resolved:false,revision:1}
    ],events:[],nextThread:2};
  }
  function total(budget){return budget.line_items.reduce((sum,item)=>sum+item.amount_cents,0);}
  function assertOpen(state){if(state.status!=="open")throw new Error("This request has already merged. Reset the demo to start again.");}
  function edit(state,itemId,amount,justification){
    assertOpen(state);
    const next=clone(state),item=next.proposal.line_items.find(i=>i.id===itemId);
    if(!item)throw new Error("Unknown line item.");
    item.amount_cents=amount;item.justification=justification;
    next.proposal=normalize(next.proposal);
    if(serialize(next.proposal)===serialize(state.proposal))return next;
    next.revision++;next.approvals=[];
    // Review discussions survive edits; blockers must be explicitly resolved again.
    for(const thread of next.threads) if(thread.blocking)thread.resolved=false;
    next.events.push({type:"revision",revision:next.revision});
    return next;
  }
  function comment(state,itemId,author,body,blocking){
    assertOpen(state);
    if(!state.proposal.line_items.some(item=>item.id===itemId))throw new Error("Unknown line item.");
    if(!roles.includes(author)||typeof body!=="string"||!body.trim())throw new Error("Choose a reviewer and enter a comment.");
    const next=clone(state);
    next.threads.push({id:next.nextThread++,itemId,author,body:body.trim(),blocking:!!blocking,resolved:false,revision:next.revision});
    if(blocking)next.approvals=[];
    return next;
  }
  function resolve(state,id){
    assertOpen(state);
    const next=clone(state),thread=next.threads.find(t=>t.id===id);
    if(!thread)throw new Error("Unknown review thread.");
    thread.resolved=!thread.resolved;
    if(!thread.resolved&&thread.blocking)next.approvals=[];
    return next;
  }
  function approve(state,role){
    assertOpen(state);
    if(!roles.includes(role))throw new Error("Choose a required reviewer.");
    if(state.threads.some(t=>t.blocking&&!t.resolved))throw new Error("Resolve blocking review threads before approving.");
    const next=clone(state);
    next.approvals=next.approvals.filter(a=>a.role!==role);
    next.approvals.push({role,revision:next.revision});
    return next;
  }
  function ready(state){
    return state.status==="open"&&!state.threads.some(t=>t.blocking&&!t.resolved)&&roles.every(role=>state.approvals.some(a=>a.role===role&&a.revision===state.revision));
  }
  function merge(state){
    assertOpen(state);
    if(!ready(state))throw new Error("Both required reviewers must approve the current revision, with all blocking threads resolved.");
    const next=clone(state);next.status="merged";next.events.push({type:"merge",revision:state.revision});
    return next;
  }
  const api={roles,normalize,serialize,createDemo,total,edit,comment,resolve,approve,ready,merge};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.BudgetReview=api;
})(typeof globalThis!=="undefined"?globalThis:this);
