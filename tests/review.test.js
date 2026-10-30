"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const R=require("../review");
const approved=()=>{
  let state=R.createDemo();state=R.resolve(state,1);
  for(const role of R.roles)state=R.approve(state,role);
  return state;
};
test("serialization is byte-identical despite object and line-item input order",()=>{
 const state=R.createDemo(),original=state.proposal;
 const reordered=Object.fromEntries(Object.entries(original).reverse());
 reordered.line_items=[...original.line_items].reverse().map(item=>Object.fromEntries(Object.entries(item).reverse()));
 const first=R.serialize(original),second=R.serialize(reordered);
 assert.equal(first,second);assert.ok(first.endsWith("\n"));assert.ok(!first.includes("\r"));
 assert.equal(crypto.createHash("sha256").update(first).digest("hex"),crypto.createHash("sha256").update(second).digest("hex"));
});
test("money and stable IDs are validated before a request is reviewable",()=>{
 const state=R.createDemo();
 assert.throws(()=>R.edit(state,"patwin-park",1.01,"Invalid precision"),/integer cents/);
 assert.throws(()=>R.edit(state,"patwin-park",Number.MAX_SAFE_INTEGER,"Invalid total"),/safe integer/);
 const duplicate=structuredClone(state.proposal);duplicate.line_items[1].id=duplicate.line_items[0].id;
 assert.throws(()=>R.serialize(duplicate),/unique stable/);
 const unknown=structuredClone(state.proposal);unknown.secret="not silently discarded";
 assert.throws(()=>R.serialize(unknown),/Unknown budget field/);
});
test("blockers prevent approval; all required reviewers must approve before merge",()=>{
 const initial=R.createDemo();
 assert.throws(()=>R.approve(initial,"Document approver"),/blocking/);
 assert.throws(()=>R.merge(initial),/Both required/);
 let state=R.resolve(initial,1);state=R.approve(state,"Budget reviewer");
 assert.throws(()=>R.merge(state),/Both required/);
 state=R.approve(state,"Document approver");assert.equal(R.merge(state).status,"merged");
});
test("an edit clears stale approvals, reopens blockers, and preserves the base",()=>{
 const state=approved(),before=R.serialize(state.base);
 const next=R.edit(state,"patwin-park",270000000,"Expanded contractor oversight.");
 assert.equal(next.revision,2);assert.equal(next.approvals.length,0);
 assert.equal(next.threads[0].resolved,false);assert.equal(R.ready(next),false);
 assert.equal(R.serialize(next.base),before);assert.equal(state.approvals.length,2);
});
test("new blocking feedback clears approvals; resolving does not silently restore them",()=>{
 const state=R.comment(approved(),"alamo-creek-park","Document approver","Evidence needed.",true);
 assert.equal(state.approvals.length,0);assert.equal(R.ready(state),false);
 const resolved=R.resolve(state,2);assert.equal(R.ready(resolved),false);
});
test("no-op edits preserve review; a merged revision is frozen",()=>{
 const state=approved(),item=state.proposal.line_items[0];
 const same=R.edit(state,item.id,item.amount_cents,item.justification);
 assert.equal(same.revision,state.revision);assert.equal(R.ready(same),true);
 const merged=R.merge(same);
 assert.throws(()=>R.edit(merged,item.id,0,"Change"),/already merged/);
 assert.throws(()=>R.comment(merged,item.id,"Document approver","Late comment",false),/already merged/);
 const before=crypto.createHash("sha256").update(R.serialize(merged.proposal)).digest("hex");
 const modified=structuredClone(merged.proposal);modified.line_items[0].amount_cents++;
 assert.notEqual(crypto.createHash("sha256").update(R.serialize(modified)).digest("hex"),before);
});
