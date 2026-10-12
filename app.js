(() => {
"use strict";

const $ = (id) => document.getElementById(id);
const faDigits = (value) => String(value).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const STORAGE_KEY = "beheshtaToeflStudioProgressV1";

const practices = [
  {
    skill: "Reading", title: "Reading · تمرین کوتاه",
    instruction: "متن را بخوان و بهترین پاسخ را انتخاب کن.",
    passage: "Research suggests that urban green spaces can improve residents’ well-being. Parks provide opportunities for exercise and social interaction, while trees may help reduce the effects of high temperatures. However, the benefits are not distributed equally when some neighborhoods have fewer public green areas.",
    question: "What is the main point of the passage?",
    answers: ["A. Parks are expensive to maintain.", "B. Green spaces offer benefits, but access can be unequal.", "C. Trees prevent every urban problem.", "D. Cities should remove public parks."],
    correct: "B", explain: "متن هم مزایای فضای سبز را می‌گوید و هم به نابرابری دسترسی اشاره می‌کند."
  },
  {
    skill: "Listening", title: "Listening · تمرین شنیداری",
    instruction: "ابتدا صدا را پخش کن، سپس پاسخ درست را انتخاب کن.",
    audioText: "Professor: Your research proposal is due on Friday. Include a clear research question and at least two academic sources. You do not need to finish the entire project.",
    passage: "Listen to the professor’s announcement, then answer the question.",
    question: "What should the proposal include?",
    answers: ["A. The complete final project.", "B. A clear question and two academic sources.", "C. Five interviews.", "D. A ten-minute speech."],
    correct: "B", explain: "استاد پرسش روشن و دست‌کم دو منبع اکادمیک را خواسته است."
  },
  {
    skill: "Speaking", title: "Speaking · تمرین پاسخ",
    instruction: "پرسش را بخوان و در ۴۵ ثانیه پاسخ انگلیسی بده. می‌توانی صدایت را ضبط کنی.",
    passage: "Speaking prompt: Do you prefer studying alone or with a group? Explain your preference and give an example.",
    question: "کدام ساختار برای یک پاسخ روشن مناسب‌تر است؟",
    answers: ["A. Opinion, reason, and example", "B. Repeat the question only", "C. Unrelated sentences", "D. No explanation"],
    correct: "A", explain: "ابتدا نظرت را بگو، بعد دلیل و یک مثال کوتاه اضافه کن."
  },
  {
    skill: "Writing", title: "Writing · دستور زبان",
    instruction: "جملهٔ درست را انتخاب کن یا نوشتهٔ خودت را در بخش بازبینی بررسی کن.",
    passage: "Academic writing is clearer when the subject and verb agree and each sentence expresses a complete idea.",
    question: "Which sentence is correct?",
    answers: ["A. Students needs more time.", "B. Students need more time.", "C. Students needing more time.", "D. Students is need more time."],
    correct: "B", explain: "Students فاعل جمع است؛ پس فعل درست need است."
  }
];

const vocab = [
  ["significant", "The policy had a significant effect on education.", "قابل‌توجه، مهم؛ چیزی که اثر یا اهمیت زیادی دارد."],
  ["evaluate", "Researchers evaluate the results carefully.", "ارزیابی‌کردن؛ بررسی کیفیت یا نتیجهٔ چیزی."],
  ["approach", "The teacher used a different approach to learning.", "روش یا رویکرد؛ شیوهٔ انجام‌دادن کاری."],
  ["evidence", "The study provides evidence for this idea.", "شواهد یا مدرک؛ اطلاعاتی که از یک ادعا پشتیبانی می‌کند."],
  ["establish", "The team established a clear set of goals.", "ایجادکردن، پایه‌گذاری‌کردن یا تثبیت‌کردن."],
  ["contribute", "Regular practice can contribute to progress.", "کمک‌کردن یا سهم‌داشتن در به‌وجودآمدن یک نتیجه."]
];

let pIndex = 0;
let answered = false;
let wIndex = 0;
let studyTimer = null;
let reminderTimer = null;
let endTimer = null;
let recordingStream = null;
let recorder = null;
let recordedChunks = [];
let toastTimer = null;
let bubbleTimer = null;
let progress = loadProgress();

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      exercises: Number(saved.exercises) || 0,
      wordsSeen: Number(saved.wordsSeen) || 0,
      minutes: Number(saved.minutes) || 30,
      completed: Array.isArray(saved.completed) ? saved.completed : []
    };
  } catch (_) {
    return { exercises: 0, wordsSeen: 0, minutes: 30, completed: [] };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    $("saveNotice").textContent = "پیشرفت تو در همین مرورگر ذخیره شد.";
  } catch (_) {
    $("saveNotice").textContent = "مرورگر اجازهٔ ذخیرهٔ محلی را نداد.";
  }
}

