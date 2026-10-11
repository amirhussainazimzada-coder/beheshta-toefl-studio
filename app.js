
/* Beheshta TOEFL Studio — SH Assistant */

(() => {
  "use strict";

  const messages = [
    "بهشته جانم، خسته نشدی؟ 💗 کمی استراحت هم بخشی از موفقیت است!",
    "بهشته جانم، چایی برات بگیرم یا قهوه؟ ☕😍",
    "قهرمان پرتلاش، حالت خوبه؟ یک نفس عمیق بکش و با آرامش ادامه بده. 💜",
    "بهشته جانم، هر لغتی که امروز یاد می‌گیری، یک قدم به هدفت نزدیک‌ترت می‌کند! 🌷",
    "یادت نره کمی آب بنوشی و چشم‌هایت را استراحت بدهی. 💧",
    "بهشته جانم، به خودت افتخار کن؛ تلاش‌های کوچک هر روز نتیجه‌های بزرگ می‌سازند! ✨"
  ];

  let messageIndex = 0;
  let timer = null;
  let started = false;
  let sessionEnd = null;

  function createAssistant() {
    if (document.getElementById("sh-assistant")) return;

    const wrapper = document.createElement("aside");
    wrapper.id = "sh-assistant";
    wrapper.className = "sh-assistant sh-hidden";
    wrapper.setAttribute("aria-live", "polite");

    wrapper.innerHTML = `
      <div class="sh-robot" aria-label="SH assistant">SH</div>
      <div class="sh-message">
        <button class="sh-close" type="button"
          aria-label="بستن پیام">×</button>
        <strong>SH 💜</strong>
        <div class="sh-message-text"></div>
      </div>
    `;

    document.body.appendChild(wrapper);

    wrapper.querySelector(".sh-close").addEventListener("click", () => {
      wrapper.classList.add("sh-hidden");
    });
  }

  function showMessage(message) {
    createAssistant();

    const wrapper = document.getElementById("sh-assistant");
    wrapper.querySelector(".sh-message-text").textContent = message;
    wrapper.classList.remove("sh-hidden");
  }

  function hideAssistant() {
    const wrapper = document.getElementById("sh-assistant");
    if (wrapper) wrapper.classList.add("sh-hidden");
  }

  function showNextMessage() {
    if (sessionEnd && Date.now() >= sessionEnd) {
      finishStudy();
      return;
    }

    showMessage(messages[messageIndex]);
    messageIndex = (messageIndex + 1) % messages.length;
  }

  function startStudy() {
    if (started) return;

    started = true;
    sessionEnd = null;

    showMessage("بهشته جانم، خوش آمدی! 💗 آماده‌ای امروز یک قدم به هدفت نزدیک‌تر شوی؟");

    timer = window.setInterval(showNextMessage, 5 * 60 * 1000);
  }

  function finishStudy() {
    if (timer) window.clearInterval(timer);

    timer = null;
    started = false;
    sessionEnd = null;

    showMessage("بهشته جانم، زمان درس امروزت تمام شد! 🎉 موفق باشی، قهرمان پرتلاش! امروز به خودت افتخار کن. 💗");
  }

  function scheduleStudyEnd(minutes) {
    const duration = Number(minutes);

    if (!Number.isFinite(duration) || duration <= 0) {
      return false;
    }

    if (timer) window.clearInterval(timer);

    started = true;
    sessionEnd = Date.now() + duration * 60 * 1000;

    showMessage("بهشته جانم، زمان مطالعه‌ات شروع شد! 💜 با آرامش پیش برو؛ SH همراهت است.");

    timer = window.setInterval(() => {
      if (Date.now() >= sessionEnd) {
        finishStudy();
      } else {
        showNextMessage();
      }
    }, 60 * 1000);

    return true;
  }

  function stopStudy() {
    if (timer) window.clearInterval(timer);

    timer = null;
    started = false;
    sessionEnd = null;

    hideAssistant();
  }

  function init() {
    createAssistant();

    // Welcome message and five-minute reminders.
    startStudy();

    // Public controls for later connection to study buttons.
    window.SH = {
      showMessage,
      startStudy,
      finishStudy,
      scheduleStudyEnd,
      stopStudy
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
