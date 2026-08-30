const toggle = document.getElementById("theme-toggle");
const storageKey = "portfolio-theme";

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }

  if (toggle) {
    toggle.checked = theme === "light";
  }
}

const initialTheme = localStorage.getItem(storageKey) || "light";
applyTheme(initialTheme);

if (toggle) {
  toggle.addEventListener("change", () => {
    const nextTheme = toggle.checked ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
  });
}

const clockEl = document.getElementById("clock");

function formatClockDate(date, compact = false) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  if (compact) {
    const shortMonth = month.slice(0, 3);
    return `${day} ${shortMonth} ${hours}:${minutes}:${seconds}`;
  }

  return `${day}. ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

function updateClock() {
  if (!clockEl) {
    return;
  }
  const compact = window.matchMedia("(max-width: 640px)").matches;
  clockEl.textContent = formatClockDate(new Date(), compact);
}

updateClock();
window.setInterval(updateClock, 1000);

function typewriterOnce(element, text, speed, startDelay = 0) {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    element.textContent = "";
    let index = 0;

    const start = () => {
      const timer = setInterval(() => {
        index += 1;
        element.textContent = text.slice(0, index);
        if (index >= text.length) {
          clearInterval(timer);
          element.classList.add("done");
          resolve();
        }
      }, speed);
    };

    window.setTimeout(start, startDelay);
  });
}

const nameLine = document.getElementById("typewriter-name");
const roleLine = document.getElementById("typewriter-role");

Promise.resolve()
  .then(() => typewriterOnce(nameLine, "Subash Nepal", 85, 180))
  .then(() => typewriterOnce(roleLine, "Video Editor & Motion Designer", 55, 120));

const projectCards = document.querySelectorAll(".project-card");
const canTilt =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canTilt) {
  projectCards.forEach((card) => {
    const maxTilt = 8;

    card.addEventListener("mousemove", (event) => {
      // ponytail: skip tilt over video controls so playback stays usable
      if (event.target.closest("video, iframe, .project-media")) {
        return;
      }

      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      const rotateY = (px - 0.5) * (maxTilt * 2);
      const rotateX = (0.5 - py) * (maxTilt * 2);

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    });
  });
}

const dock = document.getElementById("floating-dock");

document.querySelectorAll(".project-media").forEach((wrap) => {
  const video = wrap.querySelector(".bare-video");
  const muteBtn = wrap.querySelector(".mute-btn");
  if (!video || !muteBtn) return;

  let triedFallback = false;

  const tryPlay = () => {
    if (video.dataset.keepSound !== "1") {
      video.muted = true;
    }
    video.volume = 1;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const syncMuteUi = (targetVideo, targetBtn) => {
    const v = targetVideo || video;
    const b = targetBtn || muteBtn;
    b.setAttribute("aria-pressed", String(v.muted));
    b.setAttribute("aria-label", v.muted ? "Unmute video" : "Mute video");
  };

  const setMuted = (muted) => {
    video.dataset.keepSound = muted ? "0" : "1";
    video.muted = muted;
    video.volume = 1;
    if (!muted) {
      document.querySelectorAll(".project-media").forEach((otherWrap) => {
        if (otherWrap === wrap) return;
        const otherVideo = otherWrap.querySelector(".bare-video");
        const otherBtn = otherWrap.querySelector(".mute-btn");
        if (!otherVideo || !otherBtn) return;
        otherVideo.muted = true;
        otherVideo.dataset.keepSound = "0";
        otherBtn.setAttribute("aria-pressed", "true");
        otherBtn.setAttribute("aria-label", "Unmute video");
      });
      tryPlay();
    }
    syncMuteUi();
  };

  const clearError = () => {
    wrap.classList.remove("video-error");
  };

  const tryFallbackSrc = () => {
    if (triedFallback) return false;
    const current = video.getAttribute("src") || "";
    if (!current) return false;

    let next = current;
    if (current.includes("UGC.mp4")) next = current.replace("UGC.mp4", "ugc.mp4");
    else if (current.includes("ugc.mp4")) next = current.replace("ugc.mp4", "UGC.mp4");
    else if (current.includes("Shortvideo.mp4")) next = current.replace("Shortvideo.mp4", "shortvideo.mp4");
    else if (current.includes("shortvideo.mp4")) next = current.replace("shortvideo.mp4", "Shortvideo.mp4");
    else return false;

    if (next === current) return false;
    triedFallback = true;
    video.src = next;
    video.load();
    return true;
  };

  video.addEventListener("loadeddata", () => {
    clearError();
    tryPlay();
  });
  video.addEventListener("canplay", () => {
    clearError();
    tryPlay();
  });
  video.addEventListener("error", () => {
    if (tryFallbackSrc()) return;
    wrap.classList.add("video-error");
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (video.readyState >= 2) {
              tryPlay();
            } else {
              video.load();
            }
          } else if (!video.paused) {
            video.pause();
            setMuted(true);
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(wrap);
  } else {
    tryPlay();
  }

  muteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setMuted(!video.muted);
  });

  video.addEventListener("click", (event) => {
    event.stopPropagation();
    setMuted(!video.muted);
  });

  syncMuteUi();
  tryPlay();
});

if (dock) {
  const dockItems = Array.from(dock.querySelectorAll(".dock-item"));
  const maxDistance = 120;

  dock.addEventListener("mousemove", (event) => {
    dockItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(event.clientX - itemCenterX);
      const normalized = Math.max(0, 1 - distance / maxDistance);
      const scale = 1 + normalized * 0.55;
      item.style.setProperty("--dock-scale", scale.toFixed(3));
    });
  });

  dock.addEventListener("mouseleave", () => {
    dockItems.forEach((item) => {
      item.style.setProperty("--dock-scale", "1");
    });
  });
}