function updateStats() {
  $("exerciseCount").textContent = faDigits(progress.exercises);
  $("wordCount").textContent = faDigits(progress.wordsSeen);
  $("minutesStat").textContent = faDigits(progress.minutes) + " دقیقه";
  $("progress").textContent = faDigits(Math.min(100, progress.exercises * 20)) + "٪";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

function showSH(message, autoHide = false) {
  $("shMessage").textContent = message;
  $("shBubble").hidden = false;
  if (autoHide) {
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { $("shBubble").hidden = true; }, 9000);
  }
}

function closeSH() {
  $("shBubble").hidden = true;
  clearTimeout(bubbleTimer);
}

function chooseSHMessage() {
  const messages = [
    "بهشته جان، خسته نشدی؟ چایی برات بگیرم یا قهوه؟ حالت خوبه؟ 💜",
    "بهشته جانم، یک نفس عمیق بکش؛ بعد با انرژی ادامه بده. تو می‌تانی! ✨",
    "یادت نره آب بنوشی و کمی شانه‌هایت را استراحت بدهی. 🌷",
    "هر لغت تازه، یک قدم به هدفت نزدیک‌ترت می‌سازد. ادامه بده قهرمان! 💜"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function startStudy() {
  stopStudy(false);
  const minutes = Number($("minutes").value) || 30;
  const endAt = Date.now() + minutes * 60000;
  $("studyStatus").textContent = "جلسه شروع شد؛ " + faDigits(minutes) + " دقیقه برای خودت وقت داری. 💜";
  showSH("بهشته جانم، جلسهٔ مطالعه‌ات شروع شد! من این‌جا هستم؛ قدم‌به‌قدم پیش می‌رویم. ✨", true);
  reminderTimer = setInterval(() => {
    if (Date.now() >= endAt) return;
    showSH(chooseSHMessage(), true);
  }, 5 * 60 * 1000);
  endTimer = setTimeout(() => {
    stopStudy(false);
    $("studyStatus").textContent = "جلسه تمام شد. آفرین به تلاش امروزت! 💜";
    showSH("زمان درس امروزت تمام شد، موفق باشی بهشته جانم. به خودت افتخار کن! 💜✨");
    progress.completed.push(new Date().toISOString().slice(0, 10));
    saveProgress();
  }, minutes * 60 * 1000);
}

function stopStudy(updateStatus = true) {
  clearInterval(reminderTimer);
  clearTimeout(endTimer);
  reminderTimer = null;
  endTimer = null;
  if (updateStatus) $("studyStatus").textContent = "یادآوری جلسه متوقف شد.";
}

function renderPractice(index) {
  pIndex = index;
  answered = false;
  const p = practices[index];
  $("practiceTitle").textContent = p.title;
  $("instruction").textContent = p.instruction;
  $("passage").textContent = p.passage;
  $("question").textContent = p.question;
  $("feedback").textContent = "";
  $("answers").replaceChildren();
  $("audioPanel").hidden = index !== 1;
  $("recordPanel").hidden = index !== 2;
  $("writingPanel").hidden = index !== 3;
  $("writingFeedback").hidden = true;
  $("writingText").value = "";
  p.answers.forEach((answer, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.textContent = answer;
    button.addEventListener("click", () => checkAnswer(button, "ABCD"[i]));
    $("answers").appendChild(button);
  });
}

function checkAnswer(button, letter) {
  if (answered) return;
  answered = true;
  const p = practices[pIndex];
  [...$("answers").querySelectorAll(".answer")].forEach((item, i) => {
    item.disabled = true;
    if ("ABCD"[i] === p.correct) item.classList.add("correct");
  });
  if (letter !== p.correct) button.classList.add("wrong");
  $("feedback").textContent = (letter === p.correct ? "آفرین! پاسخ درست است. " : "پاسخ درست: " + p.correct + ". ") + p.explain;
  progress.exercises += 1;
  updateStats();
  saveProgress();
}

function nextPractice() {
  renderPractice((pIndex + 1) % practices.length);
}

function renderWord() {
  const word = vocab[wIndex];
  $("word").textContent = word[0];
  $("example").textContent = word[1];
  $("meaning").textContent = word[2];
  $("meaning").hidden = true;
  $("vocabStatus").textContent = "";
}

function revealMeaning() {
  if ($("meaning").hidden) {
    $("meaning").hidden = false;
    progress.wordsSeen += 1;
    updateStats();
    saveProgress();
  }
}

function speakText(text, lang = "en-US") {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    showToast("قابلیت پخش گفتار در این مرورگر پشتیبانی نمی‌شود.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.88;
  utterance.onstart = () => {};
  utterance.onerror = () => showToast("پخش صدا انجام نشد؛ دوباره امتحان کن.");
  window.speechSynthesis.speak(utterance);
}

function playListening() {
  const p = practices[1];
  speakText(p.audioText, "en-US");
}

function stopListening() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

async function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    $("recordStatus").textContent = "ضبط صدا در این مرورگر یا اتصال فعلی پشتیبانی نمی‌شود. سایت را با HTTPS و مرورگر به‌روز باز کن.";
    return;
  }
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    recorder = new MediaRecorder(recordingStream);
    recorder.ondataavailable = event => { if (event.data && event.data.size) recordedChunks.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      $("recordPlayback").src = url;
      $("recordPlayback").hidden = false;
      $("recordStatus").textContent = "ضبط تمام شد. می‌توانی صدایت را همین‌جا گوش کنی؛ صدا به سرور فرستاده نمی‌شود.";
      if (recordingStream) recordingStream.getTracks().forEach(track => track.stop());
      recordingStream = null;
    };
    recorder.start();
    $("recordButton").disabled = true;
    $("recordButton").classList.add("recording");
    $("stopRecord").disabled = false;
    $("recordPlayback").hidden = true;
    $("recordStatus").textContent = "در حال ضبط... پاسخ را واضح و به انگلیسی بگو.";
  } catch (_) {
    $("recordStatus").textContent = "اجازهٔ میکروفون داده نشد یا میکروفون در دسترس نیست. تنظیمات مرورگر را بررسی کن.";
  }
}

