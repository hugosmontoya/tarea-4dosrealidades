// ============================================================================
// Dos Realidades — Maquiavelo: La Máscara de la Felicidad
//
// Cita: «Todos ven lo que aparentas ser, pero pocos ven lo que realmente eres.»
//       — Nicolás Maquiavelo, El Príncipe (1532)
//
// SISTEMA A: MediaPipe Face Landmarker (La Apariencia Social)
//   Reconoce la fisonomía facial y mide la sonrisa / felicidad proyectada.
//   Dibuja una máscara luminosa dorada que celebra el gesto positivo.
//
// SISTEMA B: OpenCV.js (La Verdad Despojada / Blanco y Negro)
//   Aplica binarización adaptativa pura sin escalas de grises a pantalla completa.
//   Desintegra la identidad y la emoción en bloques crudos de luz y sombra.
// ============================================================================

// ---------------------------------------------------------------------------
// Configuración y URLs de CDN
// ---------------------------------------------------------------------------

const VISION_BUNDLE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const OPENCV_URL = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@5.0.0-release.1/dist/opencv.js";

// Contornos clave de la malla facial (MediaPipe Face Mesh)
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10
];

const LIPS_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0,
  37, 39, 40, 185, 61
];

const LIPS_INNER = [
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13,
  82, 81, 80, 191, 78
];

const EYE_LEFT = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const EYE_RIGHT = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263];
const EYEBROW_LEFT = [70, 63, 105, 66, 107];
const EYEBROW_RIGHT = [300, 293, 334, 296, 336];
const NOSE = [168, 6, 197, 195, 5, 4, 1, 2];

// ---------------------------------------------------------------------------
// Referencias del DOM
// ---------------------------------------------------------------------------

const video = document.getElementById("video");
const canvasA = document.getElementById("canvasA");
const ctxA = canvasA.getContext("2d");
const canvasB = document.getElementById("canvasB");
const ctxB = canvasB.getContext("2d");
const hiddenCv = document.getElementById("hiddenCv");
const ctxHidden = hiddenCv.getContext("2d", { willReadFrequently: true });

const startBtn = document.getElementById("startBtn");
const cameraBtnWrapper = document.getElementById("cameraBtnWrapper");
const statusMsg = document.getElementById("statusMsg");
const idleHintA = document.getElementById("idleHintA");
const idleHintB = document.getElementById("idleHintB");

const smilePercent = document.getElementById("smilePercent");
const meterFill = document.getElementById("meterFill");
const statA = document.getElementById("statA");
const statB = document.getElementById("statB");

// ---------------------------------------------------------------------------
// Estado de la aplicación
// ---------------------------------------------------------------------------

let faceLandmarker = null;
let cv = null;
let running = false;
let lastVideoTime = -1;
let smoothSmile = 0;
let cvCanvas = null;

// ---------------------------------------------------------------------------
// Inicialización y arranque
// ---------------------------------------------------------------------------

startBtn.addEventListener("click", start);

async function start() {
  startBtn.disabled = true;
  setStatus("Accediendo a la cámara web…");

  try {
    await initCamera();
  } catch (err) {
    console.error(err);
    setStatus("Error al acceder a la cámara: " + (err.message || "revisa los permisos del navegador."));
    startBtn.disabled = false;
    return;
  }

  running = true;
  cameraBtnWrapper.classList.add("is-live");
  startBtn.querySelector(".btn-txt").textContent = "Cámara Activa";
  requestAnimationFrame(renderLoop);

  // Carga en paralelo de ambos motores de visión
  setStatus("Cámara conectada. Cargando MediaPipe y OpenCV.js en paralelo…");

  const pFace = initFaceLandmarker();
  const pCv = initOpenCV();

  try {
    await Promise.all([pFace, pCv]);
    setStatus("Listo. Ambos sistemas de visión están operando en tiempo real.");
  } catch (err) {
    console.warn("Aviso durante la carga de motores:", err);
    setStatus("Sistemas activos. Observa la tensión entre apariencia y realidad.");
  }
}

function setStatus(txt) {
  statusMsg.textContent = txt;
}

// ---------------------------------------------------------------------------
// Cámara Web
// ---------------------------------------------------------------------------

async function initCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
    audio: false,
  });

  video.srcObject = stream;
  await video.play();

  await new Promise((resolve) => {
    if (video.readyState >= 2) return resolve();
    video.onloadedmetadata = () => resolve();
  });

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvasA.width = w;
  canvasA.height = h;
  canvasB.width = w;
  canvasB.height = h;

  // Resolución óptima de procesamiento para OpenCV (rápido y nítido)
  hiddenCv.width = 320;
  hiddenCv.height = 240;

  cvCanvas = document.createElement("canvas");
  cvCanvas.width = hiddenCv.width;
  cvCanvas.height = hiddenCv.height;
}

// ---------------------------------------------------------------------------
// Inicialización MediaPipe (Sistema A)
// ---------------------------------------------------------------------------

