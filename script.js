document.body.classList.add('boot-loading');
const menu = document.querySelector('#menuToggle');
const links = document.querySelector('#navigationLinks');
menu.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && links.classList.contains('open')) {
    closeMenu(); menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav')) closeMenu();
});
const output = document.querySelector('#terminalOutput');
const commandSections = {about:'#about',research:'#research',projects:'#projects',experience:'#experience',community:'#community',contact:'#contact'};
const sources = {};
Object.entries(commandSections).forEach(([name, selector]) => {
  sources[name] = document.querySelector(selector);
  sources[name].hidden = true;
});
document.querySelector('#viewToolbar').hidden = true;
document.body.classList.add('terminal-home');
function closeMenu() {
  links.classList.remove('open');
  menu.setAttribute('aria-expanded','false');
  menu.setAttribute('aria-label','Open navigation');
}
function setActive(command) {
  document.querySelectorAll('[data-command]').forEach(button => {
    button.classList.toggle('active', button.dataset.command === command);
    button.setAttribute('aria-pressed', String(button.dataset.command === command));
  });
  document.querySelector('#commandAnnouncement').textContent = command + ' displayed in terminal.';
}
function showContent(command) {
  if(command==='research')dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'thinking',message:'Ooh, this is the interesting part.'}}));
  if(command==='experience')dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'proud',message:'I work here!'}}));
  if(command==='contact')dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'happy',message:'Let’s connect! ♡'}}));
  if(command==='projects')dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'proud',message:'I made that!'}}));
  const response = document.createElement('div');
  response.className = 'command-result';
  response.dataset.view = command;
  const heading = document.createElement('h2');
  heading.textContent = {about:'A little about me',research:'Questions I’m exploring',projects:'Things I’ve built',experience:'Where I’ve worked',community:'Building community',contact:'Let’s connect'}[command] || command;
  response.append(heading);
  const clone = sources[command].cloneNode(true);
  clone.hidden = false;
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  clone.querySelectorAll('.section-heading,.project-toolbar,.project-art,.research-symbol,.paper-mark,.contact-star').forEach(el=>el.remove());
  if(command==='contact')clone.querySelector(':scope > h2')?.remove();
  if(command==='experience') {
    clone.querySelectorAll('.experience-row').forEach((row,index)=>{
      const details=document.createElement('details');
      details.className='experience-detail';details.open=index===0;
      const summary=document.createElement('summary');
      const title=document.createElement('span');title.textContent=row.querySelector('h3').textContent;
      const date=document.createElement('span');date.className='experience-summary-date';
      date.textContent=row.querySelector('.experience-date').firstChild.textContent;
      summary.append(title,date);
      row.querySelector('h3').remove();row.querySelector('.experience-date').remove();
      details.append(summary);row.before(details);details.append(row);
    });
  }
  response.append(clone);
  output.append(response);
  if(command==='projects')setupProjectCarousel(clone);
  output.scrollTop = 0;
}
function setupProjectCarousel(root) {
  const track=root.querySelector('.project-grid');
  const cards=[...track.children];
  track.classList.add('project-carousel');
  track.tabIndex=0;
  track.setAttribute('role','region');
  track.setAttribute('aria-label','Projects carousel. Swipe or use arrow keys to explore.');
  const controls=document.createElement('div');
  controls.className='carousel-controls';
  controls.innerHTML='<button type="button" aria-label="Previous project">←</button><span aria-live="polite"></span><button type="button" aria-label="Next project">→</button>';
  track.before(controls);
  const [previous,next]=controls.querySelectorAll('button');
  const status=controls.querySelector('span');
  let current=0;
  function sync(){
    current=cards.reduce((best,card,i)=>Math.abs(card.offsetLeft-cards[0].offsetLeft-track.scrollLeft)<Math.abs(cards[best].offsetLeft-cards[0].offsetLeft-track.scrollLeft)?i:best,0);
    status.textContent=(current+1)+' / '+cards.length+' · Swipe to explore';
    previous.disabled=current===0;next.disabled=current===cards.length-1;
  }
  function go(delta){const index=Math.max(0,Math.min(cards.length-1,current+delta));track.scrollTo({left:cards[index].offsetLeft-cards[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  previous.onclick=()=>go(-1);next.onclick=()=>go(1);
  track.addEventListener('scroll',sync,{passive:true});
  track.addEventListener('keydown',event=>{if(event.target===track&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();go(event.key==='ArrowRight'?1:-1);}});
  sync();
}
function printLine(text) {
  const line = document.createElement('p');
  line.textContent = text;
  output.append(line);
  while (output.children.length > 18) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
}
const commandHistory = [];
let historyIndex = 0;
function runCommand(raw) {
  closeMenu();
  executeCommand(raw);
  output.scrollTop = 0;
}
function executeCommand(raw) {
  let command = raw.trim().toLowerCase().replace(/^cd\s+/, '');
  const aliases = {'about me':'about','work':'experience','professional experience':'experience','all':'help','social -a':'social','..':'home'};
  command = aliases[command] || command;
  commandHistory.push(raw.trim());
  historyIndex = commandHistory.length;
  if (!command) return;
  closeMenu();
  setActive(command);
  document.querySelector('.terminal').classList.toggle('view-open', !['home','whoami','clear'].includes(command));
  dispatchEvent(new CustomEvent('pixel-command',{detail:{command}}));
  output.replaceChildren();
  output.scrollTop = 0;
  const breadcrumb = document.createElement('p');
  breadcrumb.className = 'view-breadcrumb';
  breadcrumb.textContent = 'guest@yg / ' + command;
  output.append(breadcrumb);
  if (command === 'help' || command === 'ls') printLine('about · research · projects · experience · community · resume · contact · social · whoami · clear. Tip: cd projects works too.');
  else if (command === 'social') {
    [['GitHub','https://github.com/Yateeka'],['LinkedIn','https://www.linkedin.com/in/yateeka-goyal/'],['Email','mailto:yateekag3135@gmail.com']].forEach(([name,url]) => {
      const line = document.createElement('p');
      const link = document.createElement('a');
      link.textContent = name + ' ↗'; link.href = url; link.target = '_blank'; link.rel = 'noreferrer';
      line.append(link); output.append(line);
    });
    output.scrollTop = output.scrollHeight;
  }
  else if (command === 'whoami') printLine('Yateeka. Cybersecurity student, HESTIA Lab researcher, aspiring PhD researcher.');
  else if (command === 'resume' || command === 'résumé' || command === 'cv') {
    dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'happy',message:'Click the link to get my résumé.'}}));
    const card = document.createElement('section');
    card.className = 'resume-card';
    card.setAttribute('aria-label','Yateeka Goyal résumé');
    card.innerHTML = `<div class="resume-file" aria-hidden="true">PDF<span>↓</span></div>
      <div class="resume-details"><p class="resume-eyebrow">RÉSUMÉ / YATEEKA GOYAL</p><h2>My work, on paper.</h2>
      <p>Explore my research, education, and professional experience.</p>
      <div class="resume-actions"><a class="resume-view" href="phd.pdf" target="_blank" rel="noreferrer">View résumé <span aria-hidden="true">↗</span></a>
      <a class="resume-download" href="phd.pdf" download="Yateeka-Goyal-Resume.pdf">Download PDF <span aria-hidden="true">↓</span></a></div>
      <a class="resume-linkedin" href="https://www.linkedin.com/in/yateeka-goyal/" target="_blank" rel="noreferrer">Connect on LinkedIn ↗</a></div>`;
    output.append(card);
    output.scrollTop = output.scrollHeight;
  } else if (command === 'clear') {
    output.replaceChildren();
    output.scrollTop = 0;
    document.querySelector('#terminalInput').value = '';
    document.querySelector('#terminalInput').focus({preventScroll:true});
    document.querySelector('#commandAnnouncement').textContent = 'Terminal cleared. Ready for a new command.';
  }
  else if (commandSections[command]) showContent(command);
  else if (command === 'home') {
    output.replaceChildren();
    printLine('✓ Welcome back. Type help or choose a command above.');
  }
  else {
    printLine('Command not found. Type help to see where you can go.');
    dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'confused',message:'Hmm… try help?'}}));
  }
}
document.querySelector('#terminalForm').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#terminalInput');
  runCommand(input.value);
  input.value = '';
});
document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => {
  runCommand(button.dataset.command);
  const prompt = document.querySelector('#terminalInput');
  prompt.focus({preventScroll:true});
  prompt.scrollIntoView({block:'nearest',behavior:'instant'});
}));
document.querySelectorAll('a[href="#home"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); runCommand('home'); window.scrollTo({top:0,behavior:'instant'});
}));
if (commandSections[location.hash.slice(1)]) runCommand(location.hash.slice(1));
const terminalInput = document.querySelector('#terminalInput');
terminalInput.addEventListener('keydown', event => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (!commandHistory.length) return;
    event.preventDefault();
    historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    terminalInput.value = commandHistory[historyIndex] || '';
  }
  if (event.key === 'Tab' && terminalInput.value.trim()) {
    const candidates = [...Object.keys(commandSections), 'help', 'resume', 'social', 'whoami', 'clear'].filter(word => word.startsWith(terminalInput.value.toLowerCase()));
    if (candidates.length === 1) { event.preventDefault(); terminalInput.value = candidates[0]; }
  }
});
const bootMessage = document.querySelector('#bootMessage');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !location.hash) {
  bootMessage.textContent = '> booting curiosity.exe...';
  setTimeout(() => { if (bootMessage.isConnected) bootMessage.textContent = '✓ System ready. Welcome to Yateeka’s personal terminal.'; }, 900);
}
const prank = document.querySelector('#prankDialog');
const yes = document.querySelector('#prankYes');
const arena = document.querySelector('#prankArena');
let dodges = 0;
document.querySelector('#hackingMode').addEventListener('click', () => {
  dodges = 0;
  yes.textContent='Yes, I’m sure ↗';
  prank.classList.remove('prank-won');
  document.querySelector('#prankScore').textContent='Yateeka 0 · You 0';
  yes.style.left = '24px'; yes.style.top = '30px';
  document.querySelector('#prankStatus').textContent = 'Go on. Try clicking Yes. I’ll wait. ♡';
  window.playPinkTransition(() => {
    prank.showModal();
    document.body.classList.add('dialog-open');
  });
});
function closePrank() {
  window.playPinkTransition(() => {
    prank.close();
    document.body.classList.remove('dialog-open');
  });
}
document.querySelector('#prankNo').addEventListener('click', closePrank);
prank.addEventListener('cancel', event => { event.preventDefault(); closePrank(); });
function playCaughtGlitch(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){location.assign('404.html');return;}
  const overlay=document.createElement('div');
  overlay.className='system-glitch';
  overlay.setAttribute('aria-hidden','true');
  overlay.setAttribute('popover','manual');
  const frozen=document.querySelector('.terminal').cloneNode(true);
  frozen.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  frozen.removeAttribute('id');
  frozen.querySelectorAll('button,input,a,select').forEach(node=>node.tabIndex=-1);
  const bounds=document.querySelector('.terminal').getBoundingClientRect();
  const strips=document.createElement('div');strips.className='glitch-strips';
  for(let i=0;i<5;i++){
    const strip=document.createElement('div');strip.className='glitch-strip';
    strip.style.setProperty('--slice',i);
    const copy=frozen.cloneNode(true);
    Object.assign(copy.style,{position:'absolute',top:bounds.top+'px',left:bounds.left+'px',width:bounds.width+'px',height:bounds.height+'px',margin:'0'});
    strip.append(copy);strips.append(strip);
  }
  const log=document.createElement('div');log.className='glitch-error';
  log.textContent='SESSION INTERRUPTED\nrender://terminal — response lost';
  overlay.append(strips,log);document.body.append(overlay);overlay.showPopover();
  setTimeout(()=>{log.textContent='ROUTE_NOT_FOUND\n/definitely-not-suspicious\n\n404';overlay.classList.add('signal-lost');},780);
  setTimeout(()=>location.assign('404.html'),1350);
}
function dodge() {
  if(dodges>=6){
    if(prank.classList.contains('prank-glitch'))return;
    prank.classList.add('prank-glitch');
    yes.disabled=true;
    document.querySelector('#prankStatus').textContent='Wait. You weren’t supposed to catch that…';
    playCaughtGlitch();
    return;
  }
  const maxX = Math.max(0, arena.clientWidth - yes.offsetWidth - 12);
  const maxY = Math.max(0, arena.clientHeight - yes.offsetHeight - 12);
  const oldX = yes.offsetLeft;
  const nextX = oldX < maxX / 2 ? maxX : 12;
  yes.style.left = nextX + 'px';
  yes.style.top = (12 + ((dodges * 61 + 75) % Math.max(1, maxY - 12))) + 'px';
  dodges++;
  document.querySelector('#prankScore').textContent='Yateeka '+dodges+' · You 0';
  yes.textContent=['Try again ↗','Over here! ↗','Almost… ↗','Nice try ♡','Catch me ↗','Okay, last chance ♡'][dodges-1];
  const host = document.querySelector('#prankHost');
  host.classList.remove('giggling');
  void host.offsetWidth;
  host.classList.add('giggling');
  const jokes = ['Hehe. Too slow! Try again. ♡', 'You were THIS close. Okay, not really.', 'You can’t hack the hacker. Nice try though!', 'The button and I have an arrangement. You’re not in it.', 'Still chasing it? I admire the dedication. ♡', 'One more try? That’s what you said last time.'];
  document.querySelector('#prankStatus').textContent = jokes[(dodges - 1) % jokes.length];
}
yes.addEventListener('click', dodge);


// Handle dynamically rendered contact forms without leaving the terminal.
output.addEventListener('submit', async event => {
  const form = event.target.closest('.contact-form');
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('[type="submit"]');
  const status = form.querySelector('.contact-form-status');
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = '';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error('Message delivery failed');
    status.textContent = 'Message sent. Thank you for reaching out!';
    dispatchEvent(new CustomEvent('pixel-reaction',{detail:{emotion:'shy',message:'A message for me? ♡'}}));
    form.reset();
  } catch {
    status.textContent = 'Could not send your message. Please try again or email yateekag3135@gmail.com.';
  } finally {
    button.disabled = false;
    button.textContent = 'Send Message ↗';
  }
});
