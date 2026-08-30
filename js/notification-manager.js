/**
 * notification-manager.js
 * Comprehensive Enterprise Notification & Alert System for BVĐK Bắc Ninh Số 2 Portal
 * Quản lý Trung tâm thông báo, Thông báo đẩy (Toast), Nhắc nhở ca trực & BHYT, Âm thanh Web Audio.
 */

class NotificationManager {
  constructor() {
    this.storageKey = "APP_NOTIFICATIONS_V2";
    this.soundKey = "APP_NOTIF_SOUND_ENABLED";
    this.audioCtx = null;
    this.initAutomatedChecksDone = false;
  }

  getSoundEnabled() {
    return localStorage.getItem(this.soundKey) !== "false";
  }

  setSoundEnabled(enabled) {
    localStorage.setItem(this.soundKey, enabled ? "true" : "false");
  }

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
      localStorage.setItem(this.storageKey, JSON.stringify(list.slice(0, 50)));
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
        title: "Chào mừng bạn đến với Cổng Nghiệp vụ P.CNTT",
        message: "Hệ thống tích hợp đầy đủ công cụ Kiểm tra XML BHYT (QĐ 130), Tra cứu CSDL VIMES, Xếp lịch trực và Quản lý CKS VGCA.",
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
        title: "Tính năng mới: Kiểm tra & Tự sửa lỗi XML BHYT",
        message: "Đã kích hoạt bộ quét đa tầng QĐ 130 & 4210, tự động cân bằng sai số làm tròn tài chính và xuất gói ZIP sạch.",
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
        isRead: false,
        actionText: "Kiểm tra XML",
        actionHash: "#bhyt-xml"
      }
    ];
  }

  addNotification({ type = "info", category = "system", title, message, actionText = null, actionHash = null, icon = null, playSound = false }) {
    const list = this.getNotifications();
    
    // Tránh trùng lặp thông báo giống hệt trong 10 phút
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
      else notifIcon = "ℹ️";
    }

    const newNotif = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      type,
      category,
      icon: notifIcon,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      actionText,
      actionHash
    };

    list.unshift(newNotif);
    this.saveNotifications(list);

    if (playSound && this.getSoundEnabled()) {
      this.playChime(type);
    }

    return newNotif;
  }

  markAsRead(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      this.saveNotifications(list);
    }
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
    this.saveNotifications([]);
  }

  getUnreadCount() {
    const list = this.getNotifications();
    return list.filter(n => !n.isRead).length;
  }

  /**
   * Phát âm thanh chime tinh tế bằng Web Audio API không cần file MP3
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

      if (type === "success") {
        // Hợp âm đôi vui vẻ: C5 (523Hz) -> E5 (659Hz)
        this.playTone(ctx, 523.25, now, 0.12, "sine");
        this.playTone(ctx, 659.25, now + 0.1, 0.2, "sine");
      } else if (type === "warning") {
        // Âm cảnh báo nhẹ: A4 (440Hz) -> F4 (349Hz)
        this.playTone(ctx, 440, now, 0.15, "triangle");
        this.playTone(ctx, 349.23, now + 0.12, 0.25, "triangle");
      } else if (type === "error") {
        // Âm báo lỗi: 300Hz -> 220Hz
        this.playTone(ctx, 300, now, 0.15, "sawtooth");
        this.playTone(ctx, 220, now + 0.12, 0.3, "sawtooth");
      } else {
        // Âm thông báo thường: 587Hz (D5)
        this.playTone(ctx, 587.33, now, 0.15, "sine");
      }
    } catch (e) {
      // Bỏ qua nếu trình duyệt chặn audio khi chưa tương tác
    }
  }

  playTone(ctx, freq, startTime, duration, waveType = "sine") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Tự động quét và sinh các thông báo nhắc nhở thông minh
   */
  runAutomatedSmartAlerts(dutyRosterSchedule = null, staffList = null) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Nhắc nhở Ca Trực Hôm Nay
    if (dutyRosterSchedule && dutyRosterSchedule.length > 0) {
      const todayDuty = dutyRosterSchedule.find(d => d.day === currentDay);
      if (todayDuty && todayDuty.shifts && todayDuty.shifts["shift_cntt"]) {
        const staff = todayDuty.shifts["shift_cntt"];
        if (staff && staff.name && staff.name !== "Chưa phân công") {
          this.addNotification({
            type: "info",
            category: "duty",
            icon: "💻",
            title: `Ca Trực Hôm Nay (Ngày ${currentDay}/${currentMonth})`,
            message: `Cán bộ trực ca: <strong>${staff.name}</strong> (${staff.role || "P.CNTT"}) &bull; Hotline: <strong>${staff.phone || "0912.345.678"}</strong>`,
            actionText: "Xem bảng trực",
            actionHash: "#duty-roster"
          });
        }
      }
    }

    // 2. Nhắc nhở kỳ đối soát Giám định BHYT định kỳ
    if (currentDay >= 12 && currentDay <= 15) {
      this.addNotification({
        type: "warning",
        category: "bhyt",
        icon: "📑",
        title: `Kỳ Báo Cáo Giám Định BHYT Đợt 1 (01 - 14/${currentMonth})`,
        message: `Đang ở cuối kỳ giám định đợt 1. Vui lòng rà soát và đối soát số liệu KCB BHYT trước ngày 15.`,
        actionText: "Mở Báo cáo Giám định",
        actionHash: "#giam-dinh"
      });
    } else if (currentDay >= 27 && currentDay <= 31) {
      this.addNotification({
        type: "warning",
        category: "bhyt",
        icon: "📑",
        title: `Kỳ Báo Cáo Giám Định BHYT Đợt 2 (15 - 31/${currentMonth})`,
        message: `Đang ở cuối kỳ giám định đợt 2. Vui lòng hoàn tất nộp hồ sơ BHYT tháng ${currentMonth}/${currentYear}.`,
        actionText: "Mở Báo cáo Giám định",
        actionHash: "#giam-dinh"
      });
    }

    // 3. Nhắc nhở rà soát Chữ ký số VGCA
    if (currentDay === 1 || currentDay === 15) {
      this.addNotification({
        type: "info",
        category: "vgca",
        icon: "🔐",
        title: `Rà soát Chữ ký số & Email VGCA định kỳ`,
        message: `Kiểm tra các chứng thư số sắp hết hạn hoặc cán bộ mới tiếp nhận cần cấp Token chữ ký số.`,
        actionText: "Đối chiếu CKS",
        actionHash: "#vgca-doi-chieu"
      });
    }
  }

  /**
   * Định dạng thời gian hiển thị thân thiện (ví dụ: '5 phút trước', 'Hôm nay Lúc 14:30')
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
      if (diffDay === 1) return "Hôm qua";
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return "Gần đây";
    }
  }
}

window.NotificationManager = NotificationManager;
