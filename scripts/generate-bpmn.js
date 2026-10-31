#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const transactions=[
 {id:'T0',element:'Task_Initialize',name:'Initialize experiment',optional:true,owner:'Experiment sponsor',input:null,outputs:[330000],split:'Existing sponsor coins → 330,000 marker sats + sponsor change',notes:'Optional bootstrap. Transfers existing coins, not legal budget authority. Fees come from separate sponsor inputs.',artifact:'docs/blockchain-transaction-outline.md'},
 {id:'T1',element:'Task_Authority',name:'Record approved program',owner:'Budget authority',input:330000,outputs:[10000,320000],split:'330,000 → 10,000 bridge program + 320,000 other city budget',notes:'Record the independently enacted authority and its source. The federal example is scaled inside the city experiment.',artifact:'examples/lifecycle/04-appropriation.md'},
 {id:'T2',element:'Task_Apportion',name:'Apportion current-period authority',owner:'OMB / mapped city role',input:10000,outputs:[2500,7500],split:'10,000 → 2,500 apportioned + 7,500 unapportioned',notes:'The period limit refers to the original authority and its conditions.',artifact:'examples/lifecycle/05-apportionment.md'},
 {id:'T3',element:'Task_Allot',name:'Allot to the district',owner:'Agency funds control',input:2500,outputs:[1000,1500],split:'2,500 → 1,000 district + 1,500 unallotted',notes:'Check purpose, amount, and approvals before recording the allotment.',artifact:'examples/lifecycle/06-allotment.md'},
 {id:'T4',element:'Task_Obligate',name:'Record contract obligation',owner:'Contracting approval',input:1000,outputs:[750,250],split:'1,000 → 750 obligated + 250 district/unobligated',notes:'The contract remains in its authoritative system; evidence links the obligation to the allotment.',artifact:'examples/lifecycle/07-obligation.md'},
 {id:'T5',element:'Task_PartialReceipt',name:'Attest partial payment',owner:'Payment attestation',input:750,outputs:[500,250],split:'750 → 500 paid + 250 obligated/unpaid',notes:'Attest the financial-system payment after work acceptance and reconciliation. Marker sats remain in demo custody.',artifact:'examples/lifecycle/08-payment.md'},
 {id:'T6',element:'Task_FinalReceipt',name:'Attest later final payment',owner:'Payment attestation',input:250,outputs:[250],split:'250 obligated/unpaid → 250 paid',notes:'This is a later event, beyond the live dashboard snapshot. The final payment occurs in the financial system.',artifact:'examples/lifecycle/09-closeout.md'},
 {id:'T7',element:'Task_Checkpoint',name:'Reconciliation checkpoint',optional:true,owner:'Reconciliation approval',input:750,outputs:[750],split:'500 paid + 250 paid → 750 reconciled',notes:'Optional checkpoint. Paid markers stay historical; reconciliation does not release fresh budget authority.',artifact:'examples/lifecycle/09-closeout.md'},
 {id:'TA',element:'Task_Adjust',name:'Record approved adjustment',optional:true,owner:'Apportionment reviewer',input:9000,outputs:[7000,2000],split:'7,500 unapportioned + 1,500 unallotted → 7,000 + 2,000',notes:'Consume current unspent remainders. The period ceiling increases from 2,500 to 3,000; descendants remain intact.',artifact:'_data/execution_example.json'}
];
const txByElement=new Map(transactions.map(t=>[t.element,t]));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/\n/g,'&#10;');
const processes=[],shapes=[],edges=[];
function process(id,name,x,y,w,h){const p={id,name,nodes:[],flows:[],lanes:[]};processes.push(p);shapes.push({id:'Pool_'+id,type:'pool',x,y,w,h});return p;}
function lane(p,id,name,x,y,w,h){p.lanes.push({id,name});shapes.push({id,type:'lane',x,y,w,h});return id;}
function node(p,id,name,type,x,y,w=170,h=90,details={},laneId){const tx=txByElement.get(id);const n={id,name,type,lane:laneId,details:{...details,...(tx?{transaction:tx}:{})}};p.nodes.push(n);shapes.push({id,type,x,y,w,h,tx});return id;}
function task(p,id,name,x,y,owner,artifact,notes,l){return node(p,id,name,'userTask',x,y,170,90,{owner,artifact,notes},l);}
function event(p,id,name,x,y,type='startEvent',l){return node(p,id,name,type,x,y,36,36,{},l);}
function gateway(p,id,name,x,y,l){return node(p,id,name,'exclusiveGateway',x,y,50,50,{},l);}
const box=id=>shapes.find(s=>s.id===id);
function flow(p,id,source,target,name='',points){const a=box(source),b=box(target);p.flows.push({id,source,target,name});if(!points){const forward=a.x<b.x;points=[[forward?a.x+a.w:a.x,a.y+a.h/2],[forward?b.x:b.x+b.w,b.y+b.h/2]];}edges.push({id,points,name});}
const p=process('Lifecycle','Appropriation lifecycle',30,30,6100,1050);
const prep=lane(p,'Lane_Preparation','1–3 · Request & PR review',60,30,1450,300);
const exec=lane(p,'Lane_Execution','4–8 · Authority & execution',1510,330,2290,330);
const later=lane(p,'Lane_Later','Adjustment · Payment · Closeout',3800,660,2330,420);
event(p,'Start_Request','Need identified',110,127,'startEvent',prep);
task(p,'Task_Formulate','1 · Formulate request\nJSON + justification',190,100,'Agency analyst','budget-request/','Prepare the request and supporting narrative before the budget year. No blockchain transaction.',prep);
task(p,'Task_OpenPR','Open budget PR',390,100,'Agency budget office','budgets/fy2027-28/bridge-request.json','Git supplies the document history and line-item diff. No transaction.',prep);
task(p,'Task_Review','2 · Passback review\nLine-item comments',590,100,'OMB reviewer','examples/lifecycle/02-passback.md','Structured review summary and comments, with an agency response. No transaction.',prep);
gateway(p,'Gateway_Settled','Ready to settle?',810,120,prep);
task(p,'Task_Revise','Revise or appeal\nCommit response',590,235,'Agency budget office','examples/lifecycle/02-request-v1.json','Revise the same PR or attach an appeal; review again before settlement. No transaction.',prep);
task(p,'Task_Merge','Approve + merge\nDocument settled',940,100,'Authorized document reviewer','examples/lifecycle/02-passback.md','Merge approves this planning document version; it does not enact an appropriation.',prep);
task(p,'Task_Propose','3 · Propose budget\nTransmit to Congress',1140,100,'Executive','examples/lifecycle/03-presidents-budget.md','Publish the proposal; it does not establish spending authority. No transaction.',prep);
task(p,'Task_Congress','4 · Consider / enact\nappropriation',1570,400,'Congress','examples/lifecycle/04-appropriation.md','Official legislation is the source of authority, independent of the experimental chain.',exec);
gateway(p,'Gateway_Enacted','Authority enacted?',1785,420,exec);
event(p,'End_NoAuthority','No execution authority',1792,590,'endEvent',exec);
task(p,'Task_Authority','T1 · Record approved\n$10M program',1910,400,'Budget authority',null,null,exec);
task(p,'Task_Apportion','5 · Apportion\nT2 · $2.5M',2130,400,'OMB',null,null,exec);
task(p,'Task_Allot','6 · Allot to district\nT3 · $1M',2350,400,'Agency funds control',null,null,exec);
task(p,'Task_Obligate','7 · Award / obligate\nT4 · $750K',2570,400,'Contracting approval',null,null,exec);
task(p,'Task_Accept','Accept work\nApprove invoice',2790,400,'Agency engineer','examples/lifecycle/08-payment.md','Accept actual work before approving the invoice. No blockchain transaction.',exec);
task(p,'Task_Pay','8 · Pay $500K\nFinancial system',3010,400,'Agency finance / Treasury','examples/lifecycle/08-payment.md','Actual payment happens in the financial system. The next task attests its record.',exec);
task(p,'Task_PartialReceipt','T5 · Attest partial\npayment · $500K',3230,400,'Payment attestation',null,null,exec);
gateway(p,'Gateway_Adjustment','Adjustment needed?',3450,420,exec);
task(p,'Task_ReviewAdjustment','Review proposed\nadjustment',3910,740,'Apportionment reviewer','_data/execution_example.json','Optional review; the existing descendants must remain funded. Review itself needs no transaction.',later);
gateway(p,'Gateway_AdjustApproved','Approved?',4130,760,later);
task(p,'Task_ReviseAdjustment','Revise / hold\nadjustment',4020,950,'Agency / reviewer','_data/execution_example.json','Do not change approved authority. Resolve or revise the proposal before another review.',later);
task(p,'Task_Adjust','TA · Approved\nreapportionment',4280,740,'Apportionment reviewer',null,null,later);
gateway(p,'Gateway_Continue','Continue',4550,760,later);
task(p,'Task_FinalAccept','Accept remaining\ncontract work',4670,740,'Agency engineer','examples/lifecycle/09-closeout.md','Later work acceptance, after the current live snapshot.',later);
task(p,'Task_FinalPay','Pay final $250K\nFinancial system',4890,740,'Agency finance / Treasury','examples/lifecycle/09-closeout.md','Actual final payment stays in the financial system.',later);
task(p,'Task_FinalReceipt','T6 · Attest final\npayment · $250K',5110,740,'Payment attestation',null,null,later);
task(p,'Task_Reconcile','9 · Reconcile\nRetain audit trail',5330,740,'Finance / audit','examples/lifecycle/09-closeout.md','Reconcile the $750K contract. Account closeout follows its own availability rules.',later);
gateway(p,'Gateway_Checkpoint','Checkpoint?',5550,760,later);
task(p,'Task_Checkpoint','T7 · Optional\nreconciliation receipt',5670,740,'Reconciliation approval',null,null,later);
event(p,'End_Closed','Project reconciled',5890,767,'endEvent',later);
flow(p,'F01','Start_Request','Task_Formulate');flow(p,'F02','Task_Formulate','Task_OpenPR');flow(p,'F03','Task_OpenPR','Task_Review');flow(p,'F04','Task_Review','Gateway_Settled');flow(p,'F05','Gateway_Settled','Task_Merge','Yes');
flow(p,'F06','Gateway_Settled','Task_Revise','Revise / appeal',[[835,170],[835,280],[760,280]]);flow(p,'F07','Task_Revise','Task_Review','',[[675,235],[675,190]]);flow(p,'F08','Task_Merge','Task_Propose');
flow(p,'F09','Task_Propose','Task_Congress','',[[1310,145],[1470,145],[1470,445],[1570,445]]);
flow(p,'F10','Task_Congress','Gateway_Enacted');flow(p,'F11','Gateway_Enacted','Task_Authority','Yes');flow(p,'F12','Gateway_Enacted','End_NoAuthority','No',[[1810,470],[1810,590]]);
for(const [i,a,b]of [[13,'Task_Authority','Task_Apportion'],[14,'Task_Apportion','Task_Allot'],[15,'Task_Allot','Task_Obligate'],[16,'Task_Obligate','Task_Accept'],[17,'Task_Accept','Task_Pay'],[18,'Task_Pay','Task_PartialReceipt'],[19,'Task_PartialReceipt','Gateway_Adjustment']])flow(p,'F'+i,a,b);
flow(p,'F20','Gateway_Adjustment','Task_ReviewAdjustment','Yes',[[3475,470],[3475,705],[3995,705],[3995,740]]);
flow(p,'F21','Gateway_Adjustment','Gateway_Continue','No',[[3500,445],[4575,445],[4575,760]]);
flow(p,'F22','Task_ReviewAdjustment','Gateway_AdjustApproved');flow(p,'F23','Gateway_AdjustApproved','Task_Adjust','Yes');flow(p,'F24','Gateway_AdjustApproved','Task_ReviseAdjustment','No',[[4155,810],[4300,810],[4300,995],[4190,995]]);flow(p,'F34','Task_ReviseAdjustment','Task_ReviewAdjustment','',[[4020,995],[3860,995],[3860,785],[3910,785]]);flow(p,'F25','Task_Adjust','Gateway_Continue');flow(p,'F26','Gateway_Continue','Task_FinalAccept');flow(p,'F27','Task_FinalAccept','Task_FinalPay');flow(p,'F28','Task_FinalPay','Task_FinalReceipt');flow(p,'F29','Task_FinalReceipt','Task_Reconcile');flow(p,'F30','Task_Reconcile','Gateway_Checkpoint');flow(p,'F31','Gateway_Checkpoint','Task_Checkpoint','Yes');flow(p,'F32','Task_Checkpoint','End_Closed');flow(p,'F33','Gateway_Checkpoint','End_Closed','No',[[5575,810],[5575,900],[5908,900],[5908,803]]);
const m=process('Monitoring','Monitoring · selected source events',2700,1150,1490,300);
event(m,'Start_Record','Selected source event',2780,1267);task(m,'Task_Check','Check source, approval,\nlimits and digest',2860,1240,'Verification gateway','flow-model.js','Application checks run before proposing each selected transaction. This companion flow summarizes those repeated checks.');gateway(m,'Gateway_Valid','Valid?',3090,1260);
task(m,'Task_Ready','Allow selected\nattestation',3220,1190,'Verification gateway',null,'Continue the relevant T1–T7/TA milestone. This validation step creates no extra transaction.');event(m,'End_Ready','Return to milestone',3460,1217,'endEvent');
task(m,'Task_Flag','Flag exception\nRetain source record',3220,1340,'Monitoring / reviewer',null,'Unauthorized, over-limit, or altered records become application exceptions. Do not propose a budget-state transaction.');event(m,'End_Flag','Needs review',3460,1367,'endEvent');
flow(m,'M01','Start_Record','Task_Check');flow(m,'M02','Task_Check','Gateway_Valid');flow(m,'M03','Gateway_Valid','Task_Ready','Yes',[[3115,1260],[3115,1235],[3220,1235]]);flow(m,'M04','Task_Ready','End_Ready');flow(m,'M05','Gateway_Valid','Task_Flag','No',[[3115,1310],[3115,1385],[3220,1385]]);flow(m,'M06','Task_Flag','End_Flag');
const s=process('Setup','Experiment setup · optional',1510,1150,950,300);
event(s,'Start_Setup','Experiment begins',1580,1267);task(s,'Task_Initialize','T0 · Initialize\n330,000 marker sats',1670,1240,'Experiment sponsor',null,null);event(s,'End_Setup','Marker pool ready',1920,1267,'endEvent');flow(s,'S01','Start_Setup','Task_Initialize');flow(s,'S02','Task_Initialize','End_Setup');
let xml='<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0" id="Definitions_Budget" targetNamespace="https://github.com/afomi/budget-prototype">\n';
for(const p of processes){xml+=' <bpmn:process id="Process_'+p.id+'" isExecutable="false">\n';if(p.lanes.length)xml+='  <bpmn:laneSet id="Lanes_'+p.id+'">'+p.lanes.map(l=>'<bpmn:lane id="'+l.id+'" name="'+esc(l.name)+'">'+p.nodes.filter(n=>n.lane===l.id).map(n=>'<bpmn:flowNodeRef>'+n.id+'</bpmn:flowNodeRef>').join('')+'</bpmn:lane>').join('')+'</bpmn:laneSet>\n';for(const n of p.nodes)xml+='  <bpmn:'+n.type+' id="'+n.id+'" name="'+esc(n.name)+'"><bpmn:documentation>'+esc(JSON.stringify(n.details))+'</bpmn:documentation>'+p.flows.filter(f=>f.target===n.id).map(f=>'<bpmn:incoming>'+f.id+'</bpmn:incoming>').join('')+p.flows.filter(f=>f.source===n.id).map(f=>'<bpmn:outgoing>'+f.id+'</bpmn:outgoing>').join('')+'</bpmn:'+n.type+'>\n';for(const f of p.flows)xml+='  <bpmn:sequenceFlow id="'+f.id+'" sourceRef="'+f.source+'" targetRef="'+f.target+'"'+(f.name?' name="'+esc(f.name)+'"':'')+'/>\n';xml+=' </bpmn:process>\n';}
xml+=' <bpmn:collaboration id="Collaboration_Budget">'+processes.map(p=>'<bpmn:participant id="Pool_'+p.id+'" name="'+esc(p.name)+'" processRef="Process_'+p.id+'"/>').join('')+'</bpmn:collaboration>\n <bpmndi:BPMNDiagram id="Diagram_Budget"><bpmndi:BPMNPlane id="Plane_Budget" bpmnElement="Collaboration_Budget">\n';
for(const s of shapes){const color=s.tx?'#c52233':'#112e51';xml+='  <bpmndi:BPMNShape id="'+s.id+'_di" bpmnElement="'+s.id+'"'+(s.type==='pool'||s.type==='lane'?' isHorizontal="true"':'')+' bioc:stroke="'+color+'" bioc:fill="#ffffff"><dc:Bounds x="'+s.x+'" y="'+s.y+'" width="'+s.w+'" height="'+s.h+'"/>'+(s.type.includes('Event')||s.type==='exclusiveGateway'?'<bpmndi:BPMNLabel><dc:Bounds x="'+(s.x-40)+'" y="'+(s.y+s.h+7)+'" width="120" height="35"/></bpmndi:BPMNLabel>':'')+'</bpmndi:BPMNShape>\n';}
for(const e of edges){const vertical=e.points[0][0]===e.points[1][0];const labelX=e.points[0][0]+(vertical?10:5),labelY=vertical?(e.points[0][1]+e.points[1][1])/2-10:e.points[0][1]-24;xml+='  <bpmndi:BPMNEdge id="'+e.id+'_di" bpmnElement="'+e.id+'">'+e.points.map(([x,y])=>'<di:waypoint x="'+x+'" y="'+y+'"/>').join('')+(e.name?'<bpmndi:BPMNLabel><dc:Bounds x="'+labelX+'" y="'+labelY+'" width="85" height="22"/></bpmndi:BPMNLabel>':'')+'</bpmndi:BPMNEdge>\n';}
xml+=' </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>\n</bpmn:definitions>\n';
fs.writeFileSync('diagrams/budget-lifecycle.bpmn',xml);fs.writeFileSync('_data/bpmn_transactions.json',JSON.stringify(transactions,null,2)+'\n');
// A Touchpoints path story must be a contiguous sequence-flow route, not an arbitrary set of TX nodes.
const path=['Start_Request','Task_Formulate','Task_OpenPR','Task_Review','Gateway_Settled','Task_Merge','Task_Propose','Task_Congress','Gateway_Enacted','Task_Authority','Task_Apportion','Task_Allot','Task_Obligate','Task_Accept','Task_Pay','Task_PartialReceipt','Gateway_Adjustment','Gateway_Continue','Task_FinalAccept','Task_FinalPay','Task_FinalReceipt','Task_Reconcile','Gateway_Checkpoint','Task_Checkpoint','End_Closed'];
const annotations=Object.fromEntries(path.map(id=>{const n=p.nodes.find(n=>n.id===id),tx=txByElement.get(id);return [id,tx?tx.id+': '+tx.split+'. '+tx.notes:n.details.notes||n.name.replace(/\n/g,' ')];}));
fs.writeFileSync('diagrams/budget-path-story.json',JSON.stringify({path_story:{name:'Bridge request through payment and reconciliation',description:'Illustrative federal lifecycle in a 330,000-sat city-scale experiment. Includes optional T7; skips adjustment. No chain transactions executed.',node_ids:path,annotations}},null,2)+'\n');
console.log('Generated one BPMN canvas, 9 transaction mappings, and a contiguous Touchpoints path-story payload.');
