let scene, camera, renderer;
let cakeGroup, candleFlameGroup, candleGlowLight, candleMotionGroup;
let cakeParticles = [];
let orbitParticles = [];
let cakeDecorations = [];
let cakeSolidParts = [];
let ledBulbs = [];
let glassStars = [];
let cakeSparkles = [];
let memoryCards = [];
let backgroundLayers = [];
let shootingStars = [];
let backgroundDecorations = [];
let isExploded = false;
let audioStarted = false;
let cameraStream = null;
let cameraController = null;
let handsTracker = null;
let faceTracker = null;
let lastWaveTime = 0;
let lastBlowTime = 0;
let baseCakeRotationY = 0;
let handRotationY = 0;
let handRotationX = 0;
let handRotationTargetY = 0;
let handRotationTargetX = 0;
let lastHandGesture = 'none';
let lastPhotoFingerCount = 0;
let lastPhotoTime = 0;
let lastTwoHandTime = 0;
let celebrationPulse = 0;
let candlesLit = true;
let countdownInterval = null;
let birthdayRevealed = false;
let cakeRevealProgress = 0;

// Change this date to the birthday you want to celebrate (month is zero-based: 8 = September).
const targetDate = (() => {
  const now = new Date();
  const date = new Date(now.getFullYear(), 8, 16, 21, 40, 0);
  if (date <= now) date.setFullYear(date.getFullYear() + 1);
  return date;
})();

// TÙY CHỈNH DANH SÁCH ẢNH & LỜI CHÚC TẠI ĐÂY
const photos = [
  { url: 'image 1.jpg', caption: 'Ảnh 1 🌸' },
  { url: 'image 2.jpg', caption: 'Ảnh 2 ✨' },
  { url: 'image 3.jpg', caption: 'Ảnh 3 💫' },
  { url: 'image 4.jpg', caption: 'Ảnh 4 🎉' }
];

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d0a1a, 0.015);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 8, 28);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffa07a, 2, 50);
  pointLight.position.set(0, 12, 0);
  scene.add(pointLight);

  cakeGroup = new THREE.Group();
  scene.add(cakeGroup);

  create3DCake();
  cakeGroup.visible = false;
  createBackgroundStars();
  createBirthdayBackdrop();
  createOrbitingParticles();
  createMemoryCards();
  initCountdown();

  window.addEventListener('resize', onWindowResize);
  setupRaycaster();
  animate();
}

function initCountdown() {
  const card = document.getElementById('countdown-card');
  const days = document.getElementById('countdown-days');
  const hours = document.getElementById('countdown-hours');
  const minutes = document.getElementById('countdown-minutes');
  const seconds = document.getElementById('countdown-seconds');

  function updateCountdown() {
    const remaining = targetDate.getTime() - Date.now();
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      revealBirthday(card);
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const dayCount = Math.floor(totalSeconds / 86400);
    const hourCount = Math.floor((totalSeconds % 86400) / 3600);
    const minuteCount = Math.floor((totalSeconds % 3600) / 60);
    const secondCount = totalSeconds % 60;
    days.textContent = String(dayCount).padStart(2, '0');
    hours.textContent = String(hourCount).padStart(2, '0');
    minutes.textContent = String(minuteCount).padStart(2, '0');
    seconds.textContent = String(secondCount).padStart(2, '0');
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function revealBirthday(card) {
  if (birthdayRevealed) return;
  birthdayRevealed = true;
  cakeRevealProgress = 0;
  cakeGroup.visible = true;
  memoryCards.forEach(cardItem => { cardItem.visible = true; });
  document.body.classList.remove('countdown-pending');
  document.body.classList.add('birthday-revealed');
  document.getElementById('canvas-container').classList.add('show-cake');
  document.getElementById('sub-title').textContent = '🎉 CHÚC MỪNG SINH NHẬT! MỞ QUÀ & THỔI NẾN NÀO! 🎉';
  card.classList.add('countdown-complete');
  setTimeout(() => { card.style.display = 'none'; }, 650);
  launchFireworks();
  setTimeout(launchFireworks, 650);
  if (audioStarted) document.getElementById('bg-music').play().catch(() => {});
}

// Tạo hình Bánh sinh nhật 3D từ các hạt phát sáng
function create3DCake() {
  const particleGeo = new THREE.SphereGeometry(0.075, 7, 7);

  function makeTier(radius, height, yOffset, count, color) {
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(particleGeo, mat);
      
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * height + yOffset;

      mesh.position.set(x, y, z);

      const expAngle = Math.random() * Math.PI * 2;
      const expRadius = 15 + Math.random() * 25;
      const expHeight = (Math.random() - 0.5) * 30;
      const targetPos = new THREE.Vector3(
        Math.cos(expAngle) * expRadius,
        expHeight,
        Math.sin(expAngle) * expRadius
      );

      cakeParticles.push({
        mesh: mesh,
        origin: new THREE.Vector3(x, y, z),
        target: targetPos,
        burstTarget: targetPos.clone(),
        burstAngle: Math.random() * Math.PI * 2,
        burstRadius: 0.4 + Math.random() * 1.2,
        burstSpeed: 0.006 + Math.random() * 0.01,
        burstPhase: Math.random() * Math.PI * 2,
        speed: 0.03 + Math.random() * 0.04
      });

      cakeGroup.add(mesh);
    }
  }

  makeTier(6.2, 3.8, -1.8, 1900, 0xb9d98d);

  createNumberCandles(-0.2, 0);
  createPastelCake();
}

function createPastelCake() {
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(6.22, 6.35, 3.8, 64),
    new THREE.MeshStandardMaterial({ color: 0xc8e49a, roughness: 0.72, metalness: 0.02 })
  );
  body.position.y = -1.8;
  cakeSolidParts.push(body);
  cakeGroup.add(body);

  const creamMaterial = new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.5 });
  const creamGeo = new THREE.SphereGeometry(0.62, 18, 14);
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const cream = new THREE.Mesh(creamGeo, creamMaterial);
    cream.scale.set(1, 0.72, 1);
    cream.position.set(Math.cos(angle) * 5.35, 0.22, Math.sin(angle) * 5.35);
    cakeSolidParts.push(cream);
    cakeGroup.add(cream);
  }

  const fruitColors = [0xffa62b, 0xff6f91, 0x72c8ff, 0xf4c96b, 0xff9fcf];
  const fruitData = [
    { x: -2.65, z: 1.25, scale: 0.9, color: fruitColors[0] },
    { x: -2.15, z: -1.55, scale: 0.78, color: fruitColors[1] },
    { x: 0, z: 2.05, scale: 0.68, color: fruitColors[2] },
    { x: 2.15, z: -1.55, scale: 0.82, color: fruitColors[3] },
    { x: 2.65, z: 1.25, scale: 0.72, color: fruitColors[4] }
  ];
  fruitData.forEach(fruit => {
    const piece = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 16, 12),
      new THREE.MeshStandardMaterial({ color: fruit.color, roughness: 0.4 })
    );
    piece.scale.set(fruit.scale, 0.42, fruit.scale * 0.8);
    piece.position.set(fruit.x, 0.72, fruit.z);
    cakeSolidParts.push(piece);
    cakeGroup.add(piece);
  });

  const strawberryMaterial = new THREE.MeshStandardMaterial({ color: 0xff5577, roughness: 0.45 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x75b86b, roughness: 0.7 });
  [-2.8, 2.8].forEach(x => {
    const strawberry = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.65, 12),
      strawberryMaterial
    );
    strawberry.position.set(x, 0.9, 0.1);
    cakeSolidParts.push(strawberry);
    cakeGroup.add(strawberry);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), leafMaterial);
    leaves.scale.set(1.4, 0.35, 1.4);
    leaves.position.set(x, 1.25, 0.1);
    cakeSolidParts.push(leaves);
    cakeGroup.add(leaves);
  });

  const bowMaterial = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.4 });
  [-0.45, 0.45].forEach(x => {
    const bowLoop = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), bowMaterial);
    bowLoop.scale.set(1.15, 0.7, 0.35);
    bowLoop.position.set(x, 0.35, 2.75);
    cakeSolidParts.push(bowLoop);
    cakeGroup.add(bowLoop);
  });
  const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), bowMaterial);
  bowCenter.position.set(0, 0.35, 2.83);
  cakeSolidParts.push(bowCenter);
  cakeGroup.add(bowCenter);

  const cuteColors = [0xffd166, 0xff8fab, 0x72c8ff, 0xffffff];
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const sprinkle = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.28, 0.06),
      new THREE.MeshBasicMaterial({ color: cuteColors[i % cuteColors.length] })
    );
    sprinkle.position.set(Math.cos(angle) * (3.05 + (i % 2) * 0.35), 0.7, Math.sin(angle) * (3.05 + (i % 2) * 0.35));
    sprinkle.rotation.y = angle;
    sprinkle.rotation.z = i * 0.5;
    cakeSolidParts.push(sprinkle);
    cakeGroup.add(sprinkle);
  }

  const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x35402a });
  [-1.8, 1.8].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), faceMaterial);
    eye.position.set(x, -2.15, 6.05);
    cakeSolidParts.push(eye);
    cakeGroup.add(eye);
  });
  const cheekMaterial = new THREE.MeshBasicMaterial({ color: 0xe98d8a });
  [-2.65, 2.65].forEach(x => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), cheekMaterial);
    cheek.scale.set(1.5, 0.55, 0.35);
    cheek.position.set(x, -2.55, 6.04);
    cakeSolidParts.push(cheek);
    cakeGroup.add(cheek);
  });

  const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.55, -2.55, 6.08),
    new THREE.Vector3(0, -2.82, 6.12),
    new THREE.Vector3(0.55, -2.55, 6.08)
  );
  const mouth = new THREE.Mesh(
    new THREE.TubeGeometry(mouthCurve, 12, 0.07, 6, false),
    faceMaterial
  );
  cakeSolidParts.push(mouth);
  cakeGroup.add(mouth);

  const ledMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), ledMaterial.clone());
    led.position.set(Math.cos(angle) * 6.28, -0.1, Math.sin(angle) * 6.28);
    led.userData.phase = i * 0.45;
    ledBulbs.push(led);
    cakeSolidParts.push(led);
    cakeGroup.add(led);
  }
}

