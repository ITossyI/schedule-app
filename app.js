// DayFlow - 개인화 일정관리 앱
const STORAGE_USERS_KEY = "dayflow_users";
const STORAGE_SESSION_KEY = "dayflow_session";

const CATEGORY_LABELS = {
  work: "업무",
  personal: "개인",
  study: "학습",
  health: "건강",
};

const state = {
  authMode: "login", // "login" | "register"
  currentUser: null,
  currentDate: new Date(),
  selectedDateStr: formatDate(new Date()),
  schedules: [],
};

// 유틸
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function getScheduleKey(username) {
  return `dayflow_schedules_${username}`;
}

function loadSchedules(username) {
  return JSON.parse(localStorage.getItem(getScheduleKey(username)) || "[]");
}

function saveSchedules() {
  if (!state.currentUser) return;
  localStorage.setItem(
    getScheduleKey(state.currentUser.username),
    JSON.stringify(state.schedules)
  );
}

// DOM 요소
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authForm = document.getElementById("auth-form");
const authUsername = document.getElementById("auth-username");
const authName = document.getElementById("auth-name");
const authPassword = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const authSubmit = document.getElementById("auth-submit");
const nameGroup = document.getElementById("name-group");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const demoLoginBtn = document.getElementById("demo-login-btn");

// 인증 탭 전환
function setAuthMode(mode) {
  state.authMode = mode;
  authError.textContent = "";
  if (mode === "login") {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    nameGroup.style.display = "none";
    authSubmit.textContent = "로그인";
  } else {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    nameGroup.style.display = "flex";
    authSubmit.textContent = "회원가입";
  }
}

tabLogin.addEventListener("click", () => setAuthMode("login"));
tabRegister.addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = authUsername.value.trim();
  const password = authPassword.value;
  const displayName = authName.value.trim() || username;
  const users = getUsers();

  if (state.authMode === "register") {
    if (username.length < 2) {
      authError.textContent = "아이디는 2자 이상 입력하세요.";
      return;
    }
    if (users[username]) {
      authError.textContent = "이미 존재하는 아이디입니다.";
      return;
    }
    users[username] = {
      username,
      password,
      displayName,
      themeColor: "#4f46e5",
      darkMode: false,
    };
    saveUsers(users);
    loginUser(users[username]);
  } else {
    const user = users[username];
    if (!user || user.password !== password) {
      authError.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
      return;
    }
    loginUser(user);
  }
});

demoLoginBtn.addEventListener("click", () => {
  const users = getUsers();
  if (!users["demo"]) {
    users["demo"] = {
      username: "demo",
      password: "demo",
      displayName: "데모 사용자",
      themeColor: "#4f46e5",
      darkMode: false,
    };
    saveUsers(users);
    const today = formatDate(new Date());
    const sample = [
      {
        id: "demo-1",
        title: "주간 업무 계획 세우기",
        date: today,
        time: "09:30",
        category: "work",
        memo: "이번 주 우선순위 3가지 정리",
        done: false,
      },
      {
        id: "demo-2",
        title: "저녁 러닝 30분",
        date: today,
        time: "19:00",
        category: "health",
        memo: "가벼운 스트레칭 후 시작",
        done: false,
      },
    ];
    localStorage.setItem(getScheduleKey("demo"), JSON.stringify(sample));
  }
  loginUser(users["demo"]);
});

function loginUser(user) {
  state.currentUser = user;
  localStorage.setItem(STORAGE_SESSION_KEY, user.username);
  state.schedules = loadSchedules(user.username);
  applyPersonalization();
  updateUserUI();
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  renderAll();
}

function logoutUser() {
  state.currentUser = null;
  localStorage.removeItem(STORAGE_SESSION_KEY);
  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  authForm.reset();
  authError.textContent = "";
}

document.getElementById("logout-btn").addEventListener("click", logoutUser);
document.getElementById("mobile-logout-btn").addEventListener("click", logoutUser);

// 개인화 적용
function applyPersonalization() {
  if (!state.currentUser) return;
  const { themeColor = "#4f46e5", darkMode = false, displayName } = state.currentUser;
  document.documentElement.style.setProperty("--primary", themeColor);
  document.body.classList.toggle("dark", Boolean(darkMode));

  document.getElementById("setting-name").value = displayName;
  document.getElementById("setting-darkmode").checked = Boolean(darkMode);
  document.querySelectorAll(".color-dot").forEach((dot) => {
    dot.classList.toggle("active", dot.dataset.color === themeColor);
  });
}

function updateUserUI() {
  const { displayName, username } = state.currentUser;
  document.getElementById("user-display-name").textContent = displayName;
  document.getElementById("user-id-label").textContent = `@${username}`;
  document.getElementById("user-avatar").textContent = displayName.charAt(0).toUpperCase();
  document.getElementById("mobile-user-name").textContent = displayName;
}

