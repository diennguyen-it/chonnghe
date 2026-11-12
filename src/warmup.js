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
const api={questions,valid,ready,rank};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CareerWarmup=api;
})(typeof globalThis!=='undefined'?globalThis:this);