function createRealisticCake() {
  const tiers = [
    { radius: 6.9, height: 2.9, y: -3, color: 0x10254a },
    { radius: 4.9, height: 2.35, y: 0, color: 0x163b70 },
    { radius: 2.9, height: 1.85, y: 2.5, color: 0x202b68 }
  ];

  tiers.forEach(tier => {
    const cake = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.radius, tier.radius * 1.03, tier.height, 64),
      new THREE.MeshStandardMaterial({
        color: tier.color,
        roughness: 0.75,
        metalness: 0.02
      })
    );
    cake.position.y = tier.y;
    cakeSolidParts.push(cake);
    cakeGroup.add(cake);

    const cream = new THREE.Mesh(
      new THREE.CylinderGeometry(tier.radius * 0.98, tier.radius * 0.98, 0.16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffe6d5,
        roughness: 0.55,
        emissive: 0x4c1f18,
        emissiveIntensity: 0.08
      })
    );
    cream.position.y = tier.y + tier.height / 2 + 0.08;
    cakeSolidParts.push(cream);
    cakeGroup.add(cream);

    const chocolateEdge = new THREE.Mesh(
      new THREE.TorusGeometry(tier.radius * 0.94, 0.13, 10, 64),
      new THREE.MeshStandardMaterial({ color: 0x2b0f0a, roughness: 0.5 })
    );
    chocolateEdge.rotation.x = Math.PI / 2;
    chocolateEdge.position.y = tier.y - tier.height / 2 + 0.1;
    cakeSolidParts.push(chocolateEdge);
    cakeGroup.add(chocolateEdge);
  });

  const ledColors = [0xff3158, 0xffd166, 0x65d6ff, 0xb8f2e6, 0xff8fab];
  const wireMaterial = new THREE.MeshStandardMaterial({
    color: 0x17151d,
    roughness: 0.9,
    metalness: 0.15
  });
  tiers.forEach((tier, tierIndex) => {
    const ledCount = 18 - tierIndex * 3;
    const ledY = tier.y + tier.height / 2 + 0.28;
    const ledRadius = tier.radius * 0.98;
    const wirePoints = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const sag = 0.12 + Math.pow(Math.sin(angle * 3 + tierIndex), 2) * 0.12;
      wirePoints.push(new THREE.Vector3(
        Math.cos(angle) * ledRadius,
        ledY - sag,
        Math.sin(angle) * ledRadius
      ));
    }
    const wireCurve = new THREE.CatmullRomCurve3(wirePoints, true);
    const wire = new THREE.Mesh(
      new THREE.TubeGeometry(wireCurve, 64, 0.025, 6, true),
      wireMaterial
    );
    cakeSolidParts.push(wire);
    cakeGroup.add(wire);

    for (let i = 0; i < ledCount; i++) {
      const angle = (i / ledCount) * Math.PI * 2 + tierIndex * 0.18;
      const sag = 0.12 + Math.pow(Math.sin(angle * 3 + tierIndex), 2) * 0.12;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 10, 10),
        new THREE.MeshBasicMaterial({
          color: ledColors[(i + tierIndex) % ledColors.length],
          transparent: true,
          opacity: 0.95
        })
      );
      bulb.position.set(
        Math.cos(angle) * ledRadius,
        ledY - sag + 0.03,
        Math.sin(angle) * ledRadius
      );
      bulb.userData.phase = i * 0.55 + tierIndex;
      ledBulbs.push(bulb);
      cakeSolidParts.push(bulb);
      cakeGroup.add(bulb);

      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8),
        wireMaterial
      );
      socket.position.set(bulb.position.x, bulb.position.y - 0.08, bulb.position.z);
      cakeSolidParts.push(socket);
      cakeGroup.add(socket);
    }
  });

  const dripMaterial = new THREE.MeshStandardMaterial({
    color: 0x32110b,
    roughness: 0.35,
    metalness: 0.05
  });
  tiers.forEach((tier, tierIndex) => {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + tierIndex * 0.25;
      const length = 0.35 + (i % 3) * 0.14;
      const drip = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        dripMaterial
      );
      drip.scale.y = length / 0.24;
      const edgeRadius = tier.radius * 0.97;
      drip.position.set(
        Math.cos(angle) * edgeRadius,
        tier.y + tier.height / 2 - length / 2,
        Math.sin(angle) * edgeRadius
      );
      cakeSolidParts.push(drip);
      cakeGroup.add(drip);
    }
  });

  const creamDollop = new THREE.SphereGeometry(0.3, 16, 12);
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 1.8 + (i % 2) * 0.35;
    const dollop = new THREE.Mesh(
      creamDollop,
      new THREE.MeshStandardMaterial({ color: 0xfff4e8, roughness: 0.45 })
    );
    dollop.scale.y = 0.75;
    dollop.position.set(Math.cos(angle) * radius, 3.82, Math.sin(angle) * radius);
    cakeSolidParts.push(dollop);
    cakeGroup.add(dollop);
  }

  const cherryMaterial = new THREE.MeshStandardMaterial({
    color: 0xa91432,
    roughness: 0.25,
    metalness: 0.1,
    emissive: 0x3d0712,
    emissiveIntensity: 0.3
  });
  const cherryGeo = new THREE.SphereGeometry(0.25, 16, 16);
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const radius = i === 0 ? 0 : 1.05;
    const cherry = new THREE.Mesh(cherryGeo, cherryMaterial);
    cherry.scale.set(1, 0.9, 1);
    cherry.position.set(Math.cos(angle) * radius, 4.08, Math.sin(angle) * radius);
    cakeSolidParts.push(cherry);
    cakeGroup.add(cherry);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x315b2d, roughness: 0.8 })
    );
    stem.rotation.z = Math.cos(angle) * 0.35;
    stem.rotation.x = Math.sin(angle) * 0.35;
    stem.position.set(Math.cos(angle) * radius, 4.4, Math.sin(angle) * radius);
    cakeSolidParts.push(stem);
    cakeGroup.add(stem);
  }

  const tierCreamGeo = new THREE.SphereGeometry(0.28, 14, 10);
  const tierCreamMat = new THREE.MeshStandardMaterial({
    color: 0xfff4e8,
    roughness: 0.42,
    emissive: 0x5c211d,
    emissiveIntensity: 0.08
  });
  const berryGeo = new THREE.SphereGeometry(0.19, 14, 12);
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xd9264f,
    roughness: 0.28,
    metalness: 0.08,
    emissive: 0x4d0718,
    emissiveIntensity: 0.25
  });

  tiers.slice(0, 2).forEach((tier, tierIndex) => {
    const count = tierIndex === 0 ? 16 : 12;
    const topY = tier.y + tier.height / 2 + 0.22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + tierIndex * 0.2;
      const radius = tier.radius * 0.83;
      const creamDollop = new THREE.Mesh(tierCreamGeo, tierCreamMat);
      creamDollop.scale.y = 0.7;
      creamDollop.position.set(Math.cos(angle) * radius, topY, Math.sin(angle) * radius);
      cakeSolidParts.push(creamDollop);
      cakeGroup.add(creamDollop);

      if (i % 2 === 0) {
        const berry = new THREE.Mesh(berryGeo, berryMat);
        berry.scale.y = 0.85;
        berry.position.set(
          Math.cos(angle + 0.12) * (radius - 0.22),
          topY + 0.16,
          Math.sin(angle + 0.12) * (radius - 0.22)
        );
        cakeSolidParts.push(berry);
        cakeGroup.add(berry);
      }
    }
  });

  const sprinkleColors = [0xff758c, 0xffcc00, 0x61c0bf, 0xffffff];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 2.25;
    const sprinkle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3, 0.06),
      new THREE.MeshStandardMaterial({
        color: sprinkleColors[i % sprinkleColors.length],
        emissive: sprinkleColors[i % sprinkleColors.length],
        emissiveIntensity: 0.18,
        roughness: 0.35
      })
    );
    sprinkle.position.set(Math.cos(angle) * radius, 3.96, Math.sin(angle) * radius);
    sprinkle.rotation.y = angle;
    sprinkle.rotation.z = Math.random() * Math.PI;
    cakeSolidParts.push(sprinkle);
    cakeGroup.add(sprinkle);
  }

  const galaxyColors = [0xff4f81, 0xffd166, 0x5ce1e6, 0xffffff, 0x9b8cff];
  tiers.forEach((tier, tierIndex) => {
    for (let i = 0; i < 18 - tierIndex * 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = tier.radius * (0.9 + Math.random() * 0.1);
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8),
        new THREE.MeshBasicMaterial({
          color: galaxyColors[(i + tierIndex) % galaxyColors.length]
        })
      );
      star.position.set(
        Math.cos(angle) * radius,
        tier.y + (Math.random() - 0.5) * tier.height,
        Math.sin(angle) * radius
      );
      cakeSolidParts.push(star);
      cakeGroup.add(star);
    }
  });

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(9.6, 48, 32),
    new THREE.MeshPhongMaterial({
      color: 0x78c9ff,
      transparent: true,
      opacity: 0.1,
      shininess: 120,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  dome.position.y = -0.1;
  cakeSolidParts.push(dome);
  cakeGroup.add(dome);

  const domeRim = new THREE.Mesh(
    new THREE.TorusGeometry(9.58, 0.07, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0x9edfff, transparent: true, opacity: 0.65 })
  );
  domeRim.rotation.x = Math.PI / 2;
  domeRim.position.y = -7.8;
  cakeSolidParts.push(domeRim);
  cakeGroup.add(domeRim);

  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? 0.22 : 0.09;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const glassStarColors = [0xffd166, 0xffffff, 0x62d9ff, 0xff6f91];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const height = -3.2 + (i % 8) * 1.05;
    const star = new THREE.Mesh(
      new THREE.ShapeGeometry(starShape),
      new THREE.MeshBasicMaterial({
        color: glassStarColors[i % glassStarColors.length],
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    );
    star.position.set(Math.cos(angle) * 9.72, height, Math.sin(angle) * 9.72);
    star.lookAt(0, height, 0);
    star.userData.phase = i * 0.45;
    star.userData.baseScale = 0.7 + (i % 3) * 0.25;
    glassStars.push(star);
    cakeSolidParts.push(star);
    cakeGroup.add(star);
  }

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const sparkle = new THREE.Mesh(
      new THREE.ShapeGeometry(starShape),
      new THREE.MeshBasicMaterial({
        color: glassStarColors[(i + 1) % glassStarColors.length],
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    );
    sparkle.position.set(Math.cos(angle) * 2.55, 4.02, Math.sin(angle) * 2.55);
    sparkle.lookAt(0, 4.02, 0);
    sparkle.userData.phase = i * 0.7;
    cakeSparkles.push(sparkle);
    cakeSolidParts.push(sparkle);
    cakeGroup.add(sparkle);
  }
}

function createCakeDecorations() {
  const icingRings = [
    { radius: 6.35, y: -1.55, color: 0xffd7e3 },
    { radius: 4.35, y: 1.25, color: 0xfff2b5 },
    { radius: 2.35, y: 3.45, color: 0xffffff }
  ];

  icingRings.forEach(ring => {
    const material = new THREE.MeshStandardMaterial({
      color: ring.color,
      emissive: ring.color,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(ring.radius, 0.12, 10, 64),
      material
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = ring.y;
    mesh.userData.baseIntensity = 0.35;
    cakeDecorations.push(mesh);
    cakeGroup.add(mesh);
  });

  const toppingColors = [0xffd166, 0x7bdff2, 0xff8fab, 0xffffff];
  const toppingGeo = new THREE.SphereGeometry(0.16, 10, 10);

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 0.7 + (i % 3) * 0.55;
    const mesh = new THREE.Mesh(
      toppingGeo,
      new THREE.MeshStandardMaterial({
        color: toppingColors[i % toppingColors.length],
        emissive: toppingColors[i % toppingColors.length],
        emissiveIntensity: 0.55,
        roughness: 0.2
      })
    );
    mesh.position.set(Math.cos(angle) * radius, 3.55, Math.sin(angle) * radius);
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.phase = i * 0.7;
    cakeDecorations.push(mesh);
    cakeGroup.add(mesh);
  }
}

function createNumberCandles(y, z) {
  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e9,
    roughness: 0.7,
    metalness: 0
  });
  candleMotionGroup = new THREE.Group();
  cakeGroup.add(candleMotionGroup);

  candleFlameGroup = new THREE.Group();
  candleMotionGroup.add(candleFlameGroup);

  candleGlowLight = new THREE.PointLight(0xffb52e, 2.5, 8);
  candleGlowLight.position.set(0, y + 2.3, z);
  candleMotionGroup.add(candleGlowLight);

  createNumberCandle('1', -0.9, y, z, candleMat);
  createNumberCandle('9', 0.9, y, z, candleMat);
}

function createNumberCandle(number, x, y, z, candleMat) {
  const candleGroup = new THREE.Group();
  const numberMaterial = candleMat.clone();
  numberMaterial.color.set(number === '1' ? 0xf1f5f7 : 0x3b8edb);
  numberMaterial.emissive.set(number === '1' ? 0x261f29 : 0x092d55);
  numberMaterial.emissiveIntensity = 0.3;
  numberMaterial.roughness = 0.38;
  numberMaterial.metalness = 0.28;
  const neonColor = number === '1' ? 0xff304f : 0x28d8ff;
  const stripeMat = new THREE.MeshStandardMaterial({
    color: number === '1' ? 0xd92d4d : 0xff405e,
    emissive: 0x6b263e,
    emissiveIntensity: 0.25,
    roughness: 0.35
  });
  const roundedPart = (width, height, depth, radius) => {
    const shape = new THREE.Shape();
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    shape.moveTo(-halfWidth + radius, -halfHeight);
    shape.lineTo(halfWidth - radius, -halfHeight);
    shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
    shape.lineTo(halfWidth, halfHeight - radius);
    shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
    shape.lineTo(-halfWidth + radius, halfHeight);
    shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
    shape.lineTo(-halfWidth, -halfHeight + radius);
    shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
    return new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.045,
      bevelThickness: 0.045
    });
  };

  if (number === '1') {
    const stem = new THREE.Mesh(roundedPart(0.42, 1.85, 0.42, 0.12), numberMaterial);
    const base = new THREE.Mesh(roundedPart(0.9, 0.24, 0.42, 0.1), numberMaterial);
    const topShape = new THREE.Shape();
    topShape.moveTo(-0.2, 0.55);
    topShape.lineTo(0.14, 0.55);
    topShape.quadraticCurveTo(0.22, 0.68, 0.42, 0.8);
    topShape.lineTo(0.42, 1.03);
    topShape.quadraticCurveTo(0.12, 1.02, -0.1, 0.9);
    topShape.lineTo(-0.2, 0.75);
    topShape.closePath();
    const top = new THREE.Mesh(
      new THREE.ExtrudeGeometry(topShape, {
        depth: 0.42,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.035,
        bevelThickness: 0.035
      }),
      numberMaterial
    );
    stem.position.set(0.05, 1, 0);
    top.position.set(0, 0.86, -0.21);
    base.position.set(0, 0.12, 0);
    candleGroup.add(stem, top, base);
  } else {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.17, 12, 32), numberMaterial);
    const stem = new THREE.Mesh(roundedPart(0.38, 1.1, 0.42, 0.1), numberMaterial);
    const connector = new THREE.Mesh(roundedPart(0.36, 0.62, 0.42, 0.1), numberMaterial);
    ring.position.set(-0.02, 1.48, 0);
    stem.position.set(0.28, 0.55, 0);
    connector.position.set(0.17, 0.98, 0);
    connector.rotation.z = -0.35;
    candleGroup.add(ring, stem, connector);
  }

  const sprinkleColors = [0x61c0bf, 0xffd166, 0xff8fab, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 + (i % 2) * 0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: sprinkleColors[i % sprinkleColors.length] })
    );
    const angle = (i / 8) * Math.PI * 2;
    dot.position.set(Math.cos(angle) * 0.32, 0.45 + Math.sin(angle) * 0.65, 0.25);
    candleGroup.add(dot);
  }

  candleGroup.children.forEach(part => {
    if (part.geometry && part.geometry.type === 'ExtrudeGeometry') {
      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(part.geometry),
        new THREE.LineBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.75 })
      );
      outline.position.copy(part.position);
      outline.rotation.copy(part.rotation);
      outline.scale.copy(part.scale).multiplyScalar(1.015);
      candleGroup.add(outline);
    }
  });

  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 8, 20), stripeMat);
  stripe.rotation.x = Math.PI / 2;
  stripe.position.set(0, number === '1' ? 1.35 : 0.55, 0.22);
  candleGroup.add(stripe);
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 1.3, 0.045),
    new THREE.MeshBasicMaterial({ color: 0xfff1b8 })
  );
  accent.position.set(number === '1' ? 0.23 : 0.43, 1.05, 0.22);
  accent.rotation.z = number === '1' ? 0 : -0.35;
  candleGroup.add(accent);

  candleGroup.children.forEach(part => {
    part.visible = false;
  });

  const heroDigit = new THREE.Group();
  const makeDigit = shape => {
    const glow = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.62,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelSize: 0.08,
        bevelThickness: 0.06
      }),
      new THREE.MeshBasicMaterial({ color: neonColor, transparent: true, opacity: 0.38 })
    );
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.42,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.035,
        bevelThickness: 0.045
      }),
      numberMaterial
    );
    glow.position.z = -0.1;
    body.position.z = 0;
    heroDigit.add(glow, body);
  };

  if (number === '1') {
    const shape = new THREE.Shape();
    shape.moveTo(-0.38, 0.2);
    shape.lineTo(0.48, 0.2);
    shape.lineTo(0.48, 0.45);
    shape.lineTo(0.16, 0.45);
    shape.lineTo(0.16, 1.62);
    shape.lineTo(0.45, 1.85);
    shape.lineTo(0.2, 2.05);
    shape.lineTo(-0.25, 1.78);
    shape.lineTo(-0.25, 0.45);
    shape.lineTo(-0.38, 0.45);
    shape.closePath();
    makeDigit(shape);
  } else {
    const shape = new THREE.Shape();
    const outer = [
      [0, 2.15], [0.48, 1.98], [0.68, 1.6], [0.62, 1.18],
      [0.38, 0.9], [0.1, 0.72], [-0.32, 0.75], [-0.58, 1.02],
      [-0.68, 1.45], [-0.52, 1.88]
    ];
    shape.moveTo(outer[0][0], outer[0][1]);
    outer.slice(1).forEach(point => shape.lineTo(point[0], point[1]));
    shape.closePath();
    const hole = new THREE.Path();
    const inner = [
      [-0.02, 1.78], [0.25, 1.7], [0.34, 1.48], [0.28, 1.25],
      [0.08, 1.08], [-0.2, 1.12], [-0.34, 1.35], [-0.28, 1.62]
    ];
    hole.moveTo(inner[0][0], inner[0][1]);
    inner.slice(1).forEach(point => hole.lineTo(point[0], point[1]));
    hole.closePath();
    shape.holes.push(hole);
    makeDigit(shape);

    const tail = new THREE.Shape();
    tail.moveTo(0.38, 1.22);
    tail.lineTo(0.62, 1.08);
    tail.lineTo(0.42, 0.62);
    tail.lineTo(0.08, 0.2);
    tail.lineTo(-0.48, 0.2);
    tail.lineTo(-0.28, 0.55);
    tail.lineTo(0.04, 0.82);
    tail.closePath();
    makeDigit(tail);
  }
  heroDigit.position.z = -0.01;
  heroDigit.rotation.y = number === '1' ? Math.PI : 0;
  candleGroup.add(heroDigit);

  const armorMaterial = new THREE.MeshStandardMaterial({
    color: number === '1' ? 0xd72f4d : 0xe7edf2,
    emissive: number === '1' ? 0x3c0815 : 0x172839,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.65
  });
  const panelMaterial = new THREE.MeshBasicMaterial({ color: neonColor });
  const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.08), armorMaterial);
  armorPlate.position.set(number === '1' ? -0.34 : 0.58, 1.45, 0.16);
  armorPlate.rotation.z = number === '1' ? -0.35 : 0.35;
  candleGroup.add(armorPlate);

  const shoulderPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.12), armorMaterial);
  shoulderPlate.position.set(number === '1' ? -0.18 : 0.42, 1.95, 0.12);
  shoulderPlate.rotation.z = number === '1' ? -0.25 : 0.25;
  candleGroup.add(shoulderPlate);

  const panelLine = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.85, 0.035), panelMaterial);
  panelLine.position.set(number === '1' ? 0.02 : 0.5, 0.9, 0.25);
  panelLine.rotation.z = number === '1' ? 0 : -0.45;
  candleGroup.add(panelLine);

  const digitStudColors = [0x61c0bf, 0xffd166, 0xff8fab, 0xffffff];
  for (let i = 0; i < 8; i++) {
    const stud = new THREE.Mesh(
      new THREE.SphereGeometry(0.05 + (i % 3) * 0.018, 8, 8),
      new THREE.MeshBasicMaterial({ color: digitStudColors[i % digitStudColors.length] })
    );
    stud.position.set(
      (Math.random() - 0.5) * 0.78,
      0.35 + Math.random() * 1.45,
      0.22
    );
    heroDigit.add(stud);
  }

  candleGroup.scale.set(1.45, 1.45, 1.45);
  candleGroup.position.set(x, y, z);
  candleMotionGroup.add(candleGroup);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x241b1b, roughness: 1 })
  );
  wick.position.set(x + (number === '9' ? 0.25 : 0.18), y + 2.82, z);
  candleMotionGroup.add(wick);

  const flame = new THREE.Group();
  const flameOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xff9d18, transparent: true, opacity: 0.94 })
  );
  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.68, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffb3 })
  );
  const flameTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.48, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd34d })
  );
  const flameCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  flameOuter.scale.y = 1.55;
  flameOuter.position.y = 0.16;
  flameInner.position.y = 0.12;
  flameTip.position.y = 0.48;
  flameCore.position.y = -0.02;
  flame.add(flameOuter, flameInner, flameTip, flameCore);
  flame.position.set(x + (number === '9' ? 0.25 : 0.18), y + 3.05, z);
  candleFlameGroup.add(flame);
}