function stopRecording() {
  if (recorder && recorder.state !== "inactive") recorder.stop();
  $("recordButton").disabled = false;
  $("recordButton").classList.remove("recording");
  $("stopRecord").disabled = true;
}

function reviewWriting() {
  const text = $("writingText").value.trim();
  const box = $("writingFeedback");
  if (!text) {
    box.textContent = "اول یک پاسخ انگلیسی بنویس تا بتوانی آن را بازبینی کنی.";
    box.hidden = false;
    return;
  }
  const words = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const tips = [];
  if (words.length < 20) tips.push("پاسخت کوتاه است؛ برای تمرین تافل، دلیل و مثال مشخص اضافه کن.");
  else tips.push("طول پاسخ: " + faDigits(words.length) + " واژه.");
  if (!/[.!?]$/.test(text)) tips.push("در پایان متن نقطه یا نشانهٔ مناسب بگذار.");
  if (/\bi\b/.test(text)) tips.push("ضمیر I در انگلیسی باید همیشه با حرف بزرگ نوشته شود.");
  if (/\b(he|she|it)\s+(have|do|go|make|need|want)\b/i.test(text)) tips.push("فاعل سوم‌شخص مفرد (he/she/it) در زمان حال ساده معمولاً فعل با s/es می‌گیرد؛ جمله را دوباره بررسی کن.");
  if (/\b(students|people|they|we)\s+(is|has)\b/i.test(text)) tips.push("با فاعل جمع مانند students/people/they معمولاً are/have استفاده می‌شود.");
  if (sentences.length < 2) tips.push("برای روشن‌تر شدن ایده، از چند جملهٔ کامل استفاده کن.");
  if (tips.length === 0) tips.push("نکتهٔ آشکاری از بررسی‌های ساده پیدا نشد. متن را از نظر دلیل، مثال، انسجام و دستور زبان هم مرور کن.");
  box.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = "نتیجهٔ بازبینی اولیه";
  box.appendChild(title);
  const list = document.createElement("ul");
  tips.forEach(tip => { const li = document.createElement("li"); li.textContent = tip; list.appendChild(li); });
  box.appendChild(list);
  const note = document.createElement("p");
  note.textContent = "این بررسی خودکار و ابتدایی است؛ تصحیح کامل هوش مصنوعی نیست.";
  box.appendChild(note);
  box.hidden = false;
}

