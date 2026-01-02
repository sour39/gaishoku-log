/* ===== データ ===== */
let plannedRules = JSON.parse(localStorage.getItem("plannedRules") || "[]");
let actualRecords = JSON.parse(localStorage.getItem("actualRecords") || "[]");

/* ===== 祝日 ===== */
const holidays = ["2026-01-01", "2026-01-12"];

/* ===== 日付 ===== */
const today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

/* ===== DOM ===== */
const calendarEl = document.getElementById("calendar");
const titleEl = document.getElementById("title");

/* ===== util ===== */
const dateKey = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  
/* ===== カレンダー描画 ===== */
function renderCalendar() {
  calendarEl.innerHTML = "";
  titleEl.textContent = `${year}年 ${month + 1}月`;

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  for (let i = 0; i < first.getDay(); i++) {
    calendarEl.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    const key = dateKey(date);

    const cell = document.createElement("div");
    cell.className = "day";

    if (key === dateKey(today)) cell.classList.add("today");

    const num = document.createElement("div");
    num.className = "day-number";
    if (date.getDay() === 0) num.classList.add("sun");
    if (date.getDay() === 6) num.classList.add("sat");
    if (holidays.includes(key)) num.classList.add("holiday");
    num.textContent = d;
    cell.appendChild(num);

    plannedRules
      .filter(r => r.day === date.getDay())
      .forEach(p => {
        const s = document.createElement("span");
        s.className = `dot plan-${p.type}`;
        s.textContent = `●${p.type}`;
        cell.appendChild(s);
      });

    const done = actualRecords.find(r => r.date === key);
    if (done) {
      const s = document.createElement("span");
      s.className = `dot done-${done.type}`;
      s.textContent = `○${done.type}`;
      cell.appendChild(s);
    }

    cell.onclick = () => openDayModal(date);
    calendarEl.appendChild(cell);
  }
}

/* ===== 月送り ===== */
prevMonth.onclick = () => {
  month--;
  if (month < 0) { month = 11; year--; }
  renderCalendar();
};

nextMonth.onclick = () => {
  month++;
  if (month > 11) { month = 0; year++; }
  renderCalendar();
};

/* ===== 予定設定 ===== */
addRuleBtn.onclick = () => {
  ruleModal.style.display = "flex";
};

clearRuleBtn.onclick = () => {
  if (!confirm("予定をすべて削除しますか？")) return;
  plannedRules = [];
  localStorage.removeItem("plannedRules");
  renderCalendar();
};

saveRuleBtn.onclick = () => {
  const type = ruleType.value;
  document
    .querySelectorAll('#ruleModal input[type="checkbox"]:checked')
    .forEach(cb => plannedRules.push({ day: Number(cb.value), type }));

  localStorage.setItem("plannedRules", JSON.stringify(plannedRules));
  closeRuleModal();
  renderCalendar();
};

function closeRuleModal() {
  ruleModal.style.display = "none";
  document
    .querySelectorAll('#ruleModal input[type="checkbox"]')
    .forEach(cb => cb.checked = false);
}

/* ===== 日付モーダル ===== */
let selectedDate = null;

function openDayModal(date) {
  selectedDate = date;
  dayModal.style.display = "flex";
  modalDate.textContent = `${date.getMonth() + 1}月${date.getDate()}日`;

  const plans = plannedRules.filter(r => r.day === date.getDay());
  modalPlans.innerHTML = plans.length
    ? plans.map(p => `予定：${p.type}`).join("<br>")
    : "予定なし";
}

function closeDayModal() {
  dayModal.style.display = "none";
}

markDoneBtn.onclick = () => {
  actualRecords = actualRecords.filter(r => r.date !== dateKey(selectedDate));
  actualRecords.push({ date: dateKey(selectedDate), type: actualType.value });
  localStorage.setItem("actualRecords", JSON.stringify(actualRecords));
  closeDayModal();
  renderCalendar();
};

removeDoneBtn.onclick = () => {
  actualRecords = actualRecords.filter(r => r.date !== dateKey(selectedDate));
  localStorage.setItem("actualRecords", JSON.stringify(actualRecords));
  closeDayModal();
  renderCalendar();
};

/* ===== 初期描画 ===== */
renderCalendar();