function createBackgroundStars() {
  const layers = [
    { count: 900, size: 0.16, color: 0xffffff, opacity: 0.72 },
    { count: 260, size: 0.28, color: 0x7bdff2, opacity: 0.5 },
    { count: 90, size: 0.42, color: 0xffd166, opacity: 0.42 }
  ];

  layers.forEach(layer => {
    const starGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(layer.count * 3);
    for (let i = 0; i < posArray.length; i++) {
      posArray[i] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({
      size: layer.size,
      color: layer.color,
      transparent: true,
      opacity: layer.opacity,
      depthWrite: false
    });
    const points = new THREE.Points(starGeo, starMat);
    points.userData.spin = (Math.random() - 0.5) * 0.00015;
    points.userData.baseOpacity = layer.opacity;
    backgroundLayers.push(points);
    scene.add(points);
  });

  const meteorMaterial = new THREE.MeshBasicMaterial({ color: 0xb8f2e6, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 5; i++) {
    const meteor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), meteorMaterial.clone());
    meteor.rotation.z = -0.7;
    meteor.userData.progress = Math.random();
    meteor.userData.speed = 0.0015 + Math.random() * 0.0015;
    meteor.userData.offset = Math.random() * 1000;
    shootingStars.push(meteor);
    scene.add(meteor);
  }
}