function makePlan() {
  const total = Number($("minutes").value);
  const skill = $("weak").value;
  const focused = Math.max(5, Math.round(total * 0.4));
  const vocabMinutes = Math.round(total * 0.3);
  const review = Math.max(0, total - focused - vocabMinutes);
  const plan = $("plan");
  plan.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = "برنامهٔ امروز تو";
  plan.appendChild(heading);
  const list = document.createElement("ul");
  [
    faDigits(focused) + " دقیقه: تمرین " + skill,
    faDigits(vocabMinutes) + " دقیقه: واژگان و مثال‌ها",
    faDigits(review) + " دقیقه: مرور اشتباه‌ها"
  ].forEach(text => { const li = document.createElement("li"); li.textContent = text; list.appendChild(li); });
  plan.appendChild(list);
  const end = document.createElement("p");
  end.textContent = "هر روز پیشرفت کوچک هم ارزشمند است.";
  plan.appendChild(end);
  plan.hidden = false;
  progress.minutes = total;
  updateStats();
  saveProgress();
}

function init() {
  updateStats();
  $("minutes").value = String(progress.minutes);
  renderWord();
  renderPractice(0);

  document.querySelectorAll("[data-skill]").forEach(button => {
    button.addEventListener("click", () => {
      renderPractice(Number(button.dataset.skill));
      $("practice").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  $("nextPractice").addEventListener("click", nextPractice);
  $("revealMeaning").addEventListener("click", revealMeaning);
  $("speakWord").addEventListener("click", () => speakText($("word").textContent, "en-US"));
  $("nextWord").addEventListener("click", () => { wIndex = (wIndex + 1) % vocab.length; renderWord(); });
  $("minutes").addEventListener("change", () => {
    progress.minutes = Number($("minutes").value);
    updateStats();
    saveProgress();
  });
  $("makePlan").addEventListener("click", makePlan);
  $("playAudio").addEventListener("click", playListening);
  $("stopAudio").addEventListener("click", stopListening);
  $("recordButton").addEventListener("click", startRecording);
  $("stopRecord").addEventListener("click", stopRecording);
  $("reviewWriting").addEventListener("click", reviewWriting);
  $("clearWriting").addEventListener("click", () => { $("writingText").value = ""; $("writingFeedback").hidden = true; });
  $("startStudy").addEventListener("click", startStudy);
  $("stopStudy").addEventListener("click", () => { stopStudy(true); closeSH(); });
  $("shCharacter").addEventListener("click", () => {
    if ($("shBubble").hidden) showSH(chooseSHMessage());
    else closeSH();
  });
  $("shClose").addEventListener("click", closeSH);
  $("shDismiss").addEventListener("click", closeSH);

  setTimeout(() => showSH("سلام بهشته جانم! خوش آمدی به فضای یادگیری‌ات. امروز فقط با یک قدم کوچک شروع کن. 💜", true), 1200);
  setInterval(() => {
    if ($("shBubble").hidden) showSH(chooseSHMessage(), true);
  }, 5 * 60 * 1000);
}

window.addEventListener("beforeunload", () => {
  stopListening();
  if (recordingStream) recordingStream.getTracks().forEach(track => track.stop());
});
document.addEventListener("DOMContentLoaded", init);
})();