/**
 * notification-manager.js
 * Comprehensive Enterprise Notification & Alert System for BVĐK Bắc Ninh Số 2 Portal
 * Quản lý Trung tâm thông báo, Thông báo đẩy màn hình (Desktop Push), Ghim thông báo,
 * Nhắc nhở ca trực bệnh viện, Giám định BHYT, Chữ ký số VGCA & Âm thanh Web Audio đa âm tầng.
 */

class NotificationManager {
  constructor() {
    this.storageKey = "APP_NOTIFICATIONS_V2";
    this.soundKey = "APP_NOTIF_SOUND_ENABLED";
    this.volumeKey = "APP_NOTIF_VOLUME";
    this.desktopKey = "APP_NOTIF_DESKTOP_ENABLED";
    this.prefsKey = "APP_NOTIF_ALERT_PREFS";
    this.audioCtx = null;
    this.initAutomatedChecksDone = false;
  }

  /* -------------------------------------------------------------------------- */
  /*                          CẤU HÌNH & TÙY CHỌN                              */
  /* -------------------------------------------------------------------------- */

  getSoundEnabled() {
    return localStorage.getItem(this.soundKey) !== "false";
  }

  setSoundEnabled(enabled) {
    localStorage.setItem(this.soundKey, enabled ? "true" : "false");
  }

