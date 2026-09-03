/**
 * tool-duty-roster.js
 * Quản Lý & Xếp Lịch Trực Phòng Công Nghệ Thông Tin Tự Động
 * Đơn giản hóa: Phân công cán bộ trực P.CNTT chịu trách nhiệm toàn diện trong ca trực.
 */

const ToolDutyRoster = {
  // Danh sách cán bộ chính thức Phòng Công Nghệ Thông Tin (BVĐK Bắc Ninh Số 2)
  defaultStaffList: [
    { id: "nv1", name: "KS. Ngô Thanh Tùng", role: "Kỹ sư HIS & CSDL VIMES", dept: "Phòng CNTT", phone: "0912.345.678", offDays: [] },
    { id: "nv2", name: "KS. Trần Văn Nam", role: "Kỹ sư Hạ tầng Mạng & Server", dept: "Phòng CNTT", phone: "0988.112.233", offDays: [] },
    { id: "nv3", name: "CN. Nguyễn Hải Đăng", role: "Cử nhân Phần mềm & Cổng BHYT", dept: "Phòng CNTT", phone: "0977.445.566", offDays: [] },
    { id: "nv4", name: "KTV. Lê Quang Huy", role: "KTV Phần cứng & Máy trạm", dept: "Phòng CNTT", phone: "0966.778.899", offDays: [] },
    { id: "nv5", name: "KTV. Vũ Minh Tuấn", role: "KTV Hỗ trợ Lâm sàng & HIS", dept: "Phòng CNTT", phone: "0944.556.677", offDays: [] },
    { id: "nv6", name: "KS. Phạm Đức Trọng", role: "Kỹ sư Mạng LAN & Viễn thông", dept: "Phòng CNTT", phone: "0933.221.144", offDays: [] },
    { id: "nv7", name: "CN. Đặng Hoàng Long", role: "Cử nhân Ký số & An toàn TT", dept: "Phòng CNTT", phone: "0918.998.877", offDays: [] },
    { id: "nv8", name: "KTV. Bùi Văn Kiên", role: "KTV Thiết bị Ngoại vi & In ấn", dept: "Phòng CNTT", phone: "0904.332.211", offDays: [] }
  ],

  // Vị trí ca trực: Cán bộ trực P.CNTT (chịu trách nhiệm toàn diện 24/7)
  defaultShiftRoles: [
    { id: "shift_cntt", name: "Cán Bộ Trực P.CNTT", badgeColor: "blue" }
  ],

  // Danh sách tài khoản người dùng Phòng CNTT (Mặc định: admin / admin)
  defaultAccounts: [
    {
      id: "acc_admin",
      username: "admin",
      password: "admin",
      fullname: "Trưởng Phòng CNTT (Quản trị)",
      role: "admin",
      dept: "Lãnh Đạo P.CNTT",
      staffId: null
    },
    {
      id: "acc_tungnt",
      username: "tungnt",
      password: "admin",
      fullname: "KS. Ngô Thanh Tùng",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv1"
    },
    {
      id: "acc_namtv",
      username: "namtv",
      password: "admin",
      fullname: "KS. Trần Văn Nam",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv2"
    },
    {
      id: "acc_dangnh",
      username: "dangnh",
      password: "admin",
      fullname: "CN. Nguyễn Hải Đăng",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv3"
    },
    {
      id: "acc_huylq",
      username: "huylq",
      password: "admin",
      fullname: "KTV. Lê Quang Huy",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv4"
    },
    {
      id: "acc_tuanvm",
      username: "tuanvm",
      password: "admin",
      fullname: "KTV. Vũ Minh Tuấn",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv5"
    },
    {
      id: "acc_trongpd",
      username: "trongpd",
      password: "admin",
      fullname: "KS. Phạm Đức Trọng",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv6"
    },
    {
      id: "acc_longdh",
      username: "longdh",
      password: "admin",
      fullname: "CN. Đặng Hoàng Long",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv7"
    },
    {
      id: "acc_kienbv",
      username: "kienbv",
      password: "admin",
      fullname: "KTV. Bùi Văn Kiên",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv8"
    }
  ],

  _staffListCache: null,
  _accountsCache: null,

  getStaffList() {
    if (this._staffListCache !== null) return this._staffListCache;
    try {
      const raw = localStorage.getItem("DUTY_CNTT_STAFF_LIST");
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._staffListCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    this.saveStaffList(this.defaultStaffList, false);
    this._staffListCache = [...this.defaultStaffList];
    return this._staffListCache;
  },

  saveStaffList(list, pushToCloud = true) {
    this._staffListCache = list;
    try {
      localStorage.setItem("DUTY_CNTT_STAFF_LIST", JSON.stringify(list));
    } catch (e) {}
    if (pushToCloud && this.cloudSync) {
      this.cloudSync.pushStaffList(list);
    }
  },

  clearAllStaff() {
    this._staffListCache = [];
    this.saveStaffList([]);
    return [];
  },

  getAccounts() {
    if (this._accountsCache !== null) return this._accountsCache;
    try {
      const raw = localStorage.getItem("DUTY_CNTT_ACCOUNTS");
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._accountsCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    this.saveAccounts(this.defaultAccounts, false);
    this._accountsCache = [...this.defaultAccounts];
    return this._accountsCache;
  },

  saveAccounts(accounts, pushToCloud = true) {
    this._accountsCache = accounts;
    try {
      localStorage.setItem("DUTY_CNTT_ACCOUNTS", JSON.stringify(accounts));
    } catch (e) {}
    if (pushToCloud && this.cloudSync) {
      this.cloudSync.pushAccounts(accounts);
    }
  },

  getCurrentSession() {
    try {
      const raw = localStorage.getItem("DUTY_CNTT_SESSION");
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.username) return session;
      }
    } catch (e) {}
    return null;
  },

  setSession(userObj) {
    if (!userObj) {
      localStorage.removeItem("DUTY_CNTT_SESSION");
    } else {
      localStorage.setItem("DUTY_CNTT_SESSION", JSON.stringify(userObj));
    }
  },

  logout() {
    localStorage.removeItem("DUTY_CNTT_SESSION");
  },

  authenticate(username, password) {
    const accounts = this.getAccounts();
    const user = accounts.find(a => a.username.trim().toLowerCase() === username.trim().toLowerCase() && a.password === password);
    if (user) {
      this.setSession(user);
      return { success: true, user };
    }
    return { success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" };
  },

  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  },

  getDayOfWeek(year, month, day) {
    return new Date(year, month - 1, day).getDay();
  },

  _cacheSchedule: {},

  // Tạo bảng lịch trống khi tháng chưa được phân công (tránh mỗi máy tự sinh một kiểu ngẫu nhiên)
  createEmptySchedule(year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const totalDays = this.getDaysInMonth(y, m);
    const schedule = [];
    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = this.getDayOfWeek(y, m, d);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      schedule.push({
        day: d,
        dayOfWeek: dayOfWeek,
        dayName: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dayOfWeek],
        isWeekend: isWeekend,
        shifts: {
          "shift_cntt": {
            id: "",
            name: "",
            role: "Chưa phân công",
            phone: "",
            dept: "Phòng CNTT",
            isOffDay: false,
            isUnassigned: true
          }
        }
      });
    }
    return schedule;
  },

  // Kiểm tra xem tháng này đã được xếp lịch hay chưa
  isScheduleAssigned(schedule) {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return false;
    return schedule.some(d => {
      const s = d.shifts && d.shifts["shift_cntt"];
      return s && s.id && !s.isUnassigned;
    });
  },

  getSchedule(year, month) {
    const cacheKey = `${year}_${month}`;
    if (this._cacheSchedule[cacheKey]) return this._cacheSchedule[cacheKey];
    try {
      const raw = localStorage.getItem(`DUTY_SCHEDULE_${year}_${month}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this._cacheSchedule[cacheKey] = parsed;
          return parsed;
        }
      }
    } catch (e) {}

    // Trả về bảng mẫu chưa phân công, KHÔNG tự động xếp ngẫu nhiên làm lệch giữa các máy
    const empty = this.createEmptySchedule(year, month);
    this._cacheSchedule[cacheKey] = empty;
    return empty;
  },

  saveSchedule(year, month, schedule, pushToCloud = true) {
    const cacheKey = `${year}_${month}`;
    this._cacheSchedule[cacheKey] = schedule;
    try {
      localStorage.setItem(`DUTY_SCHEDULE_${year}_${month}`, JSON.stringify(schedule));
    } catch (e) {}
    if (pushToCloud && this.cloudSync) {
      this.cloudSync.pushSchedule(year, month, schedule);
    }
  },

  clearSchedule(year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const totalDays = this.getDaysInMonth(y, m);
    const schedule = [];
    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = this.getDayOfWeek(y, m, d);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      schedule.push({
        day: d,
        dayOfWeek: dayOfWeek,
        dayName: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dayOfWeek],
        isWeekend: isWeekend,
        shifts: {
          "shift_cntt": {
            id: "",
            name: "Nghỉ trực",
            role: "Không phân công ca trực",
            phone: "",
            dept: "Phòng CNTT",
            isOffDay: true,
            isUnassigned: false
          }
        }
      });
    }
    this.saveSchedule(y, m, schedule, true);
    return schedule;
  },

  // Module Đồng Bộ Đám Mây & Đa Thiết Bị (Cloud & Multi-Device Sync Engine)
  cloudSync: {
    broadcastChannel: null,
    listeners: [],
    pollingTimer: null,
    isSyncing: false,
    lastSyncTime: null,
    lastSyncUser: "Hệ thống",
    lastSyncStatus: "idle", // "synced", "offline", "syncing", "error"

    // Cấu hình Firebase chính thức từ người dùng
    firebaseConfig: {
      apiKey: "AIzaSyDQzhi52oGxKo1nDsKiL4MHrw-7e-AwJC0",
      authDomain: "congcunghiepvu.firebaseapp.com",
      databaseURL: "https://congcunghiepvu-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "congcunghiepvu",
      storageBucket: "congcunghiepvu.firebasestorage.app",
      messagingSenderId: "391499654470",
      appId: "1:391499654470:web:97a9b95815929a10f37147"
    },

    firestoreDb: null,
    firestoreUnsubscribe: null,
    defaultEndpoint: "https://congcunghiepvu-default-rtdb.asia-southeast1.firebasedatabase.app/duty_roster",

    getEndpoint() {
      const custom = localStorage.getItem("DUTY_CLOUD_API_URL");
      if (custom && custom.trim().startsWith("http")) {
        return custom.trim().replace(/\/+$/, "");
      }
      return this.defaultEndpoint;
    },

    setEndpoint(url) {
      if (!url || !url.trim()) {
        localStorage.removeItem("DUTY_CLOUD_API_URL");
      } else {
        localStorage.setItem("DUTY_CLOUD_API_URL", url.trim().replace(/\/+$/, ""));
      }
    },

    formatUrl(subpath = "") {
      const endpoint = this.getEndpoint();
      let cleanPath = subpath ? subpath.replace(/^\/+/, "") : "";
      let url = cleanPath ? `${endpoint}/${cleanPath}` : endpoint;
      if (!url.endsWith(".json")) {
        url += ".json";
      }
      return url;
    },

    getFirebaseApp() {
      if (typeof firebase === "undefined") return null;
      if (!firebase.apps || !firebase.apps.length) {
        try {
          return firebase.initializeApp(this.firebaseConfig);
        } catch (e) {
          console.warn("[Firebase init]", e);
          return null;
        }
      }
      return firebase.app();
    },

    getFirestoreDb() {
      if (this.firestoreDb) return this.firestoreDb;
      const app = this.getFirebaseApp();
      if (app && typeof firebase.firestore === "function") {
        try {
          this.firestoreDb = firebase.firestore();
          return this.firestoreDb;
        } catch (e) {
          console.warn("[Firestore getDb]", e);
        }
      }
      return null;
    },

    getRealtimeDb() {
      const app = this.getFirebaseApp();
      if (app && typeof firebase.database === "function") {
        try {
          return firebase.database();
        } catch (e) {
          console.warn("[Realtime DB getDb]", e);
        }
      }
      return null;
    },

    initFirestoreListener() {
      this.initFirebaseListener();
    },

    initFirebaseListener() {
      // 1. Lắng nghe qua Realtime Database (Cơ sở dữ liệu thời gian thực)
      const rtdb = this.getRealtimeDb();
      if (rtdb) {
        try {
          rtdb.ref("duty_roster").on("value", (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === "object") {
              this.applyCloudData(data, true);
            }
          }, (err) => {
            console.warn("[Realtime DB Listener Error]", err);
          });
        } catch (e) {
          console.warn("[Realtime DB Init Error]", e);
        }
      }

      // 2. Lắng nghe qua Cloud Firestore (Cửa hàng lửa)
      const fsDb = this.getFirestoreDb();
      if (fsDb && !this.firestoreUnsubscribe) {
        try {
          this.firestoreUnsubscribe = fsDb.collection("duty_roster").doc("master").onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data();
              this.applyCloudData(data, true);
            }
          }, (err) => {
            console.warn("[Firestore onSnapshot Error]", err);
          });
        } catch (e) {
          console.warn("[Firestore Listener Error]", e);
        }
      }
    },

    applyCloudData(data, fromRealtime = false) {
      if (!data || typeof data !== "object") return;
      let hasChange = false;

      // Cập nhật metadata
      if (data.metadata && data.metadata.updaterName) {
        this.lastSyncUser = data.metadata.updaterName;
      }

      // Đồng bộ Danh sách cán bộ
      if (Array.isArray(data.staffList) && data.staffList.length > 0) {
        ToolDutyRoster._staffListCache = data.staffList;
        try { localStorage.setItem("DUTY_CNTT_STAFF_LIST", JSON.stringify(data.staffList)); } catch (e) {}
        hasChange = true;
      }

      // Đồng bộ Tài khoản
      if (Array.isArray(data.accounts) && data.accounts.length > 0) {
        ToolDutyRoster._accountsCache = data.accounts;
        try { localStorage.setItem("DUTY_CNTT_ACCOUNTS", JSON.stringify(data.accounts)); } catch (e) {}
        hasChange = true;
      }

      // Đồng bộ Lịch trực các tháng
      if (data.schedules && typeof data.schedules === "object") {
        Object.entries(data.schedules).forEach(([monthKey, sched]) => {
          if (Array.isArray(sched) && sched.length > 0) {
            ToolDutyRoster._cacheSchedule[monthKey] = sched;
            try { localStorage.setItem(`DUTY_SCHEDULE_${monthKey}`, JSON.stringify(sched)); } catch (e) {}
            hasChange = true;
          }
        });
      }

      this.lastSyncTime = new Date();
      this.lastSyncStatus = "synced";
      this.notifyListeners({ type: "CLOUD_FETCH_SUCCESS", data, hasChange, fromRealtime });
    },

    init(onUpdateCallback) {
      if (onUpdateCallback && !this.listeners.includes(onUpdateCallback)) {
        this.listeners.push(onUpdateCallback);
      }

      // 1. Kênh BroadcastChannel đồng bộ tức thì các tab/cửa sổ trên cùng máy
      try {
        if (typeof BroadcastChannel !== "undefined" && !this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel("duty_roster_channel");
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.type === "ROSTER_UPDATED") {
              this.notifyListeners({ type: "LOCAL_BROADCAST", payload: event.data });
            }
          };
        }
      } catch (e) {}

      // 2. Lắng nghe storage event dự phòng
      window.addEventListener("storage", (e) => {
        if (e.key && (e.key.startsWith("DUTY_SCHEDULE_") || e.key === "DUTY_CNTT_STAFF_LIST" || e.key === "DUTY_CNTT_ACCOUNTS")) {
          this.notifyListeners({ type: "STORAGE_EVENT", key: e.key });
        }
      });

      // 3. Khởi tạo Firestore Realtime Listener
      this.initFirestoreListener();

      // 4. Tự động đồng bộ khi có kết nối mạng trở lại
      window.addEventListener("online", () => {
        this.initFirestoreListener();
        this.fetchCloudData(true);
      });

      // 5. Tự động kiểm tra đồng bộ khi người dùng quay lại tab trình duyệt
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.initFirestoreListener();
          this.fetchCloudData(true);
        }
      });

      // 6. Chu kỳ kiểm tra tự động nền mỗi 45 giây nếu đang mở ứng dụng
      if (!this.pollingTimer) {
        this.pollingTimer = setInterval(() => {
          if (navigator.onLine && document.visibilityState === "visible") {
            this.fetchCloudData(true);
          }
        }, 45000);
      }
    },

    notifyListeners(eventData) {
      this.listeners.forEach(cb => {
        try { cb(eventData); } catch (e) { console.warn("[DutySync Callback]", e); }
      });
    },

    broadcastLocalChange(action, details) {
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: "ROSTER_UPDATED", action, details, timestamp: Date.now() });
        } catch (e) {}
      }
    },

    async fetchCloudData(silent = false) {
      if (!navigator.onLine) {
        this.lastSyncStatus = "offline";
        this.notifyListeners({ type: "SYNC_STATUS_CHANGED", status: "offline" });
        return { success: false, offline: true, message: "Thiết bị đang ở chế độ Ngoại tuyến." };
      }

      this.isSyncing = true;
      this.lastSyncStatus = "syncing";
      this.notifyListeners({ type: "SYNC_STATUS_CHANGED", status: "syncing" });

      // Ưu tiên 1: Firebase Realtime Database
      const rtdb = this.getRealtimeDb();
      if (rtdb) {
        try {
          const snapshot = await rtdb.ref("duty_roster").once("value");
          const data = snapshot.val();
          if (data && typeof data === "object") {
            this.isSyncing = false;
            this.applyCloudData(data, false);
            return { success: true, data };
          }
        } catch (rtdbErr) {
          console.warn("[Realtime DB Fetch]", rtdbErr);
        }
      }

      // Ưu tiên 2: Firebase Firestore SDK
      const db = this.getFirestoreDb();
      if (db) {
        try {
          const doc = await db.collection("duty_roster").doc("master").get();
          this.isSyncing = false;
          if (doc.exists) {
            const data = doc.data();
            this.applyCloudData(data, false);
            return { success: true, data };
          } else {
            // Document chưa có trên Firestore -> Đẩy dữ liệu hiện tại lên
            const initialData = {
              staffList: ToolDutyRoster.getStaffList(),
              accounts: ToolDutyRoster.getAccounts(),
              schedules: {},
              metadata: {
                lastUpdated: new Date().toISOString(),
                updaterName: "Khởi tạo ban đầu",
                version: "3.2.0"
              }
            };
            await db.collection("duty_roster").doc("master").set(initialData);
            this.applyCloudData(initialData, false);
            return { success: true, data: initialData };
          }
        } catch (fsErr) {
          console.warn("[Firestore Fetch Error]", fsErr);
        }
      }

      // Ưu tiên 3: Fallback qua API nội bộ /api/duty
      try {
        const resp = await fetch("/api/duty", {
          method: "GET",
          headers: { "Accept": "application/json" }
        });
        if (resp.ok) {
          const data = await resp.json();
          this.isSyncing = false;
          this.applyCloudData(data, false);
          return { success: true, data };
        }
      } catch (apiErr) {}

      this.isSyncing = false;
      this.lastSyncStatus = "synced";
      return { success: true, localOnly: true };
    },

    async pushSchedule(year, month, schedule) {
      this.broadcastLocalChange("SCHEDULE_SAVED", { year, month });
      if (!navigator.onLine) return { success: false, offline: true };

      const user = ToolDutyRoster.getCurrentSession();
      const meta = {
        lastUpdated: new Date().toISOString(),
        updatedBy: user ? user.username : "admin",
        updaterName: user ? user.fullname : "Trưởng Phòng CNTT",
        version: "3.2.0"
      };

      // 1. Đẩy lên Firebase Realtime Database
      const rtdb = this.getRealtimeDb();
      if (rtdb) {
        try {
          await rtdb.ref(`duty_roster/schedules/${year}_${month}`).set(schedule);
          await rtdb.ref("duty_roster/metadata").set(meta);
          this.lastSyncTime = new Date();
          this.lastSyncStatus = "synced";
        } catch (e) {}
      }

      // 2. Đẩy lên Firebase Firestore
      const db = this.getFirestoreDb();
      if (db) {
        try {
          await db.collection("duty_roster").doc("master").set({
            schedules: {
              [`${year}_${month}`]: schedule
            },
            metadata: meta
          }, { merge: true });

          this.lastSyncTime = new Date();
          this.lastSyncStatus = "synced";
        } catch (fsErr) {
          console.warn("[Firestore Push Schedule Error]", fsErr);
        }
      }

      // 3. Fallback qua /api/duty
      try {
        await fetch(`/api/duty?subpath=schedules/${year}_${month}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schedule)
        });
        this.lastSyncTime = new Date();
        this.lastSyncStatus = "synced";
      } catch (e) {}

      return { success: true };
    },

    async pushStaffList(staffList) {
      this.broadcastLocalChange("STAFF_LIST_SAVED", {});
      if (!navigator.onLine) return { success: false, offline: true };

      const user = ToolDutyRoster.getCurrentSession();
      const meta = {
        lastUpdated: new Date().toISOString(),
        updatedBy: user ? user.username : "admin",
        updaterName: user ? user.fullname : "Trưởng Phòng CNTT",
        version: "3.2.0"
      };

      const rtdb = this.getRealtimeDb();
      if (rtdb) {
        try {
          await rtdb.ref("duty_roster/staffList").set(staffList);
          await rtdb.ref("duty_roster/metadata").set(meta);
          this.lastSyncTime = new Date();
          this.lastSyncStatus = "synced";
        } catch (e) {}
      }

      const db = this.getFirestoreDb();
      if (db) {
        try {
          await db.collection("duty_roster").doc("master").set({
            staffList: staffList,
            metadata: meta
          }, { merge: true });

          this.lastSyncTime = new Date();
          this.lastSyncStatus = "synced";
        } catch (fsErr) {
          console.warn("[Firestore Push StaffList Error]", fsErr);
        }
      }

      try {
        await fetch("/api/duty?subpath=staffList", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(staffList)
        });
        this.lastSyncTime = new Date();
        this.lastSyncStatus = "synced";
      } catch (e) {}

      return { success: true };
    },

    async pushAccounts(accounts) {
      this.broadcastLocalChange("ACCOUNTS_SAVED", {});
      if (!navigator.onLine) return { success: false, offline: true };

      const user = ToolDutyRoster.getCurrentSession();
      const meta = {
        lastUpdated: new Date().toISOString(),
        updatedBy: user ? user.username : "admin",
        updaterName: user ? user.fullname : "Trưởng Phòng CNTT",
        version: "3.2.0"
      };

      const rtdb = this.getRealtimeDb();
      if (rtdb) {
        try {
          await rtdb.ref("duty_roster/accounts").set(accounts);
          await rtdb.ref("duty_roster/metadata").set(meta);
          this.lastSyncTime = new Date();
          this.lastSyncStatus = "synced";
        } catch (e) {}
      }

      const db = this.getFirestoreDb();
      if (db) {
        try {
          await db.collection("duty_roster").doc("master").set({
            accounts: accounts,
            metadata: meta
          }, { merge: true });

          this.lastSyncTime = new Date();
          this.lastSyncStatus = "synced";
        } catch (fsErr) {
          console.warn("[Firestore Push Accounts Error]", fsErr);
        }
      }

      try {
        await fetch("/api/duty?subpath=accounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accounts)
        });
        this.lastSyncTime = new Date();
        this.lastSyncStatus = "synced";
      } catch (e) {}

      return { success: true };
    },

    async testConnection(targetUrl = null) {
      const endpoint = targetUrl || this.getEndpoint();
      let testUrl = endpoint.replace(/\/+$/, "");
      if (!testUrl.endsWith(".json")) {
        testUrl += "/metadata.json";
      }

      const start = Date.now();
      try {
        const resp = await fetch(testUrl, {
          method: "GET",
          headers: { "Accept": "application/json" }
        });
        const duration = Date.now() - start;
        return {
          success: resp.ok,
          status: resp.status,
          latencyMs: duration,
          url: "Firebase Realtime DB (Singapore - asia-southeast1)"
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || "Không phản hồi",
          url: testUrl
        };
      }
    },

    exportBackupJson() {
      const schedules = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("DUTY_SCHEDULE_")) {
          const monthKey = key.replace("DUTY_SCHEDULE_", "");
          try {
            schedules[monthKey] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        }
      }
      return JSON.stringify({
        appName: "Lich_Truc_Phong_CNTT_BVDK_BacNinh_2",
        exportDate: new Date().toISOString(),
        version: "3.2.0",
        staffList: ToolDutyRoster.getStaffList(),
        accounts: ToolDutyRoster.getAccounts(),
        schedules: schedules
      }, null, 2);
    },

    importBackupJson(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== "object") {
          return { success: false, message: "Định dạng file không hợp lệ!" };
        }
        if (Array.isArray(parsed.staffList)) {
          ToolDutyRoster.saveStaffList(parsed.staffList, true);
        }
        if (Array.isArray(parsed.accounts)) {
          ToolDutyRoster.saveAccounts(parsed.accounts, true);
        }
        if (parsed.schedules && typeof parsed.schedules === "object") {
          Object.entries(parsed.schedules).forEach(([monthKey, sched]) => {
            if (Array.isArray(sched)) {
              const parts = monthKey.split("_");
              ToolDutyRoster.saveSchedule(parts[0], parts[1], sched, true);
            }
          });
        }
        this.broadcastLocalChange("BACKUP_RESTORED", {});
        return { success: true, message: "Đã phục hồi dữ liệu sao lưu thành công!" };
      } catch (err) {
        return { success: false, message: "Lỗi phân tích cú pháp file JSON: " + err.message };
      }
    }
  },

  // Cập nhật ca trực cho 1 ngày cụ thể (Đổi người hoặc Đặt ngày nghỉ)
  updateDayShift(year, month, day, staffIdOrAction) {
    const schedule = this.getSchedule(year, month);
    const dayObj = schedule.find(d => d.day === parseInt(day, 10));
    if (!dayObj) return schedule;

    if (staffIdOrAction === "OFF" || staffIdOrAction === "CLEAR" || !staffIdOrAction) {
      dayObj.shifts["shift_cntt"] = {
        id: "",
        name: "Nghỉ trực",
        role: "Không phân công ca trực",
        phone: "",
        dept: "Phòng CNTT",
        isOffDay: true
      };
    } else {
      const staffList = this.getStaffList();
      const staff = staffList.find(s => s.id === staffIdOrAction);
      if (staff) {
        dayObj.shifts["shift_cntt"] = {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          phone: staff.phone || "",
          dept: "Phòng CNTT",
          isOffDay: false
        };
      }
    }
    this.saveSchedule(year, month, schedule);
    return schedule;
  },

  // Hoán đổi chéo ca trực giữa 2 ngày bất kỳ trong tháng
  swapDayShifts(year, month, day1, day2) {
    const schedule = this.getSchedule(year, month);
    const d1 = schedule.find(d => d.day === parseInt(day1, 10));
    const d2 = schedule.find(d => d.day === parseInt(day2, 10));
    if (d1 && d2) {
      const temp = { ...d1.shifts["shift_cntt"] };
      d1.shifts["shift_cntt"] = { ...d2.shifts["shift_cntt"] };
      d2.shifts["shift_cntt"] = temp;
      this.saveSchedule(year, month, schedule);
    }
    return schedule;
  },

  // Thuật toán Tự Động Xếp Lịch Trực Phòng CNTT (Hỗ trợ 2 phương thức: Công bằng & Tuần tự 1->N)
  generateSchedule(year, month, staffList = null, method = "fair") {
    if (method === "sequential") {
      return this.generateScheduleSequential(year, month, staffList);
    }
    return this.generateScheduleFair(year, month, staffList);
  },

  // Phương thức 1: Xếp Xoay Vòng Tuần Tự (Thứ tự 1 -> N)
  generateScheduleSequential(year, month, staffList = null) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const activeStaffList = (staffList && Array.isArray(staffList)) ? staffList : this.getStaffList();
    const dutyEligibleStaff = activeStaffList.filter(s => !s.noDuty);
    const totalDays = this.getDaysInMonth(y, m);
    const schedule = [];

    if (!dutyEligibleStaff || dutyEligibleStaff.length === 0) {
      return this.clearSchedule(y, m);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = this.getDayOfWeek(y, m, d);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const staffIdx = (d - 1) % dutyEligibleStaff.length;
      const s = dutyEligibleStaff[staffIdx];

      schedule.push({
        day: d,
        dayOfWeek: dayOfWeek,
        dayName: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dayOfWeek],
        isWeekend: isWeekend,
        shifts: {
          "shift_cntt": {
            id: s.id,
            name: s.name,
            role: s.role,
            phone: s.phone || "",
            dept: "Phòng CNTT",
            isOffDay: false
          }
        }
      });
    }

    this.saveSchedule(y, m, schedule);
    return schedule;
  },

  // Phương thức 2: Tự Động Công Bằng (Chia đều ca thường/T7/CN & Tránh ngày nghỉ phép)
  generateScheduleFair(year, month, staffList = null) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const activeStaffList = (staffList && Array.isArray(staffList)) ? staffList : this.getStaffList();
    const dutyEligibleStaff = activeStaffList.filter(s => !s.noDuty);
    const totalDays = this.getDaysInMonth(y, m);
    const schedule = [];
    
    if (!dutyEligibleStaff || dutyEligibleStaff.length === 0) {
      return this.clearSchedule(y, m);
    }

    const staffPool = dutyEligibleStaff.map(s => {
      let parsedOffDays = [];
      if (Array.isArray(s.offDays)) {
        parsedOffDays = s.offDays.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      } else if (typeof s.offDays === "string" && s.offDays.trim()) {
        parsedOffDays = s.offDays.split(",").map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      }
      return {
        ...s,
        offDaysList: parsedOffDays,
        shiftCount: 0,
        weekendCount: 0,
        lastAssignedDay: -99
      };
    });

    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = this.getDayOfWeek(y, m, d);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const dayShifts = {};

      let candidates = staffPool.filter(s => {
        const isOff = s.offDaysList && s.offDaysList.includes(d);
        const isConsecutive = (s.lastAssignedDay === d - 1);
        return !isOff && !isConsecutive;
      });

      if (candidates.length === 0) {
        candidates = staffPool.filter(s => !(s.offDaysList && s.offDaysList.includes(d)));
      }
      if (candidates.length === 0) {
        candidates = [...staffPool];
      }

      candidates.sort((a, b) => {
        if (isWeekend && a.weekendCount !== b.weekendCount) return a.weekendCount - b.weekendCount;
        if (a.shiftCount !== b.shiftCount) return a.shiftCount - b.shiftCount;
        return a.lastAssignedDay - b.lastAssignedDay;
      });

      const selectedStaff = candidates[0];
      if (selectedStaff) {
        selectedStaff.shiftCount++;
        if (isWeekend) selectedStaff.weekendCount++;
        selectedStaff.lastAssignedDay = d;

        dayShifts["shift_cntt"] = {
          id: selectedStaff.id,
          name: selectedStaff.name,
          role: selectedStaff.role,
          phone: selectedStaff.phone || "",
          dept: "Phòng CNTT",
          isOffDay: false
        };
      } else {
        dayShifts["shift_cntt"] = { id: "", name: "Nghỉ trực", role: "Không phân công", phone: "", dept: "Phòng CNTT", isOffDay: true };
      }

      schedule.push({
        day: d,
        dayOfWeek: dayOfWeek,
        dayName: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dayOfWeek],
        isWeekend: isWeekend,
        shifts: dayShifts
      });
    }

    this.saveSchedule(y, m, schedule);
    return schedule;
  },

  calculateStatistics(staffList, schedule) {
    const activeStaffList = (staffList && staffList.length > 0) ? staffList : this.getStaffList();
    const stats = {};
    activeStaffList.forEach(s => {
      stats[s.id] = {
        id: s.id,
        name: s.name,
        role: s.role,
        dept: "Phòng CNTT",
        phone: s.phone || "",
        noDuty: !!s.noDuty,
        total: 0,
        weekday: 0,
        weekend: 0,
        days: [],
        shifts: []
      };
    });

    schedule.forEach(dayObj => {
      const assignedStaff = dayObj.shifts["shift_cntt"];
      if (assignedStaff && assignedStaff.id && stats[assignedStaff.id] && !assignedStaff.isOffDay && assignedStaff.name !== "Nghỉ trực") {
        stats[assignedStaff.id].total++;
        if (dayObj.isWeekend) {
          stats[assignedStaff.id].weekend++;
        } else {
          stats[assignedStaff.id].weekday++;
        }
        stats[assignedStaff.id].days.push(dayObj.day);
        stats[assignedStaff.id].shifts.push({ day: dayObj.day, dayName: dayObj.dayName, isWeekend: dayObj.isWeekend });
      }
    });

    return Object.values(stats);
  },

  getPersonalSchedule(staffId, schedule) {
    const personalShifts = [];
    schedule.forEach(dayObj => {
      const assignedStaff = dayObj.shifts["shift_cntt"];
      if (assignedStaff && assignedStaff.id === staffId && !assignedStaff.isOffDay && assignedStaff.name !== "Nghỉ trực") {
        personalShifts.push({
          day: dayObj.day,
          dayName: dayObj.dayName,
          isWeekend: dayObj.isWeekend,
          shiftId: "shift_cntt",
          shiftName: "Trực Phòng CNTT (24/7)",
          phone: assignedStaff.phone || ""
        });
      }
    });

    return personalShifts;
  },

  async exportToExcel(year, month, schedule, staffList = null, shiftRoles = null, orgConfig = {}) {
    const activeStaffList = (staffList && staffList.length > 0) ? staffList : this.getStaffList();
    const province = orgConfig.province || "Bắc Ninh";
    const filename = `Lich_Truc_PCNTT_Thang_${month}_${year}_BVDK_Bac_Ninh_2.xlsx`;

    // Sử dụng ExcelJS nếu có sẵn để tạo bảng tính tuyệt đẹp có màu sắc và định dạng chuẩn
    if (window.ExcelJS) {
      const wb = new window.ExcelJS.Workbook();
      wb.creator = "Phòng Công Nghệ Thông Tin - BVĐK Bắc Ninh Số 2";
      wb.created = new Date();
      
      const ws = wb.addWorksheet(`Lịch Trực T${month}-${year}`, {
        views: [{ showGridLines: true }]
      });

      // Thiết lập độ rộng cột chuẩn
      ws.columns = [
        { key: "stt", width: 7 },       // A: STT
        { key: "date", width: 15 },      // B: Ngày
        { key: "dayName", width: 14 },   // C: Thứ
        { key: "staff", width: 28 },     // D: Cán Bộ Trực
        { key: "role", width: 28 },      // E: Chức Danh / Vị Trí
        { key: "phone", width: 18 },     // F: Số Điện Thoại
        { key: "type", width: 20 }       // G: Phân Loại Ca
      ];

      const borderThin = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      };

      const borderHeader = {
        top: { style: "medium", color: { argb: "FF1E3A8A" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF1E3A8A" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } }
      };

      // 1. Header Đơn Vị & Quốc Hiệu
      ws.mergeCells("A1:C1");
      const cA1 = ws.getCell("A1");
      cA1.value = "SỞ Y TẾ BẮC NINH";
      cA1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
      cA1.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("D1:G1");
      const cD1 = ws.getCell("D1");
      cD1.value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
      cD1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF111827" } };
      cD1.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("A2:C2");
      const cA2 = ws.getCell("A2");
      cA2.value = "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2";
      cA2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
      cA2.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("D2:G2");
      const cD2 = ws.getCell("D2");
      cD2.value = "Độc lập - Tự do - Hạnh phúc";
      cD2.font = { name: "Segoe UI", size: 10, bold: true, italic: true, color: { argb: "FF111827" } };
      cD2.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("A3:C3");
      const cA3 = ws.getCell("A3");
      cA3.value = "PHÒNG CÔNG NGHỆ THÔNG TIN";
      cA3.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF0284C7" } };
      cA3.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells("D3:G3");
      const cD3 = ws.getCell("D3");
      cD3.value = "-------------------";
      cD3.font = { name: "Segoe UI", size: 9, color: { argb: "FF94A3B8" } };
      cD3.alignment = { horizontal: "center", vertical: "middle" };

      // 2. Tiêu Đề Bảng Lịch Trực
      ws.mergeCells("A5:G5");
      const cTitle = ws.getCell("A5");
      cTitle.value = "BẢNG PHÂN CÔNG LỊCH TRỰC PHÒNG CÔNG NGHỆ THÔNG TIN";
      cTitle.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
      cTitle.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(5).height = 26;

      ws.mergeCells("A6:G6");
      const cSub = ws.getCell("A6");
      cSub.value = `THÁNG ${month} NĂM ${year} - BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2`;
      cSub.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0284C7" } };
      cSub.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(6).height = 20;

      ws.mergeCells("A7:G7");
      const cNote = ws.getCell("A7");
      cNote.value = "* Phụ trách: Hệ thống HIS VIMES, Cổng Giám Định BHYT, Ký số, Hạ tầng Server & Mạng LAN Khoa/Phòng 24/7 *";
      cNote.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };
      cNote.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(7).height = 18;

      // 3. Tiêu Đề Cột (Table Header)
      const tableHeaders = ["STT", "Ngày", "Thứ", "Cán Bộ Trực Ca P.CNTT", "Chức Danh / Vị Trí", "Số Điện Thoại Trực", "Phân Loại Ca"];
      const headerRow = ws.getRow(9);
      headerRow.height = 26;
      tableHeaders.forEach((th, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = th;
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = borderHeader;
      });

      // 4. Dữ Liệu Các Ngày Trong Tháng
      let curRowIdx = 10;
      schedule.forEach((d, idx) => {
        const assigned = d.shifts["shift_cntt"];
        const isOff = assigned && (assigned.isOffDay || assigned.name === "Nghỉ trực");
        const isAssigned = (assigned && assigned.id && assigned.name && assigned.name !== "Chưa có cán bộ" && !isOff);
        const row = ws.getRow(curRowIdx);
        row.height = 22;

        const isWeekend = d.isWeekend;
        let rowBgColor = (idx % 2 === 0) ? "FFFFFFFF" : "FFF8FAFC";
        if (isWeekend) rowBgColor = "FFFEF3C7"; // Vàng hổ phách dịu cho cuối tuần
        if (isOff) rowBgColor = "FFFEE2E2";     // Hồng đỏ dịu cho ngày nghỉ

        // STT
        const c1 = row.getCell(1);
        c1.value = idx + 1;
        c1.alignment = { horizontal: "center", vertical: "middle" };
        c1.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF475569" } };

        // Ngày
        const c2 = row.getCell(2);
        c2.value = `Ngày ${d.day < 10 ? '0' + d.day : d.day}/${month < 10 ? '0' + month : month}`;
        c2.alignment = { horizontal: "center", vertical: "middle" };
        c2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: isWeekend ? "FF92400E" : "FF0F172A" } };

        // Thứ
        const c3 = row.getCell(3);
        c3.value = d.dayName;
        c3.alignment = { horizontal: "center", vertical: "middle" };
        c3.font = { name: "Segoe UI", size: 9.5, bold: isWeekend, color: { argb: isWeekend ? "FFB45309" : "FF475569" } };

        // Cán Bộ Trực
        const c4 = row.getCell(4);
        c4.value = isOff ? "Nghỉ trực (Không phân công)" : (isAssigned ? assigned.name : "Chưa phân công");
        c4.alignment = { horizontal: "left", vertical: "middle" };
        c4.font = { name: "Segoe UI", size: 10, bold: isAssigned, color: { argb: isOff ? "FFB91C1C" : (isAssigned ? "FF0369A1" : "FF94A3B8") } };

        // Chức Danh / Vị Trí
        const c5 = row.getCell(5);
        c5.value = isOff ? "Nghỉ Lễ / Nghỉ Trực" : (isAssigned ? (assigned.role || "Phòng CNTT") : "-");
        c5.alignment = { horizontal: "left", vertical: "middle" };
        c5.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF475569" } };

        // Số Điện Thoại
        const c6 = row.getCell(6);
        c6.value = (isAssigned && assigned.phone) ? assigned.phone : "-";
        c6.alignment = { horizontal: "center", vertical: "middle" };
        c6.font = { name: "Segoe UI", size: 9.5, bold: !!(isAssigned && assigned.phone), color: { argb: "FF059669" } };

        // Phân Loại Ca
        const c7 = row.getCell(7);
        c7.value = isOff ? "Nghỉ trực" : (isWeekend ? "Trực Cuối Tuần (24/24)" : "Trực Ngày Thường (24/24)");
        c7.alignment = { horizontal: "center", vertical: "middle" };
        c7.font = { name: "Segoe UI", size: 9, bold: isWeekend, color: { argb: isOff ? "FFB91C1C" : (isWeekend ? "FFD97706" : "FF2563EB") } };

        for (let c = 1; c <= 7; c++) {
          const cell = row.getCell(c);
          cell.border = borderThin;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
        }

        curRowIdx++;
      });

      // 5. Bảng Tổng Hợp Chấm Công & Phân Bổ Ca
      curRowIdx += 2;
      ws.mergeCells(`A${curRowIdx}:G${curRowIdx}`);
      const cSummaryTitle = ws.getCell(`A${curRowIdx}`);
      cSummaryTitle.value = "BẢNG TỔNG HỢP CHẤM CÔNG VÀ PHÂN BỔ CA TRỰC PHÒNG CNTT";
      cSummaryTitle.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cSummaryTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      cSummaryTitle.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(curRowIdx).height = 25;
      curRowIdx++;

      const statsHeaders = ["STT", "Họ Và Tên Cán Bộ", "Chuyên Môn Phụ Trách", "Số Điện Thoại", "Tổng Ca Trực", "Ca Ngày Thường", "Ca Thứ 7 / CN"];
      const statsHeaderRow = ws.getRow(curRowIdx);
      statsHeaderRow.height = 24;
      statsHeaders.forEach((sh, idx) => {
        const cell = statsHeaderRow.getCell(idx + 1);
        cell.value = sh;
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF0F766E" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCFBF1" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = borderThin;
      });
      curRowIdx++;

      const stats = this.calculateStatistics(activeStaffList, schedule);
      let totalAllShifts = 0, totalWeekdayShifts = 0, totalWeekendShifts = 0;

      stats.forEach((st, idx) => {
        const row = ws.getRow(curRowIdx);
        row.height = 22;
        totalAllShifts += st.total;
        totalWeekdayShifts += st.weekday;
        totalWeekendShifts += st.weekend;

        const rowBgColor = (idx % 2 === 0) ? "FFFFFFFF" : "FFF0FDF4";

        row.getCell(1).value = idx + 1;
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

        row.getCell(2).value = st.name;
        row.getCell(2).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

        row.getCell(3).value = st.role || "Phòng CNTT";
        row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };

        row.getCell(4).value = st.phone || "-";
        row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(4).font = { name: "Segoe UI", size: 9.5, color: { argb: "FF059669" } };

        row.getCell(5).value = `${st.total} ca`;
        row.getCell(5).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0284C7" } };
        row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

        row.getCell(6).value = `${st.weekday} ca`;
        row.getCell(6).font = { name: "Segoe UI", size: 9.5, color: { argb: "FF16A34A" } };
        row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

        row.getCell(7).value = `${st.weekend} ca`;
        row.getCell(7).font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFD97706" } };
        row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };

        for (let c = 1; c <= 7; c++) {
          const cell = row.getCell(c);
          cell.border = borderThin;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };
        }
        curRowIdx++;
      });

      // Dòng Tổng Cộng
      const totalRow = ws.getRow(curRowIdx);
      totalRow.height = 24;
      ws.mergeCells(`A${curRowIdx}:D${curRowIdx}`);
      const cTotalLbl = totalRow.getCell(1);
      cTotalLbl.value = "TỔNG CỘNG TOÀN BỘ PHÒNG CNTT:";
      cTotalLbl.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
      cTotalLbl.alignment = { horizontal: "right", vertical: "middle" };

      const cTot5 = totalRow.getCell(5);
      cTot5.value = `${totalAllShifts} ca`;
      cTot5.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF0284C7" } };
      cTot5.alignment = { horizontal: "center", vertical: "middle" };

      const cTot6 = totalRow.getCell(6);
      cTot6.value = `${totalWeekdayShifts} ca`;
      cTot6.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF16A34A" } };
      cTot6.alignment = { horizontal: "center", vertical: "middle" };

      const cTot7 = totalRow.getCell(7);
      cTot7.value = `${totalWeekendShifts} ca`;
      cTot7.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFD97706" } };
      cTot7.alignment = { horizontal: "center", vertical: "middle" };

      for (let c = 1; c <= 7; c++) {
        const cell = totalRow.getCell(c);
        cell.border = {
          top: { style: "thin", color: { argb: "FF0F766E" } },
          bottom: { style: "double", color: { argb: "FF0F766E" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } }
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      }
      curRowIdx += 2;

      // 6. Chữ Ký Phê Duyệt Hành Chính
      ws.mergeCells(`E${curRowIdx}:G${curRowIdx}`);
      const cDateSig = ws.getCell(`E${curRowIdx}`);
      cDateSig.value = `${province}, ngày ${new Date().getDate()} tháng ${month} năm ${year}`;
      cDateSig.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF475569" } };
      cDateSig.alignment = { horizontal: "center", vertical: "middle" };
      curRowIdx++;

      ws.mergeCells(`A${curRowIdx}:C${curRowIdx}`);
      const cSigL1 = ws.getCell(`A${curRowIdx}`);
      cSigL1.value = "NGƯỜI LẬP BẢNG";
      cSigL1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
      cSigL1.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells(`D${curRowIdx}:G${curRowIdx}`);
      const cSigR1 = ws.getCell(`D${curRowIdx}`);
      cSigR1.value = "TRƯỞNG PHÒNG CÔNG NGHỆ THÔNG TIN";
      cSigR1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
      cSigR1.alignment = { horizontal: "center", vertical: "middle" };
      curRowIdx++;

      ws.mergeCells(`A${curRowIdx}:C${curRowIdx}`);
      const cSigL2 = ws.getCell(`A${curRowIdx}`);
      cSigL2.value = "(Ký và ghi rõ họ tên)";
      cSigL2.font = { name: "Segoe UI", size: 8.5, italic: true, color: { argb: "FF64748B" } };
      cSigL2.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells(`D${curRowIdx}:G${curRowIdx}`);
      const cSigR2 = ws.getCell(`D${curRowIdx}`);
      cSigR2.value = "(Ký, ghi rõ họ tên & đóng dấu)";
      cSigR2.font = { name: "Segoe UI", size: 8.5, italic: true, color: { argb: "FF64748B" } };
      cSigR2.alignment = { horizontal: "center", vertical: "middle" };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // Fallback: SheetJS nếu không có ExcelJS
    if (window.XLSX) {
      const rows = [];
      rows.push(["SỞ Y TẾ BẮC NINH", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
      rows.push(["BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2", "", "Độc lập - Tự do - Hạnh phúc"]);
      rows.push(["PHÒNG CÔNG NGHỆ THÔNG TIN", "", "---------------"]);
      rows.push([""]);
      rows.push([`BẢNG PHÂN CÔNG LỊCH TRỰC PHÒNG CÔNG NGHỆ THÔNG TIN`]);
      rows.push([`THÁNG ${month} NĂM ${year} - BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2`]);
      rows.push([""]);
      rows.push(["STT", "Ngày", "Thứ", "Cán Bộ Trực P.CNTT", "Chức Danh / Vị Trí", "Số Điện Thoại Trực", "Ghi Chú"]);

      schedule.forEach((d, idx) => {
        const assigned = d.shifts["shift_cntt"];
        const isOff = assigned && (assigned.isOffDay || assigned.name === "Nghỉ trực");
        rows.push([
          idx + 1,
          `Ngày ${d.day}/${month}`,
          d.dayName,
          isOff ? "Nghỉ trực" : (assigned ? assigned.name : "Chưa phân công"),
          isOff ? "-" : (assigned ? (assigned.role || "") : ""),
          isOff ? "" : (assigned ? (assigned.phone || "") : ""),
          isOff ? "Nghỉ trực" : (d.isWeekend ? "Trực Cuối tuần" : "Trực Ngày thường")
        ]);
      });

      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, `Lich_Truc_T${month}_${year}`);
      window.XLSX.writeFile(wb, filename);
    }
  }
};

window.ToolDutyRoster = ToolDutyRoster;


