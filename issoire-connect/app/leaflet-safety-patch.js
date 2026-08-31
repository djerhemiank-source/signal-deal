(()=>{
let patched=false;
function patch(){
 if(patched||!window.L||!L.Map||!L.map)return;
 patched=true;
 const originalMap=L.map;
 L.map=function(target,options={}){
   return originalMap.call(L,target,{zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,inertia:false,...options});
 };
 const originalRemove=L.Map.prototype.remove;
 L.Map.prototype.remove=function(){
   try{if(this._panAnim)this._panAnim.stop();}catch{}
   try{if(this._flyToFrame)cancelAnimationFrame(this._flyToFrame);}catch{}
   try{this._stop();}catch{}
   try{this.stop();}catch{}
   return originalRemove.call(this);
 };
}
patch();
document.addEventListener('load',ev=>{
 const el=ev.target;
 if(el&&el.tagName==='SCRIPT'&&/leaflet/i.test(el.src||''))patch();
},true);
})();
