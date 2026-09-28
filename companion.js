(() => {
  const companion = document.querySelector('#pixelCompanion');
  const menu = document.querySelector('#companionMenu');
  const character = document.querySelector('#characterButton');
  const scene = document.querySelector('#companionScene');
  const portrait = character.querySelector('img');
  const angryPreload = new Image(); angryPreload.src = 'pixel-yateeka-angry.png';
  const bubble = document.querySelector('#companionBubble');
  const interaction = document.querySelector('#activityInteraction');
  const pause = document.querySelector('#pauseCompanion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, activity = 'bracelets', step = 0;
  let x = 20, y = 16, targetX = x, targetY = y, restingUntil = performance.now()+3500, lastTime = 0;
  let moving = false, dragging = false, dragged = false, dragStart = null;
  const layer = document.createElement('div');
  layer.className = 'companion-world';
  companion.before(layer);
  layer.append(companion);
  function place() {
    companion.style.transform = 'translate3d('+x+'px,'+(-y)+'px,0)';
    positionMenu();
  }
  function positionMenu() {
    if(menu.hidden)return;
    const rect=companion.getBoundingClientRect();
    const width=menu.offsetWidth, height=menu.offsetHeight, gap=14, margin=12;
    const right=rect.right+gap;
    const left=rect.left-width-gap;
    const desiredLeft=right+width<=innerWidth-margin?right:left;
    const viewportLeft=Math.max(margin,Math.min(innerWidth-width-margin,desiredLeft));
    const viewportTop=Math.max(margin,Math.min(innerHeight-height-margin,rect.top));
    menu.style.left=(viewportLeft-rect.left)+'px';
    menu.style.top=(viewportTop-rect.top)+'px';
    menu.style.bottom='auto';
    menu.style.right='auto';
  }
  function stopWalking() {
    moving = false; targetX = x; targetY = y;
    companion.classList.remove('wandering');
    restingUntil = performance.now()+3000+Math.random()*3000;
  }
  function bringIntoView() {
    x = Math.max(12,Math.min(innerWidth-companion.offsetWidth-12,x));
    y = Math.max(12,Math.min(Math.max(12,innerHeight-companion.offsetHeight-12),y)); stopWalking(); place();
  }
  let emotionTimer, idleTimer, attentionTimer;
  const emotionMark = character.querySelector('.emotion-mark');
  const outfitPicker = document.querySelector('#pixelOutfit');
  const outfitPositions={polka:'0%',winter:'33.333%',floral:'66.667%',sari:'100%'};
  function applyOutfit(outfit){
    companion.dataset.outfit=outfit;
    companion.style.setProperty('--outfit-position',outfitPositions[outfit]||'0%');
  }
  function seasonFor(date=new Date()){
    const month=date.getMonth();
    if(month===11||month<2)return 'winter';
    if(month<5)return 'spring';
    if(month<8)return 'summer';
    return 'fall';
  }
  const seasonalOutfits={winter:'winter',spring:'floral',summer:'polka',fall:'professional'};
  // US observance dates from USC's Hindu holy-days calendar; regional dates can vary.
  const hinduFestivalDates=new Set([
    '2026-08-28','2026-09-04','2026-09-14',...dateRange('2026-10-11','2026-10-20'),'2026-11-08',
    '2027-03-06','2027-03-22','2027-08-17','2027-08-25','2027-09-04',...dateRange('2027-09-30','2027-10-09'),'2027-10-29',
    '2028-02-23','2028-03-11','2028-08-05','2028-08-13','2028-08-23',...dateRange('2028-09-19','2028-09-27'),'2028-10-17',
    '2029-02-11','2029-03-01'
  ]);
  function dateRange(first,last){
    const dates=[],date=new Date(first+'T12:00:00'),end=new Date(last+'T12:00:00');
    while(date<=end){dates.push(date.toISOString().slice(0,10));date.setDate(date.getDate()+1)}
    return dates;
  }
  function calendarDate(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
  function outfitForDate(date){return hinduFestivalDates.has(calendarDate(date))?'sari':seasonalOutfits[seasonFor(date)]}
  let checkedDate=calendarDate(new Date()), selectedOutfit=outfitForDate(new Date()), sleeping=false;
  applyOutfit(selectedOutfit);
  outfitPicker.value=selectedOutfit;
  outfitPicker.addEventListener('change',()=>{
    selectedOutfit=outfitPicker.value;
    if(!sleeping)applyOutfit(selectedOutfit);
    bubble.textContent='New outfit, same curious me ♡';
  });
  function refreshCalendarOutfit(){
    const now=new Date(),nextDate=calendarDate(now);
    if(nextDate!==checkedDate){
      checkedDate=nextDate;
      selectedOutfit=outfitForDate(now);
      outfitPicker.value=selectedOutfit;
      if(!sleeping)applyOutfit(selectedOutfit);
    }
  }
  setInterval(refreshCalendarOutfit,60*1000);
  function setSleeping(value){
    sleeping=value;
    applyOutfit(sleeping?'pajamas':selectedOutfit);
  }
  function react(emotion,message,duration=5500){
    if(dragging || companion.hidden || document.body.classList.contains('dialog-open'))return;
    clearTimeout(emotionTimer);
    setSleeping(emotion==='sleepy');
    stopWalking();
    companion.dataset.emotion=emotion;
    emotionMark.textContent={happy:'♡',thinking:'…?',proud:'✦',confused:'?',sleepy:'z Z',excited:'✧ ♡ ✧',shy:'♡'}[emotion]||'';
    bubble.textContent=message;
    emotionTimer=setTimeout(()=>{
      companion.dataset.emotion='';emotionMark.textContent='';
      if(sleeping)setSleeping(false);
      if(!dragging)bubble.textContent='Hi, I am Yateeka off duty';
    },duration);
  }
  addEventListener('pixel-command',event=>{companion.classList.toggle('on-contact',event.detail.command==='contact');});
  addEventListener('pixel-reaction',event=>react(event.detail.emotion,event.detail.message));
  function resetIdle(){
    clearTimeout(idleTimer);
    if(companion.dataset.emotion==='sleepy'){companion.dataset.emotion='';emotionMark.textContent='';setSleeping(false);bubble.textContent='Hi, I am Yateeka off duty';}
    idleTimer=setTimeout(()=>react('sleepy','Still there? I’m taking a tiny nap.',60000),45000);
  }
  document.addEventListener('pointerdown',resetIdle,{passive:true});
  document.addEventListener('keydown',resetIdle);
  resetIdle();
  let neglect = 0, takingOver = false;
  function resetAttention(){
    clearTimeout(attentionTimer);
    if(takingOver || companion.hidden || document.hidden)return;
    neglect=0;
    companion.style.removeProperty('--attention-scale');
    character.style.transform='scale(1)';
    bubble.textContent='Hi, I am Yateeka off duty';
    attentionTimer=setTimeout(escalateNeglect,20000);
  }
  function escalateNeglect(){
    if(takingOver || companion.hidden || document.hidden)return;
    neglect++;
    const scale=1+neglect*.12;
    companion.style.setProperty('--attention-scale',scale);
    character.style.transform='scale('+scale+')';
    bubble.textContent=neglect<3?'Hey… still there?':'I’m getting bigger over here…';
    if(neglect>=12){takeOverPage();return;}
    attentionTimer=setTimeout(escalateNeglect,20000);
  }
  function takeOverPage(){
    if(takingOver)return;
    takingOver=true;
    clearTimeout(emotionTimer);
    clearTimeout(idleTimer);
    stopWalking();
    closeMenu();
    layer.classList.add('pixel-takeover');
    companion.classList.add('attention-takeover');
    companion.style.transform='none';
    bubble.textContent='I was waiting for you… ♡';
    character.setAttribute('aria-label','Pixel Yateeka has taken over the page');
    setTimeout(()=>location.assign('yateeka-is-sad.html'),reduced.matches?400:1800);
  }
  companion.addEventListener('pointerdown',()=>{
    if(companion.dataset.emotion==='crying')react('happy','You’re here! Okay, I’m happy now ♡');
    resetAttention();
  });
  companion.addEventListener('keydown',resetAttention);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)clearTimeout(attentionTimer);
    else{refreshCalendarOutfit();resetAttention();}
  });
  const activities = ['bracelets', 'sewing', 'teaching', 'travelling', 'kdrama', 'anime'];
  const descriptions = {bracelets:'One more bead. Always one more.',sewing:'A stitch in time… and a little pink.',teaching:'Big ideas start with small questions.',travelling:'BRB, dreaming about my next trip ✈',kdrama:'Just one more episode of Mr. Queen…',anime:'Maomao has entered the chat ♡',donuts:'Donut worry, I saved you a bite. 🍩'};
  let donutTimer, donutRainTimer, donutReady=false, donutCount=0;
  function clearDonutGame(){
    clearInterval(donutTimer);clearInterval(donutRainTimer);donutReady=false;donutCount=0;
    layer.querySelectorAll('.falling-donut').forEach(node=>node.remove());
  }
  function checkDonutCatch(){
    if(!donutReady)return;
    const yateeka=character.getBoundingClientRect();
    const target={left:yateeka.left-28,right:yateeka.right+28,top:yateeka.top-28,bottom:yateeka.bottom+28};
    layer.querySelectorAll('.falling-donut').forEach(donut=>{
      const box=donut.getBoundingClientRect();
      if(box.right>target.left&&box.left<target.right&&box.bottom>target.top&&box.top<target.bottom){
        feedDonut(donut);
      }
    });
  }
  function feedDonut(donut){
    if(donutCount>=5){
      bubble.textContent='I’m full! No more donuts, please. 🍩';
      const caption=document.querySelector('#activityFeedback');
      if(caption)caption.textContent='Yateeka is full. Five donuts was plenty! ♡';
      return;
    }
    if(!donutReady||donut.dataset.fed)return;
    donut.dataset.fed='true';donut.remove();donutCount++;
    bubble.textContent='nom nom nom 🍩';
    const caption=document.querySelector('#activityFeedback');
    if(caption)caption.textContent='Donuts fed: '+donutCount+' / 5. Drag me to another!';
    if(donutCount>=5){
      donutReady=false;clearInterval(donutRainTimer);react('happy','Donut-powered and ready to wander! ♡');
      if(caption)caption.textContent='Snack mission complete. Five donuts, zero regrets. ♡';
      const action=document.querySelector('.donut-feed-action');
      if(action){action.textContent='I’m full! 🍩';action.disabled=true;}
    }
  }
  function dropDonut(){
    const donut=document.createElement('button');donut.type='button';donut.className='falling-donut';donut.textContent=['🍩','🍩','🍩'][Math.floor(Math.random()*3)];donut.setAttribute('aria-label','Falling donut');
    const flavor=['strawberry','chocolate','blueberry'][Math.floor(Math.random()*3)];donut.classList.add('donut-'+flavor);donut.title=flavor+' donut';
    donut.style.left=(8+Math.random()*Math.max(8,innerWidth-50))+'px';donut.style.top='-45px';donut.style.setProperty('--fall-time',(3.5+Math.random()*2)+'s');layer.append(donut);
    donut.addEventListener('click',()=>feedDonut(donut));
    setTimeout(()=>donut.remove(),7000);
  }
  function startDonutGame(caption,action){
    clearDonutGame();donutReady=false;
    action.classList.add('donut-feed-action');
    let seconds=5;caption.textContent='I’m hungry… click Feed her to start!';action.textContent='Feed her! 🍩';action.disabled=false;action.hidden=false;
    action.onclick=()=>{
      if(donutReady){checkDonutCatch();bubble.textContent='Bring me closer to a donut! 🍩';return;}
      action.disabled=true;caption.textContent='Snack time loading… 5 seconds';bubble.textContent='Preparing the donut drop…';
      clearInterval(donutTimer);seconds=5;
      donutTimer=setInterval(()=>{seconds--;caption.textContent='Snack time loading… '+seconds+' seconds';if(seconds<=0){clearInterval(donutTimer);donutReady=true;action.disabled=false;action.textContent='Feed her! Drag Yateeka to a donut';caption.textContent='Donuts incoming! Drag me into 5 donuts before they disappear.';bubble.textContent='Catch the donuts! 🍩';donutRainTimer=setInterval(dropDonut,900);dropDonut();}},1000);
    };
  }
  function setActivity(next) {
    activity = next; step = 0;
    scene.dataset.activity = next;
    bubble.textContent = descriptions[next];
    document.querySelectorAll('[data-activity]').forEach(button => {
      if(button.tagName==='BUTTON') button.setAttribute('aria-pressed',String(button.dataset.activity===next));
    });
    clearDonutGame();interaction.replaceChildren();
    interaction.classList.toggle('donut-mini-game',next==='donuts');
    const caption = document.createElement('p');
    caption.id = 'activityFeedback'; caption.setAttribute('role','status');
    const action = document.createElement('button');
    action.className = 'activity-action';
    if(next === 'bracelets') {
      caption.textContent = 'Help me finish a bracelet: 0 / 6 beads.';
      action.textContent = '+ Add a pink bead';
      action.onclick = () => {
        step = Math.min(step+1,6);
        scene.style.setProperty('--bead-color', ['#ff79bc','#bba1ff','#fff0aa'][step%3]);
        caption.textContent = step===6 ? 'Friendship bracelet complete. This one’s for you ♡' : step+' / 6 beads. Looking cute!';
        action.disabled = step===6;
        if(step===6)setTimeout(()=>react('excited','Matching bracelets? Obviously.'),0);
        bubble.textContent = step===6 ? 'Made you a bracelet ♡' : 'Threading bead '+step+'…';
      };
    } else if(next === 'donuts') {
      startDonutGame(caption,action);
    } else if(next === 'sewing') {
      caption.textContent = 'Let’s sew a tiny heart patch: 0 / 4 stitches.';
      action.textContent = '+ Add a stitch';
      action.onclick = () => {
        step = Math.min(step+1,4);
        caption.textContent = step===4 ? 'A heart patch, sewn with love ♡' : step+' / 4 stitches. Keep going!';
        scene.style.setProperty('--stitch-progress',step/4);
        bubble.textContent = step===4 ? 'Handmade > perfect ♡' : 'Stitch '+step+'…';
        action.disabled = step===4;
      };
    } else if(next === 'teaching') {
      caption.textContent = 'Tiny CS lesson: what does a loop do?';
      action.textContent = 'Repeats instructions';
      const other = document.createElement('button');
      other.className='activity-action';other.textContent='Deletes every variable';
      other.onclick=()=>{caption.textContent='Try again! Think of threading one bead after another.';};
      action.onclick=()=>{caption.textContent='Exactly! Like adding each bead to a bracelet. You’ve got it ♡';bubble.textContent='That’s my favorite part of teaching.';};
      interaction.append(other);
    }
    if(next === 'travelling') {
      const scene = document.createElement('div');
      scene.className='hobby-travel-scene';
      scene.setAttribute('aria-hidden','true');
      scene.innerHTML='<span class="travel-cloud">☁</span><span class="travel-plane">✈</span><span class="travel-route">· · · · · · · ·</span><span class="travel-case">▣</span>';
      interaction.append(scene);
      caption.textContent='A little daydream itinerary. Where should we go?';
      const destinations=['Seoul','Kyoto','Istanbul','Lisbon'];
      action.textContent='✈ Pick a daydream destination';
      action.onclick=()=>{
        const destination=destinations[step++%destinations.length];
        caption.textContent='Daydream stop: '+destination+'. Passport, headphones, curiosity — packed!';
        bubble.textContent='Next imaginary stop: '+destination+' ✈';
      };
    }
    if(next === 'kdrama' || next === 'anime') {
      const stage=document.createElement('div');
      stage.className='hobby-screen '+next;
      const sprite=document.createElement('div');
      sprite.className='hobby-sprite';
      const img=document.createElement('img');
      img.src='hobby-pixels.png';
      img.alt=next==='anime'?'Pixel Maomao from The Apothecary Diaries':'Pixel Queen Kim So-yong from Mr. Queen';
      sprite.append(img);stage.append(sprite);interaction.append(stage);
      const favorite=next==='anime'?'The Apothecary Diaries':'Mr. Queen';
      caption.textContent='My favorite '+(next==='anime'?'anime':'K-drama')+': '+favorite+'.';
      action.textContent=next==='anime'?'✦ Give Maomao a mystery':'♡ Start a watch break';
      action.onclick=()=>{
        step++;
        stage.classList.toggle('excited');
        caption.textContent=next==='anime'
          ? ['A mysterious tea! Maomao is investigating…','Clue found. Her curiosity wins again.','Case closed. Time for another mystery ♡'][(step-1)%3]
          : ['Royal chaos incoming. Popcorn ready!','One episode later… okay, one more.','Still my favorite kind of palace drama ♡'][(step-1)%3];
        bubble.textContent=next==='anime'?'Detective mode: Maomao edition.':'Do not disturb: Mr. Queen time ♡';
      };
    }
    interaction.prepend(caption,action);
  }
  function openMenu() {
    bringIntoView();
    menu.hidden=false;positionMenu();character.setAttribute('aria-expanded','true');
    companion.classList.remove('wandering');
    menu.querySelector('[data-activity]').focus({preventScroll:true});
  }
  new ResizeObserver(positionMenu).observe(menu);
  function closeMenu() {menu.hidden=true;character.setAttribute('aria-expanded','false');}
  character.addEventListener('click',event=>{
    if(dragged){event.preventDefault();dragged=false;return;}
    menu.hidden?openMenu():closeMenu();
  });
  document.querySelector('#companionName').addEventListener('click',openMenu);
  character.addEventListener('dragstart',event=>event.preventDefault());
  document.querySelector('#closeCompanion').addEventListener('click',()=>{closeMenu();character.focus({preventScroll:true});});
  document.querySelectorAll('button[data-activity]').forEach(button=>button.addEventListener('click',()=>setActivity(button.dataset.activity)));
  function updatePause() {
    pause.textContent=paused?'Resume wandering':'Pause wandering';
    pause.setAttribute('aria-pressed',String(paused));
    companion.classList.toggle('paused',paused);
    if(paused) stopWalking();
  }
  pause.onclick=()=>{
    paused=!paused;updatePause();
    if(paused)react('crying','No more wandering? Just one tiny adventure? 🥺',12000);
    else react('happy','Yay! Back to exploring ♡',3000);
  };
  document.querySelector('#hideCompanion').onclick=()=>{clearTimeout(attentionTimer);companion.hidden=true;closeMenu();document.querySelector('#showCompanion').hidden=false;document.querySelector('#showCompanion').focus();};
  document.querySelector('#showCompanion').onclick=()=>{companion.hidden=false;bringIntoView();resetAttention();document.querySelector('#showCompanion').hidden=true;character.focus({preventScroll:true});};
  companion.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();character.focus({preventScroll:true});}});
  function chooseDestination(now) {
    const width = companion.offsetWidth;
    const offscreen = x < 12 || x > innerWidth-width-12 || y < 12 || y > innerHeight-companion.offsetHeight-12;
    if(offscreen)bringIntoView();
    targetX=12+Math.random()*Math.max(0,innerWidth-companion.offsetWidth-24);
    targetY=12+Math.random()*Math.max(0,innerHeight-companion.offsetHeight-24);
    companion.style.setProperty('--walk-facing',targetX<x?'-1':'1');
    moving=true;
    companion.classList.add('wandering');
  }
  function wander(now) {
    const elapsed = Math.min((now-lastTime)/1000,.05);lastTime=now;
    const blocked = !!companion.dataset.emotion || dragging || companion.classList.contains('daring') || paused || reduced.matches || !menu.hidden || companion.hidden || document.hidden || document.body.classList.contains('dialog-open') || companion.matches(':hover,:focus-within');
    if(blocked) {
      companion.classList.remove('wandering');
    } else if(moving) {
      companion.classList.add('wandering');
      const dx=targetX-x,dy=targetY-y,distance=Math.hypot(dx,dy);
      const speed=innerWidth<600?45:65;
      if(distance<=speed*elapsed) {
        x=targetX;y=targetY;stopWalking();
        restingUntil=now+3500+Math.random()*4000;
        setActivity(activities[Math.floor(Math.random()*activities.length)]);
      } else {
        x+=dx/distance*speed*elapsed;y+=dy/distance*speed*elapsed;
      }
      place();
    } else if(now>restingUntil)chooseDestination(now);
    requestAnimationFrame(wander);
  }
  companion.addEventListener('pointerenter',()=>{if(moving)stopWalking();});
  companion.addEventListener('focusin',()=>{if(menu.hidden && !dragStart && !dragging)bringIntoView();});
  addEventListener('resize',bringIntoView);
  character.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    if(event.pointerType==='mouse') event.preventDefault();
    stopWalking();
    dragStart={px:event.clientX,py:event.clientY,x,y};
    dragged=false;
    character.setPointerCapture(event.pointerId);
  });
  character.addEventListener('pointermove',event=>{
    if(!dragStart)return;
    const dx=event.clientX-dragStart.px,dy=event.clientY-dragStart.py;
    if(!dragging && Math.hypot(dx,dy)<6)return;
    if(!dragging){
      dragging=true;dragged=true;closeMenu();stopWalking();
      clearTimeout(emotionTimer);companion.dataset.emotion='';emotionMark.textContent='';
      companion.classList.add('being-dragged');
      portrait.src='pixel-yateeka-angry.png';
      bubble.textContent='noooooo';
    }
    x=Math.max(0,Math.min(Math.max(0,innerWidth-companion.offsetWidth),dragStart.x+dx));
    y=Math.max(0,Math.min(innerHeight-companion.offsetHeight,dragStart.y-dy));
    place();
    checkDonutCatch();
  });
  function finishDrag(){
    if(dragging){
      dragging=false;paused=true;
      const maxX=Math.max(0,innerWidth-companion.offsetWidth);
      const maxY=Math.max(0,innerHeight-companion.offsetHeight);
      if(x<35)x=8;
      else if(maxX-x<35)x=Math.max(0,maxX-8);
      if(y<35)y=8;
      else if(maxY-y<35)y=Math.max(0,maxY-8);
      place();updatePause();
      companion.classList.remove('being-dragged');
      portrait.src='pixel-yateeka.png';
      bubble.textContent='Hi, I am Yateeka off duty';
      pause.textContent='Let me wander again';
      character.setAttribute('aria-label','Pixel Yateeka is parked here. Click to let her wander again or choose an activity.');
      checkDonutCatch();
    }
    dragStart=null;
  }
  character.addEventListener('pointerup',finishDrag);
  character.addEventListener('pointercancel',finishDrag);
  character.addEventListener('lostpointercapture',finishDrag);
  const hackingButton=document.querySelector('#hackingMode');
  let beforeDare='', beforeDarePortrait='';
  const mischiefPreload=new Image();mischiefPreload.src='pixel-yateeka-mischief.png';
  function dare(){
    if(companion.hidden || companion.classList.contains('daring'))return;
    beforeDare=bubble.textContent;
    if(x<0||x>innerWidth-companion.offsetWidth||y<0||y>innerHeight-companion.offsetHeight)bringIntoView();
    stopWalking();
    bubble.textContent='I dare you to click it';
    beforeDarePortrait=portrait.getAttribute('src');
    if(companion.dataset.outfit==='professional')portrait.src='pixel-yateeka-mischief.png';
    companion.classList.add('daring');
  }
  function stopDare(){
    if(!companion.classList.contains('daring'))return;
    companion.classList.remove('daring');
    portrait.src=companion.dataset.outfit==='professional'?(dragging?'pixel-yateeka-angry.png':'pixel-yateeka.png'):beforeDarePortrait;
    bubble.textContent=beforeDare;
  }
  hackingButton.addEventListener('pointerenter',dare);
  hackingButton.addEventListener('pointerleave',stopDare);
  hackingButton.addEventListener('focus',dare);
  hackingButton.addEventListener('blur',stopDare);
  reduced.addEventListener('change',()=>{paused=reduced.matches;updatePause();});
  setActivity('bracelets');
  const terminalRect=document.querySelector('.terminal').getBoundingClientRect();
  x=Math.max(12,Math.min(innerWidth-companion.offsetWidth-12,terminalRect.right-companion.offsetWidth-20));
  y=Math.max(12,Math.min(innerHeight-companion.offsetHeight-12,innerHeight-terminalRect.bottom+155));
  targetX=x;targetY=y;
  restingUntil=performance.now()+14000;
  updatePause();bringIntoView();
  bubble.textContent='Hi, I am Yateeka off duty';
  resetAttention();
  requestAnimationFrame(wander);
})();
