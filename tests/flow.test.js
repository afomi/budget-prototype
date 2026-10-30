"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),F=require("../flow-model");
async function complete(){const demo=await F.createDemo();for(const event of F.scenario)assert.equal((await demo.submit(event)).accepted,true);return demo;}
test("the valid $10 lifecycle preserves limits and traces a payment to appropriation",async()=>{
 const demo=await complete();assert.deepEqual(demo.balances(),{appropriation:1000,apportionment:250,allotment:100,obligation:75,disbursement:50});
 assert.deepEqual(demo.trace("PAY-001").map(item=>item.id),["A-001","AP-001","AL-001","OB-001","PAY-001"]);
 assert.equal((await F.audit(demo.bundle())).verified,5);
 assert.ok(demo.receipts.every(receipt=>!("amount_cents"in receipt)));
 assert.ok(!JSON.stringify(demo.bundle().registry).includes('"d":'));
});
test("an approved reapportionment appends a decision and preserves the original",async()=>{
 const demo=await complete(),original=JSON.stringify(demo.receipts);
 assert.equal((await demo.submit(F.adjustment)).accepted,true);
 assert.equal(demo.balances().apportionment,300);assert.equal(demo.balances().obligation,75);
 assert.equal(JSON.stringify(demo.receipts.slice(0,5)),original);
 assert.deepEqual(demo.trace("AP-002").map(item=>item.id),["A-001","AP-001","AP-002"]);
 assert.equal((await demo.audit()).verified,6);
});
test("excess obligation, payment, unauthorized source, and missing approval are flagged",async()=>{
 const demo=await complete(),before=demo.balances();
 for(const [event,options,reason] of [
  [F.record("BAD-OB","obligation",200,"AL-001"),{},/remaining allotment/],
  [F.record("BAD-PAY","disbursement",26,"OB-001"),{},/unpaid obligation/],
  [F.record("BAD-SOURCE","obligation",10,"AL-001"),{source:"untrusted-importer"},/not authorized/],
  [F.record("BAD-APPROVAL","obligation",10,"AL-001"),{approve:false},/no approval/]
 ]){
  const result=await demo.submit(event,options);assert.equal(result.accepted,false);assert.match(result.exception.reason,reason);
 }
 assert.deepEqual(demo.balances(),before);assert.equal(demo.receipts.length,5);assert.equal(demo.exceptions.length,4);
});
test("a changed record or altered receipt fails independent public-key verification",async()=>{
 const demo=await complete();
 const attempt=await demo.submit(F.record("BAD-HASH","disbursement",5,"OB-001"),{tamper:true});
 assert.equal(attempt.accepted,false);assert.match(attempt.exception.reason,/digest mismatch/);
 const changedRecord=demo.bundle();changedRecord.source_records[0].record.amount_cents=999;
 await assert.rejects(F.audit(changedRecord),/digest mismatch/);
 const changedReceipt=demo.bundle();changedReceipt.receipts[1].source_signature="00";
 await assert.rejects(F.audit(changedReceipt),/receipt was altered/);
});
test("adjustments cannot strand allotments, exceed appropriation, or fork an old decision",async()=>{
 const demo=await complete();
 for(const amount of [99,1001]){
  const result=await demo.submit({...F.adjustment,id:"INVALID-"+amount,amount_cents:amount});
  assert.equal(result.accepted,false);
 }
 assert.equal((await demo.submit(F.adjustment)).accepted,true);
 const stale=await demo.submit({...F.adjustment,id:"AP-003",amount_cents:350});
 assert.equal(stale.accepted,false);assert.match(stale.exception.reason,/superseded/);
 const valid=await demo.submit({...F.adjustment,id:"AP-004",revises:"AP-002",amount_cents:350});
 assert.equal(valid.accepted,true);assert.equal(demo.balances().apportionment,350);
});
test("duplicate IDs and mismatched restrictions cannot change the accepted history",async()=>{
 const demo=await complete();
 assert.equal((await demo.submit(F.scenario[0])).accepted,false);
 const different=F.record("BAD-ACCOUNT","obligation",10,"AL-001");different.account="OTHER";
 assert.equal((await demo.submit(different)).accepted,false);assert.equal((await demo.audit()).verified,5);
});
