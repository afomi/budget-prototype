/* Native editable SVG: no embedded raster images or remote assets. */
"use strict";
const fs=require("node:fs"),path=require("node:path");
const {stages,feedback,milestones,timeline}=require("./diagram-data");
const root=path.resolve(__dirname,".."),out=path.join(root,"diagrams");
fs.mkdirSync(out,{recursive:true});
const palette={blue:{bg:"#eaf4fc",fg:"#164979",stroke:"#bedcf0"},purple:{bg:"#f0e9fa",fg:"#62418d",stroke:"#d7c5ee"},green:{bg:"#eaf6ec",fg:"#165b46",stroke:"#c5e4ce"},amber:{bg:"#fff3da",fg:"#926015",stroke:"#ecd5a5"}};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
function rect(x,y,w,h,fill="#fff",stroke="#d8e0e4",radius=10){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+radius+'" fill="'+fill+'" stroke="'+stroke+'"/>';}
function lines(text,max){const result=[];let current="";for(const word of text.split(/\s+/)){if(current&&current.length+word.length+1>max){result.push(current);current=word;}else current+=(current?" ":"")+word;}if(current)result.push(current);return result;}
function text(x,y,value,size=18,color="#344b60",weight=400,max=100,anchor="start"){
  return '<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" font-weight="'+weight+'" text-anchor="'+anchor+'">'+lines(value,max).map((line,i)=>'<tspan x="'+x+'" dy="'+(i?size*1.3:0)+'">'+esc(line)+"</tspan>").join("")+"</text>";
}
const paths={
 document:'<path d="M11 4h20l9 9v31H11zM30 4v11h10M17 21h17M17 28h17M17 35h12"/>',
 transmit:'<path d="M9 4h20l9 9v12M29 4v11h9M15 22h14M15 29h11M15 36h9M9 4v40h21M28 33h17m-7-7 7 7-7 7"/>',
 people:'<circle cx="18" cy="13" r="7"/><circle cx="35" cy="16" r="5"/><path d="M5 43V32c0-14 26-14 26 0v11zM34 26c9 0 12 4 12 10v7h-9"/>',
 building:'<path d="m4 17 21-13 21 13zM6 21h38M5 44h40M10 24v15m10-15v15m10-15v15m10-15v15M3 47h44"/>',
 pie:'<path d="M23 5a20 20 0 1 0 22 22H23zM29 3v18h18A20 20 0 0 0 29 3z"/>',
 hierarchy:'<rect x="19" y="3" width="14" height="11"/><rect x="3" y="35" width="12" height="11"/><rect x="20" y="35" width="12" height="11"/><rect x="37" y="35" width="12" height="11"/><path d="M26 14v10M9 35V24h34v11M26 24v11"/>',
 money:'<path d="M11 4h23l9 9v32H11zM34 4v10h9M32 22c-10-6-17 7-5 9s6 14-5 8M27 18v24"/>',
 database:'<ellipse cx="25" cy="9" rx="19" ry="7"/><path d="M6 9v29c0 10 38 10 38 0V9M6 18c0 10 38 10 38 0M6 28c0 10 38 10 38 0"/>',
 search:'<circle cx="21" cy="21" r="16"/><path d="m33 33 13 13"/>',
 refresh:'<path d="M42 16A19 19 0 0 0 7 14M42 4v12H30M8 34a19 19 0 0 0 35 2M8 46V34h12"/>',
 arrows:'<path d="M5 16h37m-9-9 9 9-9 9M45 35H8m9-9-9 9 9 9"/>',
 undo:'<path d="M17 11 5 23l12 12M5 23h27c18 0 18 23 0 23"/>',
 alert:'<path d="m25 4 23 41H2zM25 17v13M25 36v2"/>',
 calendar:'<rect x="5" y="9" width="40" height="36" rx="3"/><path d="M5 20h40M15 3v13M35 3v13M14 28h4m7 0h4m7 0h3M14 36h4m7 0h4m7 0h3"/>'
};
const defs='<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="m0 0 8 4-8 4" fill="none" stroke="#285b65" stroke-width="1.5"/></marker>'+Object.entries(paths).map(([id,p])=>'<symbol id="icon-'+id+'" viewBox="0 0 52 52"><g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'+p+"</g></symbol>").join("")+"</defs>";
function icon(id,x,y,size,color){return '<use href="#icon-'+id+'" x="'+x+'" y="'+y+'" width="'+size+'" height="'+size+'" color="'+color+'"/>';}
function begin(w,h,title,description){return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+" "+h+'" width="'+w+'" height="'+h+'" role="img" aria-labelledby="title description"><title id="title">'+esc(title)+'</title><desc id="description">'+esc(description)+'</desc>'+defs+'<g font-family="Arial, Helvetica, sans-serif">'+rect(0,0,w,h,"#ffffff","#ffffff",0);}
function end(){return "</g></svg>\n";}
function bullets(x,y,items,max,size=17,color="#344b60"){let result="",cursor=y;for(const item of items){result+=text(x,cursor,"•",size,color,700);result+=text(x+14,cursor,item,size,color,400,max);cursor+=lines(item,max).length*size*1.3+12;}return result;}
function lifecycle(){
 let s=begin(2400,1640,"Federal Budget Lifecycle","Editable reconstruction of the supplied lifecycle screenshot. Duplicate closeout stage consolidated; legal and verification boundaries clarified.");
 s+=text(1200,62,"Federal Budget Lifecycle",49,"#113962",700,100,"middle");
 s+=text(1200,104,"From Formulation to Closeout — Key Decisions, Authorities, and Feedback Mechanisms",25,"#5b7187",400,120,"middle");
 const x0=38,gap=9,w=(2324-8*gap)/9;
 stages.forEach((stage,i)=>{
  const x=x0+i*(w+gap),p=palette[stage.color];
  s+='<g id="stage-'+stage.id+'">'+rect(x,145,w,574,p.bg,p.stroke);
  s+='<circle cx="'+(x+27)+'" cy="177" r="18" fill="'+p.fg+'"/>'+text(x+27,184,String(stage.id),20,"#fff",700,5,"middle");
  s+=text(x+53,173,stage.title,21,p.fg,700,18);
  s+=text(x+17,259,stage.summary,17,"#3c5667",400,27);
  s+=icon(stage.icon,x+w/2-27,342,54,p.fg);
  s+=rect(x+7,421,w-14,243,"#ffffffb8",p.stroke,8);
  s+=bullets(x+15,447,stage.activities,27,15.5);
  s+=rect(x,680,w,39,p.fg,p.fg,5)+text(x+w/2,706,stage.actor,18,"#fff",700,30,"middle")+"</g>";
  if(i<8)s+='<path d="M'+(x+w-2)+' 378h14" stroke="#285b65" stroke-width="3" marker-end="url(#arrow)"/>';
 });
 s+=rect(38,756,2324,288,"#f1f4f4","#d9e1e1");
 s+=text(1200,792,"Cross-Cutting and Feedback Activities (Throughout the Lifecycle)",25,"#173c61",700,110,"middle");
 const fw=(2290-6*12)/7;
 feedback.forEach((item,i)=>{
  const x=55+i*(fw+12);s+=rect(x,816,fw,208,"#fff","#d6dfe0");
  s+=icon(item.icon,x+14,834,38,"#204f74")+text(x+64,858,item.title,19,"#214564",700,22);
  s+=bullets(x+14,899,item.items,32,16);
 });
 s+=text(48,1090,"Potential Blockchain Verification Points (Illustrative)",27,"#173c61",700);
 const groupW=1840,pw=(groupW-7*10)/8;
 stages.slice(0,8).forEach((stage,i)=>{
  const x=40+i*(pw+10),p=palette[stage.color];s+=rect(x,1110,pw,279,p.bg,p.stroke);
  s+=icon(stage.icon,x+pw/2-24,1128,48,p.fg);
  s+=text(x+pw/2,1203,stage.artifact,18,p.fg,700,21,"middle");
  const content=["Approved submission and version history","Approved guidance and response lineage","Final proposal and transmission evidence","Verified law reference and enacted authority","Approved schedule and amendment evidence","Authorized child allocations and changes","Selected obligations and approved changes","Payment-to-obligation reconciliation"][i];
  s+=text(x+pw/2,1280,content,16,"#415b66",400,25,"middle");
  s+=rect(x,1400,pw,50,"#edf1f2","#e0e7e8",5)+text(x+pw/2,1421,i===3?"Public law; on-chain digest":"Off-chain record;",14,"#5d7180",400,28,"middle");
  if(i!==3)s+=text(x+pw/2,1440,"on-chain evidence",14,"#5d7180",400,28,"middle");
 });
 s+=rect(1900,1110,462,340,"#f4f7f6","#dce4e3");
 s+=text(2131,1142,"On-Chain vs. Off-Chain",23,"#214765",700,40,"middle");
 s+=rect(1910,1160,442,118,"#e8f4e8","#cde5cc");
 s+=text(1924,1187,"On chain: verification evidence",19,"#245c46",700);
 s+=text(1924,1217,"Digests; version and event references;",17,"#3e6254",400,44);
 s+=text(1924,1242,"signer attestations; prior-event links.",17,"#3e6254",400,44);
 s+=rect(1910,1287,442,150,"#e8f1fb","#cbdfef");
 s+=text(1924,1315,"Off chain: authoritative records",19,"#214765",700);
 s+=text(1924,1345,"Budgets, justifications, contracts, reviews,",16,"#435e74",400,48);
 s+=text(1924,1370,"financial systems, payment instructions,",16,"#435e74",400,48);
 s+=text(1924,1395,"and records retained under applicable rules.",16,"#435e74",400,48);
 s+=rect(38,1480,2324,72,"#143e68","#143e68",8);
 s+=text(1200,1510,"Continuous Monitoring and Independent Verification",25,"#fff",700,100,"middle");
 s+=text(1200,1537,"Verify approved records and their lineage. A blockchain entry does not create legal authority or establish that a payment occurred.",18,"#d7e8f1",400,150,"middle");
 s+=text(42,1583,"Reconstruction note: consolidated the screenshot’s repeated stage 9; corrected text artifacts and clarified expiration versus cancellation.",16,"#6b7d88",400,150);
 s+=text(42,1609,"Process: OMB Circular A–11 (2025), §§10, 20, 120; GAO budget definitions. Blockchain placement is a design proposal.",16,"#6b7d88",400,150);
 return s+end();
}
function timelineSvg(){
 let s=begin(2400,1450,"Federal Budget Process Timeline","Editable reconstruction of the supplied FY 2028 timeline. Agency submission uses typical September timing. Execution is conditional on enacted authority and continues beyond this chart.");
 s+=text(1200,60,"Federal Budget Process Timeline",49,"#113962",700,100,"middle");
 s+=text(1200,102,"Key Activities, Responsible Parties, and Typical Dates — Illustrative Fiscal Year 2028",25,"#5b7187",400,120,"middle");
 const left=275,right=2358,mw=(right-left)/22,months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"];
 s+=rect(42,139,233,92,"#205680","#205680",6)+text(158,177,"Calendar",22,"#fff",700,20,"middle")+text(158,205,"Year",22,"#fff",700,20,"middle");
 s+=rect(left,139,mw*12,45,"#205680","#fff",5)+rect(left+mw*12,139,mw*10,45,"#205680","#fff",5);
 s+=text(left+mw*6,169,"CY 2026",24,"#fff",700,20,"middle")+text(left+mw*17,169,"CY 2027",24,"#fff",700,20,"middle");
 months.forEach((month,i)=>s+=rect(left+i*mw,185,mw,46,"#e6f2fc","#c4d9e7",0)+text(left+(i+.5)*mw,215,month,20,"#274f73",700,10,"middle"));
 const heights=[168,168,180,155];let y=234;
 timeline.forEach((lane,i)=>{
  const p=palette[lane.color],h=heights[i];s+='<g id="lane-'+i+'">'+rect(42,y,2316,h,p.bg,"#fff",6)+rect(42,y,233,h,p.stroke,p.bg,4);
  s+=icon(["building","building","building","hierarchy"][i],63,y+35,48,p.fg)+text(124,y+48,lane.actor,22,p.fg,700,17)+text(124,y+108,lane.subtitle,15,p.fg,400,19);
  for(let n=0;n<=22;n++)s+='<path d="M'+(left+n*mw)+" "+y+"v"+h+'" stroke="#fff" stroke-opacity=".7"/>';
  lane.bars.forEach(bar=>{
    const x=left+bar.start*mw,w=(bar.end-bar.start)*mw-8;
    s+=rect(x,y+18,w,i===3?111:64,p.stroke,p.stroke,8)+text(x+w/2,y+44,bar.label,i===3?15:18,p.fg,700,Math.max(11,Math.floor(w/(i===3?8:9.5))),"middle");
  });
  const captions=["Strategic planning and estimates → typical September submission → revisions and appeals","Spring guidance → fall review → passback decisions → executive budget proposal","Budget proposal received by early February; committee and floor activity follows. Enactment timing varies.","Enactment and availability are prerequisites. Execution and oversight continue through FY 2028 and beyond."];
  if(i<3)s+=text(left+20,y+132,captions[i],17,p.fg,400,175);
  else s+=text(left+20,y+60,captions[i],20,p.fg,400,88);
  s+="</g>";y+=h+3;
 });
 s+=rect(42,939,233,210,"#164b79","#164b79",5)+text(63,1011,"Key dates",24,"#fff",700,22)+text(63,1047,"Illustrative for",18,"#d6e6f0",400,22)+text(63,1074,"FY 2028",18,"#d6e6f0",400,22);
 const dw=(2083-7*8)/8;
 milestones.forEach((item,i)=>{
  const x=left+i*(dw+8);s+=rect(x,939,dw,210,"#f6fbff","#d2e3ef",7)+text(x+dw/2,969,item.date,18,"#234c73",700,24,"middle");
  s+=icon(item.icon,x+dw/2-22,989,44,"#234c73");
  s+=text(x+dw/2,1061,item.title,18,"#234c73",700,23,"middle");
  s+=text(x+dw/2,1110,item.note,13,"#627b8b",400,31,"middle");
 });
 s+=rect(42,1171,233,142,"#164b79","#164b79",6)+text(63,1220,"Related and",22,"#fff",700,20)+text(63,1250,"ongoing activities",22,"#fff",700,20);
 const related=[
 ["Authorizations / supplementals","#e4effc","Program authority and additional appropriations follow their applicable legislative processes."],
 ["Reprogramming / rescissions","#e7f1e0","Reallocations, proposals, enacted cancellations, and required approvals retain their distinct status."],
 ["Clawbacks / sequestration","#fcf0d9","Recoveries and statutory reductions depend on the specific authority and legal context."]
 ];
 related.forEach((item,i)=>{const yy=1171+i*48;s+=rect(left,yy,2083,43,item[1],item[1],6)+text(left+18,yy+28,item[0],18,"#264d66",700)+text(left+425,yy+28,item[2],16,"#527084",400,170);});
 s+=rect(42,1334,2316,81,"#f4f8fb","#d9e6ee",8);
 s+=text(60,1361,"Reconstruction notes",18,"#264d66",700);
 s+=text(60,1389,"Consolidated and clarified content from the supplied screenshot. Typical September submission replaces its August 1–15 assumption; execution is placed after enacted authority.",15,"#687f8d",400,240);
 s+=text(60,1438,"Dates are illustrative, not an official FY 2028 calendar. Sources: OMB Circular A–11 (2025), §10; 31 U.S.C. §1105. February 1, 2027 is the first Monday in February.",15,"#687f8d",400,240);
 return s+end();
}
fs.writeFileSync(path.join(out,"federal-budget-lifecycle.svg"),lifecycle());
fs.writeFileSync(path.join(out,"federal-budget-timeline.svg"),timelineSvg());
console.log("Generated two native, editable SVG diagrams.");
