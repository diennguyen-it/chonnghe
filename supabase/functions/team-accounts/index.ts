const cors = {'Access-Control-Allow-Origin':'https://chonnghe.online4you.vn','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const base=Deno.env.get('SUPABASE_URL');
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function api(path,options={}) {
 const res=await fetch(base+path,{...options,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'return=representation',...options.headers}});
 const text=await res.text();const data=text?JSON.parse(text):null;
 if(!res.ok)throw new Error(data?.msg||data?.message||data?.error_description||'Thao tác chưa thành công.');return data;
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({message:'Phương thức không hợp lệ.'},405);
 try {
  const token=req.headers.get('Authorization');if(!token?.startsWith('Bearer '))return reply({message:'Cần đăng nhập.'},401);
  const identity=await fetch(base+'/auth/v1/user',{headers:{apikey:secret,Authorization:token}});
  if(!identity.ok)return reply({message:'Phiên đăng nhập đã hết hạn.'},401);
  const actor=await identity.json();
  const profiles=await api('/rest/v1/profiles?id=eq.'+actor.id+'&select=id,role,is_active');
  const me=profiles?.[0];if(!me?.is_active||!['admin','student_admin'].includes(me.role))return reply({message:'Chỉ hai quản trị viên được quản lý tài khoản.'},403);
  const body=await req.json();
  if(body.action==='list')return reply(await api('/rest/v1/profiles?select=id,full_name,email,role,is_active,created_at&order=created_at'));
  if(body.action==='create'){
   const role=body.role||'editor';if(!['editor','viewer'].includes(role))return reply({message:'Vai trò không hợp lệ.'},400);
   if(typeof body.email!=='string'||!body.email.includes('@')||typeof body.password!=='string'||body.password.length<10||!String(body.full_name||'').trim())return reply({message:'Nhập họ tên, email và mật khẩu ít nhất 10 ký tự.'},400);
   const created=await api('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email:body.email.trim(),password:body.password,email_confirm:true,user_metadata:{full_name:String(body.full_name).trim()}})});
   const id=created.id||created.user?.id;if(!id)throw new Error('Chưa nhận được mã tài khoản.');
   await api('/rest/v1/profiles?id=eq.'+id,{method:'PATCH',body:JSON.stringify({role,is_active:true,full_name:String(body.full_name).trim(),email:body.email.trim()})});
   return reply({ok:true});
  }
  if(body.action==='update'){
   const targets=await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(String(body.id))+'&select=id,role,is_active');const target=targets?.[0];
   if(!target)return reply({message:'Không tìm thấy thành viên.'},404);
   if(target.role==='admin'||target.id===me.id)return reply({message:'Không thay đổi quản trị chính hoặc chính tài khoản đang dùng.'},403);
   const role=body.role||target.role;
   if(!['viewer','editor','student_admin'].includes(role))return reply({message:'Vai trò không hợp lệ.'},400);
   if(me.role!=='admin'&&(target.role==='student_admin'||role==='student_admin'))return reply({message:'Chỉ Administrator Support được chỉ định quản trị học sinh chính.'},403);
   const patch={role,is_active:body.is_active!==false};
   await api('/rest/v1/profiles?id=eq.'+target.id,{method:'PATCH',body:JSON.stringify(patch)});
   return reply({ok:true});
  }
  return reply({message:'Thao tác không hợp lệ.'},400);
 }catch(error){return reply({message:error instanceof Error?error.message:'Không xử lý được yêu cầu.'},400);}
});