function createBirthdayBackdrop() {
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? 0.28 : 0.11;
    const point = new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
    if (i === 0) starShape.moveTo(point.x, point.y);
    else starShape.lineTo(point.x, point.y);
  }
  starShape.closePath();

  for (let i = 0; i < 14; i++) {
    const star = new THREE.Mesh(
      new THREE.ShapeGeometry(starShape),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xf4d77b : 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    star.position.set((Math.random() - 0.5) * 28, -3 + Math.random() * 12, -6);
    star.userData.baseY = star.position.y;
    star.userData.phase = i * 0.7;
    backgroundDecorations.push(star);
    scene.add(star);
  }
}

function createOrbitingParticles() {
  const particleGeo = new THREE.SphereGeometry(0.06, 7, 7);
  const colors = [0xffd166, 0xff8fab, 0x7bdff2, 0xffffff];

  for (let i = 0; i < 28; i++) {
    const mesh = new THREE.Mesh(
      particleGeo,
      new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.9
      })
    );

    orbitParticles.push({
      mesh: mesh,
      angle: (i / 28) * Math.PI * 2,
      radius: 8 + Math.random() * 2.5,
      height: -2 + Math.random() * 7,
      speed: 0.004 + Math.random() * 0.006,
      phase: Math.random() * Math.PI * 2
    });

    scene.add(mesh);
  }
}

