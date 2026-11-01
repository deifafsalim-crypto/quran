(function(root){
  'use strict';
  const types=['vowel','shadda','letter','missing','tajweed'];
  const threshold=0.9; // Pilot gate only: not a calibrated probability of correctness.
  function validateResult(data,sample){
    if(!data||data.version!==1||data.sampleId!==sample.id||data.audioSha256!==sample.audioSha256||data.reference!==sample.reference)throw Error('النتيجة لا تطابق هذا التسجيل ونص الآية.');
    if(typeof data.provider!=='string'||!data.provider.trim()||data.provider.length>120||!Array.isArray(data.words)||data.words.length>sample.words.length)throw Error('صيغة نتيجة التحليل غير صالحة.');
    const seen=new Set();
    const words=data.words.map(w=>{
      if(!Number.isInteger(w.index)||w.index<0||w.index>=sample.words.length||seen.has(w.index))throw Error('ترقيم الكلمات غير صالح أو مكرر.');
      seen.add(w.index);
      if(!['correct','error','uncertain'].includes(w.status))throw Error('حالة كلمة غير صالحة.');
      if(w.confidence!==null&&(!Number.isFinite(w.confidence)||w.confidence<0||w.confidence>1))throw Error('الثقة يجب أن تكون من صفر إلى واحد أو null.');
      if(w.status==='error'&&(!types.includes(w.type)||typeof w.heard!=='string'||!w.heard.trim()||typeof w.explanation!=='string'||!w.explanation.trim()))throw Error('الخطأ يحتاج نوعًا والنطق المرصود وشرحًا من المحلل.');
      for(const key of ['heard','explanation'])if(w[key]!==undefined&&(typeof w[key]!=='string'||w[key].length>2000))throw Error('نص نتيجة التحليل غير صالح.');
      return {index:w.index,status:w.status,confidence:w.confidence,type:w.type||null,heard:w.heard||'',explanation:w.explanation||''};
    });
    return {version:1,sampleId:data.sampleId,audioSha256:data.audioSha256,reference:data.reference,provider:data.provider.trim(),words};
  }
  function decision(result,index){
    const w=result?.words.find(w=>w.index===index);
    if(!w||w.status==='uncertain'||w.confidence===null||w.confidence<threshold)return {status:'uncertain'};
    return w;
  }
  function metrics(samples){
    let reviewed=0,decided=0,tp=0,fp=0,fn=0,tn=0,typeMatches=0;
    for(const s of samples)for(let i=0;i<s.words.length;i++){
      const truth=s.reviews?.[i];if(!truth||truth.status==='uncertain')continue;
      reviewed++;if(!s.analysis)continue;const pred=decision(s.analysis,i);const bad=truth.status==='error';
      if(pred.status==='uncertain'){if(bad)fn++;continue;}
      decided++;
      if(pred.status==='error'){if(bad){tp++;if(pred.type===truth.type)typeMatches++;}else fp++;}
      else if(bad)fn++;else tn++;
    }
    return {reviewed,decided,tp,fp,fn,tn,typeMatches,coverage:reviewed?decided/reviewed:null,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null};
  }
  const api={types,threshold,validateResult,decision,metrics};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PilotCore=api;
})(globalThis);
