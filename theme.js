(() => {
 const button=document.querySelector('#themeButton');
 const panel=document.querySelector('#themePanel');
 const options=[...document.querySelectorAll('[data-theme-choice]')];
 function setTheme(value){
   if(!['light','normal','dark'].includes(value))value='normal';
   document.documentElement.dataset.theme=value;
   options.forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.themeChoice===value)));
   document.querySelector('meta[name="theme-color"]').content=value==='light'?'#fff3f8':value==='dark'?'#060507':'#2a1d2c';
   try{localStorage.setItem('yg-theme',value);}catch{}
 }
 function close(){panel.hidden=true;button.setAttribute('aria-expanded','false');}
 button.addEventListener('click',()=>{
   panel.hidden=!panel.hidden;
   button.setAttribute('aria-expanded',String(!panel.hidden));
 });
 options.forEach(option=>option.addEventListener('click',()=>setTheme(option.dataset.themeChoice)));
 document.addEventListener('click',event=>{if(!event.target.closest('.theme-control'))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){close();button.focus();}});
 setTheme(document.documentElement.dataset.theme||'normal');
})();
