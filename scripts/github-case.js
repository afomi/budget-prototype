#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function assess(pr,reviews,policy,changedFiles,headFiles,mergedFiles){
 const blockers=[],latest=new Map(),allowed=new Set(policy.allowed_approvers.map(x=>x.toLowerCase()));
 for(const r of reviews)if(['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(r.state))latest.set(r.user.login.toLowerCase(),r);
 const current=[...latest.values()],approvals=current.filter(r=>r.state==='APPROVED'&&r.commit_id===pr.head.sha&&r.user.login.toLowerCase()!==pr.user.login.toLowerCase()&&allowed.has(r.user.login.toLowerCase()));
 if(pr.base.ref!==policy.approved_branch)blockers.push('PR targets a different branch from the review policy.');
 if(!allowed.size)blockers.push('No independent document approver is configured.');
 if(approvals.length<policy.required_independent_approvals)blockers.push('An authorized independent reviewer must approve the current head commit.');
 if(current.some(r=>r.state==='CHANGES_REQUESTED'&&allowed.has(r.user.login.toLowerCase())))blockers.push('An authorized reviewer still requests changes.');
 if(changedFiles.some(p=>!policy.document_paths.includes(p)))blockers.push('This request changes files outside the approved document scope.');
 for(const p of policy.document_paths)if(!headFiles[p])blockers.push('Required request file is missing: '+p);
 if(pr.merged){
  if(!policy.allowed_mergers.some(x=>x.toLowerCase()===pr.merged_by?.login?.toLowerCase()))blockers.push('The merge actor is not authorized by this policy.');
  for(const p of policy.document_paths)if(!mergedFiles[p]||!headFiles[p]||sha(mergedFiles[p])!==sha(headFiles[p]))blockers.push('Merged bytes differ from reviewed bytes: '+p);
 }
 return {status:pr.merged?(blockers.length?'merged_unverified':'approved'):(pr.state==='closed'?'closed':blockers.length?'awaiting_review':'ready_to_merge'),blockers,approvals:approvals.map(r=>({review_id:r.id,login:r.user.login,commit_sha:r.commit_id,submitted_at:r.submitted_at,url:r.html_url}))};
}
function gh(args,raw=false){const out=cp.execFileSync('gh',args,{cwd:root,encoding:raw?null:'utf8',maxBuffer:8*1024*1024});return raw?out:JSON.parse(out);}
function api(endpoint,paginated=false){return paginated?gh(['api',endpoint,'--paginate','--slurp']).flat():gh(['api',endpoint]);}
function contents(repo,file,ref){return gh(['api','repos/'+repo+'/contents/'+file+'?ref='+encodeURIComponent(ref),'-H','Accept: application/vnd.github.raw+json'],true);}
function sync(number,write=false){
 const c=JSON.parse(read('_data/city_case.json')),repo=c.repository,pr=api('repos/'+repo+'/pulls/'+number),reviews=api('repos/'+repo+'/pulls/'+number+'/reviews?per_page=100',true),changed=api('repos/'+repo+'/pulls/'+number+'/files?per_page=100',true).map(f=>f.filename);
 // The request branch cannot grant itself approval permissions.
 const policyBytes=contents(repo,'.github/case-review-policy.json',pr.base.sha),policy=JSON.parse(policyBytes),head={},merged={};
 for(const p of policy.document_paths){try{head[p]=contents(repo,p,pr.head.sha);}catch{}if(pr.merged)try{merged[p]=contents(repo,p,pr.merge_commit_sha);}catch{}}
 const assessment=assess(pr,reviews,policy,changed,head,merged),records=policy.document_paths.filter(p=>head[p]).map(p=>({path:p,sha256:sha(head[p]),size_bytes:head[p].length}));
 const manifest=assessment.status==='approved'?{schema_version:1,type:'approved_document_version',case_id:c.id,repository:repo,pull_request:{number:pr.number,url:pr.html_url,author:pr.user.login},reviewed_commit_sha:pr.head.sha,merge_commit_sha:pr.merge_commit_sha,merged_by:pr.merged_by.login,merged_at:pr.merged_at,policy:{source_commit_sha:pr.base.sha,sha256:sha(policyBytes)},approvals:assessment.approvals,hash_algorithm:'SHA-256',records,blockchain_anchor:null,meaning:'GitHub API evidence for approval of a prototype document version. No City funding approval or cryptographic institutional identity is asserted.'}:null;
 const snapshot={schema_version:1,case_id:c.id,status:assessment.status,fetched_at:new Date().toISOString(),pull_request:{number:pr.number,url:pr.html_url,title:pr.title,state:pr.state,author:pr.user.login,head_commit_sha:pr.head.sha,base_branch:pr.base.ref,merged:pr.merged,merge_commit_sha:pr.merged?pr.merge_commit_sha:null},reviews:reviews.map(r=>({id:r.id,login:r.user.login,state:r.state,commit_sha:r.commit_id,submitted_at:r.submitted_at})),blockers:assessment.blockers,document_hashes:records,approval_manifest:manifest};
 if(write){fs.writeFileSync(path.join(root,'_data/city_github.json'),JSON.stringify(snapshot,null,2)+'\n');if(manifest){fs.mkdirSync(path.join(root,'evidence'),{recursive:true});fs.writeFileSync(path.join(root,'evidence/'+c.id+'.json'),JSON.stringify(manifest,null,2)+'\n');}}
 return snapshot;
}
if(require.main===module){try{const number=Number(process.argv[3]);if(process.argv[2]!=='sync'||!Number.isInteger(number)||number<1)throw Error('Usage: node scripts/github-case.js sync <PR-number> [--write]');console.log(JSON.stringify(sync(number,process.argv.includes('--write')),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={assess,sha};
