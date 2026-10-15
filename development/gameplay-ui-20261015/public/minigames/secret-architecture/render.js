(function(root){
 function block(height,dir){
  let out='<svg viewBox="0 0 80 96" aria-hidden="true">';
  for(let z=0;z<height;z++)out+='<rect x="14" y="'+(70-z*18)+'" width="52" height="16" rx="4" fill="#9edddd" stroke="#172b47" stroke-width="2"/>';
  if(height)out+='<g transform="translate(40 '+(78-(height-1)*18)+') rotate('+dir*90+')"><path d="M0 -7L7 0H3V6H-3V0H-7Z" fill="#172b47"/></g>';
  return out+'</svg>';
 }
 root.NollpicBuildingArt={block};
})(window);
