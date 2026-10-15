const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Closing always removes the iframe even when history emits no parent popstate',()=>{
 const listeners={},storage=new Map();let removed=0,back=0;const backdrop={inert:false},page={id:'page-11',scrollTop:10,querySelector:()=>null};
 const ctx={window:{addEventListener:(n,f)=>listeners[n]=f},document:{querySelector:s=>s==='.app-device'?backdrop:page,querySelectorAll:()=>[],body:{appendChild(){}},createElement:()=>({setAttribute(){},appendChild(){},remove(){removed++;}})},location:{href:'https://example.invalid/?page=challenge'},history:{state:null,pushState(s){this.state=s;},back(){back++;}},sessionStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},URLSearchParams,setTimeout};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../public/minigames/game-host.js'),'utf8'),ctx);
 for(const game of ['ATT-001','MAGIC-CIRCUIT','REVERSAL-DIRECTION','COLOR-WIZARD','CIPHER-369','SECRET-ARCHITECTURE','SECRET-DOOR']){ctx.window.NollpicMiniGameHost.open(game);a.equal(backdrop.inert,true);ctx.window.NollpicMiniGameHost.close();a.equal(backdrop.inert,false);a.equal(storage.size,0);}
 a.equal(removed,14);a.equal(back,7);
});
