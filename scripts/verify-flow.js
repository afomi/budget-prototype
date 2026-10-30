#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),F=require("../flow-model");
(async()=>{
 const [evidenceFile,sourcesFile]=process.argv.slice(2);
 if(!evidenceFile||!sourcesFile)throw new Error("Usage: node scripts/verify-flow.js verification-evidence.json source-records.json");
 const evidence=JSON.parse(fs.readFileSync(evidenceFile,"utf8")),records=JSON.parse(fs.readFileSync(sourcesFile,"utf8"));
 const report=await F.audit({...evidence,source_records:records});
 console.log("Verified "+report.verified+" receipts using the supplied public registry and separate source records.");
 console.log("Last receipt: "+report.last_receipt_hash);
 console.log("Local demo identities only; authenticity of an externally supplied registry is not established.");
})().catch(error=>{console.error(error.message);process.exitCode=1;});