async function initFaceLandmarker() {
  try {
    const { FaceLandmarker, FilesetResolver } = await import(VISION_BUNDLE_URL);
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);

    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
    } catch (gpuErr) {
      console.warn("GPU no disponible para MediaPipe, usando CPU…", gpuErr);
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
    }
  } catch (err) {
    console.error("Error al cargar MediaPipe FaceLandmarker:", err);
    idleHintA.textContent = "modelo facial no disponible";
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Inicialización OpenCV.js (Sistema B)
// ---------------------------------------------------------------------------

function initOpenCV() {
  return new Promise((resolve, reject) => {
    if (window.cv && window.cv.Mat) {
      cv = window.cv;
      return resolve(cv);
    }

    idleHintB.style.display = "flex";
    const script = document.createElement("script");
    script.src = OPENCV_URL;
    script.async = true;

    script.onload = () => {
      const c = window.cv;
      if (!c) return reject(new Error("OpenCV no definido"));

      if (typeof c.then === "function") {
        c.then((ready) => {
          cv = ready;
          idleHintB.style.display = "none";
          resolve(ready);
        });
      } else if (c.Mat) {
        cv = c;
        idleHintB.style.display = "none";
        resolve(c);
      } else {
        c["onRuntimeInitialized"] = () => {
          cv = c;
          idleHintB.style.display = "none";
          resolve(c);
        };
      }
    };

    script.onerror = () => {
      idleHintB.textContent = "error al cargar OpenCV";
      reject(new Error("Fallo al descargar OpenCV.js"));
    };

    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Bucle principal de renderizado (60 FPS)
// ---------------------------------------------------------------------------

function renderLoop(timestampMs) {
  if (!running) return;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;

    // Ejecutar Sistema A (MediaPipe)
    const result = faceLandmarker ? faceLandmarker.detectForVideo(video, timestampMs) : null;
    drawSystemA(result);

    // Ejecutar Sistema B (OpenCV)
    drawSystemB();
  }

  requestAnimationFrame(renderLoop);
}

// ---------------------------------------------------------------------------
// SISTEMA A — La Máscara de la Felicidad (MediaPipe)
// ---------------------------------------------------------------------------

function drawSystemA(result) {
  const w = canvasA.width;
  const h = canvasA.height;
  const t = performance.now() / 1000;

  ctxA.fillStyle = "#08070d";
  ctxA.fillRect(0, 0, w, h);

  const landmarks = result && result.faceLandmarks && result.faceLandmarks[0];
  const blendshapes = result && result.faceBlendshapes && result.faceBlendshapes[0] && result.faceBlendshapes[0].categories;

  if (!landmarks) {
    idleHintA.style.opacity = "1";
    statA.textContent = "esperando presencia…";
    smilePercent.textContent = "0%";
    meterFill.style.width = "0%";
    drawIdleRadar(ctxA, w, h, t);
    return;
  }

  idleHintA.style.opacity = "0";

  // 1. Extraer puntuación de sonrisa mediante Blendshapes
  let currentSmile = 0;
  if (blendshapes) {
    const smileL = (blendshapes.find((c) => c.categoryName === "mouthSmileLeft") || {}).score || 0;
    const smileR = (blendshapes.find((c) => c.categoryName === "mouthSmileRight") || {}).score || 0;
    currentSmile = Math.max(smileL, smileR) * 0.7 + ((smileL + smileR) / 2) * 0.3;
  } else {
    // Respaldo geométrico: relación ancho/alto de comisuras
    const cL = landmarks[61], cR = landmarks[291], mTop = landmarks[13], mBot = landmarks[14];
    if (cL && cR && mTop && mBot) {
      const width = Math.hypot(cL.x - cR.x, cL.y - cR.y);
      const height = Math.hypot(mTop.x - mBot.x, mTop.y - mBot.y);
      currentSmile = Math.min(1, Math.max(0, (width / 0.18 - 1) * 0.8));
    }
  }

  // Suavizado exponencial para la aguja de la emoción
  smoothSmile = smoothSmile * 0.8 + currentSmile * 0.2;
  const percentInt = Math.round(smoothSmile * 100);

  smilePercent.textContent = `${percentInt}%`;
  meterFill.style.width = `${percentInt}%`;

  if (percentInt > 50) {
    statA.textContent = `Sonrisa activa (${percentInt}% dicha proyectada)`;
  } else if (percentInt > 20) {
    statA.textContent = `Gesto afable / neutral (${percentInt}%)`;
  } else {
    statA.textContent = `Semblante serio / enigmático (${percentInt}%)`;
  }

  // 2. Halo radiante: se intensifica y expande al sonreír
  const noseTip = landmarks[1] || landmarks[4];
  if (noseTip) {
    const cx = noseTip.x * w;
    const cy = noseTip.y * h;
    const glowRadius = Math.max(w, h) * (0.28 + smoothSmile * 0.18);
    const grad = ctxA.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    grad.addColorStop(0, `rgba(255, 209, 102, ${0.12 + smoothSmile * 0.22})`);
    grad.addColorStop(0.5, `rgba(255, 138, 92, ${0.05 + smoothSmile * 0.10})`);
    grad.addColorStop(1, "rgba(255, 209, 102, 0)");

    ctxA.fillStyle = grad;
    ctxA.fillRect(0, 0, w, h);
  }

  // 3. Renderizado de la Máscara Geométrica Dorada
  const goldTone = `hsl(${45 + smoothSmile * 10}, 100%, ${65 + smoothSmile * 15}%)`;

  // Contorno facial
  drawPath(ctxA, landmarks, FACE_OVAL, w, h, "rgba(244, 240, 250, 0.25)", 1.2, false);

  // Cejas y ojos
  drawPath(ctxA, landmarks, EYEBROW_LEFT, w, h, goldTone, 2, false);
  drawPath(ctxA, landmarks, EYEBROW_RIGHT, w, h, goldTone, 2, false);
  drawPath(ctxA, landmarks, EYE_LEFT, w, h, "#5ce1ff", 1.5, true);
  drawPath(ctxA, landmarks, EYE_RIGHT, w, h, "#5ce1ff", 1.5, true);

  // Nariz
  drawPath(ctxA, landmarks, NOSE, w, h, "rgba(255, 209, 102, 0.4)", 1.5, false);

  // Labios: se vuelven intensamente luminosos con la sonrisa
  ctxA.save();
  ctxA.shadowColor = goldTone;
  ctxA.shadowBlur = 10 + smoothSmile * 25;
  drawPath(ctxA, landmarks, LIPS_OUTER, w, h, goldTone, 2 + smoothSmile * 2.5, true);
  drawPath(ctxA, landmarks, LIPS_INNER, w, h, "rgba(255, 209, 102, 0.7)", 1.5, true);
  ctxA.restore();

  // Nodos luminosos en comisuras de la boca
  [61, 291].forEach((idx) => {
    const pt = landmarks[idx];
    if (pt) {
      ctxA.beginPath();
      ctxA.arc(pt.x * w, pt.y * h, 3 + smoothSmile * 4, 0, Math.PI * 2);
      ctxA.fillStyle = "#fff";
      ctxA.shadowColor = goldTone;
      ctxA.shadowBlur = 15;
      ctxA.fill();
    }
  });
}

function drawPath(ctx, landmarks, indices, w, h, color, lineWidth, close = false) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let first = true;
  indices.forEach((idx) => {
    const p = landmarks[idx];
    if (!p) return;
    const x = p.x * w;
    const y = p.y * h;
    if (first) {
      ctx.moveTo(x, y);
      first = false;
    } else {
      ctx.lineTo(x, y);
    }
  });

  if (close) ctx.closePath();
  ctx.stroke();
}

function drawIdleRadar(ctx, w, h, t) {
  const cx = w / 2;
  const cy = h / 2;
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.8 + i * 0.6) % 2;
    const r = 30 + phase * 70;
    const alpha = Math.max(0, 0.35 * (1 - phase / 2));
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 209, 102, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// SISTEMA B — La Verdad Despojada / Blanco y Negro Puro (OpenCV.js)
// ---------------------------------------------------------------------------

function drawSystemB() {
  const w = canvasB.width;
  const h = canvasB.height;

  // Si OpenCV aún no está disponible, mostrar pantalla oscura de calibración
  if (!cv || !cv.Mat) {
    ctxB.fillStyle = "#050409";
    ctxB.fillRect(0, 0, w, h);
    statB.textContent = "iniciando motor de binarización…";
    return;
  }

  // 1. Muestreo del frame a tamaño eficiente
  const pw = hiddenCv.width;
  const ph = hiddenCv.height;
  ctxHidden.drawImage(video, 0, 0, pw, ph);

  // 2. Procesamiento matricial con OpenCV
  const src = cv.imread(hiddenCv);
  const gray = new cv.Mat();
  const bin = new cv.Mat();

  // Conversión a escala de grises
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Binarización adaptativa gaussiana:
  // Cada píxel se convierte estrictamente en 0 (negro absoluto) o 255 (blanco puro)
  // según la media local en una ventana de 25x25 píxeles.
  cv.adaptiveThreshold(
    gray,
    bin,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    25,
    5
  );

  // 3. Volcado al canvas intermedio y escalado a pantalla completa
  cv.imshow(cvCanvas, bin);

  ctxB.fillStyle = "#000";
  ctxB.fillRect(0, 0, w, h);

  // Renderizado nítido sin difuminados
  ctxB.imageSmoothingEnabled = false;
  ctxB.drawImage(cvCanvas, 0, 0, w, h);

  // 4. Estadísticas del balance luz/sombra
  let whiteCount = 0;
  const data = bin.data;
  const total = data.length;
  for (let i = 0; i < total; i += 4) {
    if (data[i] > 128) whiteCount++;
  }
  const whiteRatio = Math.round((whiteCount / (total / 4)) * 100);
  const blackRatio = 100 - whiteRatio;

  statB.textContent = `Sin rostro · ${whiteRatio}% Luz / ${blackRatio}% Sombra`;

  // Liberación estricta de memoria en WebAssembly
  src.delete();
  gray.delete();
  bin.delete();
}
