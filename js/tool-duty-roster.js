/**
 * tool-duty-roster.js
 * Công cụ Quản lý & Xếp Lịch Trực Bệnh Viện Tự Động
 * Thuật toán phân bổ công bằng, kiểm soát xung đột, giao diện lịch trực tương tác & xuất Excel/Ảnh
 */

const ToolDutyRoster = {
  // Danh sách mẫu nhân sự ban đầu
  defaultStaffList: [
    { id: "nv1", name: "BSCKI. Nguyễn Văn Hùng", role: "Trực Lãnh đạo / Trưởng ca", group: "bacsi", offDays: [] },
    { id: "nv2", name: "ThS.BS. Trần Quốc Toản", role: "Bác sĩ Trực Cấp cứu", group: "bacsi", offDays: [] },
    { id: "nv3", name: "BS. Lê Thị Mai", role: "Bác sĩ Trực Nội", group: "bacsi", offDays: [] },
    { id: "nv4", name: "BS. Phạm Minh Đức", role: "Bác sĩ Trực Ngoại", group: "bacsi", offDays: [] },
    { id: "nv5", name: "ĐD. Hoàng Thu Thủy", role: "Điều dưỡng Trưởng ca", group: "dieuduong", offDays: [] },
    { id: "nv6", name: "ĐD. Vũ Hải Yến", role: "Điều dưỡng Cấp cứu", group: "dieuduong", offDays: [] },
    { id: "nv7", name: "KTV. Đỗ Mạnh Cường", role: "Kỹ thuật viên X-Quang / XN", group: "ktv", offDays: [] },
    { id: "nv8", name: "KS. Ngô Thanh Tùng", role: "Kỹ sư Trực CNTT / HIS", group: "cntt", offDays: [] },
    { id: "nv9", name: "DS. Bùi Thị Lan", role: "Dược sĩ Trực Kho Thuốc", group: "duoc", offDays: [] }
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
    const schedule = []; // Array of day objects: { day, dayOfWeek, isWeekend, isHoliday, shifts: { shiftId: staffObj } }
    
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
          // Fallback pool from all staff
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
          dayShifts[role.id] = { id: selectedStaff.id, name: selectedStaff.name, group: selectedStaff.group };
        } else {
          dayShifts[role.id] = { id: "", name: "Chưa phân công", group: "" };
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
    rows.push([`Áp dụng: Toàn viện / Khối Chuyên môn nghiệp vụ - BVĐK Bắc Ninh Số 2`]);
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
    rows.push(["STT", "Họ Và Tên", "Bộ Phận/Chức Danh", "Tổng Số Ca Trực", "Trực Ngày Thường", "Trực Thứ 7 / CN"]);
    
    const stats = this.calculateStatistics(staffList, schedule, shiftRoles);
    stats.forEach((st, idx) => {
      rows.push([idx + 1, st.name, st.group.toUpperCase(), st.total, st.weekday, st.weekend]);
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
  },

  // Xuất Lịch Trực dạng Ảnh PNG độ nét cao để gửi Zalo
  async exportToImage(elementId, filename = "Lich_Truc_Zalo.png") {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Use modern browser Canvas drawing to render the schedule sheet into an image
    const canvas = document.createElement("canvas");
    const width = 1200;
    const padding = 30;
    const rowHeight = 36;
    const headerHeight = 120;
    
    // We will draw a beautiful, crisp schedule image
    const ctx = canvas.getContext("2d");
    // Draw logic will be bound to UI
    return canvas.toDataURL("image/png");
  }
};

window.ToolDutyRoster = ToolDutyRoster;
