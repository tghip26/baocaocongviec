/**
 * tool-duty-roster.js
 * Quản Lý & Xếp Lịch Trực Phòng Công Nghệ Thông Tin Tự Động
 * Dành riêng cho Phòng CNTT Bệnh Viện Đa Khoa Bắc Ninh Số 2: Trực Hệ thống HIS, Server, CSDL VIMES & Hỗ trợ kỹ thuật lâm sàng.
 */

const ToolDutyRoster = {
  // Danh sách nhân sự chính thức Phòng Công Nghệ Thông Tin
  defaultStaffList: [
    { id: "nv1", name: "KS. Ngô Thanh Tùng", role: "Kỹ sư HIS & CSDL VIMES", group: "cntt_main", dept: "Phòng CNTT", phone: "0912.345.678", offDays: [] },
    { id: "nv2", name: "KS. Trần Văn Nam", role: "Kỹ sư Hạ tầng Mạng & Server", group: "cntt_main", dept: "Phòng CNTT", phone: "0988.112.233", offDays: [] },
    { id: "nv3", name: "CN. Nguyễn Hải Đăng", role: "Cử nhân Phần mềm & Cổng BHYT", group: "cntt_main", dept: "Phòng CNTT", phone: "0977.445.566", offDays: [] },
    { id: "nv4", name: "KTV. Lê Quang Huy", role: "KTV Phần cứng & Máy trạm", group: "cntt_sub", dept: "Phòng CNTT", phone: "0966.778.899", offDays: [] },
    { id: "nv5", name: "KTV. Vũ Minh Tuấn", role: "KTV Hỗ trợ Lâm sàng & HIS", group: "cntt_sub", dept: "Phòng CNTT", phone: "0944.556.677", offDays: [] },
    { id: "nv6", name: "KS. Phạm Đức Trọng", role: "Kỹ sư Mạng LAN & Viễn thông", group: "cntt_sub", dept: "Phòng CNTT", phone: "0933.221.144", offDays: [] },
    { id: "nv7", name: "CN. Đặng Hoàng Long", role: "Cử nhân Ký số & An toàn TT", group: "cntt_main", dept: "Phòng CNTT", phone: "0918.998.877", offDays: [] },
    { id: "nv8", name: "KTV. Bùi Văn Kiên", role: "KTV Thiết bị Ngoại vi & In ấn", group: "cntt_sub", dept: "Phòng CNTT", phone: "0904.332.211", offDays: [] }
  ],

  // Các vị trí ca trực chuyên môn trong ngày của Phòng CNTT
  defaultShiftRoles: [
    { id: "shift_cntt_chinh", name: "🖥️ Trực Chính (HIS, Máy Chủ & CSDL)", group: "cntt_main", badgeColor: "blue", desc: "Giám sát HIS VIMES, Oracle/PostgreSQL, Cổng BHYT, CKS" },
    { id: "shift_cntt_phu", name: "🛠️ Trực Phụ (Hỗ Trợ Lâm Sàng & Mạng)", group: "cntt_sub", badgeColor: "cyan", desc: "Xử lý máy trạm, máy in, mạng LAN các khoa Khám bệnh, Cấp cứu, Điều trị" },
    { id: "shift_cntt_oncall", name: "📞 Trực On-Call / Chỉ Huy (Lãnh Đạo Phòng)", group: "cntt_main", badgeColor: "amber", desc: "Chỉ đạo xử lý sự cố cấp bách, hỗ trợ từ xa 24/7" }
  ],

  // Danh sách tài khoản người dùng Phòng CNTT (Mặc định: admin / admin)
  defaultAccounts: [
    {
      id: "acc_admin",
      username: "admin",
      password: "admin",
      fullname: "Quản Trị Viên (Trưởng Phòng CNTT)",
      role: "admin",
      dept: "Lãnh Đạo Phòng CNTT",
      staffId: null
    },
    {
      id: "acc_tungnt",
      username: "tungnt",
      password: "admin",
      fullname: "KS. Ngô Thanh Tùng",
      role: "user",
      dept: "Tổ Hệ Thống & HIS",
      staffId: "nv1"
    },
    {
      id: "acc_namtv",
      username: "namtv",
      password: "admin",
      fullname: "KS. Trần Văn Nam",
      role: "user",
      dept: "Tổ Hạ Tầng & Server",
      staffId: "nv2"
    },
    {
      id: "acc_dangnh",
      username: "dangnh",
      password: "admin",
      fullname: "CN. Nguyễn Hải Đăng",
      role: "user",
      dept: "Tổ Phần Mềm & BHYT",
      staffId: "nv3"
    },
    {
      id: "acc_huylq",
      username: "huylq",
      password: "admin",
      fullname: "KTV. Lê Quang Huy",
      role: "user",
      dept: "Tổ Kỹ Thuật Máy Trạm",
      staffId: "nv4"
    },
    {
      id: "acc_tuanvm",
      username: "tuanvm",
      password: "admin",
      fullname: "KTV. Vũ Minh Tuấn",
      role: "user",
      dept: "Tổ Hỗ Trợ Lâm Sàng",
      staffId: "nv5"
    },
    {
      id: "acc_trongpd",
      username: "trongpd",
      password: "admin",
      fullname: "KS. Phạm Đức Trọng",
      role: "user",
      dept: "Tổ Mạng & Viễn Thông",
      staffId: "nv6"
    }
  ],

  // Lấy danh sách tài khoản từ localStorage
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

  // Quản lý phiên đăng nhập hiện tại
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

  // Xác thực đăng nhập
  authenticate(username, password) {
    const accounts = this.getAccounts();
    const user = accounts.find(a => a.username.trim().toLowerCase() === username.trim().toLowerCase() && a.password === password);
    if (user) {
      this.setSession(user);
      return { success: true, user };
    }
    return { success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" };
  },

  // Lấy số ngày trong tháng
  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  },

  // Lấy thứ trong tuần (0: CN, 1: T2, ..., 6: T7)
  getDayOfWeek(year, month, day) {
    return new Date(year, month - 1, day).getDay();
  },

  // Thuật toán Tự Động Xếp Lịch Trực Phòng CNTT (Smart Fair-Distribution Scheduler)
  generateSchedule(year, month, staffList, shiftRoles) {
    const totalDays = this.getDaysInMonth(year, month);
    const schedule = [];
    
    // Khởi tạo bộ đếm công cho nhân viên CNTT
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

      shiftRoles.forEach(role => {
        // Lọc ứng viên theo nhóm chuyên môn (nếu cần) hoặc toàn thể kỹ sư CNTT
        let pool = staffPool.filter(s => {
          if (role.group === "cntt_main") return s.group === "cntt_main" || s.role.includes("KS") || s.role.includes("CN");
          return true;
        });
        if (pool.length === 0) pool = staffPool;

        // Tránh trùng người trong cùng 1 ngày
        const assignedTodayIds = Object.values(dayShifts).map(x => x.id).filter(Boolean);

        // Lọc không nghỉ phép và không trực liên tiếp 2 ngày
        let candidates = pool.filter(s => {
          const isOff = s.offDays && s.offDays.includes(d);
          const isConsecutive = (s.lastAssignedDay === d - 1);
          const alreadyAssignedToday = assignedTodayIds.includes(s.id);
          return !isOff && !isConsecutive && !alreadyAssignedToday;
        });

        if (candidates.length === 0) {
          candidates = pool.filter(s => {
            const isOff = s.offDays && s.offDays.includes(d);
            const alreadyAssignedToday = assignedTodayIds.includes(s.id);
            return !isOff && !alreadyAssignedToday;
          });
        }
        if (candidates.length === 0) {
          candidates = pool.filter(s => !assignedTodayIds.includes(s.id));
        }
        if (candidates.length === 0) {
          candidates = pool;
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
          dayShifts[role.id] = {
            id: selectedStaff.id,
            name: selectedStaff.name,
            role: selectedStaff.role,
            phone: selectedStaff.phone || "",
            dept: selectedStaff.dept || "Phòng CNTT"
          };
        } else {
          dayShifts[role.id] = { id: "", name: "Chưa phân công", role: "", phone: "", dept: "" };
        }
      });

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

  // Thống kê số ca trực của từng cán bộ Phòng CNTT
  calculateStatistics(staffList, schedule, shiftRoles) {
    const stats = {};
    staffList.forEach(s => {
      stats[s.id] = {
        id: s.id,
        name: s.name,
        role: s.role,
        dept: s.dept || "Phòng CNTT",
        phone: s.phone || "",
        total: 0,
        weekday: 0,
        weekend: 0,
        shifts: []
      };
    });

    schedule.forEach(dayObj => {
      Object.entries(dayObj.shifts).forEach(([shiftId, assignedStaff]) => {
        if (assignedStaff && assignedStaff.id && stats[assignedStaff.id]) {
          stats[assignedStaff.id].total++;
          if (dayObj.isWeekend) {
            stats[assignedStaff.id].weekend++;
          } else {
            stats[assignedStaff.id].weekday++;
          }
          stats[assignedStaff.id].shifts.push({ day: dayObj.day, shiftId });
        }
      });
    });

    return Object.values(stats);
  },

  // Lấy lịch trực cá nhân của 1 cán bộ CNTT cụ thể
  getPersonalSchedule(staffId, schedule, shiftRoles) {
    const personalShifts = [];
    schedule.forEach(dayObj => {
      Object.entries(dayObj.shifts).forEach(([shiftId, assignedStaff]) => {
        if (assignedStaff && assignedStaff.id === staffId) {
          const shiftRole = shiftRoles.find(r => r.id === shiftId);
          const colleagues = [];
          Object.entries(dayObj.shifts).forEach(([sId, staff]) => {
            if (staff && staff.id && staff.id !== staffId) {
              const r = shiftRoles.find(x => x.id === sId);
              colleagues.push({
                roleName: r ? r.name : sId,
                name: staff.name,
                phone: staff.phone || ""
              });
            }
          });

          personalShifts.push({
            day: dayObj.day,
            dayName: dayObj.dayName,
            isWeekend: dayObj.isWeekend,
            shiftId: shiftId,
            shiftName: shiftRole ? shiftRole.name : shiftId,
            colleagues: colleagues
          });
        }
      });
    });

    return personalShifts;
  },

  // Xuất file Excel Lịch Trực Phòng CNTT chuẩn Bệnh viện
  exportToExcel(year, month, schedule, staffList, shiftRoles, orgConfig = {}) {
    if (!window.XLSX) {
      alert("Thư viện SheetJS XLSX chưa được tải!");
      return;
    }

    const org1 = orgConfig.org1 || "ỦY BAN NHÂN DÂN TỈNH BẮC NINH";
    const org2 = orgConfig.org2 || "SỞ Y TẾ";
    const org3 = orgConfig.org3 || "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2";
    const province = orgConfig.province || "Bắc Ninh";

    const rows = [];
    rows.push([org1.toUpperCase(), "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
    rows.push([org2.toUpperCase(), "", "", "Độc lập - Tự do - Hạnh phúc"]);
    rows.push([org3.toUpperCase(), "", "", "---------------"]);
    rows.push(["PHÒNG CÔNG NGHỆ THÔNG TIN", "", "", ""]);
    rows.push([""]);
    rows.push([`BẢNG PHÂN CÔNG LỊCH TRỰC PHÒNG CÔNG NGHỆ THÔNG TIN`]);
    rows.push([`THÁNG ${month} NĂM ${year} - BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2`]);
    rows.push([`Hotline Trực Kỹ Thuật CNTT 24/7: 0912.345.678 - Hỗ trợ HIS, HIS VIMES, Máy Chủ & Mạng LAN`]);
    rows.push([""]);

    // Header Table
    const headers = ["Ngày", "Thứ"];
    shiftRoles.forEach(r => headers.push(r.name));
    rows.push(headers);

    // Data Rows
    schedule.forEach(d => {
      const row = [`Ngày ${d.day}/${month}`, d.dayName];
      shiftRoles.forEach(r => {
        const assigned = d.shifts[r.id];
        row.push(assigned ? `${assigned.name} (${assigned.phone || ''})` : "-");
      });
      rows.push(row);
    });

    // Thống kê chấm công Phòng CNTT
    rows.push([""]);
    rows.push(["BẢNG TỔNG HỢP SỐ CA TRỰC PHÒNG CNTT (CHẤM CÔNG)"]);
    rows.push(["STT", "Họ Và Tên", "Nhiệm Vụ / Chức Danh", "Tổng Số Ca Trực", "Trực Ngày Thường", "Trực Thứ 7 / CN", "Số Điện Thoại"]);
    
    const stats = this.calculateStatistics(staffList, schedule, shiftRoles);
    stats.forEach((st, idx) => {
      rows.push([idx + 1, st.name, st.role, st.total, st.weekday, st.weekend, st.phone]);
    });

    rows.push([""]);
    rows.push(["", "", "", `${province}, ngày ... tháng ${month} năm ${year}`]);
    rows.push(["", "NGƯỜI LẬP LỊCH", "", "TRƯỞNG PHÒNG CÔNG NGHỆ THÔNG TIN"]);
    rows.push(["", "(Ký, ghi rõ họ tên)", "", "(Ký, ghi rõ họ tên)"]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Lich_Truc_CNTT_T${month}_${year}`);

    const filename = `LICH_TRUC_PHONG_CNTT_THANG_${month}_${year}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
};

window.ToolDutyRoster = ToolDutyRoster;
