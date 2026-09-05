/* ============================================================
   Birthday Surprise — main.js
   Scene manager + all interactive behaviors.
   Personalization lives in js/config.js — this file should not
   need editing for normal customization.
   ============================================================ */
(function(){
  'use strict';

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const SCENE_ORDER = ['opening','cake','envelope','choc-intro','choc1','choc2','choc3','choc4','gift','gallery','final'];

  const state = {
    current: null,
    initialized: new Set(),
    soundOn: false,
    shakeMeter: 0,
  };

  /* ================= BACKGROUND STARFIELD ================= */
  const bgCanvas = $('#bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  let stars = [], embers = [];

  function sizeCanvas(canvas){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    return dpr;
  }

  function initStars(){
    sizeCanvas(bgCanvas);
    const count = Math.min(140, Math.floor((window.innerWidth*window.innerHeight)/9000));
    stars = Array.from({length:count}, ()=>({
      x: Math.random()*bgCanvas.width,
      y: Math.random()*bgCanvas.height*0.8,
      r: Math.random()*1.4+0.3,
      phase: Math.random()*Math.PI*2,
      speed: 0.4+Math.random()*0.8
    }));
    embers = Array.from({length:16}, ()=>({
      x: Math.random()*bgCanvas.width,
      y: bgCanvas.height*0.3 + Math.random()*bgCanvas.height*0.7,
      r: Math.random()*2+1,
      vy: -(0.15+Math.random()*0.35),
      vx: (Math.random()-0.5)*0.15,
      alpha: Math.random()*0.5+0.2
    }));
  }

  let t = 0;
  function drawBackground(){
    t += 0.016;
    bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
    stars.forEach(s=>{
      const tw = 0.5+0.5*Math.sin(t*s.speed+s.phase);
      bgCtx.beginPath();
      bgCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
      bgCtx.fillStyle = `rgba(243,234,217,${0.25+tw*0.5})`;
      bgCtx.fill();
    });
    embers.forEach(e=>{
      e.y += e.vy; e.x += e.vx;
      if(e.y < -10){ e.y = bgCanvas.height+10; e.x = Math.random()*bgCanvas.width; }
      bgCtx.beginPath();
      bgCtx.arc(e.x,e.y,e.r,0,Math.PI*2);
      bgCtx.fillStyle = `rgba(216,168,78,${e.alpha})`;
      bgCtx.fill();
    });
    requestAnimationFrame(drawBackground);
  }
  window.addEventListener('resize', initStars);
  initStars();
  requestAnimationFrame(drawBackground);

  /* ================= FX CANVAS (confetti / fireworks) ================= */
  const fxCanvas = $('#fx-canvas');
  const fxCtx = fxCanvas.getContext('2d');
  let fxParticles = [];
  window.addEventListener('resize', ()=> sizeCanvas(fxCanvas));
  sizeCanvas(fxCanvas);

  const PALETTE = ['#d8a84e','#f2c874','#e2723a','#9a6a3f','#f3ead9'];

  function spawnConfetti(count=80){
    for(let i=0;i<count;i++){
      fxParticles.push({
        type:'confetti',
        x: Math.random()*fxCanvas.width,
        y: -20,
        vx: (Math.random()-0.5)*2,
        vy: 2+Math.random()*3,
        rot: Math.random()*Math.PI*2,
        vr: (Math.random()-0.5)*0.2,
        size: 4+Math.random()*5,
        color: PALETTE[Math.floor(Math.random()*PALETTE.length)],
        life: 200+Math.random()*80
      });
    }
  }

  function spawnFirework(x,y){
    const count = 34;
    const color = PALETTE[Math.floor(Math.random()*PALETTE.length)];
    for(let i=0;i<count;i++){
      const ang = (Math.PI*2*i)/count;
      const speed = 1.5+Math.random()*2.5;
      fxParticles.push({
        type:'spark', x, y,
        vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
        size: 1.5+Math.random()*1.5,
        color, life: 46+Math.random()*26, gravity:0.03
      });
    }
  }

  function spawnFireworksShow(bursts=3){
    let i=0;
    const iv = setInterval(()=>{
      spawnFirework(fxCanvas.width*(0.25+Math.random()*0.5), fxCanvas.height*(0.18+Math.random()*0.28));
      i++;
      if(i>=bursts) clearInterval(iv);
    }, 380);
  }

  function fxLoop(){
    fxCtx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
    fxParticles = fxParticles.filter(p=>p.life>0);
    fxParticles.forEach(p=>{
      p.life--;
      if(p.type==='confetti'){
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if(p.y > fxCanvas.height+20) p.life = 0;
        fxCtx.save();
        fxCtx.translate(p.x,p.y);
        fxCtx.rotate(p.rot);
        fxCtx.fillStyle = p.color;
        fxCtx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);
        fxCtx.restore();
      } else if(p.type==='spark'){
        p.vy += p.gravity;
        p.x += p.vx; p.y += p.vy;
        fxCtx.globalAlpha = Math.max(p.life/70,0);
        fxCtx.beginPath();
        fxCtx.arc(p.x,p.y,p.size,0,Math.PI*2);
        fxCtx.fillStyle = p.color;
        fxCtx.fill();
        fxCtx.globalAlpha = 1;
      }
    });
    requestAnimationFrame(fxLoop);
  }
  requestAnimationFrame(fxLoop);

  /* ================= WEB AUDIO SYNTHESIZER ENGINE ================= */
  let audioCtx = null;
  let synthMusicTimer = null;
  let synthMusicIndex = 0;

  function getAudioCtx(){
    if(!audioCtx){
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if(AudioContext) audioCtx = new AudioContext();
    }
    if(audioCtx && audioCtx.state === 'suspended'){
      audioCtx.resume().catch(()=>{});
    }
    return audioCtx;
  }

  // Cheerful Birthday synth chord melody sequence (C major warm arpeggio)
  const BDAY_MELODY = [
    { note: 261.63, dur: 0.3, pause: 0.35 },
    { note: 261.63, dur: 0.2, pause: 0.25 },
    { note: 293.66, dur: 0.5, pause: 0.55 },
    { note: 261.63, dur: 0.5, pause: 0.55 },
    { note: 349.23, dur: 0.5, pause: 0.55 },
    { note: 329.63, dur: 0.8, pause: 0.9 },

    { note: 261.63, dur: 0.3, pause: 0.35 },
    { note: 261.63, dur: 0.2, pause: 0.25 },
    { note: 293.66, dur: 0.5, pause: 0.55 },
    { note: 261.63, dur: 0.5, pause: 0.55 },
    { note: 392.00, dur: 0.5, pause: 0.55 },
    { note: 349.23, dur: 0.8, pause: 0.9 },

    { note: 261.63, dur: 0.3, pause: 0.35 },
    { note: 261.63, dur: 0.2, pause: 0.25 },
    { note: 523.25, dur: 0.5, pause: 0.55 },
    { note: 440.00, dur: 0.5, pause: 0.55 },
    { note: 349.23, dur: 0.5, pause: 0.55 },
    { note: 329.63, dur: 0.5, pause: 0.55 },
    { note: 293.66, dur: 0.7, pause: 0.8 },

    { note: 466.16, dur: 0.3, pause: 0.35 },
    { note: 466.16, dur: 0.2, pause: 0.25 },
    { note: 440.00, dur: 0.5, pause: 0.55 },
    { note: 349.23, dur: 0.5, pause: 0.55 },
    { note: 392.00, dur: 0.5, pause: 0.55 },
    { note: 349.23, dur: 0.9, pause: 1.2 }
  ];

  function playSynthTone(freq, duration, type='triangle', gainVal=0.12){
    const ctx = getAudioCtx();
    if(!ctx) return;
    try{
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }catch(e){}
  }

  function startSynthMusic(){
    stopSynthMusic();
    synthMusicIndex = 0;
    function nextNote(){
      if(!state.soundOn) return;
      const item = BDAY_MELODY[synthMusicIndex];
      playSynthTone(item.note, item.dur, 'triangle', 0.14);
      playSynthTone(item.note * 0.5, item.dur * 1.2, 'sine', 0.08);
      synthMusicIndex = (synthMusicIndex + 1) % BDAY_MELODY.length;
      synthMusicTimer = setTimeout(nextNote, item.pause * 1000);
    }
    nextNote();
  }

  function stopSynthMusic(){
    if(synthMusicTimer){
      clearTimeout(synthMusicTimer);
      synthMusicTimer = null;
    }
  }

  function triggerSynthSfx(type){
    if(!state.soundOn) return;
    const ctx = getAudioCtx();
    if(!ctx) return;

    try{
      if(type === 'blow'){
        const bufferSize = ctx.sampleRate * 0.7;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
        filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.7);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        noise.start();
      }
      else if(type === 'unwrap'){
        for(let i=0; i<5; i++){
          setTimeout(() => playSynthTone(1800 + Math.random()*2500, 0.05, 'sawtooth', 0.05), i * 35);
        }
      }
      else if(type === 'open'){
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          setTimeout(() => playSynthTone(f, 0.8, 'sine', 0.1), i * 80);
        });
      }
      else if(type === 'confetti'){
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          setTimeout(() => playSynthTone(f, 0.4, 'triangle', 0.15), i * 60);
        });
      }
      else if(type === 'pop'){
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.08);
      }
      else if(type === 'click'){
        playSynthTone(800, 0.03, 'sine', 0.08);
      }
    }catch(e){}
  }

  /* ================= SPARKLE CURSOR TRAIL ================= */
  const sparkleCanvas = $('#sparkle-canvas');
  const sparkleCtx = sparkleCanvas ? sparkleCanvas.getContext('2d') : null;
  let sparkles = [];

  if(sparkleCanvas){
    window.addEventListener('resize', () => sizeCanvas(sparkleCanvas));
    sizeCanvas(sparkleCanvas);
  }

  function addSparkle(x, y){
    if(!sparkleCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    for(let i=0; i<2; i++){
      sparkles.push({
        x: x * dpr, y: y * dpr,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        size: Math.random() * 3 + 1,
        color: ['#f2c874', '#d8a84e', '#ffffff', '#e2723a', '#a770ef'][Math.floor(Math.random()*5)],
        life: 25 + Math.random() * 15,
        maxLife: 40
      });
    }
  }

  window.addEventListener('pointermove', (e) => addSparkle(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if(e.touches && e.touches[0]) addSparkle(e.touches[0].clientX, e.touches[0].clientY);
  });

  function sparkleLoop(){
    if(sparkleCtx){
      sparkleCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
      sparkles = sparkles.filter(s => s.life > 0);
      sparkles.forEach(s => {
        s.life--;
        s.x += s.vx; s.y += s.vy;
        const alpha = s.life / s.maxLife;
        sparkleCtx.save();
        sparkleCtx.globalAlpha = alpha;
        sparkleCtx.fillStyle = s.color;
        sparkleCtx.beginPath();
        sparkleCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        sparkleCtx.fill();
        sparkleCtx.restore();
      });
    }
    requestAnimationFrame(sparkleLoop);
  }
  requestAnimationFrame(sparkleLoop);

  /* ================= FLOATING BIRTHDAY BALLOONS ================= */
  const balloonsContainer = $('#balloons-container');

  function spawnBalloon(){
    if(!balloonsContainer) return;
    if(balloonsContainer.children.length > 7) return;
    const colors = [
      'linear-gradient(135deg, #ff4e50, #f9d423)',
      'linear-gradient(135deg, #a770ef, #cf8bf3, #fdb99b)',
      'linear-gradient(135deg, #42e695, #3bb2b8)',
      'linear-gradient(135deg, #f857a6, #ff5858)',
      'linear-gradient(135deg, #f2c874, #e2723a)'
    ];
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.background = colors[Math.floor(Math.random() * colors.length)];
    b.style.left = (5 + Math.random() * 85) + 'vw';
    b.style.animationDuration = (9 + Math.random() * 6) + 's';
    
    b.onclick = (e) => {
      e.stopPropagation();
      b.classList.add('balloon-popped');
      triggerSynthSfx('pop');
      spawnConfetti(20);
      setTimeout(() => b.remove(), 200);
    };

    balloonsContainer.appendChild(b);
    setTimeout(() => { if(b.parentNode) b.remove(); }, 15000);
  }
  setInterval(spawnBalloon, 3500);

  /* ================= SOUND ================= */
  const bgMusic = $('#bg-music');
  const sfxCandle = $('#sfx-candle');
  const sfxUnwrap = $('#sfx-unwrap');
  const sfxOpen = $('#sfx-open');
  const sfxConfetti = $('#sfx-confetti');
  const soundBtn = $('#sound-toggle');

  function safeSetSrc(el, src){
    if(!src) return;
    el.src = src;
    el.onerror = () => { el.removeAttribute('src'); };
  }
  safeSetSrc(bgMusic, CONFIG.music.src);
  safeSetSrc(sfxCandle, CONFIG.music.sfxCandle);
  safeSetSrc(sfxUnwrap, CONFIG.music.sfxUnwrap);
  safeSetSrc(sfxOpen, CONFIG.music.sfxOpen);
  safeSetSrc(sfxConfetti, CONFIG.music.sfxConfetti);

  function playSfx(el, synthType){
    if(synthType) triggerSynthSfx(synthType);
    if(!state.soundOn || !el || typeof el.getAttribute !== 'function' || !el.getAttribute('src')) return;
    try{ el.currentTime = 0; el.play().catch(()=>{}); }catch(e){}
  }

  function setSound(on){
    state.soundOn = on;
    soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if(on){
      getAudioCtx();
      startSynthMusic();
      if(bgMusic && typeof bgMusic.getAttribute === 'function' && bgMusic.getAttribute('src')){
        bgMusic.volume = 0.55;
        bgMusic.play().catch(()=>{});
      }
    } else {
      stopSynthMusic();
      if(bgMusic && typeof bgMusic.pause === 'function') bgMusic.pause();
    }
  }
  soundBtn.addEventListener('click', ()=> setSound(!state.soundOn));

  function unlockAudio(){
    const ctx = getAudioCtx();
    if(ctx && ctx.state === 'suspended'){
      ctx.resume().catch(()=>{});
    }
  }
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  /* ================= HELPERS ================= */
  function revealSequence(elements, {stagger=650, after}={}){
    const list = elements.filter(Boolean);
    list.forEach((el,i)=>{
      setTimeout(()=>{
        el.classList.add('show');
      }, i*stagger);
    });
    if(after){
      setTimeout(after, Math.max(list.length-1,0)*stagger + stagger*0.6);
    }
  }

  /* ================= SCENE MANAGER ================= */
  function updateProgress(){
    const idx = SCENE_ORDER.indexOf(state.current);
    const pct = Math.round(((idx+1)/SCENE_ORDER.length)*100);
    $('#progress-track').style.setProperty('--p', pct + '%');
  }

  function goToScene(name){
    const nextEl = document.querySelector(`.scene[data-scene="${name}"]`);
    if(!nextEl) return;
    const prev = state.current;
    if(prev && prev !== name){
      const prevEl = document.querySelector(`.scene[data-scene="${prev}"]`);
      if(prevEl) prevEl.classList.remove('active');
    }
    state.current = name;
    nextEl.classList.add('active');
    updateProgress();
    initScene(name);
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-next]');
    if(btn && !btn.hidden && !btn.disabled){
      goToScene(btn.dataset.next);
    }
  });

  // Keyboard-friendly navigation: Enter/Space activates the visible
  // primary action of the current scene when nothing else has focus.
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Enter') return;
    if(['BUTTON','INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const activeScene = document.querySelector('.scene.active');
    if(!activeScene) return;
    const btn = Array.from(activeScene.querySelectorAll('button')).find(b => !b.hidden && !b.disabled);
    if(btn) btn.click();
  });

  function initScene(name){
    switch(name){
      case 'opening': initOpening(); break;
      case 'cake': initCake(); break;
      case 'envelope': initEnvelope(); break;
      case 'choc-intro': initChocIntro(); break;
      case 'choc1': initChoc1(); break;
      case 'choc2': initChoc2(); break;
      case 'choc3': initChoc3(); break;
      case 'choc4': initChoc4(); break;
      case 'gift': initGift(); break;
      case 'gallery': initGallery(); break;
      case 'final': initFinal(); break;
    }
  }

  /* ================= SCENE 1 — OPENING ================= */
  function initOpening(){
    if(state.initialized.has('opening')) return;
    state.initialized.add('opening');

    const container = $('#opening-lines');
    container.innerHTML = '';
    CONFIG.opening.lines.forEach(text=>{
      const p = document.createElement('p');
      p.textContent = text;
      container.appendChild(p);
    });
    const lines = $$('p', container);
    const btn = $('#btn-enter');
    btn.textContent = CONFIG.opening.buttonText;

    revealSequence(lines, {stagger:1000, after: ()=>{ btn.hidden = false; }});
  }

  /* ================= SCENE 2 — CAKE ================= */
  function initCake(){
    if(state.initialized.has('cake')) return;
    state.initialized.add('cake');

    $('#cake-line-1').textContent = CONFIG.cake.linesBefore[0];
    $('#cake-line-2').textContent = CONFIG.cake.linesBefore[1];
    $('#cake-instruction').textContent = CONFIG.cake.instruction;
    $('#cake-line-3').textContent = CONFIG.cake.linesAfter[0];
    $('#cake-line-4').textContent = CONFIG.cake.linesAfter[1];
    $('#scene-cake .btn-primary').textContent = CONFIG.cake.continueButtonText;

    const candlesEl = $('#candles');
    candlesEl.innerHTML = '';
    state.cakeDone = false;

    for(let i=0; i<CONFIG.cake.candleCount; i++){
      const c = document.createElement('div');
      c.className = 'candle-3d';
      c.style.cursor = 'pointer';
      c.innerHTML = '<div class="wick"></div><div class="flame-3d"></div>';
      
      // Tap individual candle or flame to extinguish!
      c.onclick = (e) => {
        e.stopPropagation();
        if(!c.classList.contains('out')){
          c.classList.add('out');
          spawnSmokePuff(c);
          playSfx(sfxCandle, 'blow');
          const unlit = $$('#candles .candle-3d:not(.out)');
          if(unlit.length === 0){
            finishCandles();
          }
        }
      };

      candlesEl.appendChild(c);
    }

    revealSequence([$('#cake-line-1'), $('#cake-line-2')], {stagger:700});
    setupCandleBlowing();
  }

  function finishCandles(){
    if(state.cakeDone) return;
    state.cakeDone = true;
    const micBtn = $('#btn-mic-try');
    const holdBtn = $('#btn-hold-blow');
    const micHint = $('#mic-hint');
    if(micBtn) micBtn.hidden = true;
    if(holdBtn) holdBtn.hidden = true;
    if(micHint) micHint.hidden = true;
    $('#blow-controls').style.display = 'none';
    $('#cake-instruction').style.display = 'none';
    extinguishCandles();
  }

  function setupCandleBlowing(){
    const micBtn = $('#btn-mic-try');
    const holdBtn = $('#btn-hold-blow');
    const micHint = $('#mic-hint');
    micBtn.textContent = '🎤 Allow microphone to blow';
    holdBtn.textContent = 'Tap / hold here to blow them out →';

    micBtn.onclick = async () => {
      if(state.cakeDone) return;
      try{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        micBtn.textContent = '🎤 Listening... blow!';
        micBtn.disabled = true;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let loudFrames = 0;

        (function check(){
          if(state.cakeDone){ stream.getTracks().forEach(tr=>tr.stop()); audioCtx.close().catch(()=>{}); return; }
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a,b)=>a+b,0)/data.length;
          if(avg > 36) loudFrames++; else loudFrames = Math.max(0, loudFrames-1);
          if(loudFrames > 7){
            stream.getTracks().forEach(tr=>tr.stop());
            audioCtx.close().catch(()=>{});
            finishCandles();
            return;
          }
          requestAnimationFrame(check);
        })();
      }catch(err){
        micHint.hidden = false;
        micBtn.hidden = true;
      }
    };

    let chargeIv = null;
    function startCharge(){
      if(state.cakeDone) return;
      let charge = 0;
      holdBtn.classList.add('charging');
      clearInterval(chargeIv);
      chargeIv = setInterval(()=>{
        charge += 5;
        holdBtn.style.setProperty('--charge', Math.min(charge,100)+'%');
        if(charge >= 100){
          clearInterval(chargeIv);
          finishCandles();
        }
      }, 40);
    }
    function stopCharge(){
      clearInterval(chargeIv);
      holdBtn.classList.remove('charging');
      holdBtn.style.setProperty('--charge','0%');
    }
    holdBtn.onpointerdown = startCharge;
    holdBtn.onpointerup = stopCharge;
    holdBtn.onpointerleave = stopCharge;
    holdBtn.onpointercancel = stopCharge;
  }

  function extinguishCandles(){
    const candles = $$('#candles .candle-3d');
    candles.forEach((c,i)=>{
      setTimeout(()=>{
        if(!c.classList.contains('out')){
          c.classList.add('out');
          spawnSmokePuff(c);
        }
      }, i * 90);
    });
    playSfx(sfxCandle, 'blow');

    spawnConfetti(90);
    spawnFireworksShow(4);
    playSfx(sfxConfetti, 'confetti');

    setTimeout(()=>{
      const post = $('#cake-post');
      post.hidden = false;
      post.classList.add('fade-up-in');
      revealSequence([$('#cake-line-3'), $('#cake-line-4')], {stagger:500, after: ()=>{
        const btn = post.querySelector('.btn-primary');
        btn.classList.add('reveal-btn');
        btn.hidden = false;
      }});
    }, 350);
  }

  function spawnSmokePuff(candleEl){
    const layer = $('#smoke-layer');
    if(!layer) return;
    const rect = candleEl.getBoundingClientRect();
    const parentRect = layer.getBoundingClientRect();
    const puff = document.createElement('div');
    puff.className = 'smoke-puff';
    puff.style.left = (rect.left - parentRect.left + rect.width/2 - 5) + 'px';
    layer.appendChild(puff);
    setTimeout(()=> puff.remove(), 2000);
  }

  /* ================= SCENE 3 — ENVELOPE ================= */
  function initEnvelope(){
    if(state.initialized.has('envelope')) return;
    state.initialized.add('envelope');

    $('#env-line-1').textContent = CONFIG.envelope.linesBefore[0];
    $('#env-line-2').textContent = CONFIG.envelope.linesBefore[1];
    $('#env-message').textContent = CONFIG.envelope.message;
    $('#env-line-3').textContent = CONFIG.envelope.linesAfter[0];
    $('#env-line-4').textContent = CONFIG.envelope.linesAfter[1];
    $('#btn-open-envelope').textContent = CONFIG.envelope.openButtonText;
    $('#scene-envelope [data-next="choc-intro"]').textContent = CONFIG.envelope.nextButtonText;

    revealSequence([$('#env-line-1'), $('#env-line-2')], {stagger:700});

    $('#btn-open-envelope').onclick = function(){
      $('#envelope').classList.add('open');
      $('#env-line-1').style.transition = 'opacity 0.4s var(--ease)';
      $('#env-line-2').style.transition = 'opacity 0.4s var(--ease)';
      $('#env-line-1').style.opacity = '0';
      $('#env-line-2').style.opacity = '0';
      setTimeout(()=>{
        $('#env-line-1').style.display = 'none';
        $('#env-line-2').style.display = 'none';
      }, 400);
      playSfx(sfxOpen, 'open');
      this.hidden = true;
      setTimeout(()=>{
        const post = $('#env-post');
        post.hidden = false;
        post.classList.add('fade-up-in');
        revealSequence([$('#env-line-3'), $('#env-line-4')], {stagger:600, after: ()=>{
          const btn = post.querySelector('.btn-primary');
          btn.classList.add('reveal-btn');
          btn.hidden = false;
        }});
      }, 700);
    };
  }

  /* ================= SCENE 4a — CHOCOLATE INTRO ================= */
  function initChocIntro(){
    if(state.initialized.has('choc-intro')) return;
    state.initialized.add('choc-intro');

    const line = $('#choc-intro-line');
    line.textContent = CONFIG.chocolates.intro.lines[0];
    $('#btn-choc-intro-next').textContent = 'Continue →';

    revealSequence([line], {stagger:0, after: ()=>{ $('#btn-choc-intro-next').hidden = false; }});
  }

  /* ================= SCENE 4b — TOFFEE ================= */
  function initChoc1(){
    if(state.initialized.has('choc1')) return;
    state.initialized.add('choc1');

    const cfg = CONFIG.chocolates.toffee;
    $('#choc1-level').textContent = cfg.level;
    $('#choc1-tagline').textContent = cfg.tagline;
    $('#toffee-hint').textContent = cfg.tapInstruction;
    $('#choc1-message').textContent = cfg.message;
    $('#choc1-after').textContent = cfg.after;
    $('#scene-choc1 .btn-primary').textContent = cfg.buttonText;

    revealSequence([$('#choc1-level'), $('#choc1-tagline')], {stagger:500});

    $('#toffee').onclick = function(){
      const eclairs = this.querySelector('.eclairs-toffee');
      if(eclairs) eclairs.classList.add('unwrapped');
      playSfx(sfxUnwrap, 'unwrap');
      setTimeout(()=>{
        $('#toffee-hint').style.opacity = '0';
        const reveal = $('#choc1-reveal');
        reveal.hidden = false;
        reveal.classList.add('fade-up-in');
      }, 550);
      this.onclick = null;
    };
  }

  /* ================= SCENE 4c — SMALL CHOCOLATE ================= */
  function initChoc2(){
    if(state.initialized.has('choc2')) return;
    state.initialized.add('choc2');

    const cfg = CONFIG.chocolates.small;
    $('#choc2-level').textContent = cfg.level;
    $('#choc2-tagline').textContent = cfg.tagline;
    $('#choc2-instruction').textContent = cfg.tapInstruction;
    $('#choc2-message').textContent = cfg.message;
    $('#choc2-after').textContent = cfg.after;
    $('#scene-choc2 .btn-primary').textContent = cfg.buttonText;

    revealSequence([$('#choc2-level'), $('#choc2-tagline'), $('#choc2-instruction')], {stagger:450});

    $('#choc2-item').onclick = function(){
      const kitkat = this.querySelector('.kitkat-pack');
      if(kitkat) kitkat.classList.add('unwrapped');
      playSfx(sfxUnwrap, 'unwrap');
      setTimeout(()=>{
        const reveal = $('#choc2-reveal');
        reveal.hidden = false;
        reveal.classList.add('fade-up-in');
      }, 600);
      this.onclick = null;
    };
  }

  /* ================= SCENE 4d — DAIRY-MILK STYLE (SHAKE) ================= */
  function initChoc3(){
    if(state.initialized.has('choc3')) return;
    state.initialized.add('choc3');

    const cfg = CONFIG.chocolates.dairyMilk;
    $('#choc3-level').textContent = cfg.level;
    $('#choc3-tagline').textContent = cfg.tagline;
    $('#choc3-shake-instruction').textContent = cfg.shakeInstruction;
    $('#btn-shake-fallback').textContent = cfg.fallbackButtonText;
    $('#choc3-shake-line1').textContent = cfg.afterShake[0];
    $('#choc3-shake-line2').textContent = cfg.afterShake[1];
    $('#choc3-message').textContent = cfg.message;
    $('#choc3-after').textContent = cfg.after;
    $('#btn-open-choc3').textContent = 'Open it';
    $('#scene-choc3 [data-next="choc4"]').textContent = cfg.buttonText;

    revealSequence([$('#choc3-level'), $('#choc3-tagline')], {stagger:500});

    state.shakeMeter = 0;
    let shakeDone = false;
    const fill = $('#shake-fill');
    const bar = $('#choc3-bar');

    function addShake(amount){
      if(shakeDone) return;
      state.shakeMeter = Math.min(100, state.shakeMeter + amount);
      fill.style.width = state.shakeMeter + '%';
      bar.style.transform = `translate(${(Math.random()-0.5)*14}px, ${(Math.random()-0.5)*14}px) rotate(${(Math.random()-0.5)*8}deg)`;
      playSfx(null, 'unwrap');
      if(state.shakeMeter >= 100){
        shakeDone = true;
        bar.style.transform = '';
        revealShakeComplete();
      }
    }

    function handleMotion(e){
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if(!acc) return;
      const magnitude = Math.abs(acc.x||0) + Math.abs(acc.y||0) + Math.abs(acc.z||0);
      if(magnitude > 20) addShake(8);
    }

    if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
      DeviceMotionEvent.requestPermission().then(res=>{
        if(res === 'granted') window.addEventListener('devicemotion', handleMotion);
      }).catch(()=>{});
    } else if(typeof DeviceMotionEvent !== 'undefined'){
      window.addEventListener('devicemotion', handleMotion);
    }

    $('#btn-shake-fallback').onclick = () => addShake(16);
    $('#choc3-item').onclick = () => addShake(20);

    function revealShakeComplete(){
      window.removeEventListener('devicemotion', handleMotion);
      $('#choc3-shake-instruction').style.display = 'none';
      $('#shake-meter').style.display = 'none';
      $('#btn-shake-fallback').style.display = 'none';
      const post = $('#choc3-post-shake');
      post.hidden = false;
      revealSequence([$('#choc3-shake-line1'), $('#choc3-shake-line2')], {stagger:600, after: ()=>{
        const btn = $('#btn-open-choc3');
        btn.classList.add('reveal-btn');
        btn.hidden = false;
      }});
    }

    $('#btn-open-choc3').onclick = function(){
      bar.classList.add('unwrapped');
      playSfx(sfxUnwrap, 'unwrap');
      this.parentElement.hidden = true;
      setTimeout(()=>{
        spawnConfetti(35);
      }, 400);
      setTimeout(()=>{
        const reveal = $('#choc3-reveal');
        reveal.hidden = false;
        reveal.classList.add('fade-up-in');
      }, 800);
      this.onclick = null;
    };

    initChoc3.cleanup = () => window.removeEventListener('devicemotion', handleMotion);
  }

  /* ================= SCENE 4e — BIG PREMIUM CHOCOLATE ================= */
  function initChoc4(){
    if(state.initialized.has('choc4')) return;
    state.initialized.add('choc4');

    const cfg = CONFIG.chocolates.big;
    $('#choc4-level').textContent = cfg.level;
    $('#choc4-tagline').textContent = cfg.tagline;
    $('#choc4-instruction').textContent = cfg.tapInstruction;
    $('#choc4-message').textContent = cfg.message;
    $('#choc4-after').textContent = cfg.after;
    $('#scene-choc4 .btn-primary').textContent = cfg.buttonText;

    revealSequence([$('#choc4-level'), $('#choc4-tagline'), $('#choc4-instruction')], {stagger:450});

    $('#choc4-item').onclick = function(){
      const pack = this.querySelector('.goldbar-pack') || this.querySelector('.choc-bar');
      if(pack) pack.classList.add('unwrapped');
      playSfx(sfxUnwrap, 'unwrap');
      setTimeout(()=>{
        spawnConfetti(45);
        const reveal = $('#choc4-reveal');
        reveal.hidden = false;
        reveal.classList.add('fade-up-in');
      }, 650);
      this.onclick = null;
    };
  }

  /* ================= SCENE 5 — GIFT ================= */
  function initGift(){
    if(state.initialized.has('gift')) return;
    state.initialized.add('gift');

    $('#gift-line-1').textContent = CONFIG.gift.linesBefore[0];
    $('#gift-line-2').textContent = CONFIG.gift.linesBefore[1];
    $('#gift-line-3').textContent = CONFIG.gift.linesBefore[2];
    $('#btn-open-gift').textContent = CONFIG.gift.openButtonText;
    $('#gift-letter').textContent = CONFIG.gift.letter;
    $('#gift-signoff').textContent = CONFIG.gift.signOff;

    revealSequence([$('#gift-line-1'), $('#gift-line-2'), $('#gift-line-3')], {stagger:650});

    $('#btn-open-gift').onclick = function(){
      const box = $('#gift-box');
      this.disabled = true;
      box.classList.add('shaking');
      playSfx(null, 'click');
      setTimeout(()=>{
        box.classList.remove('shaking');
        box.classList.add('open');
        playSfx(sfxOpen, 'open');
        spawnConfetti(100);
        spawnFireworksShow(4);
        playSfx(sfxConfetti, 'confetti');
      }, 650);
      setTimeout(()=>{
        this.hidden = true;
        $('#gift-line-1').style.display = 'none';
        $('#gift-line-2').style.display = 'none';
        $('#gift-line-3').style.display = 'none';
        $('#gift-wrap').style.display = 'none';
        const reveal = $('#letter-reveal');
        reveal.hidden = false;
        reveal.classList.add('fade-up-in');
      }, 1550);
    };
  }

  /* ================= SCENE 6 — MEMORY GALLERY ================= */
  function initGallery(){
    if(state.initialized.has('gallery')) return;
    state.initialized.add('gallery');

    $('#gallery-line-1').textContent = "And because one surprise wasn't enough...";
    $('#gallery-line-2').textContent = 'A few memories. (Tap to view! 📷)';
    revealSequence([$('#gallery-line-1'), $('#gallery-line-2')], {stagger:600});

    const track = $('#gallery-track');
    const dots = $('#gallery-dots');
    const lightbox = $('#gallery-lightbox');
    const lightboxImg = $('#lightbox-img');
    const lightboxCap = $('#lightbox-caption');
    const lightboxClose = $('#lightbox-close');

    if(lightboxClose){
      lightboxClose.onclick = () => { lightbox.hidden = true; };
      lightbox.onclick = (e) => { if(e.target === lightbox) lightbox.hidden = true; };
    }

    track.innerHTML = '';
    dots.innerHTML = '';

    CONFIG.memories.forEach((m, i)=>{
      const card = document.createElement('div');
      card.className = 'memory-card';

      const photo = document.createElement('div');
      photo.className = 'memory-photo';
      photo.textContent = '📷';
      const img = new Image();
      img.onload = () => { photo.style.backgroundImage = `url("${m.image}")`; photo.textContent = ''; };
      img.onerror = () => { /* keep placeholder icon */ };
      img.src = m.image;

      const cap = document.createElement('p');
      cap.className = 'memory-caption';
      cap.textContent = m.caption;

      card.appendChild(photo);
      card.appendChild(cap);

      if(m.date){
        const d = document.createElement('p');
        d.className = 'memory-date';
        d.textContent = m.date;
        card.appendChild(d);
      }

      card.onclick = () => {
        lightboxImg.src = m.image;
        lightboxCap.textContent = m.caption + (m.date ? ` (${m.date})` : '');
        lightbox.hidden = false;
        triggerSynthSfx('click');
      };

      track.appendChild(card);

      const dot = document.createElement('span');
      if(i===0) dot.classList.add('active');
      dots.appendChild(dot);
    });

    track.onscroll = () => {
      const first = track.firstElementChild;
      if(!first) return;
      const cardWidth = first.getBoundingClientRect().width + 18;
      const idx = Math.round(track.scrollLeft / cardWidth);
      $$('span', dots).forEach((d,i)=> d.classList.toggle('active', i===idx));
    };
  }

  /* ================= SCENE 7 — FINAL ================= */
  function initFinal(){
    if(state.initialized.has('final')) return;
    state.initialized.add('final');

    $('#final-heading').textContent = CONFIG.finalScreen.heading.replace('{name}', CONFIG.friendName.toUpperCase());
    const linesContainer = $('#final-lines');
    linesContainer.innerHTML = '';
    CONFIG.finalScreen.lines.forEach(t=>{
      const p = document.createElement('p');
      p.textContent = t;
      linesContainer.appendChild(p);
    });
    $('#btn-replay').textContent = CONFIG.finalScreen.replayButtonText;

    spawnConfetti(120);
    spawnFireworksShow(5);
    playSfx(sfxConfetti, 'confetti');

    setTimeout(()=>{
      revealSequence($$('p', linesContainer), {stagger:750});
    }, 500);
  }

  /* ================= REPLAY / RESET ================= */
  function resetAll(){
    state.cakeDone = false;
    $('#candles').innerHTML = '';
    $('#smoke-layer').innerHTML = '';
    $('#cake-instruction').style.display = '';
    $('#blow-controls').style.display = '';
    $('#btn-mic-try').hidden = false;
    $('#btn-mic-try').disabled = false;
    $('#btn-hold-blow').hidden = false;
    $('#btn-hold-blow').style.removeProperty('--charge');
    $('#mic-hint').hidden = true;
    $('#cake-post').hidden = true;

    const cakeContinueBtn = $('#cake-post .btn-primary');
    if(cakeContinueBtn) cakeContinueBtn.hidden = true;

    $('#envelope').classList.remove('open');
    $('#env-line-1').style.display = '';
    $('#env-line-1').style.opacity = '';
    $('#env-line-2').style.display = '';
    $('#env-line-2').style.opacity = '';
    $('#btn-open-envelope').hidden = false;
    $('#env-post').hidden = true;
    const envNextBtn = $('#env-post .btn-primary');
    if(envNextBtn) envNextBtn.hidden = true;

    $('#btn-choc-intro-next').hidden = true;

    const eclairs = $('#toffee .eclairs-toffee');
    if(eclairs) eclairs.classList.remove('unwrapped');
    $('#toffee-hint').style.opacity = '';
    $('#choc1-reveal').hidden = true;

    const kitkat = $('#choc2-item .kitkat-pack');
    if(kitkat) kitkat.classList.remove('unwrapped');
    $('#choc2-reveal').hidden = true;

    if(typeof initChoc3.cleanup === 'function') initChoc3.cleanup();
    const bar3 = $('#choc3-bar');
    bar3.classList.remove('unwrapped');
    bar3.style.transform = '';
    $('#shake-fill').style.width = '0%';
    $('#choc3-shake-instruction').style.display = '';
    $('#shake-meter').style.display = '';
    $('#btn-shake-fallback').style.display = '';
    $('#choc3-post-shake').hidden = true;
    $('#btn-open-choc3').hidden = true;
    $('#choc3-reveal').hidden = true;
    state.shakeMeter = 0;

    const goldbar = $('#choc4-item .goldbar-pack');
    if(goldbar) goldbar.classList.remove('unwrapped');
    $('#choc4-reveal').hidden = true;

    $('#gift-box').classList.remove('open','shaking');
    $('#gift-line-1').style.display = '';
    $('#gift-line-2').style.display = '';
    $('#gift-line-3').style.display = '';
    $('#gift-wrap').style.display = '';
    $('#btn-open-gift').hidden = false;
    $('#btn-open-gift').disabled = false;
    $('#letter-reveal').hidden = true;

    $$('.line, .tag').forEach(el => el.classList.remove('show'));
  }

  $('#btn-replay').addEventListener('click', ()=>{
    resetAll();
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    state.initialized.clear();
    state.current = null;
    goToScene('opening');
  });

  /* ================= START ================= */
  goToScene('opening');

})();

