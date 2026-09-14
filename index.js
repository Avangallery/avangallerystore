const j=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json;charset=utf-8",...h}});
const ck=(n,v,m)=>`${n}=${encodeURIComponent(v)}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${m}`;
const gc=(r,n)=>{const x=r.headers.get("Cookie")?.match(new RegExp(`(?:^|; )${n}=([^;]*)`));return x?decodeURIComponent(x[1]):null};
async function sig(secret,text){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(text)))}
function b64(a){let s="";for(const x of a)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function ub(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function token(sec){const e=Date.now()+28800000,b=b64(new TextEncoder().encode(""+e));return b+"."+b64(await sig(sec,b))}
async function auth(r,e){const t=gc(r,"avan_admin"),[b,s]=t?.split(".")||[];if(!b||!s)return false;const a=ub(s),x=await sig(e.ADMIN_SECRET,b);let d=a.length^x.length;for(let i=0;i<Math.min(a.length,x.length);i++)d|=a[i]^x[i];return d===0&&Number(new TextDecoder().decode(ub(b)))>Date.now()}
async function products(e,all=false){let q="SELECT * FROM products";if(!all)q+=" WHERE available=1";q+=" ORDER BY id DESC";return (await e.DB.prepare(q).all()).results}
export default {async fetch(r,e){
 const u=new URL(r.url),p=u.pathname;
 if(p==="/api/login"&&r.method==="POST"){const b=await r.json().catch(()=>({}));if(b.password!==e.ADMIN_PASSWORD)return j({error:"رمز عبور اشتباه است."},401);return j({ok:true},200,{"Set-Cookie":ck("avan_admin",await token(e.ADMIN_SECRET),28800)})}
 if(p==="/api/logout"&&r.method==="POST")return j({ok:true},200,{"Set-Cookie":ck("avan_admin","",0)});
 if(p==="/api/me")return j({admin:await auth(r,e)});
 if(p==="/api/products"&&r.method==="GET"){const a=u.searchParams.get("admin")==="1"&&await auth(r,e);return j(await products(e,a))}
 if(p==="/api/products"&&r.method==="POST"){if(!await auth(r,e))return j({error:"Unauthorized"},401);const b=await r.json();if(!b.name||!b.price)return j({error:"نام و قیمت الزامی است."},400);const z=await e.DB.prepare("INSERT INTO products(name,category,price,badge,description,image_key,available) VALUES(?,?,?,?,?,?,?)").bind(b.name,b.category||"ساعت مردانه",b.price,b.badge||"",b.description||"",b.image_key||"",b.available?1:0).run();return j({ok:true,id:z.meta.last_row_id})}
 if(p.startsWith("/api/products/")&&(r.method==="PUT"||r.method==="DELETE")){if(!await auth(r,e))return j({error:"Unauthorized"},401);const id=Number(p.split("/").pop());if(r.method==="DELETE")await e.DB.prepare("DELETE FROM products WHERE id=?").bind(id).run();else{const b=await r.json();await e.DB.prepare("UPDATE products SET name=?,category=?,price=?,badge=?,description=?,image_key=?,available=? WHERE id=?").bind(b.name,b.category,b.price,b.badge||"",b.description||"",b.image_key||"",b.available?1:0,id).run()}return j({ok:true})}
 if(p==="/api/upload"&&r.method==="POST"){if(!await auth(r,e))return j({error:"Unauthorized"},401);const f=(await r.formData()).get("file");if(!(f instanceof File)||!f.type.startsWith("image/"))return j({error:"فقط تصویر مجاز است."},400);if(f.size>5*1024*1024)return j({error:"حداکثر ۵ مگابایت."},400);const ext=(f.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"").toLowerCase()||"jpg",key=`products/${crypto.randomUUID()}.${ext}`;await e.IMAGES.put(key,f.stream(),{httpMetadata:{contentType:f.type,cacheControl:"public,max-age=31536000,immutable"}});return j({ok:true,key})}
 if(p.startsWith("/media/")){const o=await e.IMAGES.get(p.slice(7));if(!o)return new Response("Not found",{status:404});const h=new Headers();o.writeHttpMetadata(h);h.set("cache-control","public,max-age=31536000,immutable");return new Response(o.body,{headers:h})}
 return e.ASSETS.fetch(r);
}};