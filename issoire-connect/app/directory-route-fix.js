(()=>{
if(typeof go!=='function'||typeof renderDirectoryPage!=='function')return;
const _goWithEarlyDirectoryRender=go;
const _renderDirectory=renderDirectoryPage;
let navSeq=0;
go=function(page,...args){
 const isDirectory=page==='businesses'||page==='nearby';
 const seq=++navSeq;
 if(!isDirectory){
   window.renderDirectoryPage=_renderDirectory;
   return _goWithEarlyDirectoryRender(page,...args);
 }
 const noop=()=>Promise.resolve();
 window.renderDirectoryPage=noop;
 let result;
 try{result=_goWithEarlyDirectoryRender(page,...args)}catch(err){window.renderDirectoryPage=_renderDirectory;throw err}
 Promise.resolve(result).catch(()=>{}).finally(()=>setTimeout(()=>{
   if(seq!==navSeq)return;
   window.renderDirectoryPage=_renderDirectory;
   _renderDirectory(page==='nearby');
 },0));
 return result;
};
})();
