/**
 * tool-sql-builder.js
 * Trình Sinh Câu Lệnh Báo Cáo SQL Tự Động Từ CSDL VIMES HIS (PostgreSQL)
 * Cung cấp các mẫu truy vấn nghiệp vụ bệnh viện thực tế & Trình dựng câu lệnh tùy biến trực quan
 */

const ToolSqlBuilder = {
  // Kho mẫu truy vấn SQL báo cáo bệnh viện chuẩn xác trên CSDL VIMES
  templates: [
    {
      id: "rpt_kcb_ngoaitru",
      name: "Báo cáo Khám chữa bệnh Ngoại trú",
      category: "KCB & Tiếp đón",
      description: "Thống kê lượt tiếp đón khám ngoại trú, thông tin bệnh nhân, mã thẻ BHYT, phòng khám, bác sĩ khám và chẩn đoán ICD-10",
      sql: `-- =========================================================================
-- BÁO CÁO THỐNG KÊ LƯỢT TIẾP ĐÓN & KHÁM CHỮA BỆNH NGOẠI TRÚ
-- Nguồn dữ liệu: CSDL VIMES (hms_doc, hms_patient, hms_dept, sys_user, sys_icd)
-- =========================================================================
SELECT 
    d.hd_docno AS "Số Hồ Sơ KCB",
    p.hp_patientno AS "Mã Bệnh Nhân",
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname, ''), ' ', p.hp_firstname)) AS "Họ Tên Người Bệnh",
    TO_CHAR(p.hp_birthdate, 'DD/MM/YYYY') AS "Ngày Sinh",
    d.hd_yofage AS "Tuổi",
    CASE WHEN p.hp_sex IN ('M', '1') THEN 'Nam' ELSE 'Nữ' END AS "Giới Tính",
    d.hd_cardno AS "Mã Thẻ BHYT",
    p.hp_dtladdr AS "Địa Chỉ Thường Trú",
    dept.hd_name AS "Khoa/Phòng Khám",
    TO_CHAR(d.hd_admitdate, 'DD/MM/YYYY HH24:MI') AS "Thời Gian Tiếp Đón",
    d.hd_icd AS "Mã Bệnh ICD-10",
    d.hd_diagnostic AS "Chẩn Đoán Khám Bệnh",
    u.su_fullname AS "Bác Sĩ Khám",
    CASE 
        WHEN d.hd_status = 'O' THEN 'Đang khám ngoại trú'
        WHEN d.hd_status = 'T' THEN 'Đã kết thúc đợt KCB'
        WHEN d.hd_status = 'I' THEN 'Đã chuyển vào nội trú'
        WHEN d.hd_status = 'X' THEN 'Đã chuyển tuyến viện'
        ELSE 'Khác'
    END AS "Trạng Thái Xử Trí"
FROM hms_doc d
INNER JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid
LEFT JOIN sys_user u ON d.hd_doctor = u.su_userid
WHERE d.hd_admitdate >= DATE_TRUNC('month', CURRENT_DATE) -- Từ đầu tháng hiện tại
  AND d.hd_admitdate < CURRENT_DATE + INTERVAL '1 day'
ORDER BY d.hd_admitdate DESC;`
    },
    {
      id: "rpt_benhnhan_noitru",
      name: "Báo cáo Bệnh nhân Điều trị Nội trú & Ngày giường",
      category: "Nội trú & Giường bệnh",
      description: "Thống kê danh sách người bệnh đang điều trị nội trú, khoa điều trị, số buồng, số giường và số ngày nằm viện",
      sql: `-- =========================================================================
-- BÁO CÁO DANH SÁCH BỆNH NHÂN ĐANG ĐIỀU TRỊ NỘI TRÚ & NGÀY GIƯỜNG
-- Nguồn dữ liệu: CSDL VIMES (hms_doc, hms_patient, hms_clinical_record, hms_dept, sys_user)
-- =========================================================================
SELECT 
    d.hd_docno AS "Số Hồ Sơ KCB",
    cr.hcr_recordno AS "Số Lưu Trữ Bệnh Án",
    p.hp_patientno AS "Mã Bệnh Nhân",
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname, ''), ' ', p.hp_firstname)) AS "Họ Tên Người Bệnh",
    d.hd_cardno AS "Số Thẻ BHYT",
    dept.hd_name AS "Khoa Điều Trị",
    TO_CHAR(d.hd_admitdate, 'DD/MM/YYYY HH24:MI') AS "Thời Gian Vào Viện",
    TO_CHAR(cr.hcr_admitdate, 'DD/MM/YYYY HH24:MI') AS "Thời Gian Vào Khoa",
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cr.hcr_admitdate)) / 86400, 1) AS "Số Ngày Đang Nằm Viện",
    d.hd_icd AS "Mã Bệnh Chính",
    d.hd_diagnostic AS "Chẩn Đoán Vào Khoa",
    u.su_fullname AS "Bác Sĩ Phụ Trách",
    cr.hcr_treatment_method AS "Phương Pháp Điều Trị"
FROM hms_doc d
INNER JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
INNER JOIN hms_clinical_record cr ON d.hd_docno = cr.hcr_docno
LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid
LEFT JOIN sys_user u ON cr.hcr_doctor = u.su_userid
WHERE (d.hd_enddate IS NULL OR d.hd_status = 'I') -- Đang còn nằm viện
ORDER BY dept.hd_name ASC, d.hd_admitdate ASC;`
    },
    {
      id: "rpt_doanhthu_vienphi",
      name: "Báo cáo Doanh thu & Viện phí BHYT / Thu phí",
      category: "Viện phí & Tài chính",
      description: "Tổng hợp doanh thu chi tiết theo đối tượng BHYT, Viện phí, Bệnh nhân cùng chi trả, Nguồn thu viện phí",
      sql: `-- =========================================================================
-- BÁO CÁO TỔNG HỢP DOANH THU VIỆN PHÍ & BẢO HIỂM Y TẾ
-- Nguồn dữ liệu: CSDL VIMES (hms_fee, hms_fee_invoice, hms_doc, hms_dept)
-- =========================================================================
SELECT 
    dept.hd_name AS "Khoa Chỉ Định / Nơi Phát Sinh",
    COUNT(DISTINCT f.hfe_docno) AS "Tổng Số Lượt Bệnh Nhân",
    SUM(f.hfe_cost) AS "Tổng Chi Phí KCB (VNĐ)",
    SUM(f.hfe_inspaid_amount) AS "Quỹ BHYT Thanh Toán (VNĐ)",
    SUM(f.hfe_patpaid_amount) AS "Bệnh Nhân Cùng Chi Trả (VNĐ)",
    SUM(f.hfe_exam_amount) AS "Tiền Khám Bệnh (VNĐ)",
    SUM(f.hfe_bed_amount) AS "Tiền Ngày Giường (VNĐ)",
    SUM(f.hfe_lab_amount) AS "Tiền Xét Nghiệm (VNĐ)",
    SUM(f.hfe_image_amount) AS "Tiền CĐHA & TDCN (VNĐ)",
    SUM(f.hfe_drug_amount) AS "Tiền Thuốc (VNĐ)",
    SUM(f.hfe_material_amount) AS "Tiền Vật Tư Y Tế (VNĐ)",
    SUM(f.hfe_deposit_amount) AS "Tổng Tạm Ứng Đã Nộp (VNĐ)"
FROM hms_fee f
INNER JOIN hms_doc d ON f.hfe_docno = d.hd_docno
LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid
WHERE d.hd_admitdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND d.hd_admitdate < CURRENT_DATE + INTERVAL '1 day'
GROUP BY dept.hd_name
ORDER BY SUM(f.hfe_cost) DESC;`
    },
    {
      id: "rpt_kedon_duoc",
      name: "Báo cáo Kê đơn Thuốc & Sử dụng Dược",
      category: "Dược & Kho thuốc",
      description: "Chi tiết số lượng thuốc đã kê đơn, hàm lượng, số lượng phát, đơn vị tính và bác sĩ kê đơn",
      sql: `-- =========================================================================
-- BÁO CÁO TỔNG HỢP KÊ ĐƠN THUỐC & SỬ DỤNG DƯỢC
-- Nguồn dữ liệu: CSDL VIMES (hms_pharma_order, hms_pharma_order_line, m_productitem, sys_user)
-- =========================================================================
SELECT 
    pi.mp_product_id AS "Mã Thuốc",
    pi.mp_name AS "Tên Thuốc & Biệt Dược",
    pi.mp_active_ingredient AS "Hoạt Chất Chính",
    pi.mp_strength AS "Hàm Lượng",
    pi.mp_unit AS "Đơn Vị Tính",
    SUM(pol.hpol_qtyissue) AS "Tổng Số Lượng Cấp Phát",
    COUNT(DISTINCT po.hpo_orderid) AS "Số Lượt Đơn Thuốc",
    u.su_fullname AS "Bác Sĩ Kê Đơn",
    dept.hd_name AS "Khoa/Phòng Kê Đơn"
FROM hms_pharma_order po
INNER JOIN hms_pharma_order_line pol ON po.hpo_orderid = pol.hpol_orderid
INNER JOIN m_productitem pi ON pol.hpol_product_id = pi.mp_product_id
INNER JOIN hms_doc d ON po.hpo_docno = d.hd_docno
LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid
LEFT JOIN sys_user u ON po.hpo_doctor = u.su_userid
WHERE po.hpo_orderdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND po.hpo_orderdate < CURRENT_DATE + INTERVAL '1 day'
GROUP BY pi.mp_product_id, pi.mp_name, pi.mp_active_ingredient, pi.mp_strength, pi.mp_unit, u.su_fullname, dept.hd_name
ORDER BY SUM(pol.hpol_qtyissue) DESC;`
    },
    {
      id: "rpt_ra_vien_bhxh",
      name: "Báo cáo Bệnh nhân Ra viện & Nghỉ BHXH (MS: 02/TT25)",
      category: "Nội trú & Xuất viện",
      description: "Danh sách người bệnh xuất viện, số lưu trữ hồ sơ, chẩn đoán, số ngày nghỉ thêm hưởng chế độ BHXH",
      sql: `-- =========================================================================
-- BÁO CÁO DANH SÁCH BỆNH NHÂN RA VIỆN & CẤP GIẤY NGHỈ BHXH (02/TT25)
-- Nguồn dữ liệu: CSDL VIMES (hms_doc, hms_patient, hms_clinical_record, hms_dept, sys_user)
-- =========================================================================
SELECT 
    d.hd_docno AS "Số Hồ Sơ KCB",
    cr.hcr_recordno AS "Số Lưu Trữ Bệnh Án",
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname, ''), ' ', p.hp_firstname)) AS "Họ Tên Bệnh Nhân",
    p.hp_sin AS "Số CCCD/Định Danh",
    d.hd_cardno AS "Mã Thẻ BHYT",
    dept.hd_name AS "Khoa Điều Trị",
    TO_CHAR(d.hd_admitdate, 'DD/MM/YYYY HH24:MI') AS "Vào Viện Lúc",
    TO_CHAR(d.hd_enddate, 'DD/MM/YYYY HH24:MI') AS "Ra Viện Lúc",
    '[' || d.hd_icd || '] ' || d.hd_diagnostic AS "Chẩn Đoán Ra Viện",
    cr.hcr_treatment_method AS "Phương Pháp Điều Trị",
    cr.hcr_rest_days AS "Số Ngày Nghỉ BHXH",
    TO_CHAR(cr.hcr_rest_from, 'DD/MM/YYYY') AS "Nghỉ Từ Ngày",
    TO_CHAR(cr.hcr_rest_to, 'DD/MM/YYYY') AS "Nghỉ Đến Ngày",
    u_treat.su_fullname AS "Bác Sĩ Điều Trị",
    u_head.su_fullname AS "Trưởng Khoa / Lãnh Đạo Ký"
FROM hms_doc d
INNER JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
INNER JOIN hms_clinical_record cr ON d.hd_docno = cr.hcr_docno
LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid
LEFT JOIN sys_user u_treat ON cr.hcr_doctor = u_treat.su_userid
LEFT JOIN sys_user u_head ON d.hd_doctor = u_head.su_userid
WHERE d.hd_enddate >= DATE_TRUNC('month', CURRENT_DATE)
  AND d.hd_enddate < CURRENT_DATE + INTERVAL '1 day'
ORDER BY d.hd_enddate DESC;`
    },
    {
      id: "rpt_giam_dinh_xml",
      name: "Báo cáo Đối soát Dữ liệu XML 130 BHYT",
      category: "Giám định BHYT",
      description: "Tổng hợp dữ liệu chi phí KCB BHYT XML 130 (XML1, XML2, XML3) phục vụ kiểm tra đối soát cổng BHXH",
      sql: `-- =========================================================================
-- BÁO CÁO ĐỐI SOÁT DỮ LIỆU BẢNG KÊ TỔNG HỢP XML 130 BHYT (bh_ct01, bh_ct02, bh_ct03)
-- Nguồn dữ liệu: CSDL VIMES (bh_ct01, bh_ct02, bh_ct03, hms_doc)
-- =========================================================================
SELECT 
    ct1.ma_lk AS "Mã Liên Kết",
    ct1.ho_ten AS "Họ Tên Người Bệnh",
    ct1.ma_the_bhyt AS "Mã Thẻ BHYT",
    ct1.ngay_vao AS "Ngày Vào KCB",
    ct1.ngay_ra AS "Ngày Ra KCB",
    ct1.ma_benh AS "Mã ICD-10",
    ct1.ten_benh AS "Tên Bệnh",
    ct1.t_tongchi AS "Tổng Chi Phí (XML1)",
    ct1.t_bhtt AS "BHYT Thanh Toán (XML1)",
    ct1.t_bntt AS "Người Bệnh Trả (XML1)",
    ct1.t_bncct AS "Đồng Chi Trả (XML1)",
    ct1.t_thuoc AS "Tiền Thuốc (XML1)",
    ct1.t_vtyt AS "Tiền VTYT (XML1)",
    ct1.t_xn AS "Tiền Xét Nghiệm (XML1)",
    ct1.t_cdha AS "Tiền CĐHA (XML1)"
FROM bh_ct01 ct1
WHERE ct1.ngay_ra >= TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYYMMDDHH24MI')
ORDER BY ct1.ngay_ra DESC;`
    },
    {
      id: "rpt_ton_kho_duoc",
      name: "Báo cáo Tồn kho Dược & Vật tư Y tế",
      category: "Dược & Kho thuốc",
      description: "Thống kê lượng thuốc, vật tư y tế tồn kho theo từng nhóm danh mục và hạn dùng",
      sql: `-- =========================================================================
-- BÁO CÁO THỐNG KÊ TỒN KHO DƯỢC & VẬT TƯ Y TẾ
-- Nguồn dữ liệu: CSDL VIMES (m_productitem, m_transaction, m_stock)
-- =========================================================================
SELECT 
    pi.mp_product_id AS "Mã Hàng Hóa",
    pi.mp_name AS "Tên Thuốc / Vật Tư",
    pi.mp_active_ingredient AS "Hoạt Chất",
    pi.mp_strength AS "Hàm Lượng",
    pi.mp_unit AS "Đơn Vị",
    pi.mp_category AS "Nhóm Dược",
    COALESCE(SUM(t.mt_qtyonhand), 0) AS "Số Lượng Tồn Kho",
    pi.mp_unitprice AS "Đơn Giá (VNĐ)",
    COALESCE(SUM(t.mt_qtyonhand), 0) * COALESCE(pi.mp_unitprice, 0) AS "Tổng Giá Trị Tồn (VNĐ)"
FROM m_productitem pi
LEFT JOIN m_transaction t ON pi.mp_product_id = t.mt_product_id
GROUP BY pi.mp_product_id, pi.mp_name, pi.mp_active_ingredient, pi.mp_strength, pi.mp_unit, pi.mp_category, pi.mp_unitprice
HAVING COALESCE(SUM(t.mt_qtyonhand), 0) > 0
ORDER BY pi.mp_name ASC;`
    }
  ],

  // Khởi tạo và cấu hình câu lệnh tùy biến chuẩn VIMES
  generateCustomSql(options = {}) {
    const {
      mainTable = "hms_doc",
      selectedFields = [
        "d.hd_docno AS \"Số Hồ Sơ KCB\"",
        "p.hp_patientno AS \"Mã Bệnh Nhân\"",
        "TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname, ''), ' ', p.hp_firstname)) AS \"Họ Tên Bệnh Nhân\"",
        "d.hd_cardno AS \"Số Thẻ BHYT\"",
        "dept.hd_name AS \"Khoa Điều Trị\"",
        "TO_CHAR(d.hd_admitdate, 'DD/MM/YYYY HH24:MI') AS \"Ngày Tiếp Đón\"",
        "d.hd_icd AS \"Mã ICD-10\"",
        "d.hd_diagnostic AS \"Chẩn Đoán Bệnh\""
      ],
      includePatient = true,
      includeDept = true,
      includeClinical = true,
      includeFee = false,
      dateRangeType = "month", // "month" | "year" | "today" | "all"
      statusFilter = "all", // "all" | "active" | "completed"
      limit = 100
    } = options;

    let sql = `-- =========================================================================\n`;
    sql += `-- CÂU LỆNH SQL ĐƯỢC SINH TỰ ĐỘNG TỪ BẢNG: ${mainTable.toUpperCase()}\n`;
    sql += `-- Hệ thống CSDL VIMES HIS - BVĐK Bắc Ninh Số 2\n`;
    sql += `-- Thời gian sinh: ${new Date().toLocaleString("vi-VN")}\n`;
    sql += `-- =========================================================================\n\n`;

    sql += `SELECT \n`;
    if (selectedFields && selectedFields.length > 0) {
      sql += selectedFields.map(f => `    ${f}`).join(",\n");
    } else {
      sql += `    d.hd_docno, p.hp_patientno, p.hp_surname, p.hp_firstname, d.hd_cardno, dept.hd_name`;
    }
    sql += `\nFROM ${mainTable} d\n`;

    if (includePatient) {
      sql += `INNER JOIN hms_patient p ON d.hd_patientno = p.hp_patientno\n`;
    }
    if (includeDept) {
      sql += `LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid\n`;
    }
    if (includeClinical) {
      sql += `LEFT JOIN hms_clinical_record cr ON d.hd_docno = cr.hcr_docno\n`;
    }
    if (includeFee) {
      sql += `LEFT JOIN hms_fee f ON d.hd_docno = f.hfe_docno\n`;
    }

    const whereClauses = [];
    if (dateRangeType === "today") {
      whereClauses.push("d.hd_admitdate >= CURRENT_DATE");
    } else if (dateRangeType === "month") {
      whereClauses.push("d.hd_admitdate >= DATE_TRUNC('month', CURRENT_DATE)");
    } else if (dateRangeType === "year") {
      whereClauses.push("d.hd_admitdate >= DATE_TRUNC('year', CURRENT_DATE)");
    }

    if (statusFilter === "active") {
      whereClauses.push("(d.hd_enddate IS NULL OR d.hd_status IN ('O', 'I'))");
    } else if (statusFilter === "completed") {
      whereClauses.push("d.hd_status = 'T'");
    }

    if (whereClauses.length > 0) {
      sql += `WHERE ` + whereClauses.join("\n  AND ") + `\n`;
    }

    sql += `ORDER BY d.hd_admitdate DESC\n`;
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
      "COALESCE", "TRIM", "CONCAT", "SUBSTRING",
      "TO_CHAR", "DATE_TRUNC", "CURRENT_DATE", "CURRENT_TIMESTAMP", "INTERVAL", "EXTRACT", "EPOCH", "DESC", "ASC"
    ];

    const kwRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    formatted = formatted.replace(kwRegex, (match) => `<span class="sql-kw">${match.toUpperCase()}</span>`);

    return formatted;
  }
};

window.ToolSqlBuilder = ToolSqlBuilder;