function createMemoryCards() {
  const textureLoader = new THREE.TextureLoader();

  photos.forEach((data, idx) => {
    textureLoader.load(data.url, (texture) => {
      const planeGeo = new THREE.PlaneGeometry(3.84, 3.84);
      const planeMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

      const mesh = new THREE.Mesh(planeGeo, planeMat);

      const border = new THREE.Mesh(
        new THREE.PlaneGeometry(4.02, 4.02),
        new THREE.MeshBasicMaterial({ color: 0xe7b951, transparent: true, opacity: 0.68, side: THREE.DoubleSide })
      );
      border.position.z = -0.01;
      mesh.add(border);

      const arcPositions = [
        new THREE.Vector3(-10.5, 4.1, -5.5),
        new THREE.Vector3(-4.9, 7.0, -6.7),
        new THREE.Vector3(4.9, 7.0, -6.7),
        new THREE.Vector3(10.5, 4.1, -5.5)
      ];
      const tilts = [-0.16, -0.06, 0.06, 0.16];
      const anchor = arcPositions[idx];

      mesh.position.copy(anchor);
      mesh.lookAt(camera.position);
      mesh.rotateZ(tilts[idx]);

      mesh.userData = { photoData: data, anchor: anchor.clone(), tilt: tilts[idx], phase: idx * 1.35 };

      mesh.visible = birthdayRevealed;
      memoryCards.push(mesh);
      scene.add(mesh);
    });
  });
}

