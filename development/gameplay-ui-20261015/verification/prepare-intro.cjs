const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../public/minigames');
const file=path.join(root,'magic-circuit/index.html');let html=fs.readFileSync(file,'utf8');
const intro=`<section id="gm-intro" class="gm-screen np-intro" aria-labelledby="np-title">
<div data-intro-content></div>
<button id="gm-start" class="gm-primary" disabled>게임 시작하기 →</button>
<details class="np-options"><summary>학년 선택 · 연습 · 이어하기</summary><div id="np-settings"><button id="c-recover" class="gm-secondary" hidden>중단한 회로 이어하기 →</button><button id="gm-practice" class="gm-secondary" disabled>연습하기 · 평가·보상 제외</button></div></details></section>
`;
html=html.replace(/<section id="gm-intro"[\s\S]*?(?=<section id="gm-play")/,intro)
 .replace('<link rel="stylesheet" href="../game-intro.css">','<link rel="stylesheet" href="../game-intro.css"><link rel="stylesheet" href="intro.css">')
 .replace('<script src="../game-intro.js" defer>','<script src="../game-intro-config.js" defer></script><script src="../game-intro.js" defer>');
fs.writeFileSync(file,html);
const js=path.join(root,'magic-circuit/game.js');fs.writeFileSync(js,fs.readFileSync(js,'utf8').replace("difficulty:$('np-difficulty')","config:NollpicGameIntroConfig['MAGIC-CIRCUIT']"));
const cssFile=path.join(root,'game-intro.css');let css=fs.readFileSync(cssFile,'utf8');
css=css.replace(/\.np-intro\{display:grid;gap:12px;text-align:left\}/,'.np-intro,.np-intro [data-intro-content]{display:grid;gap:12px;text-align:left}')
 .replace(/\.np-intro \.np-banner\{[^}]*\}[\s\S]*?(?=\.np-intro \.np-info\{)/,`/* All banner text is HTML; original objects and avatar remain separate. */
.np-intro .np-banner{border:2px solid #293b60;border-radius:20px;overflow:hidden;background:#f2f8ee}
.np-intro .np-banner-heading{position:relative;padding:20px 18px 0;z-index:1}
.np-intro .np-title{font-size:clamp(30px,8.5vw,42px);line-height:1.15;text-align:left;margin:0;color:#12234b;font-weight:400;word-break:keep-all}
.np-intro .np-mission{font-size:18px;line-height:1.4;margin:9px 0 0;max-width:27ch;color:#344b68;word-break:keep-all}
.np-intro .np-scene{position:relative;height:154px;margin:4px 12px 0;isolation:isolate}
.np-intro .np-scene-object{position:absolute;right:4%;bottom:0;width:47%;height:100%;object-fit:contain;z-index:1}
.np-intro .np-scene-avatar{position:absolute;left:12%;bottom:7px;width:61px;z-index:2}
.np-intro .np-info-copy{text-align:left;min-width:0}
`)
 .replace('.np-icon.target','.np-icon-target')
 .replace('background:#00bfa6','background:#00a98f');
css+='\n.np-intro .np-icon-bulb{background:none}\n@media(min-width:600px){.np-intro .np-scene{height:205px}.np-intro .np-scene-avatar{width:80px}}\n@media(max-width:370px){.np-intro .np-scene{height:140px}}\n';
fs.writeFileSync(cssFile,css);
const server=path.join(__dirname,'local-server.cjs');fs.writeFileSync(server,fs.readFileSync(server,'utf8').replace('const port = 8802','const port = 8803'));