// 뷰 전환 (PC & 모바일 공용)
function switchView(viewName) {
  document.querySelectorAll(".view-section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `view-${viewName}`);
  });
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
}

document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

// 캘린더 렌더링
function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const label = document.getElementById("current-month-label");
  const filterCat = document.getElementById("calendar-category-filter").value;

  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  label.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const todayStr = formatDate(new Date());
  grid.innerHTML = "";

  // 이전 달 빈칸
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevLastDate - i;
    const cell = document.createElement("div");
    cell.className = "cal-day other-month";
    cell.innerHTML = `<span class="cal-day-num">${dayNum}</span>`;
    grid.appendChild(cell);
  }

  // 이번 달 날짜
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (dateStr === todayStr) cell.classList.add("today");
    if (dateStr === state.selectedDateStr) cell.classList.add("selected");

    const daySchedules = state.schedules.filter(
      (s) => s.date === dateStr && (filterCat === "all" || s.category === filterCat)
    );

    const chipsHtml = daySchedules
      .slice(0, 2)
      .map((s) => `<div class="cal-chip cat-${s.category}">${escapeHtml(s.title)}</div>`)
      .join("");
    const moreHtml = daySchedules.length > 2 ? `<div class="muted-text" style="font-size:10px">+${daySchedules.length - 2}</div>` : "";

    cell.innerHTML = `
      <span class="cal-day-num">${d}</span>
      <div class="cal-dots">${chipsHtml}${moreHtml}</div>
    `;

    cell.addEventListener("click", () => {
      state.selectedDateStr = dateStr;
      renderCalendar();
      renderDayDetail();
    });

    grid.appendChild(cell);
  }
}

function renderDayDetail() {
  const titleEl = document.getElementById("selected-date-title");
  const listEl = document.getElementById("day-schedule-list");
  titleEl.textContent = state.selectedDateStr;

  const items = state.schedules
    .filter((s) => s.date === state.selectedDateStr)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty-state">등록된 일정이 없습니다.<br/>+ 추가 버튼으로 일정을 만들어 보세요.</div>`;
    return;
  }

  listEl.innerHTML = items.map((item) => createScheduleItemHtml(item)).join("");
  bindScheduleItemEvents(listEl);
}

function renderAllList() {
  const listEl = document.getElementById("all-schedule-list");
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const statusFilter = document.getElementById("list-status-filter").value;

  const items = state.schedules
    .filter((s) => {
      const matchQuery =
        !query ||
        s.title.toLowerCase().includes(query) ||
        (s.memo && s.memo.toLowerCase().includes(query));
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "done" && s.done) ||
        (statusFilter === "pending" && !s.done);
      return matchQuery && matchStatus;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty-state">조건에 맞는 일정이 없습니다.</div>`;
    return;
  }

  listEl.innerHTML = items.map((item) => createScheduleItemHtml(item, true)).join("");
  bindScheduleItemEvents(listEl);
}

function renderSummary() {
  const todayStr = formatDate(new Date());
  const todayCount = state.schedules.filter((s) => s.date === todayStr).length;
  const pendingCount = state.schedules.filter((s) => !s.done).length;
  document.getElementById("today-count").textContent = `${todayCount}건`;
  document.getElementById("pending-count").textContent = `${pendingCount}건`;
}

function createScheduleItemHtml(item, showDate = false) {
  return `
    <div class="schedule-item ${item.done ? "done" : ""}" data-id="${item.id}">
      <div class="schedule-left">
        <input type="checkbox" class="schedule-check" ${item.done ? "checked" : ""} aria-label="완료 체크" />
        <div>
          <strong class="schedule-title">${escapeHtml(item.title)}</strong>
          <div class="schedule-meta">
            <span class="cat-badge cat-${item.category}">${CATEGORY_LABELS[item.category]}</span>
            ${showDate ? `<span>${item.date}</span>` : ""}
            <span>${item.time || "종일"}</span>
          </div>
          ${item.memo ? `<p class="schedule-memo">${escapeHtml(item.memo)}</p>` : ""}
        </div>
      </div>
      <div class="schedule-actions">
        <button type="button" class="btn btn-ghost btn-sm edit-btn">수정</button>
        <button type="button" class="btn btn-ghost btn-sm delete-btn" style="color:var(--danger)">삭제</button>
      </div>
    </div>
  `;
}

function bindScheduleItemEvents(container) {
  container.querySelectorAll(".schedule-item").forEach((el) => {
    const id = el.dataset.id;
    el.querySelector(".schedule-check").addEventListener("change", (e) => {
      const target = state.schedules.find((s) => s.id === id);
      if (target) {
        target.done = e.target.checked;
        saveSchedules();
        renderAll();
      }
    });
    el.querySelector(".edit-btn").addEventListener("click", () => openModal(id));
    el.querySelector(".delete-btn").addEventListener("click", () => {
      state.schedules = state.schedules.filter((s) => s.id !== id);
      saveSchedules();
      renderAll();
    });
  });
}

