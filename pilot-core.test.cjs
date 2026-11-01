const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateResult,decision,metrics}=require('./pilot-core.js');
const sample={id:'sample-1',audioSha256:'a'.repeat(64),reference:'بِسْمِ اللَّهِ',words:['بِسْمِ','اللَّهِ'],reviews:{0:{status:'error',type:'vowel'},1:{status:'correct'}}};
function result(words){return {version:1,sampleId:sample.id,audioSha256:sample.audioSha256,reference:sample.reference,provider:'test fixture, not a real analysis',words};}
function error(index,confidence=.95){return {index,status:'error',confidence,type:'vowel',heard:'test vowel',explanation:'test correction'};}
test('rejects results from another recording or reference',()=>{
 for(const [field,value] of [['sampleId','other'],['audioSha256','b'.repeat(64)],['reference','different']])assert.throws(()=>validateResult({...result([]),[field]:value},sample));
});
test('rejects invalid word positions, duplicates and missing evidence',()=>{
 assert.throws(()=>validateResult(result([error(2)]),sample));
 assert.throws(()=>validateResult(result([error(0),error(0)]),sample));
 assert.throws(()=>validateResult(result([{...error(0),heard:''}]),sample));
 assert.throws(()=>validateResult(result([error(0,2)]),sample));
 assert.throws(()=>validateResult(result([{...error(0),confidence:NaN}]),sample));
});
test('missing, uncertain and low-confidence words abstain',()=>{
 for(const words of [[],[error(0,.89)],[error(0,null)],[{index:0,status:'uncertain',confidence:.99}]])assert.equal(decision(validateResult(result(words),sample),0).status,'uncertain');
 assert.equal(decision(validateResult(result([error(0)]),sample),0).status,'error');
});
test('no model results means no accuracy numbers',()=>{
 const m=metrics([sample]);assert.equal(m.reviewed,2);assert.equal(m.precision,null);assert.equal(m.recall,null);assert.equal(m.decided,0);
});
test('counts false positives, missed errors, confidence abstentions and coverage',()=>{
 const good={...sample,analysis:validateResult(result([error(0),{index:1,status:'correct',confidence:.99}]),sample)};
 let m=metrics([good]);assert.equal(m.precision,1);assert.equal(m.recall,1);assert.equal(m.coverage,1);assert.equal(m.typeMatches,1);
 m=metrics([{...sample,analysis:validateResult(result([{index:0,status:'correct',confidence:.95},error(1)]),sample)}]);assert.equal(m.fp,1);assert.equal(m.fn,1);assert.equal(m.tp,0);
 m=metrics([{...sample,analysis:validateResult(result([error(0,null)]),sample)}]);assert.equal(m.fn,1);assert.equal(m.coverage,0);assert.equal(m.precision,null);
});
