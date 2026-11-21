// アイコン（1:1）を作る：ゲームの3Dモデル6人を並べて撮影 → ロゴと色収差は icon.py で
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 600, height: 600 } })).newPage();
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  await page.goto('http://localhost:8091/index.html?osennet=off'); await page.waitForFunction('window.__osReady', null, { timeout: 120000 });
  const data = await page.evaluate(() => {
    const T = THREE, F = __os.FRIENDS, S = 1024;
    const r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true }); r.setSize(S, S); r.setPixelRatio(1); r.outputEncoding = T.sRGBEncoding; r.shadowMap.enabled = true;
    const sc = new T.Scene();
    // 床：汚染っぽい虹色のチェック
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'); const cols = ['#ff3355', '#ffaa00', '#ffee33', '#33dd66', '#33ccff', '#5566ff', '#cc44ff'];
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = cols[(i + j * 3) % cols.length]; x.fillRect(i * 32, j * 32, 32, 32); }
    const tx = new T.CanvasTexture(cv); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(3, 3); tx.encoding = T.sRGBEncoding;
    const fl = new T.Mesh(new T.CircleGeometry(2.4, 48), new T.MeshLambertMaterial({ map: tx })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    sc.add(new T.HemisphereLight(0xffffff, 0x6a4a8a, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.75); sun.position.set(1.5, 3, 2.5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -2; sun.shadow.camera.right = 2; sun.shadow.camera.top = 2; sun.shadow.camera.bottom = -2; sc.add(sun);
    const rim = new T.DirectionalLight(0xff88ff, 0.5); rim.position.set(-2, 1.5, -2); sc.add(rim);
    function put(i, px, py, pz, s) {
      const g = F.hi[i], m = new T.Mesh(g, new T.MeshLambertMaterial({ map: F.texs[g.userData.set || 0] || null, side: T.DoubleSide }));
      m.scale.setScalar(1.18 * s); m.position.set(px, py, pz); m.rotation.y = -px * 0.35; m.castShadow = true; sc.add(m);
      if (py > 0.01) { const st = new T.Mesh(new T.CylinderGeometry(0.28, 0.3, py, 24), new T.MeshLambertMaterial({ color: 0xffd5f0 })); st.position.set(px, py / 2, pz); st.castShadow = st.receiveShadow = true; sc.add(st); }
    }
    // うしろ：男の子3人（台の上）　前：女の子3人
    put(4, -0.5, 0.16, -0.42, 1.0); put(5, 0.0, 0.36, -0.55, 1.0); put(6, 0.5, 0.16, -0.42, 1.0);
    put(0, -0.68, 0, 0.28, 1.0); put(3, 0.0, 0, 0.42, 1.0); put(1, 0.68, 0, 0.28, 1.0);
    const cam = new T.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 1.45, 5.2); cam.lookAt(0, 1.2, 0);
    r.render(sc, cam);
    return r.domElement.toDataURL('image/png');
  });
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64')); await b.close(); console.log('ok');
})();
