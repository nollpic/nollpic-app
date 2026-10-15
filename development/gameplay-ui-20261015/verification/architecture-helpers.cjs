const model=require('../public/minigames/secret-architecture/engine.js');
function solve(attempt,g=model.create({...attempt,sessionId:attempt.attemptId||attempt.sessionId}),wrong=false){let at=g.checkpoint().elapsedMs;const apply=(kind,cell=null)=>g.apply({kind,cell,at:at+=20});
 while(!g.result()){const v=g.view();if(v.phase==='ready')apply('begin');else if(['reveal','hint'].includes(v.phase)){at+=v.phase==='hint'?3000:v.board.revealMs;apply('hide');}else if(v.phase==='feedback')apply('next');else{if(wrong){apply('submit');continue;}for(let i=0;i<v.cells.length;i++){const t=v.board.target[i],c={...v.cells[i]};while(c.height>t.height){apply('remove',i);c.height--;if(!c.height)c.dir=0;}while(c.height<t.height){apply('add',i);c.height++;}while(c.height&&c.dir!==t.dir){apply('rotate',i);c.dir=(c.dir+1)%4;}}apply('submit');}}
 return g.result();}
module.exports={model,solve};
