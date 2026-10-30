#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const R=require("../review"),root=path.resolve(__dirname,"..");
function find(dir){
 const full=path.join(root,dir);
 return fs.existsSync(full)?fs.readdirSync(full,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?find(dir+"/"+entry.name):entry.name.endsWith(".json")?[dir+"/"+entry.name]:[]):[];
}
const files=[...find("budgets"),...find("examples")].sort();
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
function canonical(file,format=false){
 const original=read(file),doc=R.normalize(JSON.parse(original)),expected=R.serialize(doc);
 const year=file.match(/^budgets\/fy(\d{4})-(\d{2})\//);
 if(year&&(doc.fiscal_year!==Number(year[1])+1||Number(year[2])!==doc.fiscal_year%100))throw new Error(file+": fiscal year does not match the folder.");
 if(original!==expected){if(format)fs.writeFileSync(path.join(root,file),expected);else throw new Error(file+": not canonical; run npm run format:budgets");}
 return expected;
}
function sample(){
 const value={base:JSON.parse(read("examples/base-budget.json")),proposal:JSON.parse(read("examples/vacaville-parks-request.json"))};
 return "/* Generated from the two JSON examples by scripts/budget.js sample. */\nglobalThis.BudgetSample = "+JSON.stringify(value,null,2)+";\n";
}
function emit(markdown){console.log(markdown);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown+"\n");}
try{
 const command=process.argv[2]||"check";
 if(command==="sample")fs.writeFileSync(path.join(root,"sample-budget.js"),sample());
 else if(command==="check"||command==="format"){
  for(const file of files)canonical(file,command==="format");
  if(command==="format")fs.writeFileSync(path.join(root,"sample-budget.js"),sample());
  if(read("sample-budget.js")!==sample())throw new Error("sample-budget.js is stale; run npm run format:budgets");
  console.log("Validated "+files.length+" budget JSON files and the browser sample.");
 }else if(command==="summary"){
  const base=process.env.BUDGET_BASE_REF||process.argv[3];if(!base)throw new Error("Provide a base commit.");
  const changed=cp.execFileSync("git",["diff","--name-only","--diff-filter=AMD",base,"HEAD","--","budgets/"],{cwd:root,encoding:"utf8"}).trim().split("\n").filter(file=>file.endsWith(".json"));
  let md="## Budget document review\n\nMerge means approval of this document version.\n";
  const dollars=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:2}).format(n/100);
  for(const file of changed){
   const current=fs.existsSync(path.join(root,file))?JSON.parse(canonical(file)):null;let previous=null;
   try{previous=JSON.parse(cp.execFileSync("git",["show",base+":"+file],{cwd:root,encoding:"utf8",stdio:["ignore","pipe","ignore"]}));}catch{}
   md+="\n### "+file+"\n\n| Item | Base | Proposed | Change |\n| --- | ---: | ---: | ---: |\n";
   const prior=new Map((previous?.line_items||[]).map(item=>[item.id,item]));
   for(const item of current?.line_items||[]){
    const old=prior.get(item.id);
    if(!old||JSON.stringify(old)!==JSON.stringify(item))md+="| "+item.id+" | "+(old?dollars(old.amount_cents):"new")+" | "+dollars(item.amount_cents)+" | "+dollars(item.amount_cents-(old?.amount_cents||0))+" |\n";
    prior.delete(item.id);
   }
   for(const item of prior.values())md+="| "+item.id+" | "+dollars(item.amount_cents)+" | removed | "+dollars(-item.amount_cents)+" |\n";
   md+="\nExcerpt total: "+dollars(previous?R.total(previous):0)+" → "+dollars(current?R.total(current):0)+".\n";
  }
  emit(md);
 }else if(command==="evidence"){
  const commit=process.env.BUDGET_COMMIT_SHA||cp.execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
  const branch=process.env.BUDGET_BRANCH||cp.execFileSync("git",["branch","--show-current"],{cwd:root,encoding:"utf8"}).trim();
  const match=branch.match(/^budget\/fy(\d{4})-(\d{2})\/approved$/);
  if(!match||Number(match[2])!==(Number(match[1])+1)%100)throw new Error("Approval evidence requires an approved budget branch with a valid fiscal year.");
  const selected=find("budgets/fy"+match[1]+"-"+match[2]).sort();
  if(!selected.length)throw new Error("The approved branch has no matching fiscal-year documents.");
  const records=selected.map(file=>{
   const bytes=canonical(file),committed=cp.execFileSync("git",["show",commit+":"+file],{cwd:root,encoding:"utf8"});
   if(bytes!==committed)throw new Error(file+" differs from the approved commit.");
   return {path:file,sha256:crypto.createHash("sha256").update(bytes,"utf8").digest("hex")};
  });
  const result={schema_version:1,type:"approved_document_snapshot",repository:process.env.GITHUB_REPOSITORY||null,
   branch,commit_sha:commit,hash_algorithm:"SHA-256",records,signatures:[],blockchain_anchor:null,
   meaning:"The merge approves the document version. Consult the GitHub PR for review and merge identity; this artifact is not a cryptographic signature."};
  fs.mkdirSync(path.join(root,"artifacts"),{recursive:true});
  fs.writeFileSync(path.join(root,"artifacts/approval-evidence.json"),JSON.stringify(result,null,2)+"\n");
  console.log("Wrote artifacts/approval-evidence.json for "+commit);
 }else throw new Error("Unknown command: "+command);
}catch(error){console.error(error.message);process.exitCode=1;}
