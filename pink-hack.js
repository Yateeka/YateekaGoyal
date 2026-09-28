// Pink rain is a brief transition, never a continuous background animation.
(() => {
  const canvas = document.querySelector('#codeRain');
  const context = canvas.getContext('2d');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, finishTimer = 0, generation = 0, completeCurrent = null;
  const chars = '01{}<>/アイウエオカキクケコ';
  window.playPinkTransition = (onComplete = () => {}) => {
    cancelAnimationFrame(frame);
    clearTimeout(finishTimer);
    const current = ++generation;
    completeCurrent = onComplete;
    canvas.classList.remove('rain-transition');
    context?.clearRect(0,0,canvas.width,canvas.height);
    if (!context || preference.matches || document.hidden) { completeCurrent = null; onComplete(); return; }
    // A temporary top-layer canvas also covers native modal dialogs.
    if (!canvas.matches(':popover-open')) canvas.showPopover?.();
    const width = innerWidth, height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio;
    context.setTransform(ratio,0,0,ratio,0,0);
    const drops = Array.from({length:Math.ceil(width/22)},()=>Math.random()*height/20);
    const theme = document.documentElement.dataset.theme || 'normal';
    const rainColors = theme === 'light'
      ? ['#a82565', '#a82565', '#d65392']
      : theme === 'normal'
        ? ['#c491ed', '#aa72d4', '#f078ba', '#ffacd7']
        : ['#f858a9', '#f858a9', '#ffd6eb'];
    const start = performance.now();
    let last = 0;
    void canvas.offsetWidth;
    canvas.classList.add('rain-transition');
    function draw(now) {
      if(current !== generation) return;
      if(now-last>35) {
        last=now;
        context.globalCompositeOperation='destination-out';
        context.fillStyle='rgba(0,0,0,.16)';context.fillRect(0,0,width,height);
        context.globalCompositeOperation='source-over';
        context.font='14px monospace';
        drops.forEach((y,i)=>{
          context.fillStyle=rainColors[Math.floor(Math.random()*rainColors.length)];
          context.fillText(chars[Math.floor(Math.random()*chars.length)],i*22,y*20);
          drops[i]=y*20>height?-2:y+1.8;
        });
      }
      if(now-start<850) frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    finishTimer=setTimeout(finish,900);
  };
  function stop() {
    generation++;
    cancelAnimationFrame(frame);clearTimeout(finishTimer);
    canvas.classList.remove('rain-transition');
    if(canvas.matches(':popover-open')) canvas.hidePopover();
    context?.clearRect(0,0,canvas.width,canvas.height);
  }
  function finish() { const callback = completeCurrent; completeCurrent = null; stop(); callback?.(); }
  preference.addEventListener('change',finish);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  window.playPinkTransition(() => document.body.classList.remove('boot-loading'));
})();
