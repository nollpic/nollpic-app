(() => {
 const ink='#293344',orange='#ffb45e',cream='#fffbed',mint='#91d0b2',pink='#f5a8b8',purple='#bda0e7';
 const svg=art=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g stroke="'+ink+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+art+'</g></svg>';
 const circle=(x,y,r,c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';
 const box=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+c+'"/>';
 const path=(d,c='none')=>'<path d="'+d+'" fill="'+c+'"/>';
 const art={};const add=(keys,d)=>keys.forEach(k=>art[k]=svg(d));
 add(['🎯'],circle(24,24,18,pink)+circle(24,24,11,cream)+circle(24,24,4,orange)+path('m24 24 17-17m-8 1 8-1-1 8'));
 add(['🧩'],path('M7 8h12V6a5 5 0 0 1 10 0v2h12v12h-3a5 5 0 0 0 0 10h3v11H29v-3a5 5 0 0 0-10 0v3H7V29h3a5 5 0 0 0 0-10H7Z',purple));
 add(['⚡'],path('m28 3-19 24h13l-3 18 20-26H26Z','#ffd66e'));
 add(['🔍','🔎'],circle(20,20,14,mint)+circle(20,20,9,cream)+path('m30 30 13 13'));
 add(['✋','👏','👍'],path('M14 24V12a3 3 0 0 1 6 0v10V6a3 3 0 0 1 6 0v16V8a3 3 0 0 1 6 0v16V14a3 3 0 0 1 6 0v17c0 9-5 13-12 13-6 0-9-3-12-8L6 25a3 3 0 0 1 5-3l3 4Z',pink));
 add(['💪'],path('M9 31 16 14l9-5 7 6-5 6-6-4-3 13q9-8 17-2 10 7 4 14H11Q2 38 9 31Z',orange));
 add(['🏆','🥇','🥈','🥉'],path('M14 5h20v13q0 11-10 11T14 18ZM14 9H6v7q0 9 11 8M34 9h8v7q0 9-11 8M24 29v9M15 43v-5h18v5Z','#ffd66e'));
 add(['🌱'],path('M24 44V20M24 25Q6 28 5 8q19-1 19 17M24 19Q26 3 43 5q0 18-19 14Z',mint));
 add(['🔥'],path('M23 3q5 14 13 20 13 20-12 22Q1 44 8 23q3 4 5 5 2-14 10-25Z',orange)+path('M24 25q11 13 0 17-11-5 0-17Z','#ffd66e'));
 add(['💡'],circle(24,19,12,'#ffd66e')+box(18,31,12,8,cream)+path('M20 44h8M24 2v3M5 18h4m30 0h4'));
 add(['🎲'],box(5,5,38,38,cream)+circle(15,15,2.5,ink)+circle(33,15,2.5,ink)+circle(24,24,2.5,ink)+circle(15,33,2.5,ink)+circle(33,33,2.5,ink));
 add(['📈','📏','🧮','🔢'],box(5,5,38,38,cream)+path('M12 34V22m12 12V14m12 20V9',orange));
 add(['🎁','📦','🧰','🧱','🟦','🔲'],box(6,16,36,27,orange)+box(4,11,40,10,pink)+path('M24 11v32M24 11Q4-5 8 9q3 6 16 2M24 11Q44-5 40 9q-3 6-16 2'));
 add(['🔒','💳'],box(9,20,30,24,orange)+path('M16 20v-9a8 8 0 0 1 16 0v9')+circle(24,31,2.5,ink)+path('M24 33v4'));
 add(['✨','🌟','🎉'],path('m24 3 6 14 15 2-11 10 3 16-13-8-13 8 3-16L3 19l15-2Z','#ffd66e'));
 add(['🎨','🌈'],path('M24 5q22 0 19 23-1 9-13 4-5 0-4 8-1 6-10 2Q1 37 5 22 8 5 24 5Z',cream)+circle(16,16,3,pink)+circle(29,14,3,orange)+circle(36,24,3,mint));
 add(['🔁','🧵','🧭','🏹'],circle(24,24,18,cream)+path('M13 25q0-16 20-8m0-7 1 9-9 1M35 24q0 16-20 8m0 7-1-9 9-1',orange));
 add(['🚀','🎮'],box(4,12,40,27,purple)+path('M14 19v12m-6-6h12')+circle(32,21,2,pink)+circle(37,29,2,orange));
 add(['💧'],path('M24 4Q4 27 9 37q14 17 29 0Q44 27 24 4Z','#9bd4e7'));
 add(['🔺'],path('m24 5 20 36H4Z',orange));
 add(['👕'],path('m16 5 8 5 8-5 13 9-7 9-6-4v24H16V19l-6 4-7-9Z',mint));
 add(['🍔'],path('M6 18q1-14 18-14t18 14Z',orange)+box(4,19,40,7,mint)+box(5,27,38,7,'#b18367')+box(6,35,36,9,orange));
 add(['🍣'],box(5,22,38,20,cream)+box(3,14,42,16,pink)+path('m14 16-4 10m15-10-4 10m15-10-4 10'));
 add(['🏓'],circle(21,20,16,pink)+path('m29 32 9 11 6-6-11-9Z',orange)+circle(39,8,5,cream));
 add(['👦','👧','🧒'],circle(24,25,17,pink)+path('M7 22Q7 1 24 6q20-2 17 16-9-3-11-11-4 9-23 11Z','#9e7864')+circle(18,25,1.5,ink)+circle(30,25,1.5,ink)+path('M20 33q4 4 8 0'));
 const animals=['🦦','🐧','🐿','🐿️','🐳','🦉','🦊','🐼','🐰','🐢','🦁','🐟'];
 animals.forEach((key,i)=>{try{if(window.nollpicFlankerIcon){const icon=window.nollpicFlankerIcon(key);if(icon.startsWith('<svg')){art[key]=icon;return;}}}catch(_){} art[key]=svg(circle(13,10,7,i%2?mint:orange)+circle(35,10,7,i%2?mint:orange)+circle(24,26,19,i%2?mint:orange)+circle(18,25,2,ink)+circle(30,25,2,ink)+path('M20 33q4 4 8 0'));});
 const urls={};Object.entries(art).forEach(([k,v])=>urls[k]='url("data:image/svg+xml,'+encodeURIComponent(v).replace(/'/g,'%27')+'")');
 const old=window.PIXEL_ICONS||{};
 const render=(key,cls='')=>urls[key]?'<i class="px-ico flat-ico '+cls+'" data-flat-icon="'+key+'" style="background-image:'+urls[key].replaceAll('"',"'")+'" aria-hidden="true"></i>':key;
 window.pixIcon=render;window.PIXEL_ICONS={...old,...urls};
 const keys=Object.keys(art).sort((a,b)=>b.length-a.length);
 function scan(root){
  if(root.nodeType===1&&root.closest('svg,script,style,textarea,input,option,.flat-ico'))return;
  if(root.nodeType===3){const value=root.nodeValue;if(!keys.some(k=>value.includes(k)))return;const fragment=document.createDocumentFragment();let text=value;while(text){let index=text.length,key=null;for(const k of keys){const n=text.indexOf(k);if(n>=0&&n<index){index=n;key=k;}}if(!key){fragment.append(document.createTextNode(text));break;}fragment.append(document.createTextNode(text.slice(0,index)));const holder=document.createElement('span');holder.innerHTML=render(key);fragment.append(holder.firstChild);text=text.slice(index+key.length);}root.replaceWith(fragment);return;}
  if(root.nodeType!==1)return;
  if(root.matches('.px-ico:not(.flat-ico)')){const style=root.getAttribute('style')||'';for(const [k,url]of Object.entries(old)){if(urls[k]&&style.includes(url)){root.style.backgroundImage=urls[k];root.classList.add('flat-ico');break;}}}
  [...root.childNodes].forEach(scan);
 }
 scan(document.body);
 new MutationObserver(changes=>changes.forEach(change=>{if(change.type==='characterData')scan(change.target);else change.addedNodes.forEach(scan);})).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
