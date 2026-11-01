const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const assets=new Set(['pilot.html','pilot.js','pilot.css','pilot-core.js','pilot-guide.html','index.html']);
const server=http.createServer((req,res)=>{const name=(req.url||'').slice(1).split('?')[0];if(!assets.has(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(name));});
let browser,ws;
const timeout=(p,ms)=>Promise.race([p,new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Browser test timeout')),ms);t.unref();})]);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const profile=path.join(__dirname,'.pilot-browser-profile');
 browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const endpoint=await timeout(new Promise((resolve,reject)=>{let log='';browser.on('error',reject);browser.stderr.on('data',chunk=>{log+=chunk;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)resolve(m[1]);});}),20000);
 ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});let next=0,pending=new Map(),session;
 const send=(method,params={},sid=session)=>timeout(new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));}),15000);
 const errors=[];
 ws.onmessage=async event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}return;}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused'){
   const data={code:200,data:{ayahs:[{numberInSurah:1,text:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'},{numberInSurah:2,text:'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'}]}};
   await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(JSON.stringify(data)).toString('base64')},m.sessionId);
  }
 };
 const target=await send('Target.createTarget',{url:'about:blank'},null);const attached=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null);session=attached.sessionId;
 await send('Runtime.enable');await send('Page.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*api.alquran.cloud*'}]});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/pilot.html`});
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
 async function until(expression){const end=Date.now()+15000;while(Date.now()<end){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Condition not met: '+expression);}
 await until("document.getElementById('record')&&!document.getElementById('record').disabled");
 await evaluate("request('samples','readwrite',st=>st.clear()).then(()=>{samples=[];render()})");
 assert.match(await evaluate("document.getElementById('report').textContent"),/لا توجد نتائج تحليل/);
 await evaluate("document.getElementById('record').click()");await until("document.getElementById('stop').disabled===false");
 await new Promise(r=>setTimeout(r,1200));await evaluate("document.getElementById('stop').click()");await until("document.querySelectorAll('.sample').length===1");
 await evaluate("document.querySelector('.word').click()");await until("document.getElementById('wordDialog').open");
 assert.match(await evaluate("document.getElementById('analysisDetail').textContent"),/لم يُحلّل/);
 await evaluate("document.getElementById('reviewStatus').value='error';document.getElementById('reviewStatus').dispatchEvent(new Event('change'));document.getElementById('reviewHeard').value='بُسْمِ';document.getElementById('reviewExplanation').value='كسرة الباء بدل الضمة المسموعة';document.getElementById('reviewer').value='مراجعة اختبارية';document.getElementById('reviewForm').requestSubmit()");
 await until("!document.getElementById('wordDialog').open");assert.equal(await evaluate("document.querySelectorAll('.word.error').length"),1);
 await send('Page.reload');await until("document.querySelectorAll('.word.error').length===1");
 assert.equal(await evaluate("document.querySelectorAll('.sample').length"),1);
 await evaluate("(async()=>{const s=samples[0],r={version:1,sampleId:s.id,audioSha256:s.audioSha256,reference:s.reference,provider:'synthetic test only',words:[{index:0,status:'error',confidence:null,type:'vowel',heard:'test',explanation:'test'}]};await importAnalysis(s,new File([JSON.stringify(r)],'result.json',{type:'application/json'}));})()");
 await evaluate("document.querySelector('.word').click()");assert.match(await evaluate("document.getElementById('analysisDetail').textContent"),/غير محسومة/);await evaluate("document.getElementById('wordDialog').close()");
 await evaluate("(async()=>{const s=samples[0],{blob,...rest}=s;const backup=new File([JSON.stringify({version:1,samples:[{...rest,audio:await dataURL(blob)}]})],'backup.json',{type:'application/json'});await request('samples','readwrite',st=>st.clear());samples=[];render();await restore(backup);})()");
 assert.equal(await evaluate("document.querySelectorAll('.word.error').length"),1,'backup restores audio and teacher annotations');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.equal(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),true,'no horizontal overflow on mobile');
 assert.deepEqual(errors,[]);
 const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('.pilot-browser-preview.png',Buffer.from(screenshot.data,'base64'));
 console.log('PASS: browser synthetic recording, persistence, word dialog, teacher annotation, low-confidence abstention, backup restore, mobile layout');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(ws?.readyState===1){try{ws.send(JSON.stringify({id:99999,method:'Browser.close'}));}catch{}ws.close();}if(browser)browser.kill();server.close();});
