/* Beheshta TOEFL Studio — SH + Listening + Speaking + local progress */
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
  const STORAGE_KEY = "beheshtaToeflProgressV1";
  let messageIndex = 0, timer = null, started = false, sessionEnd = null;
  let recorder = null, recordedChunks = [], audioUrl = null, stream = null;

  function createAssistant() {
    if (document.getElementById("sh-assistant")) return;
    const wrapper = document.createElement("aside");
    wrapper.id = "sh-assistant";
    wrapper.className = "sh-assistant sh-hidden";
    wrapper.setAttribute("aria-live", "polite");
    wrapper.innerHTML = `<div class="sh-robot" aria-label="SH assistant">SH</div>
      <div class="sh-message"><button class="sh-close" type="button" aria-label="بستن پیام">×</button>
      <strong>SH 💜</strong><div class="sh-message-text"></div></div>`;
    document.body.appendChild(wrapper);
    wrapper.querySelector(".sh-close").addEventListener("click", () => wrapper.classList.add("sh-hidden"));
  }
  function showMessage(message) {
    createAssistant();
    const el = document.getElementById("sh-assistant");
    el.querySelector(".sh-message-text").textContent = message;
    el.classList.remove("sh-hidden");
  }
  function hideAssistant() {
    const el = document.getElementById("sh-assistant");
    if (el) el.classList.add("sh-hidden");
  }
  function showNextMessage() {
    if (sessionEnd && Date.now() >= sessionEnd) return finishStudy();
    showMessage(messages[messageIndex]);
    messageIndex = (messageIndex + 1) % messages.length;
  }
  function startStudy() {
    if (started) return;
    started = true; sessionEnd = null;
    showMessage("بهشته جانم، خوش آمدی! 💗 آماده‌ای امروز یک قدم به هدفت نزدیک‌تر شوی؟");
    timer = window.setInterval(showNextMessage, 5 * 60 * 1000);
  }
  function finishStudy() {
    if (timer) clearInterval(timer);
    timer = null; started = false; sessionEnd = null;
    showMessage("بهشته جانم، زمان درس امروزت تمام شد! 🎉 موفق باشی، قهرمان پرتلاش! امروز به خودت افتخار کن. 💗");
    const status = document.getElementById("studyStatus");
    if (status) status.textContent = "جلسه تمام شد. آفرین به تلاش امروزت! 💗";
  }
  function scheduleStudyEnd(minutes) {
    const duration = Number(minutes);
    if (!Number.isFinite(duration) || duration <= 0) return false;
    if (timer) clearInterval(timer);
    started = true; sessionEnd = Date.now() + duration * 60 * 1000;
    showMessage("بهشته جانم، زمان مطالعه‌ات شروع شد! 💜 با آرامش پیش برو؛ SH همراهت است.");
    const status = document.getElementById("studyStatus");
    if (status) status.textContent = "جلسه شروع شد؛ SH هر پنج دقیقه یادآوری می‌کند.";
    timer = window.setInterval(() => {
      if (Date.now() >= sessionEnd) finishStudy();
      else showNextMessage();
    }, 5 * 60 * 1000);
    return true;
  }
  function stopStudy() {
    if (timer) clearInterval(timer);
    timer = null; started = false; sessionEnd = null; hideAssistant();
    const status = document.getElementById("studyStatus");
    if (status) status.textContent = "یادآوری‌ها متوقف شد.";
  }

  function speakListening() {
    const p = (window.__toeflPractices || [])[1];
    const passage = p ? p.passage : "Your research proposal is due on Friday. Include a clear research question and at least two academic sources.";
    const status = document.getElementById("listeningStatus");
    if (!("speechSynthesis" in window)) {
      if (status) status.textContent = "پخش صوت در این مرورگر پشتیبانی نمی‌شود.";
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(passage.replace(/^Professor:\s*/i, ""));
    utterance.lang = "en-US"; utterance.rate = 0.88; utterance.pitch = 1;
    utterance.onstart = () => { if (status) status.textContent = "صوت در حال پخش است…"; };
    utterance.onend = () => { if (status) status.textContent = "پخش تمام شد. حالا پاسخ را انتخاب کن."; };
    utterance.onerror = () => { if (status) status.textContent = "پخش صوت انجام نشد؛ دوباره امتحان کن."; };
    window.speechSynthesis.speak(utterance);
  }
  function stopListening() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const status = document.getElementById("listeningStatus");
    if (status) status.textContent = "پخش متوقف شد.";
  }

  function addPanel(kind) {
    const card = document.querySelector("#practice .card");
    if (!card) return null;
    let panel = document.getElementById(kind + "Panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "tool-panel";
    panel.id = kind + "Panel";
    const after = document.getElementById("passage");
    if (after && after.parentNode === card) after.insertAdjacentElement("afterend", panel);
    else card.insertBefore(panel, card.querySelector("#question"));
    return panel;
  }
  function setupListening() {
    const panel = addPanel("listening");
    if (!panel) return;
    panel.innerHTML = `<strong>Listening audio 🔊</strong><p>صدای انگلیسی متن را پخش کن. این نسخه از صدای انگلیسی موجود در مرورگر استفاده می‌کند.</p>
      <div class="tool-row"><button type="button" class="btn primary" id="playListening">▶ پخش صوت</button>
      <button type="button" class="btn" id="stopListening">■ توقف</button></div>
      <div class="tool-status" id="listeningStatus" aria-live="polite"></div>`;
    document.getElementById("playListening").onclick = speakListening;
    document.getElementById("stopListening").onclick = stopListening;
  }
  function setupSpeaking() {
    const panel = addPanel("speaking");
    if (!panel) return;
    panel.innerHTML = `<strong>تمرین صدای تو 🎙️</strong><p>با اجازهٔ میکروفون می‌توانی پاسخ انگلیسی‌ات را ضبط و بعد بازشنوی کنی. این نسخه تلفظ را به‌طور هوشمند نمره‌دهی نمی‌کند.</p>
      <div class="tool-row"><button type="button" class="btn primary" id="startRecording">● شروع ضبط</button>
      <button type="button" class="btn" id="stopRecording" disabled>■ پایان ضبط</button></div>
      <div class="tool-status" id="speakingStatus" aria-live="polite"></div><div id="recordedAudio"></div>`;
    document.getElementById("startRecording").onclick = startRecording;
    document.getElementById("stopRecording").onclick = stopRecording;
  }
  async function startRecording() {
    const status = document.getElementById("speakingStatus");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      status.textContent = "ضبط صدا در این مرورگر یا اتصال فعلی پشتیبانی نمی‌شود. سایت را با HTTPS باز کن و دوباره امتحان کن.";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio:true});
      recordedChunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data && e.data.size) recordedChunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, {type: recorder.mimeType || "audio/webm"});
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(blob);
        document.getElementById("recordedAudio").innerHTML = `<audio controls style="width:100%;margin-top:12px" src="${audioUrl}"></audio>`;
        status.textContent = "ضبط انجام شد؛ صدایت را می‌توانی بازشنوی کنی.";
        if (stream) stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      document.getElementById("startRecording").disabled = true;
      document.getElementById("stopRecording").disabled = false;
      document.getElementById("stopRecording").classList.add("recording");
      status.textContent = "در حال ضبط… پاسخ انگلیسی‌ات را بگو.";
    } catch (e) {
      status.textContent = "اجازهٔ میکروفون داده نشد یا میکروفون در دسترس نیست.";
    }
  }
  function stopRecording() {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;
    document.getElementById("stopRecording").classList.remove("recording");
  }
  function setupWriting() {
    const panel = addPanel("writing");
    if (!panel) return;
    panel.innerHTML = `<strong>تمرین نوشتن ✍️</strong><p>یک پاسخ کوتاه انگلیسی بنویس. این بررسی اولیه، جمله‌های خالی و چند مورد ساده را یادآوری می‌کند؛ جای تصحیح هوشمند را نمی‌گیرد.</p>
      <textarea class="practice-text" id="writingText" placeholder="In my opinion, studying with a group..."></textarea>
      <div class="tool-row"><button type="button" class="btn primary" id="checkWriting">بررسی اولیه</button></div>
      <div class="tool-status" id="writingStatus" aria-live="polite"></div>`;
    document.getElementById("checkWriting").onclick = () => {
      const text = document.getElementById("writingText").value.trim();
      const status = document.getElementById("writingStatus");
      if (!text) { status.textContent = "اول یک یا دو جمله بنویس."; return; }
      const words = text.split(/\s+/).filter(Boolean).length;
      const notes = [];
      if (words < 8) notes.push("پاسخت کوتاه است؛ یک دلیل و مثال اضافه کن.");
      if (!/[.!?]$/.test(text)) notes.push("در پایان جمله نشانه‌گذاری بگذار.");
      if (!/\b(because|for example|however|therefore|also)\b/i.test(text)) notes.push("برای پیوند ایده‌ها از because یا for example استفاده کن.");
      if (/\bi\b/.test(text) && !/\bI\b/.test(text)) notes.push("ضمیر I در انگلیسی همیشه با حرف بزرگ نوشته می‌شود.");
      status.textContent = `تعداد تقریبی واژه‌ها: ${words}. ` + (notes.length ? notes.join(" ") : "شروع خوبی است؛ متن را از نظر دستور زبان و وضوح هم دوباره بخوان.");
    };
  }

  function refreshPracticeTools(i) {
    if (i === 1) setupListening();
    if (i === 2) setupSpeaking();
    if (i === 3) setupWriting();
    if (i !== 1) stopListening();
    if (i !== 2 && recorder && recorder.state !== "inactive") stopRecording();
  }

  function saveStudyProgress() {
    try {
      const data = {
        exercises: Number(document.getElementById("exerciseCount")?.textContent.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) || 0,
        wordsSeen: Number(document.getElementById("wordCount")?.textContent.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) || 0,
        minutes: document.getElementById("minutes")?.value || "30",
        weak: document.getElementById("weak")?.value || "Reading"
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }
  function loadStudyProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!data) return;
      const toLatin = s => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
      if (Number.isFinite(Number(data.exercises))) {
        const n = Math.max(0, Number(data.exercises));
        // Keep the page's own counters in sync with the saved values.
        exercises = n;
        document.getElementById("exerciseCount").textContent = n.toLocaleString("fa-IR");
        document.getElementById("progress").textContent = Math.min(100, n * 20).toLocaleString("fa-IR") + "٪";
      }
      if (Number.isFinite(Number(data.wordsSeen))) {
        wordsSeen = Math.max(0, Number(data.wordsSeen));
        document.getElementById("wordCount").textContent = wordsSeen.toLocaleString("fa-IR");
      }
      if (data.minutes) {
        document.getElementById("minutes").value = toLatin(data.minutes);
        document.getElementById("minutesStat").textContent = toLatin(data.minutes).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]) + " دقیقه";
      }
      if (data.weak) document.getElementById("weak").value = data.weak;
    } catch (_) {}
  }

  function init() {
    createAssistant();
    loadStudyProgress();
    startStudy();
    window.SH = {showMessage, startStudy, finishStudy, scheduleStudyEnd, stopStudy};
    window.refreshPracticeTools = refreshPracticeTools;
    window.saveStudyProgress = saveStudyProgress;
    // If Listening is the default/open practice, tools are available when its tile is tapped.
    const planButton = document.querySelector('#planner button[onclick="makePlan()"]');
    if (planButton) planButton.addEventListener("click", () => saveStudyProgress());
    const minutes = document.getElementById("minutes");
    const weak = document.getElementById("weak");
    if (minutes) minutes.addEventListener("change", saveStudyProgress);
    if (weak) weak.addEventListener("change", saveStudyProgress);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();