
(function(){
  "use strict";

  /* ------------------------------------------------------------
     6.1  LANDING PAGE STARFIELD (2D canvas, lightweight)
  ------------------------------------------------------------ */
  const starCanvas = document.getElementById('starCanvas');
  const sctx = starCanvas.getContext('2d');
  let stars = [];
  function resizeStarCanvas(){
    starCanvas.width = innerWidth; starCanvas.height = innerHeight;
    stars = Array.from({length: Math.floor(innerWidth*innerHeight/2600)}, ()=>({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      r: Math.random()*1.4+0.2, s: Math.random()*0.4+0.05, tw: Math.random()*Math.PI*2
    }));
  }
  resizeStarCanvas();
  window.addEventListener('resize', resizeStarCanvas);
  (function starLoop(){
    if(!document.getElementById('landing').classList.contains('hide')){
      sctx.clearRect(0,0,starCanvas.width,starCanvas.height);
      const g = sctx.createRadialGradient(innerWidth*0.5, innerHeight*0.32, 0, innerWidth*0.5, innerHeight*0.32, innerWidth*0.7);
      g.addColorStop(0,'rgba(80,60,160,0.18)'); g.addColorStop(1,'rgba(0,0,0,0)');
      sctx.fillStyle = g; sctx.fillRect(0,0,starCanvas.width,starCanvas.height);
      for(const st of stars){
        st.tw += 0.02;
        const a = 0.5 + Math.sin(st.tw)*0.5;
        sctx.beginPath();
        sctx.fillStyle = `rgba(230,235,255,${(0.3+a*0.7).toFixed(2)})`;
        sctx.arc(st.x, st.y, st.r, 0, Math.PI*2); sctx.fill();
        st.y += st.s;
        if(st.y > innerHeight){ st.y = 0; st.x = Math.random()*innerWidth; }
      }
    }
    requestAnimationFrame(starLoop);
  })();

  /* ------------------------------------------------------------
     6.2  LANDING -> GAME TRANSITION
  ------------------------------------------------------------ */
  const landing = document.getElementById('landing');
  const gameEl  = document.getElementById('game');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn  = document.getElementById('backBtn');
  let gameStarted = false;

  enterBtn.addEventListener('click', ()=>{
    landing.classList.add('hide');
    setTimeout(()=>{
      gameEl.classList.add('show');
      if(!gameStarted){ initGame(); gameStarted = true; }
    }, 500);
  });
  backBtn.addEventListener('click', ()=>{
    gameEl.classList.remove('show');
    landing.classList.remove('hide');
  });

  /* ==============================================================
     6.3  GAME — THREE.JS GRAVITY SANDBOX
  ============================================================== */
  function initGame(){

    /* ---- config ---- */
    const G = 0.9;                 // gravitational constant (scaled for visuals)
    const SUN_MASS = 26000;
    const LOOP_SECONDS = 180;
    const LORE_POOL = [
      {kind:'خرابهٔ ورین', text:'زبانی که بر این سنگ حک شده، از تمدن <b>ورین</b> است — قومی که پیش از فروپاشی خورشیدشان، دانش خود را در حلقه‌های زمانی مدفون کردند.'},
      {kind:'لوح ورین', text:'«ما نمی‌توانیم مرگ ستاره را متوقف کنیم؛ اما می‌توانیم هر بار کمی بیشتر بفهمیم.» — سرودهٔ کاوشگران ورین.'},
      {kind:'نگاشتهٔ مداری', text:'نقشه‌ای از مدارهای این منظومه پیش از فروپاشی، حک‌شده بر فلزی که در برابر زمان مقاومت کرده.'},
      {kind:'یادداشت رصدی', text:'کاوشگران ورین باور داشتند سیاه‌چاله‌ها دروازه‌ای به حلقهٔ بعدی هستند، نه پایان.'},
      {kind:'نماد حلقه', text:'نماد تکرارشونده‌ای که در تمام خرابه‌ها دیده می‌شود: ماری که دم خود را می‌بلعد — نماد بازگشت جاودان.'},
      {kind:'سرود آخر', text:'«وقتی خورشید سرخ شد، ما دیگر نترسیدیم. هر پایان، آغاز دانشی تازه بود.»'},
      {kind:'ثبت کاوش', text:'ورین‌ها فهمیدند جرم هر جسم، مسیر زمان را در اطراف خود خم می‌کند — هرچه سنگین‌تر، کندتر.'},
      {kind:'پیام بازمانده', text:'اگر این را می‌خوانی، یعنی به همان چیزی رسیده‌ای که ما رسیدیم: کنجکاوی، تنها راه بقاست.'},
      {kind:'طرح فنی', text:'بقایای سفینه‌ای که برای عبور از میدان گرانشی سیاه‌چاله طراحی شده بود — ناکام ماند.'},
      {kind:'دفترچهٔ رصد', text:'روی این جسم علائمی از برخوردی کهن دیده می‌شود؛ گویی زمانی سیاره‌ای دیگر بوده.'},
      {kind:'حکاکی گمشده', text:'ورین‌ها زمان را نه خطی، بلکه حلقه‌ای می‌دیدند — هر تکرار، لایه‌ای تازه از فهم.'},
      {kind:'آخرین علامت', text:'اینجا، در حاشیهٔ منظومه، آخرین علامت ورین‌ها نوشته شده: «به دنبال نور برو.»'}
    ];
    let loreIndex = 0;
    const discovered = [];

    /* ---- renderer / scene / camera ---- */
    const canvas = document.getElementById('gameCanvas');
    const infoPanel = document.getElementById('infoPanel');
    const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060d);
    scene.fog = new THREE.FogExp2(0x05060d, 0.0022);

    const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 4000);
    let camSpherical = {r: 620, theta: 0.9, phi: 1.15};
    updateCameraFromSpherical();

    window.addEventListener('resize', ()=>{
      camera.aspect = innerWidth/innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    /* ---- background starfield (3D points) ---- */
    (function buildBgStars(){
      const N = 2600, pos = new Float32Array(N*3);
      for(let i=0;i<N;i++){
        const r = 1400 + Math.random()*1200;
        const th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
        pos[i*3]   = r*Math.sin(ph)*Math.cos(th);
        pos[i*3+1] = r*Math.sin(ph)*Math.sin(th);
        pos[i*3+2] = r*Math.cos(ph);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
      const mat = new THREE.PointsMaterial({color:0xaab4ff, size:1.6, sizeAttenuation:true});
      scene.add(new THREE.Points(geo, mat));
    })();

    /* ---- lighting ---- */
    scene.add(new THREE.AmbientLight(0x33344a, 1.1));
    const sunLight = new THREE.PointLight(0xfff2d6, 3.2, 3000, 1.4);
    scene.add(sunLight);

    /* ---- sun ---- */
    const sunGeo = new THREE.SphereGeometry(34, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({color:0xffb457});
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    const glowGeo = new THREE.SphereGeometry(50, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({color:0xff8a4a, transparent:true, opacity:0.18});
    sunMesh.add(new THREE.Mesh(glowGeo, glowMat));

    /* ---- bodies registry ----
       body = {mesh, mass, radius, vel:THREE.Vector3, isHole, name, kindLabel, lore, trail, exploded:false}
    */
    let bodies = [];
    let selected = null;
    let paused = false;
    let activeTool = 'select'; // select | planet | comet | hole

    const PLANET_COLORS = [0x6fd3ff, 0x9d8bff, 0xff9d6f, 0x7fffb0, 0xffe36f, 0xff6f9d, 0x6fffe3];
    const PLANET_NAMES = ['ورین-الف','ورین-ب','کالیستو-۹','آذرک','نیمروز','سپهر','تیام','رخشا','بوران','یلدا','آترا','ثریا'];

    function makePlanet(pos, vel, radius, colorIdx){
      const color = PLANET_COLORS[colorIdx % PLANET_COLORS.length];
      const geo = new THREE.SphereGeometry(radius, 26, 26);
      const mat = new THREE.MeshStandardMaterial({color, roughness:0.6, metalness:0.15, emissive:color, emissiveIntensity:0.06});
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      const trailGeo = new THREE.BufferGeometry();
      const trailMat = new THREE.LineBasicMaterial({color, transparent:true, opacity:0.35});
      const trailPts = new Array(60).fill(null).map(()=>pos.clone());
      trailGeo.setFromPoints(trailPts);
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);

      const mass = radius*radius*radius*2.2;
      const body = {
        mesh, mass, radius, vel: vel.clone(), isHole:false,
        name: PLANET_NAMES[Math.floor(Math.random()*PLANET_NAMES.length)] + '-' + Math.floor(Math.random()*90+10),
        kindLabel: 'سیاره', trailLine, trailPts, explored:false,
        lore: LORE_POOL[loreIndex % LORE_POOL.length]
      };
      loreIndex++;
      bodies.push(body);
      return body;
    }

    function makeBlackHole(pos){
      const radius = 14;
      const geo = new THREE.SphereGeometry(radius, 24, 24);
      const mat = new THREE.MeshBasicMaterial({color:0x000000});
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      const ringGeo = new THREE.RingGeometry(radius*1.6, radius*3.2, 48);
      const ringMat = new THREE.MeshBasicMaterial({color:0x8b7bff, side:THREE.DoubleSide, transparent:true, opacity:0.55});
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI/2.3;
      mesh.add(ring);

      const trailGeo = new THREE.BufferGeometry();
      const trailMat = new THREE.LineBasicMaterial({color:0x8b7bff, transparent:true, opacity:0.3});
      const trailPts = new Array(60).fill(null).map(()=>pos.clone());
      trailGeo.setFromPoints(trailPts);
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);

      const body = {
        mesh, mass: 9000, radius, vel: new THREE.Vector3(0,0,0), isHole:true,
        name: 'سیاه‌چالهٔ ' + Math.floor(Math.random()*900+100),
        kindLabel:'سیاه‌چاله', trailLine, trailPts, explored:true, ring,
        lore: {kind:'ناحیهٔ رویداد افق', text:'هیچ نوری از این نقطه باز نمی‌گردد. ورین‌ها آن را «دروازهٔ خاموش» می‌نامیدند.'}
      };
      bodies.push(body);
      return body;
    }

    function circularVel(pos, centerMass){
      const r = pos.length();
      const speed = Math.sqrt(G*centerMass/Math.max(r,1));
      // tangential direction on the XZ-ish orbital plane with slight y variation
      const dir = new THREE.Vector3(-pos.z, 0, pos.x).normalize();
      return dir.multiplyScalar(speed);
    }

    /* ---- seed initial system ---- */
    function seedSystem(){
      // clear existing
      for(const b of bodies){ scene.remove(b.mesh); scene.remove(b.trailLine); }
      bodies = [];
      selected = null;
      hideInfoPanel();
      const seeds = [
        {r:120, size:6}, {r:190, size:8}, {r:270, size:5.5}, {r:360, size:10}, {r:460, size:7}
      ];
      seeds.forEach((s, i)=>{
        const angle = Math.random()*Math.PI*2;
        const pos = new THREE.Vector3(Math.cos(angle)*s.r, (Math.random()-0.5)*14, Math.sin(angle)*s.r);
        const vel = circularVel(pos, SUN_MASS);
        makePlanet(pos, vel, s.size, i);
      });
    }
    seedSystem();

    /* ---- physics step ---- */
    const tmp = new THREE.Vector3();
    function physicsStep(dt){
      if(paused) return;
      // gravity from sun + mutual gravity between bodies
      for(let i=0;i<bodies.length;i++){
        const b = bodies[i];
        const acc = new THREE.Vector3();
        // sun pull
        tmp.copy(sunMesh.position).sub(b.mesh.position);
        let dist = Math.max(tmp.length(), 6);
        acc.add(tmp.normalize().multiplyScalar(G*SUN_MASS/(dist*dist)));
        // mutual pulls
        for(let j=0;j<bodies.length;j++){
          if(i===j) continue;
          const other = bodies[j];
          tmp.copy(other.mesh.position).sub(b.mesh.position);
          dist = Math.max(tmp.length(), 4);
          acc.add(tmp.normalize().multiplyScalar(G*other.mass/(dist*dist)));
        }
        b.vel.addScaledVector(acc, dt);
      }
      for(const b of bodies){
        b.mesh.position.addScaledVector(b.vel, dt);
        if(b.ring) b.ring.rotation.z += dt*0.6;
        // update trail
        b.trailPts.push(b.mesh.position.clone());
        b.trailPts.shift();
        b.trailLine.geometry.setFromPoints(b.trailPts);
      }
      // collisions
      handleCollisions();
      // remove bodies that fell into sun or flew too far
      bodies = bodies.filter(b=>{
        const dSun = b.mesh.position.distanceTo(sunMesh.position);
        if(dSun < 30 && !b.isHole){ removeBody(b, true); return false; }
        if(b.mesh.position.length() > 2200){ removeBody(b, false); return false; }
        return true;
      });
    }

    function handleCollisions(){
      for(let i=0;i<bodies.length;i++){
        for(let j=i+1;j<bodies.length;j++){
          const a = bodies[i], b = bodies[j];
          const d = a.mesh.position.distanceTo(b.mesh.position);
          if(d < a.radius + b.radius){
            if(a.isHole || b.isHole){
              const hole = a.isHole ? a : b;
              const prey = a.isHole ? b : a;
              hole.mass += prey.mass*0.4;
              removeBody(prey, true);
              bodies = bodies.filter(x=>x!==prey);
            } else {
              mergeBodies(a,b);
            }
            return; // recompute next frame
          }
        }
      }
    }

    function mergeBodies(a,b){
      const big = a.mass>=b.mass ? a : b;
      const small = a.mass>=b.mass ? b : a;
      const totalMass = a.mass+b.mass;
      const newVel = a.vel.clone().multiplyScalar(a.mass).add(b.vel.clone().multiplyScalar(b.mass)).divideScalar(totalMass);
      const newRadius = Math.cbrt(a.radius**3 + b.radius**3);
      big.vel.copy(newVel);
      big.mass = totalMass;
      big.radius = newRadius;
      big.mesh.geometry.dispose();
      big.mesh.geometry = new THREE.SphereGeometry(newRadius, 26, 26);
      big.mesh.scale.set(1,1,1);
      spawnBurst(big.mesh.position, 0xffcf9a);
      removeBody(small, true);
      bodies = bodies.filter(x=>x!==small);
      if(selected===small) hideInfoPanel();
    }

    function removeBody(b, burst){
      if(burst) spawnBurst(b.mesh.position, 0xff8a6a);
      scene.remove(b.mesh);
      scene.remove(b.trailLine);
      if(selected===b) hideInfoPanel();
    }

    /* ---- particle burst on destroy/merge ---- */
    const bursts = [];
    function spawnBurst(pos, color){
      const N=26;
      const posArr = new Float32Array(N*3);
      const vels = [];
      for(let i=0;i<N;i++){
        posArr[i*3]=pos.x; posArr[i*3+1]=pos.y; posArr[i*3+2]=pos.z;
        vels.push(new THREE.Vector3((Math.random()-0.5)*2,(Math.random()-0.5)*2,(Math.random()-0.5)*2).normalize().multiplyScalar(Math.random()*40+10));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(posArr,3));
      const mat = new THREE.PointsMaterial({color, size:2.4, transparent:true, opacity:1});
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      bursts.push({pts, vels, life:0});
    }
    function updateBursts(dt){
      for(let i=bursts.length-1;i>=0;i--){
        const br = bursts[i];
        br.life += dt;
        const arr = br.pts.geometry.attributes.position.array;
        for(let k=0;k<br.vels.length;k++){
          arr[k*3]   += br.vels[k].x*dt;
          arr[k*3+1] += br.vels[k].y*dt;
          arr[k*3+2] += br.vels[k].z*dt;
        }
        br.pts.geometry.attributes.position.needsUpdate = true;
        br.pts.material.opacity = Math.max(0, 1 - br.life/1.1);
        if(br.life>1.1){ scene.remove(br.pts); bursts.splice(i,1); }
      }
    }

    /* ---- camera controls: drag to orbit, wheel to zoom ---- */
    let dragging = false, dragMode = null, lastX=0, lastY=0;
    let dragStartWorld = null, dragCurrentWorld = null, ghostLine=null;

    function updateCameraFromSpherical(){
      camSpherical.phi = Math.max(0.25, Math.min(Math.PI-0.25, camSpherical.phi));
      camSpherical.r = Math.max(80, Math.min(1600, camSpherical.r));
      const {r,theta,phi} = camSpherical;
      camera.position.set(
        r*Math.sin(phi)*Math.cos(theta),
        r*Math.cos(phi),
        r*Math.sin(phi)*Math.sin(theta)
      );
      camera.lookAt(0,0,0);
    }

    function screenToWorldPlane(clientX, clientY){
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX-rect.left)/rect.width)*2-1,
        -((clientY-rect.top)/rect.height)*2+1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pt);
      return pt || new THREE.Vector3();
    }

    function pickBody(clientX, clientY){
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX-rect.left)/rect.width)*2-1,
        -((clientY-rect.top)/rect.height)*2+1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      raycaster.params.Points.threshold = 4;
      const meshes = bodies.map(b=>b.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if(hits.length){
        return bodies.find(b=>b.mesh===hits[0].object);
      }
      return null;
    }

    canvas.addEventListener('pointerdown', (e)=>{
      lastX = e.clientX; lastY = e.clientY;
      dragging = true;
      const hitBody = pickBody(e.clientX, e.clientY);

      if(activeTool==='comet'){
        dragMode = 'comet';
        dragStartWorld = screenToWorldPlane(e.clientX, e.clientY);
      } else if(hitBody && activeTool==='select'){
        dragMode = 'none';
        selectBody(hitBody);
      } else {
        dragMode = 'orbit';
      }
    });

    canvas.addEventListener('pointermove', (e)=>{
      if(!dragging) return;
      if(dragMode==='orbit'){
        const dx = e.clientX-lastX, dy = e.clientY-lastY;
        camSpherical.theta -= dx*0.0045;
        camSpherical.phi   -= dy*0.0045;
        updateCameraFromSpherical();
        lastX=e.clientX; lastY=e.clientY;
      } else if(dragMode==='comet'){
        dragCurrentWorld = screenToWorldPlane(e.clientX, e.clientY);
        if(ghostLine) scene.remove(ghostLine);
        const g = new THREE.BufferGeometry().setFromPoints([dragStartWorld, dragCurrentWorld]);
        ghostLine = new THREE.Line(g, new THREE.LineDashedMaterial({color:0xffffff, dashSize:4, gapSize:3}));
        ghostLine.computeLineDistances();
        scene.add(ghostLine);
      }
    });

    canvas.addEventListener('pointerup', (e)=>{
      if(dragMode==='comet' && dragStartWorld){
        const end = screenToWorldPlane(e.clientX, e.clientY) || dragStartWorld;
        const vel = dragStartWorld.clone().sub(end).multiplyScalar(1.6);
        makePlanet(dragStartWorld, vel, 3.4, Math.floor(Math.random()*7));
        if(ghostLine){ scene.remove(ghostLine); ghostLine=null; }
        dragStartWorld = null;
      } else if(dragMode==='orbit'){
        const moved = Math.abs(e.clientX-lastX)+Math.abs(e.clientY-lastY);
        if(moved < 3){
          // treat as click
          if(activeTool==='planet'){
            const pos = screenToWorldPlane(e.clientX, e.clientY);
            pos.y = (Math.random()-0.5)*14;
            const vel = circularVel(pos, SUN_MASS);
            makePlanet(pos, vel, 3+Math.random()*4, Math.floor(Math.random()*7));
          } else if(activeTool==='hole'){
            const pos = screenToWorldPlane(e.clientX, e.clientY);
            makeBlackHole(pos);
          } else if(activeTool==='select'){
            hideInfoPanel();
          }
        }
      }
      dragging=false; dragMode=null;
    });

    canvas.addEventListener('wheel', (e)=>{
      camSpherical.r += e.deltaY*0.4;
      updateCameraFromSpherical();
    }, {passive:true});

    /* ---- selection / info panel ---- */
    // const infoPanel = document.getElementById('infoPanel');

    function selectBody(b){
      selected = b;
      document.getElementById('infoName').textContent = b.name;
      document.getElementById('infoKind').textContent = b.kindLabel;
      document.getElementById('infoMass').textContent = Math.round(b.mass);
      document.getElementById('infoVel').textContent = b.vel.length().toFixed(1);
      document.getElementById('infoDist').textContent = Math.round(b.mesh.position.distanceTo(sunMesh.position));
      const loreEl = document.getElementById('infoLore');
      loreEl.innerHTML = `<b>${b.lore.kind}</b><br>${b.lore.text}`;
      infoPanel.classList.add('show');

      if(!b.explored){
        b.explored = true;
        discovered.push(b.lore);
        updateCodex();
      }
    }
    function hideInfoPanel(){
      selected = null;
      infoPanel.classList.remove('show');
    }
    document.getElementById('destroyBtn').addEventListener('click', ()=>{
      if(selected){
        removeBody(selected, true);
        bodies = bodies.filter(x=>x!==selected);
      }
    });

    /* ---- codex panel ---- */
    const codexPanel = document.getElementById('codexPanel');
    function updateCodex(){
      document.getElementById('codexCount').textContent = discovered.length+'/'+LORE_POOL.length;
      const list = document.getElementById('codexList');
      if(!discovered.length){ list.innerHTML = '<div class="empty">هنوز چیزی کشف نشده. روی یک سیاره کلیک کن.</div>'; return; }
      list.innerHTML = discovered.map(f=>`<div class="frag"><b style="color:var(--violet)">${f.kind}</b><br>${f.text}</div>`).join('');
    }

    /* ---- toolbar ---- */
    const toolButtons = {
      select: document.getElementById('toolSelect'),
      planet: document.getElementById('toolPlanet'),
      comet:  document.getElementById('toolComet'),
      hole:   document.getElementById('toolHole'),
    };
    function setTool(name){
      activeTool = name;
      Object.entries(toolButtons).forEach(([k,el])=>el.classList.toggle('active', k===name));
    }
    Object.entries(toolButtons).forEach(([name,el])=> el.addEventListener('click', ()=>setTool(name)));

    const pauseBtn = document.getElementById('toolPause');
    pauseBtn.addEventListener('click', ()=>{
      paused = !paused;
      pauseBtn.innerHTML = paused ? '<span class="ic">▶️</span>ادامه' : '<span class="ic">⏸️</span>توقف';
    });
    document.getElementById('toolReset').addEventListener('click', triggerSupernova);

    /* codex toggle via clicking the chip */
    document.getElementById('codexCount').parentElement.addEventListener('click', ()=>{
      codexPanel.classList.toggle('show');
    });
    codexPanel.classList.add('show'); // visible by default on wide screens

    /* ---- keyboard ---- */
    window.addEventListener('keydown', (e)=>{
      if(e.key==='Delete' || e.key==='Backspace'){
        if(selected){ removeBody(selected, true); bodies = bodies.filter(x=>x!==selected); }
      }
    });

    /* ---- time loop / supernova ---- */
    let loopCount = 1;
    let timeLeft = LOOP_SECONDS;
    const loopCountEl = document.getElementById('loopCount');
    const loopTimerEl = document.getElementById('loopTimer');
    const toFa = n => n.toString().replace(/\d/g, d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

    function triggerSupernova(){
      const flash = document.getElementById('flash');
      flash.style.transition = 'opacity .15s ease';
      flash.style.opacity = '1';
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(()=>{
        flash.style.transition = 'opacity 1.2s ease';
        flash.style.opacity = '0';
      }, 180);
      setTimeout(()=>{ toast.classList.remove('show'); }, 2200);
      seedSystem();
      loopCount++;
      timeLeft = LOOP_SECONDS;
      loopCountEl.textContent = toFa(loopCount);
    }

    /* ---- main loop ---- */
    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      if(!paused){
        timeLeft -= dt;
        if(timeLeft <= 0){ triggerSupernova(); }
        const m = Math.max(0, Math.floor(timeLeft/60));
        const s = Math.max(0, Math.floor(timeLeft%60));
        loopTimerEl.textContent = `${toFa(String(m).padStart(2,'0'))}:${toFa(String(s).padStart(2,'0'))}`;
      }
      physicsStep(dt);
      updateBursts(dt);
      sunMesh.rotation.y += dt*0.15;
      // keep info panel numbers live while selected
      if(selected && bodies.includes(selected)){
        document.getElementById('infoVel').textContent = selected.vel.length().toFixed(1);
        document.getElementById('infoDist').textContent = Math.round(selected.mesh.position.distanceTo(sunMesh.position));
      }
      renderer.render(scene, camera);
    }
    animate();
  }
})();
