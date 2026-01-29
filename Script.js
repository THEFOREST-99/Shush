const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const micBtn = document.getElementById("mic");
const video = document.getElementById("video");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ================= JARVIS STATE ================= */

let hologram = {
  active: false,
  x: canvas.width / 2,
  y: canvas.height / 2,
  scale: 1
};

/* ================= VOICE ================= */

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.pitch = 0.8;
  msg.rate = 0.95;
  speechSynthesis.speak(msg);
}

micBtn.onclick = () => {
  const rec = new SpeechRecognition();
  rec.lang = "en-US";

  rec.onstart = () => statusText.textContent = "Listening...";
  rec.onresult = e => handleCommand(e.results[0][0].transcript.toLowerCase());
  rec.onerror = e => statusText.textContent = e.error;

  rec.start();
};

function handleCommand(cmd) {
  statusText.textContent = "Command: " + cmd;

  if (cmd.includes("activate") || cmd.includes("hologram")) {
    hologram.active = true;
    speak("Hologram online");
  }

  if (cmd.includes("scan")) {
    speak("Scanning environment");
  }

  if (cmd.includes("clear")) {
    hologram.active = false;
    speak("Hologram offline");
  }
}

/* ================= HAND TRACKING ================= */

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(r => {
  if (!r.multiHandLandmarks) return;

  const lm = r.multiHandLandmarks[0];
  const index = lm[8];
  const thumb = lm[4];

  hologram.x = index.x * canvas.width;
  hologram.y = index.y * canvas.height;

  const d = Math.hypot(index.x - thumb.x, index.y - thumb.y);
  hologram.scale = Math.max(0.6, d * 6);
});

const camera = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640,
  height: 480
});
camera.start();

/* ================= HOLOGRAM DRAW ================= */

function drawHologram() {
  ctx.strokeStyle = "cyan";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "cyan";

  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 40 + i * 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.lineTo(60, 0);
  ctx.moveTo(0, -60);
  ctx.lineTo(0, 60);
  ctx.stroke();
}

/* ================= LOOP ================= */

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (hologram.active) {
    ctx.save();
    ctx.translate(hologram.x, hologram.y);
    ctx.scale(hologram.scale, hologram.scale);
    drawHologram();
    ctx.restore();
  }

  requestAnimationFrame(animate);
}
animate();