function toggleState() {
  isExploded = !isExploded;
  const btn = document.getElementById('action-btn');

  if (isExploded) {
    if (btn) btn.innerText = "🎂 THU BÁNH SINH NHẬT";
    launchFireworks();
  } else {
    if (btn) btn.innerText = "🎂 MỞ QUÀ & BÓNG BAY";
  }
}

function startMusic() {
  const music = document.getElementById('bg-music');
  music.play().then(() => {
    audioStarted = true;
    document.getElementById('music-btn').innerText = '🔇';
  }).catch(() => {
    document.getElementById('camera-status').innerText = 'Hãy bấm BẬT NHẠC để phát';
  });
}

function toggleMusic() {
  const music = document.getElementById('bg-music');
  if (music.paused) {
    startMusic();
  } else {
    music.pause();
    audioStarted = false;
    document.getElementById('music-btn').innerText = '🎵';
  }
}

async function toggleCamera() {
  if (cameraStream) {
    stopCamera();
    return;
  }

  const video = document.getElementById('camera-feed');
  const status = document.getElementById('camera-status');
  const button = document.getElementById('camera-btn');

  if (!window.Hands || !window.FaceMesh || !window.Camera) {
    status.innerText = 'Không tải được nhận diện camera';
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });
    video.srcObject = cameraStream;

    handsTracker = new Hands({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    handsTracker.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.65
    });
    handsTracker.onResults(handleHandResults);

    faceTracker = new FaceMesh({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceTracker.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65
    });
    faceTracker.onResults(handleFaceResults);

    cameraController = new Camera(video, {
      onFrame: async () => {
        await handsTracker.send({ image: video });
        await faceTracker.send({ image: video });
      },
      width: 640,
      height: 480
    });
    cameraController.start();
    status.innerText = 'Camera đang hoạt động';
    button.innerText = '⏹';
  } catch (error) {
    cameraStream = null;
    status.innerText = 'Hãy cho phép quyền camera';
  }
}

