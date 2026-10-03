const fs = require('fs');
let html = fs.readFileSync('signal-bench.html', 'utf8');

// 1. Add webgazer script in head
html = html.replace('</head>', '  <script src="https://cdn.jsdelivr.net/npm/webgazer/dist/webgazer.min.js"></script>\n</head>');

// 2. Add lamps
html = html.replace('<span class="lamp" id="lamp-vox" title="Voice activity"><i></i>VOX</span>', 
`<span class="lamp" id="lamp-vox" title="Voice activity"><i></i>VOX</span>
      <span class="lamp" id="lamp-eye" title="Eye Tracking activity"><i></i>EYE</span>
      <span class="lamp" id="lamp-pad" title="Gamepad activity"><i></i>PAD</span>`);

// 3. Add modules
const modulesHTML = `      <!-- EYE TRACKING -->
      <section class="module rise rise-4" data-section="vision" aria-label="Vision instrument">
        <div class="module-head">
          <h2 class="module-title"><span class="idx">04</span>VISION</h2>
          <span class="live" id="eye-live">cam off</span>
        </div>

        <div class="duo">
          <div class="readout">
            <div class="kv"><span>GAZE X,Y</span><b id="eye-pos">— , —</b></div>
            <div class="kv"><span>STATUS</span><b id="eye-status">OFF</b></div>
            <div style="margin-top:8px;">
              <button class="btn" id="eye-btn">ENABLE CAM</button>
            </div>
          </div>
          <div class="pad" aria-hidden="true" id="eye-pad" style="display:flex;justify-content:center;align-items:center;">
             <span class="pad-dot" id="eye-dot"></span>
          </div>
        </div>

        <div class="mod-row">
          <span class="mod-note">look around the screen to drive the gaze dot</span>
        </div>
      </section>

      <!-- GAMEPAD -->
      <section class="module rise rise-4" data-section="gamepad" aria-label="Gamepad instrument">
        <div class="module-head">
          <h2 class="module-title"><span class="idx">05</span>GAMEPAD</h2>
          <span class="live" id="gp-live">disconnected</span>
        </div>
        <div class="duo">
          <div class="readout">
            <div class="kv"><span>AXIS X,Y</span><b id="gp-axes">0 , 0</b></div>
            <div class="kv"><span>BUTTONS</span><b id="gp-btns">0</b></div>
            <div>
              <div class="meter" role="meter" id="gp-meter"><i></i></div>
            </div>
          </div>
          <div class="pad" aria-hidden="true">
            <span class="pad-dot" id="gp-dot"></span>
          </div>
        </div>
        <div class="mod-row">
          <span class="mod-note">connect a controller, press any button</span>
        </div>
      </section>

`;

html = html.replace('<!-- EVENT LOG -->', modulesHTML + '      <!-- EVENT LOG -->');
html = html.replace('<h2 class="module-title"><span class="idx">04</span>EVENT LOG</h2>', '<h2 class="module-title"><span class="idx">06</span>EVENT LOG</h2>');

// 4. JS state changes
html = html.replace(/micOn: false,/, 'micOn: false,\n    eyeOn: false,\n    gpActive: false,');

// 5. JS el mapping
const elCode = `lampVox: $('lamp-vox'), lampEye: $('lamp-eye'), lampPad: $('lamp-pad'),`;
html = html.replace(/lampVox: \$\('lamp-vox'\),/, elCode);

const elCode2 = `chips: $('chips'),
    eyeLive: $('eye-live'), eyePos: $('eye-pos'), eyeStatus: $('eye-status'), eyeBtn: $('eye-btn'), eyeDot: $('eye-dot'), eyePad: $('eye-pad'),
    gpLive: $('gp-live'), gpAxes: $('gp-axes'), gpBtns: $('gp-btns'), gpMeter: $('gp-meter'), gpDot: $('gp-dot'),`;
html = html.replace(/chips: \$\('chips'\),/, elCode2);

