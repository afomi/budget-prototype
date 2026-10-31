'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
async function model(){const {BpmnModdle}=await import('bpmn-moddle');return new BpmnModdle().fromXML(fs.readFileSync(path.join(root,'diagrams/budget-lifecycle.bpmn'),'utf8'));}
test('portable BPMN imports without warnings and maps every proposed transaction to a task and source artifact',async()=>{
 const {warnings,elementsById}=await model();assert.deepEqual(warnings,[]);
 const txs=JSON.parse(fs.readFileSync(path.join(root,'_data/bpmn_transactions.json')));assert.deepEqual(txs.map(t=>t.id).sort(),['T0','T1','T2','T3','T4','T5','T6','T7','TA']);
 for(const tx of txs){const task=elementsById[tx.element];assert.equal(task.$type,'bpmn:UserTask');assert.deepEqual(JSON.parse(task.documentation[0].text).transaction,tx);assert(fs.existsSync(path.join(root,tx.artifact)));if(tx.input!==null)assert.equal(tx.outputs.reduce((a,b)=>a+b,0),tx.input);}
});
test('the Touchpoints story is a connected start-to-end path and annotations reference only its nodes',async()=>{
 const {elementsById}=await model(),{path_story:story}=JSON.parse(fs.readFileSync(path.join(root,'diagrams/budget-path-story.json')));
 assert.equal(elementsById[story.node_ids[0]].$type,'bpmn:StartEvent');assert.equal(elementsById[story.node_ids.at(-1)].$type,'bpmn:EndEvent');
 for(let i=1;i<story.node_ids.length;i++){const prev=elementsById[story.node_ids[i-1]];assert(prev.outgoing.some(f=>f.targetRef.id===story.node_ids[i]),'Broken path at '+prev.id);}
 for(const id of Object.keys(story.annotations))assert(story.node_ids.includes(id));
 assert(story.node_ids.includes('Task_Pay'));assert(story.node_ids.includes('Task_PartialReceipt'));assert(!story.node_ids.includes('Task_Adjust'));
});
test('revision, denied authority, adjustment and monitoring branches remain explicit and all nodes have diagram positions',async()=>{
 const {elementsById,rootElement}=await model();
 for(const [source,target]of [['Gateway_Settled','Task_Revise'],['Task_Revise','Task_Review'],['Gateway_Enacted','End_NoAuthority'],['Gateway_Adjustment','Task_ReviewAdjustment'],['Gateway_AdjustApproved','Task_Adjust'],['Gateway_Valid','Task_Flag'],['Gateway_Checkpoint','End_Closed']])assert(elementsById[source].outgoing.some(f=>f.targetRef.id===target),source+' → '+target);
 const positions=new Set(rootElement.diagrams[0].plane.planeElement.map(e=>e.bpmnElement?.id));
 for(const element of Object.values(elementsById))if(element.$instanceOf('bpmn:FlowNode'))assert(positions.has(element.id),'Missing position '+element.id);
 for(const element of Object.values(elementsById))if(element.$type==='bpmn:SequenceFlow')assert.equal(element.sourceRef.$parent,element.targetRef.$parent);
});
test('lanes express responsibility while phase headings remain separate annotations',async()=>{
 const {elementsById,rootElement}=await model(),process=elementsById.Process_Lifecycle;
 const lanes=process.laneSets[0].lanes;
 assert.deepEqual(lanes.map(l=>l.name),['Agency budget office','OMB budget reviewer','Executive','Congress','Agency funds control','Contracting officer','Agency engineer','Agency finance / Treasury','Finance / audit']);
 const expected={Task_Formulate:'Lane_BudgetOffice',Task_OpenPR:'Lane_BudgetOffice',Task_Review:'Lane_OMB',Task_Revise:'Lane_BudgetOffice',Task_Merge:'Lane_OMB',Task_Propose:'Lane_Executive',Task_Congress:'Lane_Congress',Task_Authority:'Lane_FundsControl',Task_Apportion:'Lane_OMB',Task_Allot:'Lane_FundsControl',Task_Obligate:'Lane_Contracting',Task_Accept:'Lane_Engineer',Task_Pay:'Lane_Finance',Task_PartialReceipt:'Lane_Finance',Task_ReviewAdjustment:'Lane_OMB',Task_ReviseAdjustment:'Lane_BudgetOffice',Task_Adjust:'Lane_OMB',Task_FinalReceipt:'Lane_Finance',Task_Reconcile:'Lane_Audit',Task_Checkpoint:'Lane_Audit'};
 for(const [id,laneId]of Object.entries(expected))assert(elementsById[laneId].flowNodeRef.some(n=>n.id===id),id+' has wrong responsible lane');
 const shapes=new Map(rootElement.diagrams[0].plane.planeElement.filter(e=>e.bounds).map(e=>[e.bpmnElement.id,e.bounds]));
 for(const node of process.flowElements.filter(e=>e.$instanceOf('bpmn:FlowNode'))){const owners=lanes.filter(l=>l.flowNodeRef.includes(node));assert.equal(owners.length,1,node.id+' must have one responsible lane');const actor=owners[0],details=JSON.parse(node.documentation[0].text);assert.equal(details.actor,actor.name);const b=shapes.get(node.id),l=shapes.get(actor.id);assert(b.y>=l.y&&b.y+b.height<=l.y+l.height,node.id+' drawn outside its lane');}
 for(const id of ['Phase_Request','Phase_Execution','Phase_Later'])assert.equal(elementsById[id].$type,'bpmn:TextAnnotation');
});
