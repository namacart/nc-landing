// ── Tab switching ──
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.form-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+tab));
}

function scrollToHero(tab){
  switchTab(tab);
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── Form submission ──
async function submitForm(type, btnElement){
  let valid = true;
  const required = {
    customer:['c-name','c-phone','c-email','c-area'],
    vendor:['v-name','v-phone','v-shopname','v-type','v-address']
  };
  required[type].forEach(id=>{
    const el=document.getElementById(id);
    if(!el||!el.value.trim()){valid=false;el.style.borderColor='#B91C1C';}
    else el.style.borderColor='';
  });
  if(!valid){
    const first=document.getElementById(required[type][0]);
    if(first)first.focus();
    return;
  }
  
  // Set Loading State
  btnElement.disabled = true;
  btnElement.querySelector('.spinner').style.display = 'inline-block';
  btnElement.querySelector('.btn-text').style.opacity = '0.5';

  // Collect data
  const entry = {type, timestamp:new Date().toISOString()};
  if(type==='customer') {
    entry.data={name:document.getElementById('c-name').value,phone:document.getElementById('c-phone').value,email:document.getElementById('c-email').value,area:document.getElementById('c-area').value,lang:document.getElementById('c-lang').value};
    entry.whatsappOptIn=document.getElementById('c-notify').checked;
  }
  if(type==='vendor') {
    entry.data={name:document.getElementById('v-name').value,phone:document.getElementById('v-phone').value,shopname:document.getElementById('v-shopname').value,shoptype:document.getElementById('v-type').value,address:document.getElementById('v-address').value,customers:document.getElementById('v-customers').value};
    entry.whatsappOptIn=document.getElementById('v-notify').checked;
  }

  try {
    // Attempt API Request to Serverless Function
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    
    // Always persist to localStorage as fallback & for counters
    persistToLocalStorage(entry);
    updateCounters();
    
    // Show success regardless of server failure, so user experience is uninterrupted
    document.getElementById('form-body-'+type).style.display='none';
    document.getElementById('success-'+type).style.display='block';
    launchConfetti();
    
  } catch (error) {
    console.error("Submission error:", error);
    // Fallback if fetch completely fails (e.g., offline)
    persistToLocalStorage(entry);
    updateCounters();
    document.getElementById('form-body-'+type).style.display='none';
    document.getElementById('success-'+type).style.display='block';
    launchConfetti();
  } finally {
    // Reset Loading State
    btnElement.disabled = false;
    btnElement.querySelector('.spinner').style.display = 'none';
    btnElement.querySelector('.btn-text').style.opacity = '1';
  }
}

function persistToLocalStorage(entry) {
  try{
    const all=JSON.parse(localStorage.getItem('nc_registrations')||'[]');
    all.push(entry);
    localStorage.setItem('nc_registrations',JSON.stringify(all));
  }catch(e){}
}

function updateCounters(){
  try{
    const all=JSON.parse(localStorage.getItem('nc_registrations')||'[]');
    const base={customer:47,vendor:12};
    const byType={customer:0,vendor:0};
    all.forEach(e=>byType[e.type]=(byType[e.type]||0)+1);
    animateCounter('counter-customers',base.customer+byType.customer);
    animateCounter('counter-shops',base.vendor+byType.vendor);
  }catch(e){}
}

function animateCounter(id,target){
  const el=document.getElementById(id);
  if(!el)return;
  const start=parseInt(el.textContent)||0;
  const dur=800;
  const s=Date.now();
  const tick=()=>{
    const p=Math.min((Date.now()-s)/dur,1);
    el.textContent=Math.round(start+(target-start)*p);
    if(p<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Confetti ──
function launchConfetti(){
  const colors=['#67D3A0','#137A45','#fff','#FFD700','#1A3550'];
  for(let i=0;i<60;i++){
    const el=document.createElement('div');
    el.style.cssText=`position:fixed;top:20%;left:${20+Math.random()*60}%;width:8px;height:8px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};pointer-events:none;z-index:9999;transition:transform ${0.5+Math.random()*1}s ease,opacity ${0.5+Math.random()*1}s ease;`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>{
      el.style.transform=`translate(${(Math.random()-.5)*300}px,${200+Math.random()*200}px) rotate(${Math.random()*360}deg)`;
      el.style.opacity='0';
    });
    setTimeout(()=>el.remove(),2000);
  }
}

// ── Scroll reveal ──
const revealObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting)e.target.classList.add('visible'); });
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

// ── Init counters ──
updateCounters();