// 6. JS logic for Gamepad & Eye Tracking
const extraJS = `
  /* ============================================================
     CHANNEL 04 — EYE TRACKING
     ============================================================ */
  var gazeActive = false;
  el.eyeBtn.addEventListener('click', async function() {
    if (gazeActive) {
      if (window.webgazer) {
        window.webgazer.pause();
        window.webgazer.showVideoPreview(false);
        window.webgazer.showPredictionPoints(false);
      }
      gazeActive = false;
      state.eyeOn = false;
      el.eyeStatus.textContent = 'OFF';
      el.eyeLive.textContent = 'cam off';
      el.eyeBtn.textContent = 'ENABLE CAM';
      log('EYE', 'gaze tracking paused');
      setMicUI(state.micOn ? 'listening' : 'off');
      return;
    }
    
    if (!window.webgazer) {
      log('EYE', 'webgazer not loaded');
      return;
    }

    try {
      el.eyeStatus.textContent = 'INIT...';
      await window.webgazer.setRegression('ridge')
        .setGazeListener(function(data, elapsedTime) {
          if (data == null) return;
          var x = data.x;
          var y = data.y;
          
          el.eyePos.textContent = Math.round(x) + ' , ' + Math.round(y);
          
          var padRect = el.eyePad.getBoundingClientRect();
          var px = (x / window.innerWidth) * 100;
          var py = (y / window.innerHeight) * 100;
          el.eyeDot.style.left = px + '%';
          el.eyeDot.style.top = py + '%';
          
          if (Math.random() < 0.03) {
             var local = stageLocal(x, y);
             if (local.inside) {
                stage.ripple(local.x, local.y);
             }
          }
          pulseLamp(el.lampEye, 100);
        })
        .begin();
        
      window.webgazer.showVideoPreview(false).showPredictionPoints(false);
      gazeActive = true;
      state.eyeOn = true;
      el.eyeStatus.textContent = 'TRACKING';
      el.eyeLive.textContent = 'cam active';
      el.eyeBtn.textContent = 'DISABLE CAM';
      log('EYE', 'gaze tracking started');
      flash('EYE TRACKING ON');
    } catch(err) {
      console.error(err);
      el.eyeStatus.textContent = 'ERROR';
      log('EYE', 'failed to init webgazer');
    }
  });

  /* ============================================================
     CHANNEL 05 — GAMEPAD
     ============================================================ */
  window.addEventListener("gamepadconnected", (e) => {
    state.gpActive = true;
    el.gpLive.textContent = e.gamepad.id.substring(0, 15) + '...';
    log('PAD', 'gamepad connected: ' + e.gamepad.id);
    flash('GAMEPAD CONNECTED');
  });

  window.addEventListener("gamepaddisconnected", (e) => {
    state.gpActive = false;
    el.gpLive.textContent = 'disconnected';
    log('PAD', 'gamepad disconnected');
  });
`;

html = html.replace('/* ============================================================', extraJS + '\n  /* ============================================================');

const gpTickJS = `
    /* gamepad poll */
    if (state.gpActive) {
      var gps = navigator.getGamepads ? navigator.getGamepads() : [];
      var gp = gps[0];
      if (gp) {
        var ax = gp.axes[0] || 0;
        var ay = gp.axes[1] || 0;
        el.gpAxes.textContent = ax.toFixed(2) + ' , ' + ay.toFixed(2);
        
        el.gpDot.style.left = (50 + ax * 50) + '%';
        el.gpDot.style.top = (50 + ay * 50) + '%';
        
        var activeBtns = 0;
        gp.buttons.forEach((b) => {
           if(b.pressed) activeBtns++;
        });
        el.gpBtns.textContent = activeBtns;
        
        if (Math.abs(ax) > 0.1 || Math.abs(ay) > 0.1 || activeBtns > 0) {
            pulseLamp(el.lampPad, 100);
            el.gpMeter.firstElementChild.style.width = Math.min(100, Math.max(Math.abs(ax), Math.abs(ay)) * 100) + '%';
        } else {
            el.gpMeter.firstElementChild.style.width = '0%';
        }
      }
    }
`;

html = html.replace('/* keep spectrum alive when the big loop is paused */', gpTickJS + '\n    /* keep spectrum alive when the big loop is paused */');

fs.writeFileSync('signal-bench.html', html);
