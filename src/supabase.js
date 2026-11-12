(function(root){
  'use strict';
  const url='https://mxncmnfbbvtoaadeppgd.supabase.co';
  const key='sb_publishable_OxsHuLM8Z8CqfGeo00VHXg_GslHN0A6';
  const TOKEN='chonnghe-supabase-session-v13';
  let session=null,refreshing=null;
  try{session=JSON.parse(localStorage.getItem(TOKEN)||'null');}catch{}
  const headers=(auth=true)=>({'apikey':key,'Content-Type':'application/json',...(auth&&session?.access_token?{'Authorization':'Bearer '+session.access_token}:{})});
  async function call(path,options={}){
    if(options.auth!==false&&session?.refresh_token&&session.expires_at&&Date.now()/1000>session.expires_at-60)await refreshSession();
    const response=await fetch(url+path,{...options,headers:{...headers(options.auth!==false),...(options.headers||{})}});
    let data=null;try{data=await response.json();}catch{}
    if(!response.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.hint||'Không kết nối được Supabase.');
    return data;
  }
  function saveSession(value){session=value?{...value,expires_at:value.expires_at||Math.floor(Date.now()/1000)+(value.expires_in||3600)}:null;try{session?localStorage.setItem(TOKEN,JSON.stringify(session)):localStorage.removeItem(TOKEN);}catch{}}
  async function refreshSession(){if(!refreshing)refreshing=call('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session?.refresh_token}),auth:false}).then(saveSession).finally(()=>{refreshing=null;});return refreshing;}
  async function signIn(email,password){const value=await call('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password}),auth:false});saveSession(value);return currentProfile();}
  async function signUp(email,password,fullName){return call('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password,data:{full_name:fullName}}),auth:false});}
  async function signOut(){try{await call('/auth/v1/logout',{method:'POST'});}finally{saveSession(null);}}
  async function currentProfile(){if(!session?.access_token)return null;try{const user=await call('/auth/v1/user');const rows=await rest('profiles?id=eq.'+encodeURIComponent(user.id)+'&select=id,full_name,role,is_active');if(rows[0]?.is_active===false){saveSession(null);return null;}return {...user,profile:rows[0]||{role:'viewer'}};}catch{saveSession(null);return null;}}
  async function rest(path,options={}){return call('/rest/v1/'+path,{...options,headers:{'Prefer':options.prefer||'return=representation',...(options.headers||{})}});}
  async function loadPublicData(){
    try{
      const [content,questions,careers]=await Promise.all([
        rest('site_content?select=key,value&order=key',{auth:false}),
        rest('questions?select=code,content,dimension,sort_order&is_active=eq.true&order=sort_order',{auth:false}),
        rest('careers?select=code,name,description&is_active=eq.true&order=sort_order',{auth:false})
      ]);
      const values=Object.fromEntries(content.map(x=>[x.key,x.value]));root.CareerContent=values;
      if(questions.length){const map=Object.fromEntries(questions.map(x=>[x.code,x]));root.CareerData.questions.forEach(q=>{if(map[q.id])q.text=map[q.id].content;});}
      if(careers.length){const map=Object.fromEntries(careers.map(x=>[x.code,x]));root.CareerData.majors.forEach(m=>{if(map[m.id]){m.name=map[m.id].name;m.summary=map[m.id].description||m.summary;}});}
      return values;
    }catch{return {};}
  }
  async function submitAssessment(profile,answers,result){
    const id=crypto.randomUUID();
    await rest('assessment_sessions',{method:'POST',body:JSON.stringify({id,province:profile.province,school_name:profile.school,class_name:profile.className,consent:true,completed:true,result:{status:result.status,selected:(result.selected||[]).map(x=>({id:x.major.id,name:x.major.name,priority:x.priority,score:x.total}))},completed_at:new Date().toISOString()}),prefer:'return=minimal'});
    const payload=Object.entries(answers).map(([code,score])=>({session_id:id,question_code:code,score:score===null?0:Number(score),is_unknown:score===null}));
    if(payload.length)await rest('assessment_answers',{method:'POST',body:JSON.stringify(payload),prefer:'return=minimal'});
  }
  async function uploadImage(file){
    if(!session?.access_token)throw new Error('Cần đăng nhập.');
    const safe=(file.name||'image').toLowerCase().replace(/[^a-z0-9._-]+/g,'-');const path=Date.now()+'-'+safe;
    const response=await fetch(url+'/storage/v1/object/site-images/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+session.access_token,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    if(!response.ok)throw new Error('Không tải được ảnh.');
    return url+'/storage/v1/object/public/site-images/'+path;
  }
  async function seedDefaults(data){
    const groups=data.groups.map((g,i)=>({code:g.id,name:g.name,description:'Nhóm '+g.number,sort_order:i+1,is_active:true}));
    const savedGroups=await rest('career_groups?on_conflict=code',{method:'POST',body:JSON.stringify(groups),prefer:'resolution=merge-duplicates,return=representation'});
    const groupIds=Object.fromEntries(savedGroups.map(g=>[g.code,g.id]));
    const questions=data.questions.map((q,i)=>({code:q.id,content:q.text,dimension:q.dimension,sort_order:i+1,is_active:true}));
    await rest('questions?on_conflict=code',{method:'POST',body:JSON.stringify(questions),prefer:'resolution=merge-duplicates,return=minimal'});
    const careers=data.majors.map((m,i)=>({group_id:groupIds[m.group]||null,code:m.id,name:m.name,description:m.summary,sort_order:i+1,is_active:true}));
    await rest('careers?on_conflict=code',{method:'POST',body:JSON.stringify(careers),prefer:'resolution=merge-duplicates,return=minimal'});
  }
  async function manageAccounts(payload){return call('/functions/v1/team-accounts',{method:'POST',body:JSON.stringify(payload)});}
  async function changePassword(password){return call('/auth/v1/user',{method:'PUT',body:JSON.stringify({password})});}
  root.CareerBackend={url,key,rest,signIn,signUp,signOut,currentProfile,loadPublicData,submitAssessment,uploadImage,seedDefaults,manageAccounts,changePassword,getSession:()=>session};
})(window);
