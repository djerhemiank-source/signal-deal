(()=>{
if(typeof go!=='function'||typeof renderDirectoryPage!=='function')return;
const _goAfterDirectory=go;
go=function(page,...args){
 const result=_goAfterDirectory(page,...args);
 if(page==='businesses'||page==='nearby'){
   Promise.resolve(result).catch(()=>{}).finally(()=>setTimeout(()=>renderDirectoryPage(page==='nearby'),0));
 }
 return result;
};
})();
