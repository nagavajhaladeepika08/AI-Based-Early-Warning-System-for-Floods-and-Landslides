(() => {
  'use strict';

  // ---------- Element references ----------
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const viewportContainer = document.getElementById('viewportContainer');

  const permissionOverlay = document.getElementById('permissionOverlay');
  const permissionTitle = document.getElementById('permissionTitle');
  const permissionText = document.getElementById('permissionText');
  const retryPermissionBtn = document.getElementById('retryPermissionBtn');

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const captureBtn = document.getElementById('captureBtn');
  const mirrorBtn = document.getElementById('mirrorBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  const statusDot = document.getElementById('statusDot');
  const currentFilterLabel = document.getElementById('currentFilterLabel');

  const timerSelect = document.getElementById('timerSelect');
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');

  const filterGrid = document.getElementById('filterGrid');
  const filterChips = Array.from(document.querySelectorAll('.filter-chip'));

  const brightnessRange = document.getElementById('brightnessRange');
  const contrastRange = document.getElementById('contrastRange');
  const saturationRange = document.getElementById('saturationRange');
  const blurRange = document.getElementById('blurRange');

  const brightnessValue = document.getElementById('brightnessValue');
  const contrastValue = document.getElementById('contrastValue');
  const saturationValue = document.getElementById('saturationValue');
  const blurValue = document.getElementById('blurValue');

  const resetBtn = document.getElementById('resetBtn');

  const latestPhotoWrap = document.getElementById('latestPhotoWrap');
  const latestPhoto = document.getElementById('latestPhoto');
  const downloadLatestBtn = document.getElementById('downloadLatestBtn');
  const clearGalleryBtn = document.getElementById('clearGalleryBtn');

  const filmstrip = document.getElementById('filmstrip');
  const emptyGalleryMsg = document.getElementById('emptyGalleryMsg');

  // ---------- State ----------
  let mediaStream = null;
  let mirrored = false;
  let currentPreset = 'normal';
  let adjustments = { brightness: 100, contrast: 100, saturation: 100, blur: 0 };
  let photos = []; // { url, filterLabel, timestamp }
  let countdownTimerId = null;

  const PRESET_FILTERS = {
    normal: '',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    vintage: 'sepia(55%) contrast(88%) brightness(96%) saturate(115%)',
    invert: 'invert(100%)',
    cool: 'hue-rotate(180deg) saturate(135%) brightness(102%)',
    warm: 'sepia(35%) saturate(155%) hue-rotate(-15deg)',
    // These three reuse the "normal" base — the real effect comes from the sliders below.
    brightness: '',
    contrast: '',
    saturation: '',
    blur: ''
  };

  const FILTER_LABELS = {
    normal: 'Normal',
    grayscale: 'Black & White',
    sepia: 'Sepia',
    vintage: 'Vintage',
    invert: 'Invert',
    cool: 'Cool',
    warm: 'Warm',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    blur: 'Blur'
  };

  const SLIDER_FOCUS_KEYS = ['brightness', 'contrast', 'saturation', 'blur'];

  // ---------- Filter engine ----------
  function buildFilterString() {
    const base = PRESET_FILTERS[currentPreset] || '';
    const dynamic = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px)`;
    return `${base} ${dynamic}`.trim();
  }

  function applyFilterToVideo() {
    video.style.filter = buildFilterString();
  }

  function setActivePreset(presetKey) {
    currentPreset = presetKey;
    filterChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === presetKey);
    });
    currentFilterLabel.textContent = FILTER_LABELS[presetKey] || 'Normal';

    document.querySelectorAll('.slider-row').forEach(row => row.classList.remove('slider-focus'));
    if (SLIDER_FOCUS_KEYS.includes(presetKey)) {
      const row = document.querySelector(`.slider-row[data-slider-row="${presetKey}"]`);
      if (row) {
        row.classList.add('slider-focus');
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    applyFilterToVideo();
  }

  filterGrid.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    setActivePreset(chip.dataset.filter);
  });

  // ---------- Sliders ----------
  function syncSliderDisplay() {
    brightnessValue.textContent = `${adjustments.brightness}%`;
    contrastValue.textContent = `${adjustments.contrast}%`;
    saturationValue.textContent = `${adjustments.saturation}%`;
    blurValue.textContent = `${adjustments.blur}px`;
  }

  brightnessRange.addEventListener('input', () => {
    adjustments.brightness = Number(brightnessRange.value);
    syncSliderDisplay();
    applyFilterToVideo();
  });
  contrastRange.addEventListener('input', () => {
    adjustments.contrast = Number(contrastRange.value);
    syncSliderDisplay();
    applyFilterToVideo();
  });
  saturationRange.addEventListener('input', () => {
    adjustments.saturation = Number(saturationRange.value);
    syncSliderDisplay();
    applyFilterToVideo();
  });
  blurRange.addEventListener('input', () => {
    adjustments.blur = Number(blurRange.value);
    syncSliderDisplay();
    applyFilterToVideo();
  });

  resetBtn.addEventListener('click', () => {
    adjustments = { brightness: 100, contrast: 100, saturation: 100, blur: 0 };
    brightnessRange.value = 100;
    contrastRange.value = 100;
    saturationRange.value = 100;
    blurRange.value = 0;
    syncSliderDisplay();
    setActivePreset('normal');
  });

  // ---------- Camera control ----------
  function showPermissionOverlay(title, text, showAsError) {
    permissionTitle.textContent = title;
    permissionText.textContent = text;
    permissionOverlay.classList.remove('hidden');
    permissionOverlay.style.display = 'flex';
    retryPermissionBtn.textContent = showAsError ? 'Try Again' : 'Start Camera';
  }

  function hidePermissionOverlay() {
    permissionOverlay.classList.add('hidden');
    permissionOverlay.style.display = 'none';
  }

  function setCameraActiveUI(isActive) {
    startBtn.disabled = isActive;
    stopBtn.disabled = !isActive;
    captureBtn.disabled = !isActive;
    mirrorBtn.disabled = !isActive;
    fullscreenBtn.disabled = !isActive;
    statusDot.classList.toggle('live', isActive);
  }

  async function startCamera() {
    if (mediaStream) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showPermissionOverlay(
        'Camera not supported',
        'Your browser does not support webcam access. Please try a recent version of Chrome, Firefox, Edge, or Safari.',
        true
      );
      return;
    }

    showPermissionOverlay('Requesting camera access…', 'Allow camera permission in the prompt above to start your live preview.', false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      mediaStream = stream;
      video.srcObject = stream;
      await video.play();
      hidePermissionOverlay();
      setCameraActiveUI(true);
      applyFilterToVideo();
    } catch (err) {
      mediaStream = null;
      setCameraActiveUI(false);
      let title = 'Camera access failed';
      let text = 'Something went wrong while trying to access your webcam. Please try again.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        title = 'Camera permission denied';
        text = 'You blocked camera access. Enable camera permission for this site in your browser settings, then try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        title = 'No camera found';
        text = 'We could not find a connected webcam. Plug in a camera or check your device settings, then try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        title = 'Camera already in use';
        text = 'Your webcam might be in use by another application. Close it and try again.';
      } else if (err.name === 'OverconstrainedError') {
        title = 'Camera constraints not supported';
        text = 'Your webcam does not support the requested settings. Try again — we will use its default resolution.';
      }
      showPermissionOverlay(title, text, true);
    }
  }

  function stopCamera() {
    if (!mediaStream) return;
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    video.pause();
    video.srcObject = null;
    setCameraActiveUI(false);
    showPermissionOverlay('Camera stopped', 'Your webcam is off. Click below to start it again whenever you are ready.', false);
  }

  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);
  retryPermissionBtn.addEventListener('click', startCamera);

  // ---------- Mirror ----------
  mirrorBtn.addEventListener('click', () => {
    mirrored = !mirrored;
    video.classList.toggle('mirrored', mirrored);
    mirrorBtn.style.color = mirrored ? 'var(--accent)' : '';
  });

  // ---------- Fullscreen ----------
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      viewportContainer.requestFullscreen().catch(() => {
        showPermissionOverlay('Fullscreen unavailable', 'Your browser blocked fullscreen mode for this page.', true);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // ---------- Capture ----------
  function drawFrameToCanvas() {
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.filter = buildFilterString() || 'none';

    if (mirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  function addPhotoToGallery(dataUrl) {
    const timestamp = new Date();
    const entry = { url: dataUrl, filterLabel: FILTER_LABELS[currentPreset] || 'Normal', timestamp };
    photos.unshift(entry);

    latestPhoto.src = dataUrl;
    latestPhotoWrap.classList.remove('hidden');
    emptyGalleryMsg.style.display = 'none';

    const frame = document.createElement('div');
    frame.className = 'film-frame';
    frame.innerHTML = `
      <img src="${dataUrl}" alt="Captured photo with ${entry.filterLabel} filter" />
      <div class="film-holes"><span></span><span></span><span></span><span></span><span></span></div>
    `;
    frame.addEventListener('click', () => {
      latestPhoto.src = dataUrl;
      latestPhotoWrap.classList.remove('hidden');
      latestPhotoWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    filmstrip.insertBefore(frame, filmstrip.firstChild);
  }

  function takePhotoNow() {
    if (!mediaStream || video.videoWidth === 0) return;
    const dataUrl = drawFrameToCanvas();
    addPhotoToGallery(dataUrl);

    // brief flash feedback
    viewportContainer.animate(
      [{ filter: 'brightness(2.4)' }, { filter: 'brightness(1)' }],
      { duration: 220, easing: 'ease-out' }
    );
  }

  function runCountdownThenCapture(seconds) {
    let remaining = seconds;
    countdownNumber.textContent = String(remaining);
    countdownOverlay.classList.remove('hidden');

    countdownTimerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimerId);
        countdownTimerId = null;
        countdownOverlay.classList.add('hidden');
        takePhotoNow();
      } else {
        countdownNumber.textContent = String(remaining);
      }
    }, 1000);
  }

  captureBtn.addEventListener('click', () => {
    const timerValue = Number(timerSelect.value);
    if (timerValue > 0) {
      runCountdownThenCapture(timerValue);
    } else {
      takePhotoNow();
    }
  });

  downloadLatestBtn.addEventListener('click', () => {
    if (!latestPhoto.src) return;
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = latestPhoto.src;
    link.download = `aperture-photo-${stamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  clearGalleryBtn.addEventListener('click', () => {
    photos = [];
    filmstrip.innerHTML = '';
    filmstrip.appendChild(emptyGalleryMsg);
    emptyGalleryMsg.style.display = 'block';
    latestPhotoWrap.classList.add('hidden');
    latestPhoto.src = '';
  });

  // ---------- Init ----------
  // The script tag sits at the end of <body>, so the DOM is already
  // parsed by the time this file runs — safe to request the camera once, immediately.
  syncSliderDisplay();
  setCameraActiveUI(false);
  startCamera();
})();
