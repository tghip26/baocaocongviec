/**
 * tool-duty-roster.js
 * Quản Lý & Xếp Lịch Trực Phòng Công Nghệ Thông Tin Tự Động
 * Đơn giản hóa: Phân công cán bộ trực P.CNTT chịu trách nhiệm toàn diện trong ca trực.
 */

const ToolDutyRoster = {
  // Danh sách cán bộ chính thức Phòng Công Nghệ Thông Tin
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
    }
  ],

  getAccounts() {
    try {
      const raw = localStorage.getItem("DUTY_CNTT_ACCOUNTS");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.defaultAccounts;
  },

  saveAccounts(accounts) {
    localStorage.setItem("DUTY_CNTT_ACCOUNTS", JSON.stringify(accounts));
  },

  getCurrentSession() {
    try {
      const raw = localStorage.getItem("DUTY_CNTT_SESSION");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.defaultAccounts[0]; // Mặc định admin
  },

  setSession(userObj) {
    localStorage.setItem("DUTY_CNTT_SESSION", JSON.stringify(userObj));
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

  // Thuật toán Tự Động Xếp Lịch Trực Phòng CNTT (Công bằng, chống trực 2 ngày liên tiếp)
  generateSchedule(year, month, staffList, shiftRoles = null) {
    const totalDays = this.getDaysInMonth(year, month);
    const schedule = [];
    
    const staffPool = staffList.map(s => ({
      ...s,
      shiftCount: 0,
      weekendCount: 0,
      lastAssignedDay: -99
    }));

    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = this.getDayOfWeek(year, month, d);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const dayShifts = {};

      // Ứng viên: không nghỉ phép và không trực ngày hôm trước
      let candidates = staffPool.filter(s => {
        const isOff = s.offDays && s.offDays.includes(d);
        const isConsecutive = (s.lastAssignedDay === d - 1);
        return !isOff && !isConsecutive;
      });

      if (candidates.length === 0) {
        candidates = staffPool.filter(s => !(s.offDays && s.offDays.includes(d)));
      }
      if (candidates.length === 0) {
        candidates = [...staffPool];
      }

      // Ưu tiên chia đều số ca & ca cuối tuần
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
          dept: "Phòng CNTT"
        };
      } else {
        dayShifts["shift_cntt"] = { id: "", name: "Chưa phân công", role: "", phone: "", dept: "" };
      }

      schedule.push({
        day: d,
        dayOfWeek: dayOfWeek,
        dayName: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dayOfWeek],
        isWeekend: isWeekend,
        shifts: dayShifts
      });
    }

    return schedule;
  },

  calculateStatistics(staffList, schedule) {
    const stats = {};
    staffList.forEach(s => {
      stats[s.id] = {
        id: s.id,
        name: s.name,
        role: s.role,
        dept: "Phòng CNTT",
        phone: s.phone || "",
        total: 0,
        weekday: 0,
        weekend: 0,
        shifts: []
      };
    });

    schedule.forEach(dayObj => {
      const assignedStaff = dayObj.shifts["shift_cntt"];
      if (assignedStaff && assignedStaff.id && stats[assignedStaff.id]) {
        stats[assignedStaff.id].total++;
        if (dayObj.isWeekend) {
          stats[assignedStaff.id].weekend++;
        } else {
          stats[assignedStaff.id].weekday++;
        }
        stats[assignedStaff.id].shifts.push({ day: dayObj.day, dayName: dayObj.dayName, isWeekend: dayObj.isWeekend });
      }
    });

    return Object.values(stats);
  },

  getPersonalSchedule(staffId, schedule) {
    const personalShifts = [];
    schedule.forEach(dayObj => {
      const assignedStaff = dayObj.shifts["shift_cntt"];
      if (assignedStaff && assignedStaff.id === staffId) {
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

  exportToExcel(year, month, schedule, staffList, shiftRoles = null, orgConfig = {}) {
    if (!window.XLSX) {
      alert("Thư viện SheetJS XLSX chưa được tải!");
      return;
    }

    const org1 = orgConfig.org1 || "ỦY BAN NHÂN DÂN TỈNH BẮC NINH";
    const org2 = orgConfig.org2 || "SỞ Y TẾ";
    const org3 = orgConfig.org3 || "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2";
    const province = orgConfig.province || "Bắc Ninh";

    const rows = [];
    rows.push([org1.toUpperCase(), "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
    rows.push([org2.toUpperCase(), "", "Độc lập - Tự do - Hạnh phúc"]);
    rows.push([org3.toUpperCase(), "", "---------------"]);
    rows.push(["PHÒNG CÔNG NGHỆ THÔNG TIN", "", ""]);
    rows.push([""]);
    rows.push([`BẢNG PHÂN CÔNG LỊCH TRỰC PHÒNG CÔNG NGHỆ THÔNG TIN`]);
    rows.push([`THÁNG ${month} NĂM ${year} - BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2`]);
    rows.push([`Phụ trách toàn diện: Hệ thống HIS VIMES, Cổng BHYT, Máy Chủ, Ký số & Mạng LAN Khoa/Phòng 24/7`]);
    rows.push([""]);

    // Header Table
    rows.push(["Ngày", "Thứ", "Cán Bộ Trực P.CNTT", "Số Điện Thoại Trực", "Ghi Chú"]);

    // Data Rows
    schedule.forEach(d => {
      const assigned = d.shifts["shift_cntt"];
      rows.push([
        `Ngày ${d.day}/${month}`,
        d.dayName,
        assigned ? assigned.name : "Chưa phân công",
        assigned ? (assigned.phone || "") : "",
        d.isWeekend ? "Trực Cuối tuần" : "Trực Ngày thường"
      ]);
    });

    // Thống kê chấm công
    rows.push([""]);
    rows.push(["BẢNG TỔNG HỢP SỐ CA TRỰC PHÒNG CNTT (CHẤM CÔNG)"]);
    rows.push(["STT", "Họ Và Tên", "Nhiệm Vụ / Vị Trí", "Tổng Số Ca Trực", "Trực Ngày Thường", "Trực Thứ 7 / CN", "Số Điện Thoại"]);
    
    const stats = this.calculateStatistics(staffList, schedule);
    stats.forEach((st, idx) => {
      rows.push([idx + 1, st.name, st.role, st.total, st.weekday, st.weekend, st.phone]);
    });

    rows.push([""]);
    rows.push(["", "", `${province}, ngày ... tháng ${month} năm ${year}`]);
    rows.push(["NGƯỜI LẬP LỊCH", "", "TRƯỞNG PHÒNG CÔNG NGHỆ THÔNG TIN"]);
    rows.push(["(Ký, ghi rõ họ tên)", "", "(Ký, ghi rõ họ tên)"]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Lich_Truc_CNTT_T${month}_${year}`);

    const filename = `LICH_TRUC_PHONG_CNTT_THANG_${month}_${year}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
};

window.ToolDutyRoster = ToolDutyRoster;