  getVolume() {
    const v = localStorage.getItem(this.volumeKey);
    return v ? parseFloat(v) : 0.6; // Mặc định 60%
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, parseFloat(vol) || 0.6));
    localStorage.setItem(this.volumeKey, clamped.toString());
  }

  getDesktopEnabled() {
    return localStorage.getItem(this.desktopKey) === "true";
  }

  setDesktopEnabled(enabled) {
    localStorage.setItem(this.desktopKey, enabled ? "true" : "false");
  }

  getAlertPrefs() {
    try {
      const raw = localStorage.getItem(this.prefsKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      alertDutyToday: true,
      alertDutyTomorrow: true,
      alertBhytDeadlines: true,
      alertVgcaReview: true,
      alertCloudSync: true
    };
  }

  setAlertPrefs(prefs) {
    try {
      localStorage.setItem(this.prefsKey, JSON.stringify(prefs));
    } catch (e) {}
  }

  /* -------------------------------------------------------------------------- */
  /*                      DESKTOP NATIVE WEB NOTIFICATIONS                     */
  /* -------------------------------------------------------------------------- */

  hasDesktopSupport() {
    return ("Notification" in window);
  }

  hasDesktopPermission() {
    return this.hasDesktopSupport() && Notification.permission === "granted";
  }

  async requestDesktopPermission() {
    if (!this.hasDesktopSupport()) return false;
    try {
      const perm = await Notification.requestPermission();
      const granted = (perm === "granted");
      this.setDesktopEnabled(granted);
      return granted;
    } catch (e) {
      console.warn("Lỗi xin quyền thông báo Desktop:", e);
      return false;
    }
  }

  sendDesktopNotification(title, options = {}) {
    if (!this.getDesktopEnabled() || !this.hasDesktopPermission()) return null;
    try {
      const notif = new Notification(title, {
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        silent: true, // Để Web Audio tự xử lý âm thanh
        ...options
      });

      notif.onclick = () => {
        window.focus();
        if (options.actionHash) {
          window.location.hash = options.actionHash;
        }
        notif.close();
      };
      return notif;
    } catch (e) {
      console.warn("Lỗi gửi Desktop Notification:", e);
      return null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                          DỮ LIỆU THÔNG BÁO                                 */
  /* -------------------------------------------------------------------------- */

  getNotifications() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Lỗi đọc danh sách thông báo:", e);
    }
    return this.getDefaultNotifications();
  }

  saveNotifications(list) {
    try {
      // Giữ tối đa 60 thông báo gần nhất
      localStorage.setItem(this.storageKey, JSON.stringify(list.slice(0, 60)));
    } catch (e) {
      console.error("Lỗi lưu thông báo:", e);
    }
  }

  getDefaultNotifications() {
    const now = new Date();
    return [
      {
        id: "notif_welcome",
        type: "success",
        category: "system",
        icon: "🌟",
        pinned: true,
        title: "Chào mừng bạn đến với Cổng Nghiệp vụ P.CNTT",
        message: "Hệ thống tích hợp đầy đủ công cụ Kiểm tra XML BHYT (QĐ 130), Tra cứu CSDL VIMES, Xếp lịch trực tự động, Quản lý CKS VGCA, và bộ công cụ Web CMS.",
        timestamp: now.toISOString(),
        isRead: false,
        actionText: "Khám phá ngay",
        actionHash: "#hub"
      },
      {
        id: "notif_bhyt_feature",
        type: "info",
        category: "bhyt",
        icon: "📑",
        pinned: false,
        title: "Bộ quét & Tự sửa lỗi XML BHYT (QĐ 130 & 4210)",
        message: "Kích hoạt kiểm tra đa tầng, tự động cân bằng sai số làm tròn tài chính XML3 và xuất gói ZIP hồ sơ sạch nộp Cổng tiếp nhận.",
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
        isRead: false,
        actionText: "Kiểm tra XML",
        actionHash: "#bhyt-xml"
      },
      {
        id: "notif_tools_upgrade",
        type: "success",
        category: "system",
        icon: "🚀",
        pinned: false,
        title: "Nâng cấp Tool Word sang HTML & Xuất ảnh PDF",
        message: "Hỗ trợ gộp ô bảng biểu (rowspan), trích xuất toàn bộ ảnh Word (.ZIP), bộ lọc làm trắng bản scan y tế, trích xuất text PDF và lưu thẳng vào thư mục máy tính.",
        timestamp: new Date(now.getTime() - 7200000).toISOString(),
        isRead: false,
        actionText: "Xem Word sang HTML",
        actionHash: "#word-to-html"
      }
    ];
  }

  addNotification({
    type = "info",
    category = "system",
    title,
    message,
    actionText = null,
    actionHash = null,
    icon = null,
    pinned = false,
    playSound = false,
    showDesktop = false
  }) {
    const list = this.getNotifications();
    
    // Chống trùng lặp thông báo giống hệt trong 10 phút
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const exists = list.some(n => n.title === title && new Date(n.timestamp).getTime() > tenMinsAgo);
    if (exists) return null;

    let notifIcon = icon;
    if (!notifIcon) {
      if (type === "success") notifIcon = "✅";
      else if (type === "warning") notifIcon = "⚠️";
      else if (type === "error") notifIcon = "❌";
      else if (category === "duty") notifIcon = "📅";
      else if (category === "bhyt") notifIcon = "🏥";
      else if (category === "vgca") notifIcon = "🔐";
      else notifIcon = "ℹ️";
    }

    const newNotif = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type,
      category,
      icon: notifIcon,
      pinned: Boolean(pinned),
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      actionText,
      actionHash
    };

    // Đưa vào đầu danh sách
    list.unshift(newNotif);
    this.saveNotifications(list);

    if (playSound && this.getSoundEnabled()) {
      this.playChime(type);
    }

    if (showDesktop) {
      const plainMessage = message.replace(/<[^>]+>/g, " ");
      this.sendDesktopNotification(title, {
        body: plainMessage,
        actionHash
      });
    }

    return newNotif;
  }

  togglePin(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.pinned = !item.pinned;
      this.saveNotifications(list);
      return item.pinned;
    }
    return false;
  }

  markAsRead(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      this.saveNotifications(list);
    }
  }

  toggleRead(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = !item.isRead;
      this.saveNotifications(list);
      return item.isRead;
    }
    return false;
  }

  markAllAsRead() {
    const list = this.getNotifications();
    list.forEach(n => n.isRead = true);
    this.saveNotifications(list);
  }

  deleteNotification(id) {
    const list = this.getNotifications().filter(n => n.id !== id);
    this.saveNotifications(list);
  }

  clearAll() {
    // Chỉ xóa các thông báo không được ghim (preserve pinned)
    const list = this.getNotifications().filter(n => n.pinned);
    this.saveNotifications(list);
  }

  getUnreadCount() {
    const list = this.getNotifications();
    return list.filter(n => !n.isRead).length;
  }

  /**
   * Lọc và tìm kiếm thông báo nâng cao
   */
  getFilteredNotifications({ search = "", category = "all", status = "all" } = {}) {
    let list = this.getNotifications();

    // 1. Lọc theo danh mục
    if (category && category !== "all") {
      list = list.filter(n => n.category === category);
    }

    // 2. Lọc theo trạng thái đọc / ghim
    if (status === "unread") {
      list = list.filter(n => !n.isRead);
    } else if (status === "pinned") {
      list = list.filter(n => n.pinned);
    }

    // 3. Tìm kiếm theo từ khóa
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.actionText && n.actionText.toLowerCase().includes(q))
      );
    }

    // 4. Sắp xếp: Pinned luôn lên đầu, sau đó sắp theo timestamp mới nhất
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                     ÂM THANH WEB AUDIO SYNTHESIZER                         */
  /* -------------------------------------------------------------------------- */

  /**
   * Phát âm thanh chime tinh tế bằng Web Audio API không cần bất kỳ file MP3 nào
   */
  playChime(type = "info") {
    if (!this.getSoundEnabled()) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const vol = this.getVolume();

      if (type === "success") {
        // Hợp âm 3 nốt vui tươi: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
        this.playTone(ctx, 523.25, now, 0.1, "sine", vol);
        this.playTone(ctx, 659.25, now + 0.08, 0.12, "sine", vol);
        this.playTone(ctx, 783.99, now + 0.16, 0.25, "sine", vol);
      } else if (type === "warning") {
        // Cảnh báo 2 nhịp êm dịu: A4 (440Hz) -> F4 (349Hz)
        this.playTone(ctx, 440, now, 0.14, "triangle", vol);
        this.playTone(ctx, 349.23, now + 0.12, 0.28, "triangle", vol);
      } else if (type === "error") {
        // Báo lỗi 2 âm trầm dứt khoát: 320Hz -> 220Hz
        this.playTone(ctx, 320, now, 0.15, "sawtooth", vol * 0.9);
        this.playTone(ctx, 220, now + 0.12, 0.32, "sawtooth", vol * 0.9);
      } else if (type === "duty") {
        // Âm ca trực đặc trưng: G4 (392Hz) -> C5 (523Hz)
        this.playTone(ctx, 392, now, 0.12, "sine", vol);
        this.playTone(ctx, 523.25, now + 0.1, 0.28, "sine", vol);
      } else {
        // Âm thông báo thường êm dịu: D5 (587Hz) -> A5 (880Hz)
        this.playTone(ctx, 587.33, now, 0.12, "sine", vol);
        this.playTone(ctx, 880, now + 0.1, 0.2, "sine", vol);
      }
    } catch (e) {
      // Bỏ qua nếu trình duyệt chưa kích hoạt user gesture
    }
  }

  playTone(ctx, freq, startTime, duration, waveType = "sine", volume = 0.6) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    const targetGain = 0.08 * volume;
    gain.gain.setValueAtTime(targetGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /* -------------------------------------------------------------------------- */
  /*             HỆ THỐNG CẢNH BÁO THÔNG MINH BỆNH VIỆN TỰ ĐỘNG               */
  /* -------------------------------------------------------------------------- */

  /**
   * Tự động quét và phát hiện các thông báo nhắc nhở quan trọng theo nghiệp vụ y tế
   */
  runAutomatedSmartAlerts(dutyRosterSchedule = null, staffList = null) {
    const prefs = this.getAlertPrefs();
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Nhắc nhở Ca Trực Hôm Nay
    if (prefs.alertDutyToday && dutyRosterSchedule && dutyRosterSchedule.length > 0) {
      const todayDuty = dutyRosterSchedule.find(d => d.day === currentDay);
      if (todayDuty && todayDuty.shifts && todayDuty.shifts["shift_cntt"]) {
        const staff = todayDuty.shifts["shift_cntt"];
        if (staff && staff.name && staff.name !== "Chưa phân công") {
          this.addNotification({
            type: "info",
            category: "duty",
            icon: "💻",
            title: `Ca Trực Hôm Nay (${currentDay}/${currentMonth})`,
            message: `Cán bộ trực ca: <strong>${staff.name}</strong> (${staff.role || "P.CNTT"}) &bull; Hotline: <strong>${staff.phone || "0912.345.678"}</strong>. Chúc đồng chí ca trực bình an!`,
            actionText: "Xem bảng trực",
            actionHash: "#duty-roster",
            showDesktop: true
          });
        }
      }

      // 2. Nhắc nhở Ca Trực Ngày Mai
      if (prefs.alertDutyTomorrow) {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowDay = tomorrow.getDate();
        if (tomorrow.getMonth() + 1 === currentMonth) {
          const tomorrowDuty = dutyRosterSchedule.find(d => d.day === tomorrowDay);
          if (tomorrowDuty && tomorrowDuty.shifts && tomorrowDuty.shifts["shift_cntt"]) {
            const tmStaff = tomorrowDuty.shifts["shift_cntt"];
            if (tmStaff && tmStaff.name && tmStaff.name !== "Chưa phân công") {
              this.addNotification({
                type: "info",
                category: "duty",
                icon: "⏰",
                title: `Nhắc Nhở: Ca Trực Ngày Mai (${tomorrowDay}/${currentMonth})`,
                message: `Cán bộ trực tiếp theo: <strong>${tmStaff.name}</strong> (${tmStaff.role || "P.CNTT"}). Vui lòng chuẩn bị sẵn sàng thiết bị và thông tin bàn giao ca trực.`,
                actionText: "Xem lịch trực",
                actionHash: "#duty-roster"
              });
            }
          }
        }
      }

      // 3. Cảnh báo các ngày chưa phân công trực CNTT trong tháng
      const unassignedDays = dutyRosterSchedule.filter(d => 
        d.day >= currentDay && 
        (!d.shifts || !d.shifts["shift_cntt"] || !d.shifts["shift_cntt"].name || d.shifts["shift_cntt"].name === "Chưa phân công")
      );
      if (unassignedDays.length > 0) {
        this.addNotification({
          type: "warning",
          category: "duty",
          icon: "⚠️",
          title: `Cảnh Báo: Còn ${unassignedDays.length} ngày chưa phân công trực!`,
          message: `Các ngày [${unassignedDays.map(d => d.day).slice(0, 5).join(", ")}${unassignedDays.length > 5 ? "..." : ""}] trong tháng ${currentMonth} chưa có cán bộ trực CNTT. Vui lòng xếp bổ sung.`,
          actionText: "Xếp lịch trực ngay",
          actionHash: "#duty-roster"
        });
      }
    }

    // 4. Nhắc nhở kỳ đối soát Giám định BHYT định kỳ (BHXH Việt Nam)
    if (prefs.alertBhytDeadlines) {
      if (currentDay >= 11 && currentDay <= 15) {
        this.addNotification({
          type: "warning",
          category: "bhyt",
          icon: "📑",
          title: `Hạn Chót Báo Cáo Giám Định BHYT Đợt 1 (1 - 14/${currentMonth})`,
          message: `Đang ở cuối kỳ giám định đợt 1. Vui lòng rà soát và đối soát số liệu KCB BHYT trước ngày 15/${currentMonth}.`,
          actionText: "Mở Báo Cáo Giám Định",
          actionHash: "#giam-dinh",
          showDesktop: true
        });
      } else if (currentDay >= 26 && currentDay <= 31) {
        this.addNotification({
          type: "warning",
          category: "bhyt",
          icon: "📑",
          title: `Hạn Chót Báo Cáo Giám Định BHYT Đợt 2 (15 - cuối tháng ${currentMonth})`,
          message: `Đang ở cuối kỳ giám định đợt 2. Vui lòng hoàn tất nộp hồ sơ BHYT tháng ${currentMonth}/${currentYear} lên Cổng giám định BHXH.`,
          actionText: "Mở Báo Cáo Giám Định",
          actionHash: "#giam-dinh",
          showDesktop: true
        });
      }
    }

    // 5. Nhắc nhở rà soát Chữ ký số VGCA & Email công vụ định kỳ
    if (prefs.alertVgcaReview && (currentDay === 1 || currentDay === 15)) {
      this.addNotification({
        type: "info",
        category: "vgca",
        icon: "🔐",
        title: `Rà Soát Chữ Ký Số & Email VGCA Định Kỳ`,
        message: `Kiểm tra các chứng thư số sắp hết hạn hoặc cán bộ mới tiếp nhận cần đăng ký cấp Token chữ ký số Ban Cơ Yếu.`,
        actionText: "Đối Chiếu CKS",
        actionHash: "#vgca-doi-chieu"
      });
    }
  }

  /**
   * Định dạng thời gian hiển thị thân thiện tiếng Việt
   */
  formatTimeAgo(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay === 1) return `Hôm qua ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return "Gần đây";
    }
  }
}

window.NotificationManager = NotificationManager;