function stopCamera() {
  if (cameraController) cameraController.stop();
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraController = null;
  cameraStream = null;
  handRotationTargetY = 0;
  handRotationTargetX = 0;
  lastHandGesture = 'none';
  lastPhotoFingerCount = 0;
  document.getElementById('camera-feed').srcObject = null;
  document.getElementById('camera-status').innerText = 'Camera đang tắt';
  document.getElementById('camera-btn').innerText = '📷';
}

function handleHandResults(results) {
  if (!birthdayRevealed) return;
  const hands = results.multiHandLandmarks || [];
  if (hands.length >= 2 && hands.every(isOpenHand) && Date.now() - lastTwoHandTime > 3500) {
    lastTwoHandTime = Date.now();
    celebrationPulse = 1;
    document.getElementById('camera-status').innerText = 'Hai tay mở - hiệu ứng đặc biệt';
    if (!isExploded) toggleState();
    else launchFireworks();
    confetti({
      particleCount: 220,
      spread: 150,
      startVelocity: 48,
      scalar: 1.15,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#ff304f', '#28d8ff', '#ffd166', '#ffffff']
    });
  }

  const hand = hands[0];
  if (!hand) {
    handRotationTargetY = 0;
    handRotationTargetX = 0;
    return;
  }

  handRotationTargetY = (hand[0].x - 0.5) * 1.8;
  handRotationTargetX = (0.5 - hand[0].y) * 0.7;
  document.getElementById('camera-status').innerText = 'Đã nhận diện bàn tay';

  const fingertips = [8, 12, 16, 20];
  const pipJoints = [6, 10, 14, 18];
  const openFingers = fingertips.filter((tip, index) => hand[tip].y < hand[pipJoints[index]].y).length;
  const thumbOpen = hand[4].distanceTo ? hand[4].distanceTo(hand[0]) > hand[3].distanceTo(hand[0]) * 1.12 : Math.abs(hand[4].x - hand[0].x) > Math.abs(hand[3].x - hand[0].x);
  const totalFingers = openFingers + (thumbOpen ? 1 : 0);
  const gesture = totalFingers >= 5 ? 'open' : totalFingers === 0 ? 'closed' : 'photo';

  if (totalFingers < 5 && openFingers >= 1 && openFingers <= 4 && Date.now() - lastPhotoTime > 900 && lastPhotoFingerCount !== openFingers) {
    lastPhotoTime = Date.now();
    lastPhotoFingerCount = openFingers;
    openModal(photos[openFingers - 1]);
    document.getElementById('camera-status').innerText = `Đang xem ảnh ${openFingers}`;
  }

  if (gesture === 'open' && lastHandGesture !== 'open' && !isExploded && Date.now() - lastWaveTime > 1200) {
    lastWaveTime = Date.now();
    if (document.getElementById('image-modal').classList.contains('active')) closeModal();
    toggleState();
  }
  if (gesture === 'closed' && lastHandGesture !== 'closed' && isExploded && Date.now() - lastWaveTime > 1200) {
    lastWaveTime = Date.now();
    toggleState();
  }
  if (gesture === 'closed' && document.getElementById('image-modal').classList.contains('active')) {
    closeModal();
    document.getElementById('camera-status').innerText = 'Đã đóng ảnh';
  }
  if (gesture === 'closed' && lastPhotoFingerCount !== 0) lastPhotoFingerCount = 0;
  lastHandGesture = gesture;
}

function isOpenHand(hand) {
  const fingertips = [8, 12, 16, 20];
  const pipJoints = [6, 10, 14, 18];
  const openFingers = fingertips.filter((tip, index) => hand[tip].y < hand[pipJoints[index]].y).length;
  const thumbOpen = Math.abs(hand[4].x - hand[0].x) > Math.abs(hand[3].x - hand[0].x) * 1.12;
  return openFingers >= 3 && thumbOpen;
}

function handleFaceResults(results) {
  if (!birthdayRevealed) return;
  const face = results.multiFaceLandmarks && results.multiFaceLandmarks[0];
  if (!face || !candlesLit) return;

  const mouthHeight = Math.abs(face[13].y - face[14].y);
  const mouthWidth = Math.abs(face[61].x - face[291].x);
  if (mouthWidth > 0 && mouthHeight / mouthWidth > 0.34 && Date.now() - lastBlowTime > 2500) {
    lastBlowTime = Date.now();
    extinguishCandles();
  }
}

function extinguishCandles() {
  candlesLit = false;
  candleFlameGroup.visible = false;
  candleGlowLight.intensity = 0;
  document.getElementById('camera-status').innerText = 'Đã thổi tắt nến';
  setTimeout(() => {
    candlesLit = true;
    candleFlameGroup.visible = true;
    document.getElementById('camera-status').innerText = cameraStream ? 'Camera đang hoạt động' : 'Camera đang tắt';
  }, 3000);
}

function launchFireworks() {
  const bursts = [
    { x: 0.16, y: 0.38, delay: 0 },
    { x: 0.84, y: 0.32, delay: 180 },
    { x: 0.5, y: 0.2, delay: 360 },
    { x: 0.28, y: 0.25, delay: 540 },
    { x: 0.72, y: 0.27, delay: 700 }
  ];

  bursts.forEach(burst => {
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 38,
        gravity: 0.85,
        ticks: 120,
        scalar: 0.9,
        origin: { x: burst.x, y: burst.y },
        colors: ['#ff758c', '#ffcc00', '#7bdff2', '#ffffff', '#b8f2e6']
      });
    }, burst.delay);
  });

  confetti({
    particleCount: 140,
    spread: 110,
    startVelocity: 28,
    gravity: 1.05,
    ticks: 150,
    scalar: 1.05,
    origin: { x: 0.5, y: 0.72 },
    colors: ['#ff758c', '#ffcc00', '#7bdff2', '#ffffff']
  });
}

function setupRaycaster() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('#header-ui') || e.target.closest('#image-modal')) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(memoryCards);

    if (intersects.length > 0) {
      openModal(intersects[0].object.userData.photoData);
    }
  });
}

