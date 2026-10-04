/**
 * SMVS Satellite Dashabdi Mahotsav 2026 - Invitation Web Application
 * Tap & Open Envelope Animation with Video Reveal, Dashabdi Kirtan & Gentle Auto-Scroll
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. DEVICE DETECTION & ENVELOPE SELECTION (MOBILE vs TABLET/PC)
  // =========================================================================
  const envelopeImg = document.getElementById('envelopeImg');
  const envelopeSourceMobile = document.getElementById('envelopeSourceMobile');
  const envelopeSourceDesktop = document.getElementById('envelopeSourceDesktop');

  function isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );
  }

  function updateEnvelopeSource() {
    if (!envelopeImg) return;
    const mobile = isMobileDevice();

    if (mobile) {
      // Mobile: envelope-first.webep / envelope-first.webp
      envelopeImg.src = 'assets/envelope-first.webep';
      envelopeImg.onerror = () => {
        envelopeImg.src = 'assets/envelope-first.webp';
      };
    } else {
      // Tablet / PC: Envelop_Horizontal.jpg
      envelopeImg.src = 'assets/Envelop_Horizontal.jpg';
      envelopeImg.onerror = () => {
        envelopeImg.src = 'assets/envelope-first.webp';
      };
    }
  }

  updateEnvelopeSource();
  window.addEventListener('resize', () => {
    // Only update if not already opened
    if (!isOpened) {
      updateEnvelopeSource();
    }
  });

  // =========================================================================
  // 2. ENVELOPE TAP & VIDEO OPENING REVEAL
  // =========================================================================
  const entrance = document.getElementById('entrance');
  const envelopeOpenBtn = document.getElementById('envelopeOpenBtn');
  const openingVideo = document.getElementById('openingVideo');
  const skipOpeningBtn = document.getElementById('skipOpeningBtn');
  const mainWrapper = document.getElementById('mainWrapper');
  const kirtanAudio = document.getElementById('kirtanAudio');

  let isOpened = false;
  let videoStarted = false;

  async function startEnvelopeOpening() {
    if (isOpened) return;
    isOpened = true;

    // 1. Play Dashabdi Kirtan MP3
    playKirtan();

    // 2. Play Web Audio Bell chime for sacred atmosphere
    playTempleBell(659.25, 4.0);

    // 3. Play Envelop Opening Final.mp4
    if (openingVideo) {
      if (envelopeOpenBtn) {
        envelopeOpenBtn.style.pointerEvents = 'none';
        envelopeOpenBtn.style.opacity = '0';
      }

      openingVideo.hidden = false;
      if (skipOpeningBtn) {
        skipOpeningBtn.hidden = false;
      }

      try {
        await openingVideo.play();
        videoStarted = true;
      } catch (err) {
        console.warn('Video autoplay issue, proceeding to webpage:', err);
        finishOpening();
      }

      // When the video finishes playing, reveal webpage
      openingVideo.addEventListener('ended', finishOpening, { once: true });
    } else {
      finishOpening();
    }
  }

  function finishOpening() {
    if (entrance.classList.contains('leaving')) return;

    if (openingVideo) {
      openingVideo.pause();
    }

    // Smoothly dissolve the envelope screen
    entrance.classList.add('leaving');
    document.body.classList.remove('locked');

    if (mainWrapper) {
      mainWrapper.removeAttribute('inert');
    }

    // Ensure Kirtan is playing
    playKirtan();

    // Start very slow auto-scrolling
    startGentleAutoScroll();

    // Ring the hero bells visually to celebrate entrance
    const heroBells = document.querySelectorAll('.hanging-bell');
    heroBells.forEach(b => {
      b.classList.remove('ringing');
      void b.offsetWidth;
      b.classList.add('ringing');
    });

    setTimeout(() => {
      entrance.style.display = 'none';
    }, 1000);
  }

  if (envelopeOpenBtn) {
    envelopeOpenBtn.addEventListener('click', startEnvelopeOpening);
  }

  // Also tapping on the entrance overlay triggers opening
  if (entrance) {
    entrance.addEventListener('click', (e) => {
      if (e.target === skipOpeningBtn) return;
      if (!isOpened) {
        startEnvelopeOpening();
      }
    });
  }

  if (skipOpeningBtn) {
    skipOpeningBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishOpening();
    });
  }

  // =========================================================================
  // 3. DASHABDI KIRTAN MP3 AUDIO
  // =========================================================================
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicBtnIcon = document.getElementById('musicBtnIcon');
  const musicBtnLabel = document.getElementById('musicBtnLabel');
  let isMusicPlaying = false;

  function playKirtan() {
    if (!kirtanAudio) return;
    kirtanAudio.volume = 0.65;
    kirtanAudio.play()
      .then(() => {
        isMusicPlaying = true;
        updateMusicBtnState();
      })
      .catch((e) => {
        console.warn('Audio play was prevented or file pending:', e);
      });
  }

  function toggleKirtan() {
    if (!kirtanAudio) return;
    if (isMusicPlaying) {
      kirtanAudio.pause();
      isMusicPlaying = false;
    } else {
      kirtanAudio.play()
        .then(() => {
          isMusicPlaying = true;
        })
        .catch(() => {});
    }
    updateMusicBtnState();
  }

  function updateMusicBtnState() {
    if (!musicToggleBtn) return;
    if (isMusicPlaying) {
      musicToggleBtn.classList.add('active');
      if (musicBtnIcon) musicBtnIcon.textContent = '🔊';
      if (musicBtnLabel) musicBtnLabel.textContent = 'સંગીત ચાલુ';
    } else {
      musicToggleBtn.classList.remove('active');
      if (musicBtnIcon) musicBtnIcon.textContent = '🎵';
      if (musicBtnLabel) musicBtnLabel.textContent = 'કીર્તન';
    }
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', toggleKirtan);
  }

  // =========================================================================
  // 4. VERY SLOW AUTO-SCROLL
  // Smoothly glides down the page automatically so guests can read with ease
  // =========================================================================
  let autoScrollActive = true;
  let userIsInteracting = false;
  let userInteractionTimeout = null;
  const SCROLL_SPEED = 0.45; // pixels per animation frame (very gentle & slow)
  let scrollAccumulator = 0;
  let autoScrollAnimationId = null;

  const autoScrollToggleBtn = document.getElementById('autoScrollToggleBtn');
  const scrollBtnLabel = document.getElementById('scrollBtnLabel');

  function startGentleAutoScroll() {
    autoScrollActive = true;
    updateAutoScrollBtnState();

    function scrollStep() {
      if (autoScrollActive && !userIsInteracting && isOpened) {
        scrollAccumulator += SCROLL_SPEED;
        if (scrollAccumulator >= 1) {
          const pixels = Math.floor(scrollAccumulator);
          window.scrollBy(0, pixels);
          scrollAccumulator -= pixels;
        }

        // Check if reached bottom of document
        const scrollBottom = window.innerHeight + window.pageYOffset;
        if (scrollBottom >= document.documentElement.scrollHeight - 5) {
          autoScrollActive = false;
          updateAutoScrollBtnState();
        }
      }
      autoScrollAnimationId = requestAnimationFrame(scrollStep);
    }

    if (!autoScrollAnimationId) {
      autoScrollAnimationId = requestAnimationFrame(scrollStep);
    }
  }

  // Pause auto-scroll when user manually scrolls or touches the screen
  function handleUserScrollAction() {
    if (!autoScrollActive) return;
    userIsInteracting = true;
    clearTimeout(userInteractionTimeout);
    // Gracefully resume after 3 seconds of inactivity
    userInteractionTimeout = setTimeout(() => {
      userIsInteracting = false;
    }, 3000);
  }

  ['touchstart', 'touchmove', 'wheel', 'keydown', 'mousedown'].forEach(event => {
    window.addEventListener(event, handleUserScrollAction, { passive: true });
  });

  function toggleAutoScroll() {
    autoScrollActive = !autoScrollActive;
    userIsInteracting = false;
    updateAutoScrollBtnState();
  }

  function updateAutoScrollBtnState() {
    if (!autoScrollToggleBtn) return;
    if (autoScrollActive) {
      autoScrollToggleBtn.classList.add('active');
      if (scrollBtnLabel) scrollBtnLabel.textContent = 'ઓટો સ્ક્રોલ';
    } else {
      autoScrollToggleBtn.classList.remove('active');
      if (scrollBtnLabel) scrollBtnLabel.textContent = 'સ્ક્રોલ બંધ';
    }
  }

  if (autoScrollToggleBtn) {
    autoScrollToggleBtn.addEventListener('click', toggleAutoScroll);
  }

  // =========================================================================
  // 5. WEB AUDIO API - TEMPLE BELL SYNTHESIZER
  // =========================================================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTempleBell(frequency = 659.25, duration = 4.0) {
    try {
      initAudioContext();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const harmonics = [
        { ratio: 1.00, gain: 0.45, decay: duration },
        { ratio: 2.01, gain: 0.30, decay: duration * 0.8 },
        { ratio: 2.76, gain: 0.20, decay: duration * 0.6 },
        { ratio: 3.00, gain: 0.15, decay: duration * 0.5 },
        { ratio: 5.42, gain: 0.08, decay: duration * 0.35 }
      ];

      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.connect(audioCtx.destination);

      harmonics.forEach(({ ratio, gain, decay }) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency * ratio, now);

        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(gain, now + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch (e) {
      console.warn('Audio synthesis not supported or prevented by policy:', e);
    }
  }

  // Interactive Hanging Bells in Hero
  const bells = document.querySelectorAll('.hanging-bell');
  const bellFrequencies = [587.33, 659.25, 783.99];

  bells.forEach((bell, index) => {
    bell.addEventListener('click', () => {
      initAudioContext();
      bell.classList.remove('ringing');
      void bell.offsetWidth;
      bell.classList.add('ringing');
      playTempleBell(bellFrequencies[index % bellFrequencies.length], 4.2);
    });
  });

  const bellSoundBtn = document.getElementById('bellSoundBtn');
  if (bellSoundBtn) {
    bellSoundBtn.addEventListener('click', () => {
      initAudioContext();
      playTempleBell(659.25, 4.5);
      const centerBell = document.getElementById('bell2');
      if (centerBell) {
        centerBell.classList.remove('ringing');
        void centerBell.offsetWidth;
        centerBell.classList.add('ringing');
      }
    });
  }

  // Hero Section Open Invitation Button
  const openInvitationBtn = document.getElementById('openInvitationBtn');
  if (openInvitationBtn) {
    openInvitationBtn.addEventListener('click', () => {
      initAudioContext();
      playTempleBell(659.25, 4.5);

      const storySection = document.getElementById('story');
      if (storySection) {
        storySection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // =========================================================================
  // 6. LIVE COUNTDOWN (Target: 26 October 2026, 16:00:00 IST)
  // =========================================================================
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMinutes = document.getElementById('cdMinutes');
  const cdSeconds = document.getElementById('cdSeconds');

  const targetDate = new Date('2026-10-26T16:00:00+05:30').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMinutes) cdMinutes.textContent = '00';
      if (cdSeconds) cdSeconds.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
    if (cdMinutes) cdMinutes.textContent = String(minutes).padStart(2, '0');
    if (cdSeconds) cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // =========================================================================
  // 7. FLOWER PETALS & DIVINE SPARKLES CANVAS ANIMATION
  // =========================================================================
  const canvas = document.getElementById('petalCanvas');
  let ctx = canvas ? canvas.getContext('2d') : null;
  let petalsRunning = true;
  let petals = [];

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const petalColors = [
    '#f44336', // Rose Petal Red
    '#e91e63', // Deep Pink
    '#ff9800', // Marigold Saffron
    '#ffc107', // Golden Yellow
    '#ffd54f'  // Sparkle Gold
  ];

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      if (!canvas) return;
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -20;
      this.size = Math.random() * 8 + 6;
      this.speedY = Math.random() * 1.2 + 0.8;
      this.speedX = (Math.random() - 0.5) * 1.2;
      this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
      this.opacity = Math.random() * 0.6 + 0.35;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.04;
      this.oscillation = Math.random() * 100;
      this.oscillationSpeed = Math.random() * 0.02 + 0.01;
      this.isSparkle = Math.random() < 0.25;
    }

    update() {
      this.y += this.speedY;
      this.oscillation += this.oscillationSpeed;
      this.x += this.speedX + Math.sin(this.oscillation) * 0.8;
      this.rotation += this.rotationSpeed;

      if (canvas && (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20)) {
        this.reset(false);
      }
    }

    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.rotation);
      context.globalAlpha = this.opacity;

      if (this.isSparkle) {
        context.fillStyle = '#ffecb3';
        context.shadowColor = '#ffd700';
        context.shadowBlur = 6;
        context.beginPath();
        context.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = this.color;
        context.beginPath();
        context.moveTo(0, -this.size);
        context.quadraticCurveTo(this.size * 0.8, -this.size * 0.3, this.size * 0.6, this.size * 0.7);
        context.quadraticCurveTo(0, this.size, -this.size * 0.6, this.size * 0.7);
        context.quadraticCurveTo(-this.size * 0.8, -this.size * 0.3, 0, -this.size);
        context.fill();
      }

      context.restore();
    }
  }

  if (canvas && ctx) {
    const PETAL_COUNT = 32;
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push(new Petal());
    }

    function renderPetals() {
      if (petalsRunning && ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        petals.forEach(petal => {
          petal.update();
          petal.draw(ctx);
        });
      }
      requestAnimationFrame(renderPetals);
    }

    requestAnimationFrame(renderPetals);
  }

  const petalToggleBtn = document.getElementById('petalToggleBtn');
  if (petalToggleBtn) {
    petalToggleBtn.addEventListener('click', () => {
      petalsRunning = !petalsRunning;
      if (!petalsRunning && ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      petalToggleBtn.style.opacity = petalsRunning ? '1' : '0.6';
    });
  }

  // =========================================================================
  // 8. SHARE INVITATION MODAL
  // =========================================================================
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const whatsappShareBtn = document.getElementById('whatsappShareBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const copyToast = document.getElementById('copyToast');

  const shareTitle = 'SMVS સ્વામિનારાયણ મંદિર – સેટેલાઇટ દશાબ્દી મહોત્સવ ૨૦૨૬';
  const shareText = `દશાબ્દી મહોત્સવ – ૨૦૨૬\n૧૦ વર્ષ ભક્તિ • સેવા • સત્સંગ\nSMVS સ્વામિનારાયણ મંદિર – સેટેલાઇટ સેન્ટર\n🗓️ ૨૬ ઓક્ટોબર ૨૦૨૬ (સોમવાર) • શરદ પૂનમ\nસાંજે ૪:૦૦ થી રાત્રે ૯:૦૦\n\nપ્રેમભર્યું આમંત્રણ: આપ અને આપના સમગ્ર પરિવારને સહર્ષ પધારવા હાર્દિક નિમંત્રણ.\n“આવ્યો સેટેલાઈટ મંદિરે ઉત્સવ…”`;
  const shareUrl = window.location.href;

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      initAudioContext();
      playTempleBell(783.99, 3.0);

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            openShareModal();
          }
        }
      } else {
        openShareModal();
      }
    });
  }

  function openShareModal() {
    if (shareModal) {
      const encodedMsg = encodeURIComponent(`${shareTitle}\n\n${shareText}\n\n${shareUrl}`);
      if (whatsappShareBtn) {
        whatsappShareBtn.href = `https://api.whatsapp.com/send?text=${encodedMsg}`;
      }
      shareModal.showModal();
    }
  }

  if (closeModalBtn && shareModal) {
    closeModalBtn.addEventListener('click', () => {
      shareModal.close();
    });
  }

  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      const rect = shareModal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
        && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        shareModal.close();
      }
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (copyToast) {
          copyToast.classList.add('show');
          setTimeout(() => {
            copyToast.classList.remove('show');
          }, 2500);
        }
        if (copyBtnText) {
          const original = copyBtnText.textContent;
          copyBtnText.textContent = 'લિંક કોપી થઈ ગઈ! (Copied!)';
          setTimeout(() => {
            copyBtnText.textContent = original;
          }, 2500);
        }
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        if (copyToast) {
          copyToast.classList.add('show');
          setTimeout(() => copyToast.classList.remove('show'), 2500);
        }
      }
    });
  }

});
