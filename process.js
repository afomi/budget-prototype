(() => {
'use strict';
const embedded=new URLSearchParams(location.search).has('embed');if(embedded)document.documentElement.classList.add('process-embed');
const $=id=>document.getElementById(id),txs=JSON.parse($('bpmn-transactions').textContent);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localPath=path=>(document.body.dataset.siteRoot||'/')+path.replace(/^\//,'').replace(/^(process|storyboard|budget-request|document-review)\.html(?=#|$)/,'$1/');
let viewer,canvas,registry,selected=null;
const status=text=>$('bpmn-status').textContent=text;
function download(name,value,type){const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function highlight(){
 if(!canvas)return;
 const enabled=$('show-transactions').checked,optional=$('show-optional').checked;
 for(const tx of txs){const visible=enabled&&(!tx.optional||optional);canvas.removeMarker(tx.element,'tx-highlight');canvas.removeMarker(tx.element,'tx-optional');canvas.removeMarker(tx.element,'tx-muted');canvas.addMarker(tx.element,visible?'tx-highlight':'tx-muted');if(visible&&tx.optional)canvas.addMarker(tx.element,'tx-optional');}
 $('bpmn-count').textContent=enabled?txs.filter(t=>!t.optional||optional).length+' transaction points':'Transaction layer hidden';
}
function inspect(element,focus=false){
 if(!element||element.labelTarget||!element.businessObject.documentation?.length)return;
 let d;try{d=JSON.parse(element.businessObject.documentation[0].text);}catch{return;}
 if(!Object.keys(d).length)return;
 if(embedded&&window.parent!==window)window.parent.postMessage({type:'budget-case-node',node_id:element.id},location.origin);
 const tx=d.transaction;const instanceStatus=window.CityCase?.describeNode(element.id);
 if(selected)canvas.removeMarker(selected,'process-selected');selected=element.id;canvas.addMarker(selected,'process-selected');
 document.querySelectorAll('[data-transaction]').forEach(b=>b.setAttribute('aria-pressed',String(tx?.id===b.dataset.transaction)));
 $('bpmn-detail').innerHTML='<p class="eyebrow">'+escape(tx?tx.id+' · '+(tx.optional?'OPTIONAL TRANSACTION':'PROPOSED TRANSACTION'):'PROCESS STEP · NO TRANSACTION')+'</p><h2>'+escape(tx?.name||d.activity||element.businessObject.name.replace(/\n/g,' '))+'</h2><p class="micro">'+escape(d.actor||tx?.owner||d.owner||'')+'</p>'+(d.phase?'<p class="micro">Phase: '+escape(d.phase)+(d.system?' · System: '+escape(d.system):'')+'</p>':'')+(tx?'<p class="bpmn-split">'+escape(tx.split)+'</p>':'')+(instanceStatus?'<p class="bpmn-split">'+escape(instanceStatus)+'</p>':'')+'<p>'+escape(tx?.notes||d.notes||'')+'</p>'+((tx?.artifact||d.artifact)?'<a href="'+escape(localPath(tx?.artifact||d.artifact))+'"'+((tx?.artifact||d.artifact).startsWith('docs/')?' data-design-note="true"':'')+'>Open supporting artifact →</a>':'')+(tx?'<p class="micro">'+(tx.quantity_unit==='USD cents'?'Budget quantities use exact USD cents in signed data. Native carrier sats and fees are separate.':'1 sat = $1,000 represented spending. Fees funded separately.')+' This point is proposed; no transaction is submitted.</p>':'');
 const designLink=$('bpmn-detail').querySelector('[data-design-note]');if(designLink)designLink.href='https://github.com/afomi/budget-prototype/blob/main/'+(tx?.artifact||d.artifact);
 if(focus){const view=canvas.viewbox(),scale=Math.min(1.15,Math.max(.75,view.scale));canvas.zoom(scale);const bounds=canvas.viewbox();canvas.viewbox({x:element.x+element.width/2-bounds.width/2,y:element.y+element.height/2-bounds.height/2,width:bounds.width,height:bounds.height});}
}
function readingView(){
 canvas.zoom(1);
 const view=canvas.viewbox();canvas.viewbox({x:0,y:0,width:view.width,height:view.height});
}
function instanceMarkers(){
 if(!canvas||!window.CityCase)return;
 for(const s of window.CityCase.case.stages){canvas.removeMarker(s.element,'case-preview');canvas.removeMarker(s.element,'case-approved');if(s.record_id&&window.CityCase.records.some(r=>r.id===s.record_id))canvas.addMarker(s.element,'case-preview');if(s.id==='approval'&&window.CityCase.github.status==='approved')canvas.addMarker(s.element,'case-approved');}
 const adjusted=window.CityCase.records.some(r=>r.id==='AP-002');canvas.removeMarker('Task_Adjust','case-preview');if(adjusted)canvas.addMarker('Task_Adjust','case-preview');
 if(selected)inspect(registry.get(selected));
}
async function ready(){
 try{
  if(typeof BpmnJS!=='function')throw new Error('BPMN viewer asset is unavailable. Rebuild or restart the local preview.');
  viewer=new BpmnJS({container:'#bpmn-canvas'});
  const {warnings}=await viewer.importXML($('budget-bpmn').textContent.trim());
  if(warnings.length)throw new Error(warnings.map(w=>w.message).join('; '));
  canvas=viewer.get('canvas');registry=viewer.get('elementRegistry');
  for(const tx of txs)if(!registry.get(tx.element))throw new Error('Missing transaction task '+tx.id);
  readingView();highlight();instanceMarkers();window.addEventListener('city-case:change',instanceMarkers);
  viewer.get('eventBus').on('element.click',({element})=>inspect(element));
  $('bpmn-start').addEventListener('click',readingView);
  $('bpmn-fit').addEventListener('click',()=>canvas.zoom('fit-viewport','auto'));
  $('bpmn-zoom-in').addEventListener('click',()=>canvas.zoom(Math.min(3,canvas.zoom()*1.3)));
  $('bpmn-zoom-out').addEventListener('click',()=>canvas.zoom(Math.max(.15,canvas.zoom()/1.3)));
  ['show-transactions','show-optional'].forEach(id=>$(id).addEventListener('change',highlight));
  document.querySelectorAll('[data-transaction]').forEach(button=>button.addEventListener('click',()=>inspect(registry.get(txs.find(t=>t.id===button.dataset.transaction).element),true)));
  $('bpmn-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('bpmn-workspace').requestFullscreen();}catch{status('Full screen is unavailable in this browser. Use zoom and pan to inspect the model.');}});
  document.addEventListener('fullscreenchange',()=>{canvas.resized();$('bpmn-fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
  new ResizeObserver(()=>canvas.resized()).observe($('bpmn-canvas'));
  $('bpmn-svg').addEventListener('click',async()=>{try{const {svg}=await viewer.saveSVG();const style='<style>'+document.getElementById('bpmn-export-style').textContent+'</style>';download('budget-lifecycle.svg',svg.replace(/(<svg\b[^>]*>)/,'$1'+style),'image/svg+xml');status('Exported the complete canvas with the current transaction layer.');}catch(error){status('SVG export failed: '+error.message);}});
  status('Model ready · actor lanes · 9 proposed transaction points · select a task for its case status');
  $('bpmn-canvas').dataset.ready='true';
 }catch(error){status('Unable to display BPMN: '+error.message);$('bpmn-canvas').textContent='The diagram could not load. Download the BPMN file below to open it in Touchpoints.';}
}
ready();
})();
