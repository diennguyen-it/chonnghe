(function(root){
'use strict';
const questions=[
{id:'interests',text:'Sở thích của bạn là gì?',multi:true,options:['Kĩ thuật công nghệ','Nghiên cứu khám phá','Nghệ thuật sáng tạo','Giao tiếp và tương tác','Kinh doanh, quản lý','Làm việc với số liệu, thông tin','Môi trường, thiên nhiên']},
{id:'hot',text:'Độ hot của ngành/nghề quan trọng với bạn ra sao?',multi:false,options:['Rất quan trọng','Khá quan trọng','Cân bằng với sự phù hợp','Không phải ưu tiên']},
{id:'abilities',text:'Năng lực nổi bật của bản thân là gì?',multi:true,options:['Giao tiếp','Sáng tạo','Năng lực thấu hiểu','Lãnh đạo','Công nghệ','Thích ứng','Giải quyết vấn đề']},
{id:'parents',text:'Mong muốn của bố mẹ dành cho bạn là gì?',multi:true,options:['Thu nhập tốt','Nối nghiệp gia đình','Được làm điều mình thích','Đóng góp cộng đồng','Nghề nghiệp ổn định']}
];
// Explicit exploratory mapping. Hotness and parental wishes are discussion context only.
const interestVectors=[[1,0,0,0,0,0],[0,1,0,0,0,0],[0,0,1,0,0,0],[0,0,0,1,0,0],[0,0,0,0,1,0],[0,0,0,0,0,1],[.6,1,0,.2,0,0]];
const abilityVectors=[[0,0,.2,1,1,0],[0,.3,1,0,0,0],[0,0,0,1,0,0],[0,0,0,.4,1,.2],[1,1,0,0,0,.7],[.4,.4,.4,.4,.4,.4],[.7,1,.3,0,.2,.5]];
const valid=(q,v)=>q.multi?Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length):Number.isInteger(v)&&v>=0&&v<q.options.length;
function ready(a){return questions.every(q=>valid(q,a[q.id]));}
function vector(ids,vectors){return vectors[0].map((_,i)=>ids.reduce((s,id)=>s+vectors[id][i],0)/ids.length);}
function cosine(a,b){const den=Math.hypot(...a)*Math.hypot(...b);return den?a.reduce((s,v,i)=>s+v*b[i],0)/den:0;}
function rank(a,D){if(!ready(a))return [];const I=vector(a.interests,interestVectors),N=vector(a.abilities,abilityVectors);return D.majors.filter(m=>m.type==='nganh'&&m.profile).map(major=>({major,total:100*(.7*cosine(I,major.profile.interest)+.3*cosine(N,major.profile.interest))})).sort((a,b)=>b.total-a.total||a.major.id.localeCompare(b.major.id));}
function groups(a,D){const rows=rank(a,D);return D.groups.map(group=>({group,...rows.find(r=>r.major.group===group.id)})).filter(r=>r.major).sort((a,b)=>b.total-a.total||a.group.number.localeCompare(b.group.number));}
function reasons(a,major){if(!ready(a))return [];return [[a.interests,interestVectors,questions[0],'Sở thích'],[a.abilities,abilityVectors,questions[2],'Năng lực tự đánh giá']].map(([ids,vectors,q,label])=>{const top=ids.map(id=>({id,score:cosine(vectors[id],major.profile.interest)})).sort((a,b)=>b.score-a.score||a.id-b.id)[0];return top?.score>0?`${label}: ${q.options[top.id]}`:null;}).filter(Boolean);}
function arenaPair(candidates,picks=[]){if(candidates.length!==4||new Set(candidates).size!==4)return [];if(!picks.length)return [candidates[0],candidates[3]];if(picks.length===1)return [candidates[1],candidates[2]];if(picks.length===2)return picks.slice();return [];}
function validPicks(candidates,picks){const accepted=[];for(const id of (Array.isArray(picks)?picks:[]).slice(0,3)){if(!arenaPair(candidates,accepted).includes(id))break;accepted.push(id);}return accepted;}
const api={questions,valid,ready,rank,groups,reasons,arenaPair,validPicks};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CareerWarmup=api;
})(typeof globalThis!=='undefined'?globalThis:this);