function openModal(data) {
  document.getElementById('modal-img').src = data.url;
  document.getElementById('modal-caption').innerText = data.caption;
  document.getElementById('image-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('image-modal').classList.remove('active');
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Xoay không gian khi kéo chuột
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

window.addEventListener('mousedown', () => isDragging = true);
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaMove = { x: e.clientX - previousMousePosition.x, y: e.clientY - previousMousePosition.y };
    scene.rotation.y += deltaMove.x * 0.005;
    scene.rotation.x += deltaMove.y * 0.003;
  }
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

function animate() {
  requestAnimationFrame(animate);

  if (!isExploded) {
    baseCakeRotationY += 0.008;
  }
  if (candleMotionGroup) {
    candleMotionGroup.rotation.y += isExploded ? 0.012 : 0.004;
  }
  handRotationY += (handRotationTargetY - handRotationY) * 0.08;
  handRotationX += (handRotationTargetX - handRotationX) * 0.08;
  cakeGroup.rotation.y = baseCakeRotationY + handRotationY;
  cakeGroup.rotation.x = handRotationX;
  celebrationPulse *= 0.94;
  if (birthdayRevealed) {
    cakeRevealProgress = Math.min(1, cakeRevealProgress + 0.022);
    const easedReveal = 1 - Math.pow(1 - cakeRevealProgress, 3);
    cakeGroup.scale.setScalar((0.3 + easedReveal * 0.7) * (1 + celebrationPulse * 0.08));
  }

  cakeSolidParts.forEach(part => {
    part.visible = !isExploded;
  });

  ledBulbs.forEach(bulb => {
    bulb.material.opacity = 0.5 + (Math.sin(Date.now() * 0.008 + bulb.userData.phase) + 1) * 0.25;
    bulb.scale.setScalar(0.9 + Math.max(0, bulb.material.opacity - 0.5) * 0.35);
  });

  glassStars.forEach(star => {
    const shimmer = (Math.sin(Date.now() * 0.004 + star.userData.phase) + 1) / 2;
    star.material.opacity = 0.35 + shimmer * 0.65;
    star.scale.setScalar(star.userData.baseScale * (0.8 + shimmer * 0.35));
  });

  cakeSparkles.forEach(sparkle => {
    const shimmer = (Math.sin(Date.now() * 0.006 + sparkle.userData.phase) + 1) / 2;
    sparkle.material.opacity = 0.25 + shimmer * 0.75;
    sparkle.scale.setScalar(0.65 + shimmer * 0.45);
  });

  cakeParticles.forEach(p => {
    if (isExploded) {
      p.burstAngle += p.burstSpeed;
      p.burstTarget.x = p.target.x + Math.cos(p.burstAngle) * p.burstRadius;
      p.burstTarget.z = p.target.z + Math.sin(p.burstAngle) * p.burstRadius;
      p.burstTarget.y = p.target.y + Math.sin(Date.now() * 0.002 + p.burstPhase) * 0.7;
      p.mesh.position.lerp(p.burstTarget, p.speed);
    } else {
      p.mesh.position.lerp(p.origin, p.speed);
    }
  });

  if (candleFlameGroup) {
    const flameTime = Date.now() * 0.01;
    candleFlameGroup.children.forEach((flame, index) => {
      const flamePhase = flameTime * (1 + index * 0.12) + index;
      flame.scale.x = 1 + Math.sin(flamePhase) * 0.1;
      flame.scale.y = 1 + Math.sin(flamePhase * 1.25) * 0.12;
      flame.scale.z = 1 + Math.cos(flamePhase * 0.9) * 0.1;
      flame.rotation.z = Math.sin(flamePhase * 0.7) * 0.04;
    });
  }

  if (candleGlowLight) {
    candleGlowLight.intensity = 2.2 + Math.sin(Date.now() * 0.012) * 0.45;
  }

  cakeDecorations.forEach((decoration, index) => {
    const phase = decoration.userData.phase || index * 0.4;
    const pulse = Math.sin(Date.now() * 0.003 + phase) * 0.12;
    if (decoration.userData.baseY) {
      decoration.position.y = decoration.userData.baseY + pulse * 0.25;
    }
    if (decoration.material.emissiveIntensity !== undefined) {
      decoration.material.emissiveIntensity = (decoration.userData.baseIntensity || 0.55) + pulse;
    }
  });

  memoryCards.forEach(card => {
    const floatTime = Date.now() * 0.001 + card.userData.phase;
    card.position.copy(card.userData.anchor);
    card.position.y += Math.sin(floatTime * 1.35) * 0.38;
    card.position.x += Math.cos(floatTime) * 0.16;
    card.lookAt(camera.position);
    card.rotateZ(card.userData.tilt + Math.sin(floatTime) * 0.018);
    const easedReveal = 1 - Math.pow(1 - cakeRevealProgress, 3);
    card.scale.setScalar(0.3 + easedReveal * 0.7);
  });

  orbitParticles.forEach(particle => {
    particle.angle += particle.speed;
    particle.mesh.position.x = Math.cos(particle.angle) * particle.radius;
    particle.mesh.position.z = Math.sin(particle.angle) * particle.radius;
    particle.mesh.position.y = particle.height + Math.sin(Date.now() * 0.0015 + particle.phase) * 0.45;
  });

  backgroundLayers.forEach((layer, index) => {
    layer.rotation.y += layer.userData.spin;
    layer.rotation.x += layer.userData.spin * (index + 1) * 0.35;
    layer.material.opacity = layer.userData.baseOpacity + Math.sin(Date.now() * 0.0008 + index) * 0.06;
  });

  shootingStars.forEach(meteor => {
    meteor.userData.progress += meteor.userData.speed;
    if (meteor.userData.progress > 1) {
      meteor.userData.progress = 0;
      meteor.userData.offset = Math.random() * 1000;
    }
    const progress = meteor.userData.progress;
    meteor.position.set(
      -48 + progress * 96,
      24 - progress * 48 + Math.sin(meteor.userData.offset) * 8,
      -18
    );
    meteor.material.opacity = Math.sin(progress * Math.PI) * 0.9;
  });

  backgroundDecorations.forEach((decoration, index) => {
    const phase = decoration.userData.phase || index;
    decoration.position.y = decoration.userData.baseY + Math.sin(Date.now() * 0.001 + phase) * 0.08;
    if (decoration.material && decoration.material.opacity !== undefined) {
      decoration.material.opacity = 0.5 + (Math.sin(Date.now() * 0.003 + phase) + 1) * 0.2;
    }
  });

  renderer.render(scene, camera);
}

window.onload = init;
