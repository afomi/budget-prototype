'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('../flow-model'),R=require('../review'),{assess}=require('../scripts/github-case'),c=require('../_data/city_case.json'),execution=require('../_data/city_execution.json');
const policy={approved_branch:'budget/fy2025-26/approved',allowed_approvers:['reviewer'],allowed_mergers:['afomi'],required_independent_approvals:1,document_paths:['request.json','request.md']};
const pr={head:{sha:'head'},base:{ref:policy.approved_branch},user:{login:'afomi'},state:'open',merged:false};
const review={id:1,state:'APPROVED',commit_id:'head',user:{login:'reviewer'}};
const files={'request.json':Buffer.from('{}\n'),'request.md':Buffer.from('Justification\n')};
test('GitHub approval requires an allowed independent reviewer on the exact head and exact merged bytes',()=>{
 const check=(p,rs,pol=policy,merged=files)=>assess(p,rs,pol,policy.document_paths,files,merged);
 assert.equal(check(pr,[]).status,'awaiting_review');assert.equal(check(pr,[{...review,user:{login:'afomi'}}]).status,'awaiting_review');assert.equal(check(pr,[{...review,user:{login:'stranger'}}]).status,'awaiting_review');assert.equal(check(pr,[{...review,commit_id:'old'}]).status,'awaiting_review');assert.equal(check(pr,[review]).status,'ready_to_merge');
 const merged={...pr,merged:true,merged_by:{login:'afomi'}};assert.equal(check(merged,[review]).status,'approved');assert.equal(check(merged,[review],policy,{...files,'request.md':Buffer.from('Changed\n')}).status,'merged_unverified');assert.equal(check(merged,[review,{...review,id:2,state:'DISMISSED'}]).status,'merged_unverified');assert.equal(check(merged,[review],{...policy,allowed_approvers:[]}).status,'merged_unverified');
});
test('the city request, source baseline and execution records share one case and stay within their limits',async()=>{
 const request=JSON.parse(fs.readFileSync(c.preview_json));assert.equal(R.serialize(request),fs.readFileSync(c.preview_json,'utf8'));assert.equal(request.request_id,c.id);assert.equal(R.total(request),c.request_cents);assert(c.request_cents<=c.published_baseline_cents);
 assert.deepEqual(execution,JSON.parse(fs.readFileSync(c.execution_path)));const demo=await F.createDemo({roles:execution.roles,definition:execution});for(const r of execution.records)assert((await demo.submit(r)).accepted);
 assert.deepEqual(demo.trace('PAY-001').map(r=>r.id),['A-001','AP-001','AL-001','OB-001','PAY-001']);const old=JSON.stringify(demo.receipts);assert(!(await demo.submit(execution.invalid_obligation)).accepted);assert.equal(JSON.stringify(demo.receipts),old);assert((await demo.submit(execution.authorized_adjustment)).accepted);assert.equal(demo.balances().apportionment,300000);assert.equal(demo.bundle().instance_id,c.id);assert.equal((await demo.audit()).verified,6);
});
test('the city BPMN uses city actors, case records and a contiguous path; the offline plan conserves native sats',async()=>{
 const {BpmnModdle}=await import('bpmn-moddle'),xml=fs.readFileSync('diagrams/city-maintenance.bpmn','utf8'),{warnings,elementsById}=await new BpmnModdle().fromXML(xml);assert.deepEqual(warnings,[]);
 const lanes=elementsById.Process_Lifecycle.laneSets[0].lanes;assert(lanes.some(l=>l.name==='Document approver'));assert(!lanes.some(l=>/OMB|Congress|Executive/.test(l.name)));
 for(const stage of c.stages)assert(elementsById[stage.element],stage.id+' has no process task');
 const {path_story:story}=JSON.parse(fs.readFileSync('diagrams/city-path-story.json'));for(let i=1;i<story.node_ids.length;i++)assert(elementsById[story.node_ids[i-1]].outgoing.some(f=>f.targetRef.id===story.node_ids[i]));
 const plan=JSON.parse(fs.readFileSync('cases/vacaville-fy2025-26/utxo-plan.json'));assert.equal(plan.case_id,c.id);assert.equal(plan.network,null);for(const tx of plan.transactions){assert.equal(tx.native_outputs.reduce((n,o)=>n+o.sats,0),tx.native_inputs_sats);const record=execution.records.find(r=>r.id===tx.event_id);assert.equal(tx.budget_amount_cents,record.amount_cents);assert.equal(tx.record_sha256,await F.hash(F.canonical(record)));}
});
