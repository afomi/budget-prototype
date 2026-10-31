/* A local verification gateway and append-only evidence log. No blockchain network or payments. */
(function(root){
"use strict";
const webcrypto=globalThis.crypto||(typeof require==="function"?require("node:crypto").webcrypto:null);
const roles={
 "legislative-register":["appropriation"],
 "omb-budget-system":["apportionment","reapportionment"],
 "agency-funds-control":["allotment"],
 "agency-obligations":["obligation"],
 "treasury-payment-system":["disbursement"],
 "untrusted-importer":[]
};
const clone=value=>JSON.parse(JSON.stringify(value));
const base={account:"DEMO-2028",fiscal_year:2028,currency:"USD",purpose:"Hypothetical program"};
function record(id,type,amount,authority,revises=null){
 return {id,type,amount_cents:amount,authority_id:authority,revises,...base,effective_date:"2028-04-15"};
}
const fixture=typeof module!=="undefined"&&module.exports
 ?require("./_data/execution_example.json")
 :JSON.parse(document.getElementById("flow-fixture").textContent);
const scenario=fixture.records,adjustment=fixture.authorized_adjustment;
const encode=value=>new TextEncoder().encode(typeof value==="string"?value:JSON.stringify(value));
function canonical(value){
 const fields=["id","type","amount_cents","authority_id","revises","account","fiscal_year","currency","purpose","effective_date"];
 if(!value||Object.keys(value).some(key=>!fields.includes(key))||fields.some(key=>!(key in value)))throw new Error("Invalid source-record schema.");
 if(!/^[A-Z0-9-]+$/.test(value.id)||!Number.isSafeInteger(value.amount_cents)||value.amount_cents<=0)throw new Error("Invalid record ID or amount; use positive integer cents.");
 return Object.fromEntries(fields.map(key=>[key,value[key]]));
}
async function hash(value){return hex(await webcrypto.subtle.digest("SHA-256",encode(value)));}
function hex(buffer){return Array.from(new Uint8Array(buffer),byte=>byte.toString(16).padStart(2,"0")).join("");}
function unhex(text){
 if(typeof text!=="string"||!/^([a-f0-9]{2})+$/.test(text))throw new Error("Invalid signature encoding.");
 return new Uint8Array(text.match(/../g).map(part=>parseInt(part,16)));
}
async function sign(key,value){return hex(await webcrypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},key,encode(value)));}
async function verify(jwk,value,signature){
 const key=await webcrypto.subtle.importKey("jwk",jwk,{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
 return webcrypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,unhex(signature),encode(value));
}
function approvalMessage(id,digest){return {decision:"approved_document",event_id:id,record_digest:digest};}
function rootId(id,records){
 let event=records.find(item=>item.id===id);
 if(!event)throw new Error("The referenced authority has not been verified.");
 while(event.revises){event=records.find(item=>item.id===event.revises);if(!event)throw new Error("Missing prior decision.");}
 return event.id;
}
function currentLimit(id,records){
 const origin=rootId(id,records);
 return [...records].reverse().find(item=>rootId(item.id,records)===origin);
}
function sum(records,type,parent){
 return records.filter(item=>item.type===type&&rootId(item.authority_id,records)===rootId(parent,records)).reduce((n,item)=>n+item.amount_cents,0);
}
function validateBudget(value,records){
 const r=canonical(value);
 if(records.some(item=>item.id===r.id))throw new Error("Duplicate event: the original decision is already recorded.");
 if(r.type==="appropriation"){
  if(records.length||r.authority_id!==null||r.revises!==null)throw new Error("The demo starts with one appropriation.");
  return;
 }
 const parent=records.find(item=>item.id===r.authority_id);
 if(!parent)throw new Error("The referenced authority has not been verified.");
 for(const field of ["account","fiscal_year","currency","purpose"])if(r[field]!==parent[field])throw new Error("Account, year, currency, and purpose must match the parent authority.");
 if(r.effective_date<parent.effective_date)throw new Error("An event cannot precede its parent decision.");
 const expected={apportionment:"appropriation",allotment:"apportionment",obligation:"allotment",disbursement:"obligation",reapportionment:"appropriation"};
 if(expected[r.type]!==parent.type&&!(r.type==="allotment"&&parent.type==="reapportionment"))throw new Error("This event has the wrong kind of parent authority.");
 if(r.type!=="reapportionment"&&r.revises!==null)throw new Error("Only a reapportionment may revise a prior decision.");
 if(r.type==="reapportionment"){
  const old=records.find(item=>item.id===r.revises);
  if(!old||!["apportionment","reapportionment"].includes(old.type))throw new Error("A reapportionment must reference an existing apportionment decision.");
  if(currentLimit(old.id,records).id!==old.id)throw new Error("This adjustment is based on a superseded decision.");
  if(old.authority_id!==r.authority_id)throw new Error("A reapportionment must preserve its appropriation reference.");
  const used=sum(records,"allotment",old.id);
  if(r.amount_cents<used)throw new Error("The revised ceiling is below existing allotments.");
  const roots=records.filter(item=>item.type==="apportionment"&&item.authority_id===parent.id);
  const other=roots.filter(item=>item.id!==rootId(old.id,records)).reduce((n,item)=>n+currentLimit(item.id,records).amount_cents,0);
  if(other+r.amount_cents>parent.amount_cents)throw new Error("The revised apportionments exceed the appropriation.");
  return;
 }
 if(r.type==="apportionment"){
  const used=records.filter(item=>item.type==="apportionment"&&item.authority_id===parent.id).reduce((n,item)=>n+currentLimit(item.id,records).amount_cents,0);
  if(used+r.amount_cents>parent.amount_cents)throw new Error("The apportionment exceeds remaining appropriation authority.");
 }else{
  const used=sum(records,r.type,parent.id),limit=currentLimit(parent.id,records).amount_cents;
  if(used+r.amount_cents>limit){
   const labels={allotment:"apportionment",obligation:"allotment",disbursement:"unpaid obligation"};
   throw new Error("Amount exceeds the remaining "+labels[r.type]+" ($"+((limit-used)/100).toFixed(2)+").");
  }
 }
}
async function validateEnvelope(value,envelope,registry){
 const r=canonical(value),digest=await hash(r);
 if(digest!==envelope.record_digest)throw new Error("The source record changed after signing: digest mismatch.");
 const source=registry[envelope.source_signer];
 if(!source||!source.events.includes(r.type))throw new Error("The source signer is not authorized for "+r.type+" events.");
 if(!await verify(source.public_key,r,envelope.source_signature))throw new Error("The source signature is invalid.");
 if(!envelope.approval_signer||!envelope.approval_signature)throw new Error("The document has no approval evidence.");
 const approver=registry[envelope.approval_signer];
 if(!approver?.can_approve)throw new Error("The approval signer is not authorized.");
 if(!await verify(approver.public_key,approvalMessage(r.id,digest),envelope.approval_signature))throw new Error("Approval is not bound to this document digest.");
 return digest;
}
function receiptBody(receipt){const {receipt_hash,...body}=receipt;return body;}
async function audit(bundle){
 let previous=null;const accepted=[];
 for(let i=0;i<bundle.receipts.length;i++){
  const receipt=bundle.receipts[i];
  if(receipt.sequence!==i+1||receipt.previous_receipt_hash!==previous)throw new Error("The evidence sequence or prior-receipt link is inconsistent.");
  if(await hash(receiptBody(receipt))!==receipt.receipt_hash)throw new Error("An evidence receipt was altered.");
  const source=bundle.source_records.find(item=>item.accepted&&item.record.id===receipt.event_id);
  if(!source)throw new Error("The source record is unavailable for verification.");
  if(source.record.authority_id!==receipt.parent_event_id||source.record.revises!==receipt.revises_event_id||source.record.type!==receipt.event_type)throw new Error("The receipt has inconsistent lineage metadata.");
  await validateEnvelope(source.record,receipt,bundle.registry);
  validateBudget(source.record,accepted);accepted.push(source.record);previous=receipt.receipt_hash;
 }
 return {verified:accepted.length,last_receipt_hash:previous};
}
class Demo{
 constructor(keys,registry,options={}){this.keys=keys;this.registry=registry;this.roles=options.roles||roles;this.definition=options.definition||fixture;this.sourceRecords=[];this.receipts=[];this.exceptions=[];}
 accepted(){return this.sourceRecords.filter(item=>item.accepted).map(item=>item.record);}
 async prepare(input,options={}){
  const r=canonical(clone(input));
  const role=options.source||Object.keys(this.roles).find(key=>this.roles[key].includes(r.type));
  if(!this.keys[role])throw new Error("Unknown demo source identity.");
  const digest=await hash(r);
  const envelope={record_digest:digest,source_signer:role,source_signature:await sign(this.keys[role].privateKey,r),
   approval_signer:options.approve===false?null:"document-review",approval_signature:options.approve===false?null:await sign(this.keys["document-review"].privateKey,approvalMessage(r.id,digest))};
  if(options.tamper)r.amount_cents+=1;
  return {record:r,envelope};
 }
 async submit(input,options={}){
  const prepared=await this.prepare(input,options),r=prepared.record;
  try{
   const digest=await validateEnvelope(r,prepared.envelope,this.registry);
   validateBudget(r,this.accepted());
   const receipt={sequence:this.receipts.length+1,event_id:r.id,event_type:r.type,record_digest:digest,...prepared.envelope,
    parent_event_id:r.authority_id,revises_event_id:r.revises,previous_receipt_hash:this.receipts.at(-1)?.receipt_hash||null};
   receipt.receipt_hash=await hash(receipt);
   this.sourceRecords.push({record:clone(r),accepted:true});this.receipts.push(receipt);
   return {accepted:true,receipt};
  }catch(error){
   this.sourceRecords.push({record:clone(r),accepted:false});
   const exception={attempt:this.exceptions.length+1,event_id:r.id,event_type:r.type,reason:error.message,source_signer:prepared.envelope.source_signer,status:"Needs review"};
   this.exceptions.push(exception);return {accepted:false,exception};
  }
 }
 bundle(){return clone({definition_id:this.definition.definition_id,instance_id:this.definition.instance_id,simulation:true,registry:this.registry,source_records:this.sourceRecords,receipts:this.receipts,exceptions:this.exceptions});}
 async audit(){return audit(this.bundle());}
 trace(id){
  const records=this.accepted(),found=new Set();
  const visit=eventId=>{if(!eventId||found.has(eventId))return;const r=records.find(item=>item.id===eventId);if(!r)return;visit(r.authority_id);visit(r.revises);found.add(eventId);};
  visit(id);return records.filter(item=>found.has(item.id));
 }
 balances(){
  const records=this.accepted(),appropriation=records.find(item=>item.type==="appropriation");
  const apportioned=records.filter(item=>item.type==="apportionment").reduce((n,item)=>n+currentLimit(item.id,records).amount_cents,0);
  const total=type=>records.filter(item=>item.type===type).reduce((n,item)=>n+item.amount_cents,0);
  return {appropriation:appropriation?.amount_cents||0,apportionment:apportioned,allotment:total("allotment"),obligation:total("obligation"),disbursement:total("disbursement")};
 }
}
async function createDemo(options={}){
 if(!webcrypto?.subtle)throw new Error("Web Crypto is required. Open the prototype through localhost.");
 const keys={},registry={};
 for(const [id,events]of Object.entries({...(options.roles||roles),"document-review":[]})){
  const pair=await webcrypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
  keys[id]=pair;registry[id]={events,can_approve:id==="document-review",public_key:await webcrypto.subtle.exportKey("jwk",pair.publicKey)};
 }
 return new Demo(keys,registry,options);
}
const api={createDemo,scenario,adjustment,record,canonical,validateBudget,audit,hash};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.BudgetFlow=api;
})(typeof globalThis!=="undefined"?globalThis:this);
