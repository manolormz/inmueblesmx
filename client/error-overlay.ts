(function(){
  function showOverlay(msg:string){
    try{
      const el = document.createElement("div");
      el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);color:#fff;z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px";
      el.innerHTML = "<pre style='max-width:90%;max-height:80%;overflow:auto;font-family:ui-monospace,Menlo,monospace;font-size:12px;white-space:pre-wrap'>"+msg+"</pre>";
      document.body.appendChild(el);
    }catch(e){
      console.error("[overlay-fail]", e);
    }
  }
  window.addEventListener("error", (e:any)=> showOverlay("[window.onerror]\n"+(e?.error?.stack || e?.message || String(e))));
  window.addEventListener("unhandledrejection", (e:any)=> showOverlay("[unhandledrejection]\n"+(e?.reason?.stack || String(e?.reason))));
})();
