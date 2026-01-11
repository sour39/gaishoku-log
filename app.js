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
const weeklyTotalEl = document.getElementById("weeklyTotal");
const monthlyTotalEl = document.getElementById("monthlyTotal");

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
      if (done.amount != null && done.amount !== "") {
        s.innerHTML = `○${done.type}<br>¥${done.amount}`;
      } else {
        s.textContent = `○${done.type}`;
      }
      cell.appendChild(s);
    }

    cell.onclick = () => openDayModal(date);
    calendarEl.appendChild(cell);
  }

  // 週ごとの合計金額を表示
  renderWeeklyTotal();
  
  // 月ごとの合計金額を表示
  renderMonthlyTotal();
}

/* ===== 週ごとの合計金額表示 ===== */
function renderWeeklyTotal() {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  
  // 月の最初の日曜日を取得
  const firstSunday = new Date(first);
  firstSunday.setDate(first.getDate() - first.getDay());
  
  // 週ごとの合計を計算
  const weeklyTotals = [];
  let currentWeekStart = new Date(firstSunday);
  
  while (currentWeekStart <= last) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    // その週の月内の日付範囲を取得
    const weekStartInMonth = currentWeekStart < first ? first : currentWeekStart;
    const weekEndInMonth = weekEnd > last ? last : weekEnd;
    
    let weekTotal = 0;
    for (let d = new Date(weekStartInMonth); d <= weekEndInMonth; d.setDate(d.getDate() + 1)) {
      const key = dateKey(d);
      const record = actualRecords.find(r => r.date === key);
      if (record && record.amount != null && record.amount !== "") {
        weekTotal += Number(record.amount);
      }
    }
    
    weeklyTotals.push({
      startDate: new Date(weekStartInMonth),
      endDate: new Date(weekEndInMonth),
      total: weekTotal
    });
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  // 表示（合計が0より大きい週のみ表示）
  const filteredTotals = weeklyTotals.filter(w => w.total > 0);
  if (filteredTotals.length > 0) {
    weeklyTotalEl.innerHTML = filteredTotals.map(w => {
      const startDay = w.startDate.getDate();
      const endDay = w.endDate.getDate();
      const startMonth = w.startDate.getMonth() + 1;
      const endMonth = w.endDate.getMonth() + 1;
      
      let dateRange;
      if (startMonth === endMonth) {
        dateRange = `${startMonth}/${startDay}〜${endDay}`;
      } else {
        dateRange = `${startMonth}/${startDay}〜${endMonth}/${endDay}`;
      }
      
      return `<div class="weekly-total-item">${dateRange}：¥${w.total.toLocaleString()}</div>`;
    }).join("");
    weeklyTotalEl.style.display = "block";
  } else {
    weeklyTotalEl.style.display = "none";
  }
}

/* ===== 月ごとの合計金額表示（16日起点） ===== */
function renderMonthlyTotal() {
  // 現在表示している月の16日から次の月の15日までの期間を取得
  const currentMonthStart = new Date(year, month, 16);
  const currentMonthEnd = new Date(year, month + 1, 15);
  
  // その期間内の実績データから金額を合計
  let monthlyTotal = 0;
  for (let d = new Date(currentMonthStart); d <= currentMonthEnd; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    const record = actualRecords.find(r => r.date === key);
    if (record && record.amount != null && record.amount !== "") {
      monthlyTotal += Number(record.amount);
    }
  }
  
  // 期間の表示用
  const startMonth = currentMonthStart.getMonth() + 1;
  const endMonth = currentMonthEnd.getMonth() + 1;
  const startDay = currentMonthStart.getDate();
  const endDay = currentMonthEnd.getDate();
  const startYear = currentMonthStart.getFullYear();
  const endYear = currentMonthEnd.getFullYear();
  
  let dateRange;
  if (startYear === endYear && startMonth === endMonth) {
    dateRange = `${startYear}年${startMonth}月${startDay}日〜${endDay}日`;
  } else if (startYear === endYear) {
    dateRange = `${startYear}年${startMonth}月${startDay}日〜${endMonth}月${endDay}日`;
  } else {
    dateRange = `${startYear}年${startMonth}月${startDay}日〜${endYear}年${endMonth}月${endDay}日`;
  }
  
  // 表示
  if (monthlyTotal > 0) {
    monthlyTotalEl.innerHTML = `<div class="monthly-total-item"><strong>${dateRange}の合計：¥${monthlyTotal.toLocaleString()}</strong></div>`;
    monthlyTotalEl.style.display = "block";
  } else {
    monthlyTotalEl.style.display = "none";
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

  // 既存の実績データを取得して入力欄に反映
  const key = dateKey(date);
  const existingRecord = actualRecords.find(r => r.date === key);
  
  if (existingRecord) {
    actualType.value = existingRecord.type || "外食";
    actualAmount.value = existingRecord.amount != null && existingRecord.amount !== "" ? String(existingRecord.amount) : "";
    actualMemo.value = existingRecord.memo != null && existingRecord.memo !== "" ? existingRecord.memo : "";
  } else {
    actualType.value = "外食";
    actualAmount.value = "";
    actualMemo.value = "";
  }
}

function closeDayModal() {
  dayModal.style.display = "none";
  // 入力フィールドをクリア（次のモーダル表示時に正しく初期化されるように）
  actualType.value = "外食";
  actualAmount.value = "";
  actualMemo.value = "";
}

markDoneBtn.onclick = () => {
  actualRecords = actualRecords.filter(r => r.date !== dateKey(selectedDate));
  const record = {
    date: dateKey(selectedDate),
    type: actualType.value,
    amount: actualAmount.value || null,
    memo: actualMemo.value || null
  };
  actualRecords.push(record);
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
