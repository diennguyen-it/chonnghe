(function(root){
  'use strict';
  const dimensions=['R','I','A','S','E','C'];
  const epsilon=1e-9;
  const valid=x=>Number.isInteger(x)&&x>=1&&x<=5;
  const point=x=>25*(x-1);
  function assess(answers,questions){
    const scores={interest:[],ability:[],value:[]},missing=[];
    const counts={};
    for(const dim of dimensions){
      const qs=questions.filter(q=>q.part==='interest'&&q.dimension===dim);
      const supplied=qs.filter(q=>valid(answers[q.id]));counts[dim]=supplied.length;
      scores.interest.push(supplied.length?supplied.reduce((s,q)=>s+point(answers[q.id]),0)/supplied.length:null);
      if(supplied.length<2)missing.push(...qs.filter(q=>!valid(answers[q.id])).map(q=>q.id));
    }
    for(const part of ['ability','value']){
      for(const q of questions.filter(q=>q.part===part)){
        if(!valid(answers[q.id]))missing.push(q.id);
        scores[part].push(valid(answers[q.id])?point(answers[q.id]):null);
      }
    }
    return {ready:missing.length===0,scores,counts,missing:[...new Set(missing)],answered:questions.filter(q=>valid(answers[q.id])||answers[q.id]===null).length,informed:questions.filter(q=>valid(answers[q.id])).length};
  }
  function validProfile(m){return m.type==='nganh'&&m.profile&&['interest','ability','value'].every(k=>Array.isArray(m.profile[k])&&m.profile[k].length===6&&m.profile[k].every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&m.profile[k].reduce((a,b)=>a+b,0)>0);}
  function weighted(values,weights){if(values.length!==6||weights.length!==6||values.some(v=>!Number.isFinite(v)))throw new Error('Dữ liệu điểm không hợp lệ');const sum=weights.reduce((a,b)=>a+b,0);if(sum<=0)throw new Error('Tổng hệ số bằng 0');return values.reduce((a,v,i)=>a+v*weights[i],0)/sum;}
  function calculate(scores,profile){const I=weighted(scores.interest,profile.interest),N=weighted(scores.ability,profile.ability),V=weighted(scores.value,profile.value);return {I,N,V,total:.5*I+.25*N+.25*V};}
  function rank(answers,data){
    const assessment=assess(answers,data.questions);
    if(!assessment.ready)return {status:'missing',assessment,rows:[],tieExtras:[],invalid:[]};
    const invalid=data.majors.filter(m=>m.type==='nganh'&&!validProfile(m)).map(m=>m.id);
    const rows=data.majors.filter(validProfile).map(m=>({major:m,...calculate(assessment.scores,m.profile)})).sort((a,b)=>b.total-a.total||a.major.id.localeCompare(b.major.id));
    const tiers=[];
    for(const row of rows){let tier=tiers[tiers.length-1];if(!tier||tier[0].total-row.total>epsilon){tier=[];tiers.push(tier);}tier.push(row);}
    const collator=new Intl.Collator('vi');
    const ranked=tiers.flatMap((tier,i)=>tier.sort((a,b)=>collator.compare(a.major.name,b.major.name)||a.major.id.localeCompare(b.major.id)).map(row=>({...row,priority:i+1,tied:tier.length>1})));
    const selected=ranked.slice(0,3);
    const tieExtras=selected.length===3?ranked.slice(3).filter(r=>r.priority===selected[2].priority):[];
    return {status:!rows.length?'empty':tiers.length===1&&rows.length>1?'flat':'ok',assessment,rows:ranked,selected,tieExtras,invalid};
  }
  function reasons(row,assessment,data){
    const list=[];const dims=['R','I','A','S','E','C'];
    for(const part of ['interest','ability','value'])assessment.scores[part].forEach((v,i)=>{if(v>=50&&row.major.profile[part][i]>0){const labels=part==='interest'?{R:'hoạt động thực hành, kỹ thuật',I:'tìm hiểu và phân tích',A:'hoạt động sáng tạo',S:'hỗ trợ con người',E:'thuyết phục và tổ chức',C:'dữ liệu và quy trình'}:null;const q=part==='interest'?null:data.questions.find(q=>q.id===(part==='ability'?'N':'V')+(i+1));let text=part==='interest'?`Bạn thể hiện sự quan tâm đến ${labels[dims[i]]}.`:part==='ability'?`Bạn tự đánh giá tích cực về ${q.label.toLocaleLowerCase('vi')}.`:`Bạn coi trọng ${q.label.toLocaleLowerCase('vi')}.`;const sum=row.major.profile[part].reduce((a,b)=>a+b,0);list.push({part,text,contribution:v*row.major.profile[part][i]/sum*(part==='interest'?.5:.25)});}});
    list.sort((a,b)=>b.contribution-a.contribution);
    const chosen=[];for(const item of list){if(chosen.length>=3)break;if(!chosen.some(c=>c.part===item.part)||chosen.length>=2)chosen.push(item);}
    return chosen.map(x=>x.text);
  }
  const api={dimensions,epsilon,valid,point,assess,validProfile,weighted,calculate,rank,reasons};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CareerScoring=api;
})(typeof globalThis!=='undefined'?globalThis:this);

