(() => {
  "use strict";

  const PREVIEW = 768;
  const EXPORT_BASE = 2048;

  const $ = s => document.querySelector(s);
  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const fileInput = $("#fileInput");
  const cameraInput = $("#cameraInput");
  const emptyState = $("#emptyState");
  const toast = $("#toast");

  const state = {
    photo: null,
    photoUrl: null,
    frame: null,
    frameMeta: null,
    x: EXPORT_BASE / 2,
    y: EXPORT_BASE * .47,
    scale: 1,
    baseScale: 1,
    rotation: 0,
    flipX: 1,
    safe: true
  };

  let renderQueued = false;
  let frames = [];
  const pointers = new Map();
  let gesture = null;

  function say(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(say.t);
    say.t = setTimeout(() => toast.classList.remove("show"), 1500);
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      drawPreview();
    });
  }

  function calcCover(imgW, imgH) {
    return Math.max(EXPORT_BASE / imgW, EXPORT_BASE / imgH);
  }

  function calcContain(imgW, imgH) {
    return Math.min(EXPORT_BASE / imgW, EXPORT_BASE / imgH);
  }

  function reset(mode = "cover") {
    if (!state.photo) return;
    state.baseScale = mode === "contain"
      ? calcContain(state.photo.naturalWidth, state.photo.naturalHeight)
      : calcCover(state.photo.naturalWidth, state.photo.naturalHeight);
    state.scale = state.baseScale;
    state.x = EXPORT_BASE / 2;
    state.y = EXPORT_BASE * .47;
    state.rotation = 0;
    state.flipX = 1;
    syncControls();
    queueRender();
  }

  function draw(target, size, includeGuide = false) {
    const c = target.getContext("2d", { alpha: false });
    c.clearRect(0, 0, size, size);
    c.fillStyle = "#eef2f6";
    c.fillRect(0, 0, size, size);

    const ratio = size / EXPORT_BASE;

    if (state.photo) {
      c.save();
      c.translate(state.x * ratio, state.y * ratio);
      c.rotate(state.rotation);
      const s = state.scale * ratio;
      c.scale(s * state.flipX, s);
      c.drawImage(
        state.photo,
        -state.photo.naturalWidth / 2,
        -state.photo.naturalHeight / 2
      );
      c.restore();
    }

    if (state.frame) c.drawImage(state.frame, 0, 0, size, size);

    if (includeGuide && state.safe) {
      const safe = state.frameMeta?.safeArea || { x:.5, y:.47, radius:.30 };
      c.save();
      c.beginPath();
      c.arc(safe.x * size, safe.y * size, safe.radius * size, 0, Math.PI * 2);
      c.strokeStyle = "rgba(255,255,255,.9)";
      c.lineWidth = Math.max(2, size * .003);
      c.setLineDash([size * .012, size * .009]);
      c.shadowColor = "rgba(0,0,0,.25)";
      c.shadowBlur = 5;
      c.stroke();
      c.restore();
    }
  }

  function drawPreview() {
    draw(canvas, PREVIEW, true);
  }

  async function loadImageFile(file) {
    if (!file?.type?.startsWith("image/")) return say("Vui lòng chọn file ảnh.");

    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = URL.createObjectURL(file);

    const img = new Image();
    img.src = state.photoUrl;
    try {
      await img.decode();
    } catch {
      return say("Không đọc được ảnh.");
    }

    state.photo = img;
    emptyState.classList.add("hidden");
    reset("cover");
  }

  async function loadFrame(meta) {
    const img = new Image();
    img.decoding = "async";
    img.src = meta.image;
    try {
      await img.decode();
      state.frame = img;
      state.frameMeta = meta;
      queueRender();
    } catch {
      say("Không tải được khung.");
    }
  }

  function syncControls() {
    if (state.photo) {
      const pct = Math.round((state.scale / state.baseScale) * 100);
      $("#zoom").value = Math.min(400, Math.max(20, pct));
      $("#zoomLabel").textContent = pct + "%";
    }
    const deg = Math.round(state.rotation * 180 / Math.PI);
    $("#rotate").value = deg;
    $("#rotateLabel").textContent = deg + "°";
    $("#safeToggle").checked = state.safe;
  }

  async function exportImage(size) {
    if (!state.photo) return say("Hãy chọn ảnh trước.");
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c, size, false);
    return new Promise(resolve => c.toBlob(resolve, "image/png", 1));
  }

  async function download(size = 2048) {
    const blob = await exportImage(size);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avatar-my-phuoc-a-${size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  async function share() {
    const blob = await exportImage(1024);
    if (!blob) return;
    const file = new File([blob], "avatar-my-phuoc-a.png", { type:"image/png" });
    if (!navigator.share || !navigator.canShare?.({ files:[file] })) {
      return say("Thiết bị chưa hỗ trợ chia sẻ trực tiếp.");
    }
    try {
      await navigator.share({ title:"Khung avatar Trường Tiểu học Mỹ Phước A", files:[file] });
    } catch {}
  }

  function action(name) {
    if (!state.photo) return say("Hãy chọn ảnh trước.");
    if (name === "contain") reset("contain");
    if (name === "cover") reset("cover");
    if (name === "center") {
      state.x = EXPORT_BASE / 2;
      state.y = EXPORT_BASE * .47;
      queueRender();
    }
    if (name === "flip") {
      state.flipX *= -1;
      queueRender();
    }
    if (name === "rotate90") {
      state.rotation += Math.PI / 2;
      syncControls();
      queueRender();
    }
    if (name === "reset") reset("cover");
  }

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * EXPORT_BASE,
      y: (e.clientY - r.top) / r.height * EXPORT_BASE
    };
  }

  canvas.addEventListener("pointerdown", e => {
    if (!state.photo) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, canvasPoint(e));

    if (pointers.size === 1) {
      const p = [...pointers.values()][0];
      gesture = { type:"drag", p, x:state.x, y:state.y };
    } else if (pointers.size === 2) {
      const [a,b] = [...pointers.values()];
      gesture = {
        type:"pinch",
        distance:Math.hypot(b.x-a.x,b.y-a.y),
        angle:Math.atan2(b.y-a.y,b.x-a.x),
        scale:state.scale,
        rotation:state.rotation
      };
    }
  });

  canvas.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, canvasPoint(e));

    if (pointers.size === 1 && gesture?.type === "drag") {
      const p = [...pointers.values()][0];
      state.x = gesture.x + p.x - gesture.p.x;
      state.y = gesture.y + p.y - gesture.p.y;
      queueRender();
    } else if (pointers.size === 2 && gesture?.type === "pinch") {
      const [a,b] = [...pointers.values()];
      const d = Math.hypot(b.x-a.x,b.y-a.y);
      const ang = Math.atan2(b.y-a.y,b.x-a.x);
      state.scale = Math.max(.03, Math.min(15, gesture.scale * d / gesture.distance));
      state.rotation = gesture.rotation + ang - gesture.angle;
      syncControls();
      queueRender();
    }
  });

  function pointerEnd(e) {
    pointers.delete(e.pointerId);
    if (!pointers.size) gesture = null;
  }
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerEnd);

  $("#chooseBtn").onclick = () => fileInput.click();
  $("#cameraBtn").onclick = () => cameraInput.click();
  fileInput.onchange = e => loadImageFile(e.target.files?.[0]);
  cameraInput.onchange = e => loadImageFile(e.target.files?.[0]);

  $("#canvasBox").addEventListener("dragover", e => e.preventDefault());
  $("#canvasBox").addEventListener("drop", e => {
    e.preventDefault();
    const f = [...e.dataTransfer.files].find(x => x.type.startsWith("image/"));
    if (f) loadImageFile(f);
  });

  window.addEventListener("paste", e => {
    const f = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith("image/"));
    if (f) loadImageFile(f);
  });

  document.querySelectorAll("[data-action]").forEach(b => {
    b.onclick = () => action(b.dataset.action);
  });

  $("#zoom").oninput = e => {
    if (!state.photo) return;
    const pct = Number(e.target.value);
    state.scale = state.baseScale * pct / 100;
    $("#zoomLabel").textContent = pct + "%";
    queueRender();
  };

  $("#rotate").oninput = e => {
    if (!state.photo) return;
    const deg = Number(e.target.value);
    state.rotation = deg * Math.PI / 180;
    $("#rotateLabel").textContent = deg + "°";
    queueRender();
  };

  $("#safeToggle").onchange = e => {
    state.safe = e.target.checked;
    queueRender();
  };

  const sheet = $("#sheet");
  const backdrop = $("#backdrop");
  function openSheet() {
    sheet.classList.add("show");
    backdrop.classList.add("show");
    sheet.setAttribute("aria-hidden","false");
  }
  function closeSheet() {
    sheet.classList.remove("show");
    backdrop.classList.remove("show");
    sheet.setAttribute("aria-hidden","true");
  }
  $("#editBtn").onclick = openSheet;
  $("#closeSheet").onclick = closeSheet;
  backdrop.onclick = closeSheet;

  $("#downloadBtn").onclick = () => download(2048);
  $("#download1024").onclick = () => download(1024);
  $("#download2048").onclick = () => download(2048);
  $("#shareBtn").onclick = share;

  const help = $("#helpDialog");
  $("#helpBtn").onclick = () => help.showModal();
  $("#closeHelp").onclick = () => help.close();

  async function init() {
    try {
      const res = await fetch("frames.json", { cache:"no-cache" });
      const data = await res.json();

      $("#schoolName").textContent = data.site?.school || $("#schoolName").textContent;
      $("#ownerName").textContent = data.site?.owner || $("#ownerName").textContent;
      $("#campaignName").textContent = data.site?.campaign || $("#campaignName").textContent;

      frames = (data.frames || []).filter(f => f.active !== false);
      $("#frameCount").textContent = frames.length + " mẫu";

      const list = $("#frameList");
      for (const f of frames) {
        const btn = document.createElement("button");
        btn.className = "frame";
        btn.innerHTML = `<img src="${f.thumbnail}" loading="lazy" decoding="async" alt=""><span>${f.name}</span>`;
        btn.onclick = async () => {
          document.querySelectorAll(".frame").forEach(x => x.classList.remove("active"));
          btn.classList.add("active");
          await loadFrame(f);
        };
        list.appendChild(btn);
      }

      if (frames[0]) {
        list.firstElementChild?.classList.add("active");
        await loadFrame(frames[0]);
      } else {
        queueRender();
      }
    } catch {
      say("Không tải được dữ liệu khung.");
      queueRender();
    }
  }

  init();
})();