/**
 * tool-duty-roster.js
 * Quản Lý & Xếp Lịch Trực Bệnh Viện Tự Động (Tích hợp Hệ thống Phân quyền Admin / User Cá Nhân)
 * Cung cấp: Phân quyền admin/user, quản lý tài khoản nhân viên, lọc lịch trực cá nhân, xếp lịch thông minh & xuất Excel.
 */

const ToolDutyRoster = {
  // Danh sách mẫu nhân sự ban đầu
  defaultStaffList: [
    { id: "nv1", name: "BSCKI. Nguyễn Văn Hùng", role: "Trực Lãnh đạo / Trưởng ca", group: "bacsi", dept: "Khối Ngoại - Cấp Cứu", offDays: [] },
    { id: "nv2", name: "ThS.BS. Trần Quốc Toản", role: "Bác sĩ Trực Cấp cứu", group: "bacsi", dept: "Khoa Cấp Cứu", offDays: [] },
    { id: "nv3", name: "BS. Lê Thị Mai", role: "Bác sĩ Trực Nội", group: "bacsi", dept: "Khoa Nội Tổng Hợp", offDays: [] },
    { id: "nv4", name: "BS. Phạm Minh Đức", role: "Bác sĩ Trực Ngoại", group: "bacsi", dept: "Khoa Ngoại Tổng Hợp", offDays: [] },
    { id: "nv5", name: "ĐD. Hoàng Thu Thủy", role: "Điều dưỡng Trưởng ca", group: "dieuduong", dept: "Khối Điều Dưỡng", offDays: [] },
    { id: "nv6", name: "ĐD. Vũ Hải Yến", role: "Điều dưỡng Cấp cứu", group: "dieuduong", dept: "Khoa Cấp Cứu", offDays: [] },
    { id: "nv7", name: "KTV. Đỗ Mạnh Cường", role: "Kỹ thuật viên X-Quang / XN", group: "ktv", dept: "Khoa CĐHA & Xét Nghiệm", offDays: [] },
    { id: "nv8", name: "KS. Ngô Thanh Tùng", role: "Kỹ sư Trực CNTT / HIS", group: "cntt", dept: "Phòng CNTT", offDays: [] },
    { id: "nv9", name: "DS. Bùi Thị Lan", role: "Dược sĩ Trực Kho Thuốc", group: "duoc", dept: "Khoa Dược", offDays: [] }
  ],

  // Các vị trí / ca trực trong ngày
  defaultShiftRoles: [
    { id: "shift_lanhdao", name: "Trực Lãnh Đạo", group: "bacsi", badgeColor: "blue" },
    { id: "shift_capcuu", name: "Trực Cấp Cứu", group: "bacsi", badgeColor: "emerald" },
    { id: "shift_noi", name: "Trực Nội Khoa", group: "bacsi", badgeColor: "violet" },
    { id: "shift_ngoai", name: "Trực Ngoại Khoa", group: "bacsi", badgeColor: "amber" },
    { id: "shift_dieuduong", name: "Điều Dưỡng Trực", group: "dieuduong", badgeColor: "cyan" },
    { id: "shift_ktv", name: "Kỹ Thuật Viên (XN/CĐHA)", group: "ktv", badgeColor: "indigo" },
    { id: "shift_cntt", name: "Trực CNTT / Hệ Thống HIS", group: "cntt", badgeColor: "blue" }
  ],

  // Danh sách tài khoản người dùng mặc định (Admin: admin / admin)
  defaultAccounts: [
    {
      id: "acc_admin",
      username: "admin",
      password: "admin",
      fullname: "Quản Trị Viên (Phòng CNTT)",
      role: "admin",
      dept: "Phòng CNTT",
      staffId: null
    },
    {
      id: "acc_tungnt",
      username: "tungnt",
      password: "admin",
      fullname: "KS. Ngô Thanh Tùng",
      role: "user",
      dept: "Phòng CNTT",
      staffId: "nv8"
    },
    {
      id: "acc_hungnv",
      username: "hungnv",
      password: "admin",
      fullname: "BSCKI. Nguyễn Văn Hùng",
      role: "user",
      dept: "Khối Ngoại - Cấp Cứu",
      staffId: "nv1"
    },
    {
      id: "acc_toantq",
      username: "toantq",
      password: "admin",
      fullname: "ThS.BS. Trần Quốc Toản",
      role: "user",
      dept: "Khoa Cấp Cứu",
      staffId: "nv2"
    },
    {
      id: "acc_thuyht",
      username: "thuyht",
      password: "admin",
      fullname: "ĐD. Hoàng Thu Thủy",
      role: "user",
      dept: "Khối Điều Dưỡng",
      staffId: "nv5"
    }
  ],

  // Khởi tạo và lấy danh sách tài khoản từ localStorage
  getAccounts() {
    try {
      const raw = localStorage.getItem("DUTY_ACCOUNTS");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.defaultAccounts;
  },

  saveAccounts(accounts) {
    localStorage.setItem("DUTY_ACCOUNTS", JSON.stringify(accounts));
  },

  // Quản lý phiên đăng nhập hiện tại
  getCurrentSession() {
    try {
      const raw = localStorage.getItem("DUTY_CURRENT_SESSION");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Mặc định đăng nhập với tài khoản admin
    return this.defaultAccounts[0];
  },

  setSession(userObj) {
    localStorage.setItem("DUTY_CURRENT_SESSION", JSON.stringify(userObj));
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

  // Thuật toán Tự Động Xếp Lịch Trực Thông Minh (Smart Fair-Distribution Scheduler)
  generateSchedule(year, month, staffList, shiftRoles) {
    const totalDays = this.getDaysInMonth(year, month);
    const schedule = []; // Array of day objects: { day, dayOfWeek, isWeekend, shifts: { shiftId: staffObj } }
    
    // Nhóm nhân sự theo role group
    const staffByGroup = {};
    staffList.forEach(s => {
      if (!staffByGroup[s.group]) staffByGroup[s.group] = [];
      staffByGroup[s.group].push({ ...s, shiftCount: 0, weekendCount: 0, lastAssignedDay: -99 });
    });

    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = this.getDayOfWeek(year, month, d);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const dayShifts = {};

      shiftRoles.forEach(role => {
        let pool = staffByGroup[role.group] || [];
        if (pool.length === 0) {
          pool = Object.values(staffByGroup).flat();
        }

        // Lọc các nhân viên không bị vướng ngày nghỉ và không trực ngày hôm trước (cách ít nhất 1 ngày)
        let candidates = pool.filter(s => {
          const isOff = s.offDays && s.offDays.includes(d);
          const isConsecutive = (s.lastAssignedDay === d - 1);
          return !isOff && !isConsecutive;
        });

        // Nếu tất cả đều vướng, nới lỏng điều kiện liên tiếp
        if (candidates.length === 0) {
          candidates = pool.filter(s => !(s.offDays && s.offDays.includes(d)));
        }
        if (candidates.length === 0) {
          candidates = pool;
        }

        // Ưu tiên người có số ca trực ít nhất, nếu bằng nhau thì ưu tiên người có số ca cuối tuần ít hơn
        candidates.sort((a, b) => {
          if (isWeekend) {
            if (a.weekendCount !== b.weekendCount) return a.weekendCount - b.weekendCount;
          }
          if (a.shiftCount !== b.shiftCount) return a.shiftCount - b.shiftCount;
          return a.lastAssignedDay - b.lastAssignedDay;
        });

        const selectedStaff = candidates[0];
        if (selectedStaff) {
          selectedStaff.shiftCount++;
          if (isWeekend) selectedStaff.weekendCount++;
          selectedStaff.lastAssignedDay = d;
          dayShifts[role.id] = { id: selectedStaff.id, name: selectedStaff.name, group: selectedStaff.group, dept: selectedStaff.dept || "" };
        } else {
          dayShifts[role.id] = { id: "", name: "Chưa phân công", group: "", dept: "" };
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

  // Tính toán thống kê số ca trực của từng nhân sự
  calculateStatistics(staffList, schedule, shiftRoles) {
    const stats = {};
    staffList.forEach(s => {
      stats[s.id] = {
        id: s.id,
        name: s.name,
        group: s.group,
        dept: s.dept || "",
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

  // Lọc danh sách ca trực của một nhân viên cụ thể
  getPersonalSchedule(staffId, schedule, shiftRoles) {
    const personalShifts = [];
    schedule.forEach(dayObj => {
      Object.entries(dayObj.shifts).forEach(([shiftId, assignedStaff]) => {
        if (assignedStaff && assignedStaff.id === staffId) {
          const shiftRole = shiftRoles.find(r => r.id === shiftId);
          // Tìm các đồng nghiệp cùng trực trong ngày này
          const colleagues = [];
          Object.entries(dayObj.shifts).forEach(([sId, staff]) => {
            if (staff && staff.id && staff.id !== staffId) {
              const r = shiftRoles.find(x => x.id === sId);
              colleagues.push({ roleName: r ? r.name : sId, name: staff.name });
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

  // Xuất file Excel Lịch Trực chuẩn Bệnh viện
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
    rows.push([org1.toUpperCase(), "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
    rows.push([org2.toUpperCase(), "", "", "", "Độc lập - Tự do - Hạnh phúc"]);
    rows.push([org3.toUpperCase(), "", "", "", "---------------"]);
    rows.push([""]);
    rows.push([`BẢNG PHÂN CÔNG LỊCH TRỰC THÁNG ${month} NĂM ${year}`]);
    rows.push([`Áp dụng: Khối Chuyên Môn & Phòng CNTT - BVĐK Bắc Ninh Số 2`]);
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
        row.push(assigned ? assigned.name : "-");
      });
      rows.push(row);
    });

    // Thống kê ca trực
    rows.push([""]);
    rows.push(["BẢNG TỔNG HỢP SỐ CA TRỰC & CHẤM CÔNG"]);
    rows.push(["STT", "Họ Và Tên", "Đơn Vị / Khoa Phòng", "Tổng Số Ca Trực", "Trực Ngày Thường", "Trực Thứ 7 / CN"]);
    
    const stats = this.calculateStatistics(staffList, schedule, shiftRoles);
    stats.forEach((st, idx) => {
      rows.push([idx + 1, st.name, st.dept || st.group.toUpperCase(), st.total, st.weekday, st.weekend]);
    });

    rows.push([""]);
    rows.push(["", "", "", "", `${province}, ngày ... tháng ${month} năm ${year}`]);
    rows.push(["", "NGƯỜI LẬP BẢNG", "", "", "GIÁM ĐỐC BỆNH VIỆN"]);
    rows.push(["", "(Ký, ghi rõ họ tên)", "", "", "(Ký, đóng dấu)"]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Lich_Truc_T${month}_${year}`);

    const filename = `LICH_TRUC_BVDK_BAC_NINH_SO_2_THANG_${month}_${year}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
};

window.ToolDutyRoster = ToolDutyRoster;