function renderAll() {
  renderCalendar();
  renderDayDetail();
  renderAllList();
  renderSummary();
}

// 월 이동 및 필터 이벤트
document.getElementById("prev-month-btn").addEventListener("click", () => {
  state.currentDate.setMonth(state.currentDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById("next-month-btn").addEventListener("click", () => {
  state.currentDate.setMonth(state.currentDate.getMonth() + 1);
  renderCalendar();
});
document.getElementById("today-btn").addEventListener("click", () => {
  state.currentDate = new Date();
  state.selectedDateStr = formatDate(new Date());
  renderCalendar();
  renderDayDetail();
});
document.getElementById("calendar-category-filter").addEventListener("change", renderCalendar);
document.getElementById("search-input").addEventListener("input", renderAllList);
document.getElementById("list-status-filter").addEventListener("change", renderAllList);

// 모달 (추가/수정)
const modal = document.getElementById("schedule-modal");
const scheduleForm = document.getElementById("schedule-form");

function openModal(editId = null) {
  document.getElementById("schedule-id").value = editId || "";
  if (editId) {
    const item = state.schedules.find((s) => s.id === editId);
    if (!item) return;
    document.getElementById("modal-title").textContent = "일정 수정";
    document.getElementById("schedule-title").value = item.title;
    document.getElementById("schedule-date").value = item.date;
    document.getElementById("schedule-time").value = item.time || "09:00";
    document.getElementById("schedule-category").value = item.category;
    document.getElementById("schedule-memo").value = item.memo || "";
  } else {
    document.getElementById("modal-title").textContent = "새 일정 추가";
    scheduleForm.reset();
    document.getElementById("schedule-date").value = state.selectedDateStr;
    document.getElementById("schedule-time").value = "09:00";
  }
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

document.getElementById("pc-add-btn").addEventListener("click", () => openModal());
document.getElementById("detail-add-btn").addEventListener("click", () => openModal());
document.getElementById("mobile-add-btn").addEventListener("click", () => openModal());
document.getElementById("close-modal-btn").addEventListener("click", closeModal);
document.getElementById("cancel-modal-btn").addEventListener("click", closeModal);

scheduleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("schedule-id").value;
  const payload = {
    id: id || `sch-${Date.now()}`,
    title: document.getElementById("schedule-title").value.trim(),
    date: document.getElementById("schedule-date").value,
    time: document.getElementById("schedule-time").value,
    category: document.getElementById("schedule-category").value,
    memo: document.getElementById("schedule-memo").value.trim(),
    done: false,
  };

  if (id) {
    const idx = state.schedules.findIndex((s) => s.id === id);
    if (idx !== -1) {
      payload.done = state.schedules[idx].done;
      state.schedules[idx] = payload;
    }
  } else {
    state.schedules.push(payload);
  }

  state.selectedDateStr = payload.date;
  saveSchedules();
  closeModal();
  renderAll();
});

// 개인화 설정 저장
let selectedThemeColor = "#4f46e5";
document.querySelectorAll(".color-dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    selectedThemeColor = dot.dataset.color;
    document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("active"));
    dot.classList.add("active");
  });
});

document.getElementById("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const users = getUsers();
  const username = state.currentUser.username;
  const activeDot = document.querySelector(".color-dot.active");
  const color = activeDot ? activeDot.dataset.color : selectedThemeColor;

  users[username].displayName = document.getElementById("setting-name").value.trim() || username;
  users[username].themeColor = color;
  users[username].darkMode = document.getElementById("setting-darkmode").checked;
  saveUsers(users);

  state.currentUser = users[username];
  applyPersonalization();
  updateUserUI();

  const msg = document.getElementById("settings-saved-msg");
  msg.textContent = "설정이 저장되었습니다!";
  setTimeout(() => (msg.textContent = ""), 2500);
});

// 백업 내보내기 / 가져오기
document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.schedules, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dayflow-${state.currentUser.username}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data)) {
        state.schedules = data;
        saveSchedules();
        renderAll();
        alert("일정을 성공적으로 가져왔습니다.");
      }
    } catch {
      alert("올바른 JSON 파일이 아닙니다.");
    }
  };
  reader.readAsText(file);
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 자동 로그인 복원
(function init() {
  const savedUsername = localStorage.getItem(STORAGE_SESSION_KEY);
  if (savedUsername) {
    const users = getUsers();
    if (users[savedUsername]) {
      loginUser(users[savedUsername]);
    }
  }
})();
