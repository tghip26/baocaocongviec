/**
 * tool-sql-builder.js
 * Trình Sinh Câu Lệnh Báo Cáo SQL Tự Động Từ CSDL VIMES
 * Cung cấp các mẫu truy vấn nghiệp vụ thường quy & Trình dựng câu lệnh tùy biến trực quan
 */

const ToolSqlBuilder = {
  // Kho mẫu truy vấn SQL báo cáo bệnh viện thường dùng
  templates: [
    {
      id: "rpt_kcb_ngoaitru",
      name: "Báo cáo Khám chữa bệnh Ngoại trú",
      category: "KCB & Tiếp đón",
      description: "Thống kê lượt khám ngoại trú, thông tin bệnh nhân, mã thẻ BHYT, phòng khám, bác sĩ khám và chẩn đoán ICD-10",
      sql: `-- =========================================================================
-- BÁO CÁO THỐNG KÊ LƯỢT KHÁM CHỮA BỆNH NGOẠI TRÚ
-- Nguồn dữ liệu: CSDL VIMES (hsp_treatment, hsp_patient, hsp_dept, hsp_icd)
-- =========================================================================
SELECT 
    t.treatmentno AS "Mã Điều Trị",
    p.patientno AS "Mã Bệnh Nhân",
    p.fullname AS "Họ Và Tên",
    TO_CHAR(p.birthday, 'DD/MM/YYYY') AS "Ngày Sinh",
    CASE WHEN p.gender = 1 THEN 'Nam' ELSE 'Nữ' END AS "Giới Tính",
    p.healthinsuranceno AS "Mã Thẻ BHYT",
    p.address AS "Địa Chỉ",
    d.deptname AS "Khoa/Phòng Khám",
    TO_CHAR(t.regdate, 'DD/MM/YYYY HH24:MI') AS "Thời Gian Đến Khám",
    t.icdcode AS "Mã Bệnh ICD10",
    icd.icdname AS "Chẩn Đoán Bệnh",
    t.doctorname AS "Bác Sĩ Khám",
    CASE 
        WHEN t.status = 1 THEN 'Đang khám'
        WHEN t.status = 2 THEN 'Đã kết thúc khám'
        WHEN t.status = 3 THEN 'Chuyển vào nội trú'
        WHEN t.status = 4 THEN 'Chuyển tuyến viện'
        ELSE 'Khác'
    END AS "Trạng Thái Xử Trí"
FROM hsp_treatment t
INNER JOIN hsp_patient p ON t.patientid = p.patientid
LEFT JOIN hsp_dept d ON t.deptid = d.deptid
LEFT JOIN hsp_icd icd ON t.icdcode = icd.icdcode
WHERE t.treatmenttype = 1 -- 1: Khám Ngoại trú
  AND t.regdate >= DATE_TRUNC('month', CURRENT_DATE) -- Từ đầu tháng hiện tại
  AND t.regdate < CURRENT_DATE + INTERVAL '1 day'
ORDER BY t.regdate DESC;`
    },
    {
      id: "rpt_benhnhan_noitru",
      name: "Báo cáo Bệnh nhân Điều trị Nội trú & Ngày giường",
      category: "Nội trú & Giường bệnh",
      description: "Thống kê danh sách người bệnh đang điều trị nội trú, khoa điều trị, số buồng, số giường và số ngày nằm viện",
      sql: `-- =========================================================================
-- BÁO CÁO DANH SÁCH BỆNH NHÂN ĐANG ĐIỀU TRỊ NỘI TRÚ & NGÀY GIƯỜNG
-- Nguồn dữ liệu: CSDL VIMES (hsp_treatment, hsp_patient, hsp_dept, hsp_bed_history)
-- =========================================================================
SELECT 
    t.treatmentno AS "Mã Hồ Sơ Bệnh Án",
    p.patientno AS "Mã Bệnh Nhân",
    p.fullname AS "Họ Tên Người Bệnh",
    p.healthinsuranceno AS "Số Thẻ BHYT",
    d.deptname AS "Khoa Điều Trị",
    b.roomname AS "Buồng Bệnh",
    b.bedcode AS "Số Giường",
    TO_CHAR(t.admitdate, 'DD/MM/YYYY HH24:MI') AS "Ngày Giờ Vào Viện",
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.admitdate)) / 86400, 1) AS "Số Ngày Đang Điều Trị",
    t.mainicd AS "Mã Bệnh Chính",
    icd.icdname AS "Chẩn Đoán Vào Khoa",
    t.treatingdoctor AS "Bác Sĩ Phụ Trách",
    t.depositamount AS "Tạm Ứng (VNĐ)"
FROM hsp_treatment t
INNER JOIN hsp_patient p ON t.patientid = p.patientid
INNER JOIN hsp_dept d ON t.deptid = d.deptid
LEFT JOIN hsp_bed_history b ON t.treatmentid = b.treatmentid AND b.isactive = 1
LEFT JOIN hsp_icd icd ON t.mainicd = icd.icdcode
WHERE t.treatmenttype = 2 -- 2: Điều trị Nội trú
  AND (t.dischargedate IS NULL OR t.status = 1) -- Đang còn nằm viện
ORDER BY d.deptname ASC, t.admitdate ASC;`
    },
    {
      id: "rpt_doanhthu_vienphi",
      name: "Báo cáo Doanh thu & Viện phí BHYT / Thu phí",
      category: "Viện phí & Tài chính",
      description: "Tổng hợp doanh thu chi tiết theo đối tượng BHYT, Viện phí, Bệnh nhân cùng chi trả, Nguồn thu viện phí",
      sql: `-- =========================================================================
-- BÁO CÁO TỔNG HỢP DOANH THU VIỆN PHÍ & BẢO HIỂM Y TẾ
-- Nguồn dữ liệu: CSDL VIMES (hsp_invoice, hsp_treatment, hsp_patient, hsp_dept)
-- =========================================================================
SELECT 
    d.deptname AS "Khoa Chỉ Định / Thu Viện Phí",
    COUNT(DISTINCT inv.invoiceno) AS "Tổng Số Phiếu Thu",
    SUM(inv.totalamount) AS "Tổng Chi Phí KCB (VNĐ)",
    SUM(inv.bhxhamount) AS "BHYT Thanh Toán (VNĐ)",
    SUM(inv.copayamount) AS "Bệnh Nhân Cùng Chi Trả (VNĐ)",
    SUM(inv.selfamount) AS "Bệnh Nhân Tự Trả / Dịch Vụ (VNĐ)",
    SUM(inv.exemptionamount) AS "Miễn Giảm Viện Phí (VNĐ)",
    SUM(inv.actualamount) AS "Thực Thu Tiền Mặt (VNĐ)"
FROM hsp_invoice inv
INNER JOIN hsp_treatment t ON inv.treatmentid = t.treatmentid
INNER JOIN hsp_dept d ON inv.deptid = d.deptid
WHERE inv.invoicedate >= DATE_TRUNC('month', CURRENT_DATE)
  AND inv.invoicedate < CURRENT_DATE + INTERVAL '1 day'
  AND inv.isactive = 1 AND inv.iscanceled = 0
GROUP BY d.deptname
ORDER BY SUM(inv.totalamount) DESC;`
    },
    {
      id: "rpt_kedon_duoc",
      name: "Báo cáo Kê đơn Thuốc & Sử dụng Dược",
      category: "Dược & Kho thuốc",
      description: "Chi tiết số lượng thuốc đã kê đơn, hàm lượng, số lượng phát, đơn giá và tổng thành tiền theo từng bác sĩ",
      sql: `-- =========================================================================
-- BÁO CÁO TỔNG HỢP KÊ ĐƠN THUỐC & SỬ DỤNG DƯỢC
-- Nguồn dữ liệu: CSDL VIMES (hsp_prescription, hsp_prescription_item, med_medicine)
-- =========================================================================
SELECT 
    m.medicinecode AS "Mã Thuốc",
    m.medicinename AS "Tên Thuốc & Biệt Dược",
    m.unitname AS "Đơn Vị Tính",
    m.concentration AS "Hàm Lượng",
    SUM(pi.quantity) AS "Tổng Số Lượng Kê",
    pi.unitprice AS "Đơn Giá (VNĐ)",
    SUM(pi.quantity * pi.unitprice) AS "Thành Tiền (VNĐ)",
    COUNT(DISTINCT p.prescriptionno) AS "Số Lượt Đơn Kê",
    pr.deptname AS "Khoa Kê Đơn"
FROM hsp_prescription p
INNER JOIN hsp_prescription_item pi ON p.prescriptionid = pi.prescriptionid
INNER JOIN med_medicine m ON pi.medicineid = m.medicineid
INNER JOIN hsp_dept pr ON p.deptid = pr.deptid
WHERE p.prescriptiondate >= DATE_TRUNC('month', CURRENT_DATE)
  AND p.prescriptiondate < CURRENT_DATE + INTERVAL '1 day'
  AND p.isactive = 1
GROUP BY m.medicinecode, m.medicinename, m.unitname, m.concentration, pi.unitprice, pr.deptname
ORDER BY SUM(pi.quantity * pi.unitprice) DESC;`
    },
    {
      id: "rpt_phauthuat_thuthuat",
      name: "Báo cáo Thống kê Phẫu thuật - Thủ thuật",
      category: "Ngoại khoa & PTTT",
      description: "Thống kê ca mổ theo phân loại (Đặc biệt, Loại 1, Loại 2, Loại 3), phẫu thuật viên chính, phương pháp vô cảm",
      sql: `-- =========================================================================
-- BÁO CÁO THỐNG KÊ PHẪU THUẬT & THỦ THUẬT
-- Nguồn dữ liệu: CSDL VIMES (hsp_surgery, hsp_treatment, hsp_patient, hsp_icd)
-- =========================================================================
SELECT 
    s.surgeryno AS "Mã Ca Mổ/Thủ Thuật",
    p.patientno AS "Mã BN",
    p.fullname AS "Họ Tên Người Bệnh",
    s.surgeryname AS "Tên Phẫu Thuật / Thủ Thuật",
    s.surgerytype AS "Phân Loại PTTT",
    TO_CHAR(s.starttime, 'DD/MM/YYYY HH24:MI') AS "Thời Gian Bắt Đầu",
    TO_CHAR(s.endtime, 'DD/MM/YYYY HH24:MI') AS "Thời Gian Kết Thúc",
    s.maindoctor AS "Phẫu Thuật Viên Chính",
    s.anesthesiadoctor AS "Bác Sĩ Gây Mê",
    s.anesthesiamethod AS "Phương Pháp Vô Cảm",
    s.preopdiagnosis AS "Chẩn Đoán Trước Mổ",
    s.postopdiagnosis AS "Chẩn Đoán Sau Mổ",
    CASE 
        WHEN s.status = 1 THEN 'Hoàn thành an toàn'
        WHEN s.status = 2 THEN 'Có tai biến/biến chứng'
        ELSE 'Khác'
    END AS "Kết Quả"
FROM hsp_surgery s
INNER JOIN hsp_treatment t ON s.treatmentid = t.treatmentid
INNER JOIN hsp_patient p ON t.patientid = p.patientid
WHERE s.starttime >= DATE_TRUNC('month', CURRENT_DATE)
  AND s.starttime < CURRENT_DATE + INTERVAL '1 day'
ORDER BY s.starttime DESC;`
    }
  ],

  // Khởi tạo và cấu hình câu lệnh tùy biến
  generateCustomSql(options = {}) {
    const {
      mainTable = "hsp_treatment",
      selectedFields = ["t.treatmentno", "p.fullname", "p.healthinsuranceno", "d.deptname", "t.regdate"],
      includePatient = true,
      includeDept = true,
      includeIcd = true,
      includeInvoice = false,
      dateRangeType = "month", // "month" | "year" | "today" | "all"
      statusFilter = "all", // "all" | "active" | "completed"
      limit = 100
    } = options;

    let sql = `-- =========================================================================\n`;
    sql += `-- CÂU LỆNH SQL ĐƯỢC SINH TỰ ĐỘNG TỪ BẢNG: ${mainTable.toUpperCase()}\n`;
    sql += `-- Hệ thống CSDL VIMES - BVĐK Bắc Ninh Số 2\n`;
    sql += `-- Thời gian sinh: ${new Date().toLocaleString("vi-VN")}\n`;
    sql += `-- =========================================================================\n\n`;

    sql += `SELECT \n`;
    if (selectedFields && selectedFields.length > 0) {
      sql += selectedFields.map(f => `    ${f}`).join(",\n");
    } else {
      sql += `    t.*, p.fullname, p.healthinsuranceno, d.deptname`;
    }
    sql += `\nFROM ${mainTable} t\n`;

    if (includePatient) {
      sql += `INNER JOIN hsp_patient p ON t.patientid = p.patientid\n`;
    }
    if (includeDept) {
      sql += `LEFT JOIN hsp_dept d ON t.deptid = d.deptid\n`;
    }
    if (includeIcd) {
      sql += `LEFT JOIN hsp_icd icd ON t.icdcode = icd.icdcode\n`;
    }
    if (includeInvoice) {
      sql += `LEFT JOIN hsp_invoice inv ON t.treatmentid = inv.treatmentid AND inv.isactive = 1\n`;
    }

    const whereClauses = [];
    if (dateRangeType === "today") {
      whereClauses.push("t.regdate >= CURRENT_DATE");
    } else if (dateRangeType === "month") {
      whereClauses.push("t.regdate >= DATE_TRUNC('month', CURRENT_DATE)");
    } else if (dateRangeType === "year") {
      whereClauses.push("t.regdate >= DATE_TRUNC('year', CURRENT_DATE)");
    }

    if (statusFilter === "active") {
      whereClauses.push("t.status = 1");
    } else if (statusFilter === "completed") {
      whereClauses.push("t.status = 2");
    }

    if (whereClauses.length > 0) {
      sql += `WHERE ` + whereClauses.join("\n  AND ") + `\n`;
    }

    sql += `ORDER BY t.regdate DESC\n`;
    if (limit > 0) {
      sql += `LIMIT ${limit};`;
    } else {
      sql += `;`;
    }

    return sql;
  },

  // Tô màu cú pháp SQL đơn giản (Syntax highlighting)
  highlightSql(sql) {
    if (!sql) return "";
    let formatted = sql
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Comments
    formatted = formatted.replace(/(--.*$)/gm, '<span class="sql-comment">$1</span>');

    // Strings
    formatted = formatted.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="sql-string">$1</span>');

    // Keywords
    const keywords = [
      "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "ON",
      "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL",
      "CASE", "WHEN", "THEN", "ELSE", "END", "DISTINCT", "COUNT", "SUM", "AVG", "ROUND",
      "TO_CHAR", "DATE_TRUNC", "CURRENT_DATE", "CURRENT_TIMESTAMP", "INTERVAL", "EXTRACT", "EPOCH", "DESC", "ASC"
    ];

    const kwRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    formatted = formatted.replace(kwRegex, (match) => `<span class="sql-kw">${match.toUpperCase()}</span>`);

    return formatted;
  }
};

window.ToolSqlBuilder = ToolSqlBuilder;
