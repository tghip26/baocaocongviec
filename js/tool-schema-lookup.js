/**
 * tool-schema-lookup.js
 * Comprehensive Semantic Database Schema, Column Variable & Medical Clinical Form Lookup Engine for VIMES HIS.
 * Multi-dimensional search:
 *  1. Table Mode (Tra cứu Bảng CSDL)
 *  2. Column / Variable Mode (Tra cứu Biến / Cột)
 *  3. Medical Form & Document Mode (Tra cứu Mẫu Biểu / Giấy tờ y tế: Giấy ra viện, Chuyển tuyến, Bảng kê, Đơn thuốc...)
 */

// REGISTRY CÁC BIỂU MẪU Y TẾ & BẢN ĐỒ ÁNH XẠ TRƯỜNG DỮ LIỆU CSDL VIMES HIS
window.VIMES_CLINICAL_FORMS = [
  {
    id: "form_giay_ra_vien",
    code: "MS: 02/TT25",
    standard: "Thông tư 18/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY RA VIỆN",
    category: "Nội trú & Xuất viện",
    icon: "📄",
    keywords: ["giấy ra viện", "giay ra vien", "ra viện", "02/tt25", "mau 02", "xuat vien", "nghi them", "nghi bhxh", "giay chung nhan ra vien", "hms_discharge_certificate", "hms_clinical_record", "hms_doc"],
    description: "Giấy tờ hành chính và chuyên môn xác nhận người bệnh kết thúc đợt điều trị nội trú, lưu trữ hồ sơ bệnh án và xác nhận thời gian nghỉ việc hưởng chế độ BHXH.",
    primaryTables: ["hms_doc", "hms_patient", "hms_clinical_record", "hms_card", "bh_ct01", "bh_ct03", "sys_user"],
    fields: [
      {
        no: 1,
        docField: "Số lưu trữ / Mã lưu khoa",
        example: "TMH/47151",
        table: "hms_clinical_record / hms_doc",
        column: "hcr_recordno / hd_recordno / so_luutru",
        type: "varchar(20)",
        note: "Số lưu trữ hồ sơ bệnh án khoa điều trị (VD: Khoa Tai Mũi Họng). Khóa liên kết: hcr_docno = hd_docno"
      },
      {
        no: 2,
        docField: "Số hồ sơ (Mã đợt tiếp đón KCB)",
        example: "26174151",
        table: "hms_doc",
        column: "hd_docno / docno / sohoso",
        type: "bigint / integer",
        note: "Mã định danh duy nhất của lượt khám chữa bệnh (Khóa chính liên kết xuyên suốt toàn bộ CSDL VIMES)"
      },
      {
        no: 3,
        docField: "Họ tên người bệnh",
        example: "NGUYỄN VĂN TUẤN",
        table: "hms_patient / hms_doc",
        column: "hp_fullname / hp_surname + hp_midname + hp_firstname / hd_fullname",
        type: "varchar(255)",
        note: "Họ và tên người bệnh in hoa. Khóa liên kết: hms_doc.hd_patientno = hms_patient.hp_patientno"
      },
      {
        no: 4,
        docField: "Ngày/tháng/năm sinh",
        example: "10/10/1997",
        table: "hms_patient",
        column: "hp_birthdate / ngay_sinh / nam_sinh",
        type: "date / timestamp",
        note: "Ngày sinh đầy đủ định dạng DD/MM/YYYY. Lưu trong bảng thông tin hành chính bệnh nhân."
      },
      {
        no: 5,
        docField: "Tuổi người bệnh",
        example: "29",
        table: "hms_doc / hms_patient",
        column: "hd_yofage / hd_age / tuoi_benhnhan",
        type: "integer",
        note: "Số tuổi tính tại thời điểm vào viện. Nếu trẻ < 6 tuổi, tính thêm tháng tuổi: hd_mofage"
      },
      {
        no: 6,
        docField: "Nam / Nữ (Giới tính)",
        example: "Nam",
        table: "hms_patient",
        column: "hp_sex / gioi_tinh / gender",
        type: "varchar(1)",
        note: "Quy ước: 'M' / '1' = Nam, 'F' / '2' = Nữ. Trên giao diện hiển thị Nam hoặc Nữ."
      },
      {
        no: 7,
        docField: "Dân tộc",
        example: "Kinh",
        table: "hms_patient (FK sys_ethnic)",
        column: "hp_ethnic (Mã) -> sys_ethnic.se_name (Tên)",
        type: "integer -> varchar(64)",
        note: "Mã dân tộc liên kết danh mục sys_ethnic (1: Kinh, 2: Tày, 3: Thái, 4: Mường...)"
      },
      {
        no: 8,
        docField: "Nghề nghiệp",
        example: "Công nhân",
        table: "hms_patient (FK sys_occupation)",
        column: "hp_occupation (Mã) -> sys_occupation.so_name (Tên)",
        type: "varchar(10) -> varchar(128)",
        note: "Mã nghề nghiệp liên kết danh mục sys_occupation"
      },
      {
        no: 9,
        docField: "Số CCCD / Định danh công dân / Hộ chiếu",
        example: "027097002405",
        table: "hms_patient",
        column: "hp_idcard / so_cccd / ma_dinh_danh / hp_passport",
        type: "varchar(20)",
        note: "Số thẻ CCCD 12 chữ số hoặc số định danh cá nhân phục vụ liên thông Cổng DVC / VNeID"
      },
      {
        no: 10,
        docField: "Ngày cấp CCCD",
        example: "27/04/2021",
        table: "hms_patient",
        column: "hp_idcard_date / ngay_cap_cccd",
        type: "date",
        note: "Ngày cấp căn cước công dân của người bệnh"
      },
      {
        no: 11,
        docField: "Mã số BHXH / Thẻ BHYT số",
        example: "DN424272131563527008",
        table: "hms_card / hms_doc / bh_ct01",
        column: "hc_cardno / hd_cardno / ma_the_bhyt / ma_so_bhxh",
        type: "varchar(25)",
        note: "Mã thẻ BHYT 15 ký tự (DN424272131563527008), trong đó 10 số cuối (2721315635) là mã định danh BHXH."
      },
      {
        no: 12,
        docField: "Địa chỉ người bệnh",
        example: "Xã Phù Lãng, Tỉnh Bắc Ninh",
        table: "hms_patient / hms_doc",
        column: "hp_address / hp_dtladdr / dia_chi",
        type: "varchar(255)",
        note: "Địa chỉ thường trú / tạm trú của bệnh nhân. Mã hành chính: hp_provid (Tỉnh), hp_distid (Huyện), hp_villid (Xã)"
      },
      {
        no: 13,
        docField: "Vào viện lúc (Giờ phút, ngày tháng năm)",
        example: "09 giờ 28 phút, ngày 21 tháng 08 năm 2026",
        table: "hms_doc / hms_clinical_record / bh_ct01",
        column: "hd_admitdate / hcr_admitdate / ngay_vao",
        type: "timestamp without time zone",
        note: "Thời điểm tiếp đón hoặc thời điểm vào khoa điều trị nội trú. Định dạng BHYT: YYYYMMDDHHMM"
      },
      {
        no: 14,
        docField: "Ra viện lúc (Giờ phút, ngày tháng năm)",
        example: "11 giờ 30 phút, ngày 27 tháng 08 năm 2026",
        table: "hms_doc / hms_clinical_record / bh_ct01",
        column: "hd_enddate / hd_dischargedate / hcr_dischargedate / ngay_ra",
        type: "timestamp without time zone",
        note: "Thời điểm kết thúc đợt điều trị / xuất viện do Bác sĩ xác nhận trên phiếu ra viện"
      },
      {
        no: 15,
        docField: "Chẩn đoán ra viện (Mã ICD + Tên bệnh)",
        example: "[H91.2] Điếc đột ngột tai trái ngày thứ 4",
        table: "hms_doc / hms_clinical_record / bh_ct01 / bh_ct03",
        column: "hd_icd (Mã ICD) + hd_diagnostic (Tên) / hcr_main_icd + hcr_diagnostic",
        type: "varchar(13) + varchar(512)",
        note: "Mã ICD-10 bệnh chính kèm theo diễn giải chẩn đoán chi tiết. Kèm bệnh phụ nếu có: hd_reldisease"
      },
      {
        no: 16,
        docField: "Phương pháp điều trị",
        example: "Nội khoa",
        table: "hms_clinical_record / hms_doc / bh_ct03",
        column: "hcr_treatment_method / hd_treatmethod / pp_dieu_tri",
        type: "varchar(254) / text",
        note: "Phương pháp điều trị: Nội khoa, Phẫu thuật, Thủ thuật, Chăm sóc điều dưỡng..."
      },
      {
        no: 17,
        docField: "Ghi chú / Lời dặn & Số ngày nghỉ thêm BHXH",
        example: "Ra viện. Nghỉ thêm 07 ngày tính từ ngày 28/08/2026 đến hết ngày 02/09/2028",
        table: "hms_clinical_record / hms_doc / hms_discharge_certificate",
        column: "hcr_note / hcr_rest_days / hcr_rest_from / hcr_rest_to / hd_advice",
        type: "text + integer + date",
        note: "Số ngày nghỉ hưởng chế độ ốm đau BHXH và lời dặn của Bác sĩ sau khi xuất viện"
      },
      {
        no: 18,
        docField: "Khoa phòng điều trị kết thúc",
        example: "Khoa Tai Mũi Họng (TMH)",
        table: "hms_doc (FK hms_dept)",
        column: "hd_enddept -> hms_dept.hd_name",
        type: "varchar(7) -> varchar(128)",
        note: "Khoa người bệnh nằm điều trị trước khi ra viện"
      },
      {
        no: 19,
        docField: "Người hành nghề KCB (Bác sĩ điều trị ký tên)",
        example: "BS. Hoàng Văn Minh",
        table: "hms_clinical_record (FK sys_user)",
        column: "hcr_doctor -> sys_user.su_fullname / su_cchn",
        type: "varchar(15) -> varchar(128)",
        note: "Họ tên và mã Chứng chỉ hành nghề (CCHN) của Bác sĩ trực tiếp điều trị"
      },
      {
        no: 20,
        docField: "Đại diện đơn vị (Trưởng khoa / Giám đốc ký tên)",
        example: "TS.BS. Nguyễn Đình Tâm",
        table: "hms_doc / hms_dept (FK sys_user)",
        column: "hd_doctor / hd_head_doctor -> sys_user.su_fullname",
        type: "varchar(15) -> varchar(128)",
        note: "Lãnh đạo khoa điều trị hoặc Ban Giám đốc phụ trách chuyên môn ký duyệt giấy ra viện"
      }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN DỮ LIỆU ĐẦY ĐỦ CHO GIẤY RA VIỆN (MS: 02/TT25) TRÊN VIMES HIS
-- =========================================================================
SELECT 
    p.hp_patientno AS ma_benh_nhan,
    d.hd_docno AS so_ho_so,
    cr.hcr_recordno AS so_luu_tru_khoa,
    p.hp_fullname AS ho_ten_nguoi_benh,
    TO_CHAR(p.hp_birthdate, 'DD/MM/YYYY') AS ngay_thang_nam_sinh,
    d.hd_yofage AS tuoi,
    CASE WHEN p.hp_sex IN ('M', '1') THEN 'Nam' ELSE 'Nữ' END AS gioi_tinh,
    se.se_name AS dan_toc,
    so.so_name AS nghe_nghiep,
    p.hp_idcard AS so_cccd,
    TO_CHAR(p.hp_idcard_date, 'DD/MM/YYYY') AS ngay_cap_cccd,
    d.hd_cardno AS ma_the_bhyt,
    SUBSTRING(d.hd_cardno FROM 6 FOR 10) AS ma_so_bhxh,
    p.hp_address AS dia_chi,
    TO_CHAR(d.hd_admitdate, 'HH24:MI, DD/MM/YYYY') AS vao_vien_luc,
    TO_CHAR(d.hd_enddate, 'HH24:MI, DD/MM/YYYY') AS ra_vien_luc,
    '[' || d.hd_icd || '] ' || d.hd_diagnostic AS chan_doan_ra_vien,
    COALESCE(cr.hcr_treatment_method, d.hd_treatmethod, 'Nội khoa') AS phuong_phap_dieu_tri,
    COALESCE(cr.hcr_note, d.hd_advice, 'Ra viện') AS ghi_chu_loi_dan,
    cr.hcr_rest_days AS so_ngay_nghi_them,
    dept.hd_name AS khoa_dieu_tri,
    u_treat.su_fullname AS bac_si_dieu_tri,
    u_head.su_fullname AS dai_dien_don_vi_truong_khoa
FROM hms_doc d
JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
LEFT JOIN hms_clinical_record cr ON d.hd_docno = cr.hcr_docno
LEFT JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid
LEFT JOIN sys_ethnic se ON p.hp_ethnic = se.se_id
LEFT JOIN sys_occupation so ON p.hp_occupation = so.so_id
LEFT JOIN sys_user u_treat ON cr.hcr_doctor = u_treat.su_userid
LEFT JOIN sys_user u_head ON d.hd_doctor = u_head.su_userid
WHERE d.hd_docno = 26174151; -- Thay 26174151 bằng số hồ sơ cần tra cứu`
  },
  {
    id: "form_giay_chuyen_tuyen",
    code: "Mẫu số 06/BHYT",
    standard: "Thông tư 40/2015/TT-BYT & Quyết định 130/QĐ-BYT",
    title: "GIẤY CHUYỂN TUYẾN KCB BHYT",
    category: "Tiếp đón & Chuyển viện",
    icon: "🚑",
    keywords: ["giấy chuyển tuyến", "giay chuyen tuyen", "chuyển viện", "chuyen vien", "chuyển tuyến", "chuyen tuyen", "06/bhyt", "mau 06", "hms_transfer_paper", "hd_transplace"],
    description: "Giấy tờ hành chính và chuyên môn chuyển người bệnh lên tuyến trên hoặc sang bệnh viện chuyên khoa điều trị.",
    primaryTables: ["hms_doc", "hms_patient", "hms_transfer_paper", "bh_ct01", "sys_hospital", "sys_user"],
    fields: [
      { no: 1, docField: "Số giấy chuyển tuyến", example: "CT-2026/08-142", table: "hms_transfer_paper / hms_doc", column: "htp_docno / hd_paper_trans", type: "varchar(48)", note: "Số lưu giấy chuyển tuyến liên thông Cổng BHYT" },
      { no: 2, docField: "Cơ sở KCB chuyển đến", example: "Bệnh viện Bạch Mai (Mã: 01001)", table: "hms_doc (FK sys_hospital)", column: "hd_tohosid -> sys_hospital.sh_name", type: "varchar(7) -> varchar(128)", note: "Mã và tên bệnh viện tuyến trên tiếp nhận" },
      { no: 3, docField: "Họ tên người bệnh", example: "TRẦN VĂN AN", table: "hms_patient", column: "hp_fullname", type: "varchar(255)", note: "Họ tên người bệnh chuyển viện" },
      { no: 4, docField: "Mã thẻ BHYT", example: "HT2424272131563", table: "hms_card / hms_doc", column: "hc_cardno / hd_cardno", type: "varchar(25)", note: "Số thẻ BHYT có giá trị sử dụng" },
      { no: 5, docField: "Tóm tắt bệnh lý & Quá trình điều trị", example: "Bệnh nhân điều trị 5 ngày không đỡ, khó thở tăng dần...", table: "hms_transfer_paper / hms_doc", column: "htp_clinical_summary / hd_transdiagn", type: "text / varchar(512)", note: "Diễn biến lâm sàng và cận lâm sàng" },
      { no: 6, docField: "Chẩn đoán lúc chuyển tuyến", example: "[J18.9] Viêm phổi nặng biến chứng suy hô hấp", table: "hms_doc", column: "hd_transicd (Mã ICD) + hd_transdiagn (Tên)", type: "varchar(11) + varchar(254)", note: "Chẩn đoán xác định khi làm thủ tục chuyển" },
      { no: 7, docField: "Lý do chuyển tuyến", example: "1: Đủ điều kiện chuyển tuyến (Vượt quá khả năng chuyên môn)", table: "hms_doc", column: "hd_transreason", type: "integer", note: "1: Đúng tuyến chuyên môn; 2: Theo nguyện vọng người bệnh" },
      { no: 8, docField: "Thuốc và dịch truyền đã sử dụng", example: "Ceftriaxone 1g x 02 lọ, NaCl 0.9% 500ml...", table: "hms_transfer_paper", column: "htp_drugs_used", type: "text", note: "Các thuốc đã cho bệnh nhân dùng" },
      { no: 9, docField: "Phương tiện vận chuyển & Cán bộ y tế đi cùng", example: "Xe cứu thương BV & BS. Phạm Đức Trọng", table: "hms_transfer_paper", column: "htp_transport_vehicle / htp_escort_doctor", type: "varchar(128)", note: "Điều kiện an toàn khi chuyển bệnh nhân" },
      { no: 10, docField: "Thời gian chuyển tuyến", example: "14:00, 25/08/2026", table: "hms_doc / hms_transfer_paper", column: "hd_transdate / htp_transfer_time", type: "timestamp", note: "Thời điểm bàn giao người bệnh lên xe vận chuyển" }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN DỮ LIỆU CHO GIẤY CHUYỂN TUYẾN KCB BHYT (MẪU 06/BHYT)
-- =========================================================================
SELECT 
    d.hd_docno AS so_ho_so,
    p.hp_fullname AS ho_ten_nguoi_benh,
    d.hd_cardno AS ma_the_bhyt,
    sh.sh_name AS benh_vien_chuyen_den,
    sh.sh_hospital_id AS ma_cskcb_den,
    d.hd_transicd AS ma_icd_chuyen,
    d.hd_transdiagn AS chan_doan_chuyen,
    d.hd_transdate AS ngay_chuyen,
    CASE WHEN d.hd_transreason = 1 THEN 'Đúng tuyến chuyên môn kỹ thuật' ELSE 'Theo yêu cầu của người bệnh' END AS ly_do_chuyen
FROM hms_doc d
JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
LEFT JOIN sys_hospital sh ON d.hd_tohosid = sh.sh_hospital_id
WHERE d.hd_docno = 26174151;`
  },
  {
    id: "form_bang_ke_01",
    code: "Mẫu 01/BV & 02/BV",
    standard: "Quyết định 6556/QĐ-BYT & QĐ 130/QĐ-BYT (XML1, XML2, XML3)",
    title: "BẢNG KÊ CHI PHÍ KHÁM BỆNH, CHỮA BỆNH (01/BV, 02/BV)",
    category: "Viện phí & Giám định BHYT",
    icon: "🧾",
    keywords: ["bảng kê", "bang ke", "bảng kê 01", "bang ke 01", "01/bv", "02/bv", "chi phí", "vien phi", "bhyt thanh toan", "hms_fee", "bh_ct01", "bh_ct02"],
    description: "Bảng kê tổng hợp toàn bộ chi phí tiền khám, giường bệnh, xét nghiệm, chẩn đoán hình ảnh, thuốc, vật tư và tỷ lệ thanh toán BHYT.",
    primaryTables: ["hms_fee", "hms_fee_invoice", "hms_fee_item", "hms_doc", "bh_ct01", "bh_ct02"],
    fields: [
      { no: 1, docField: "Tổng chi phí KCB", example: "3,850,000 đ", table: "hms_fee / bh_ct01", column: "hfe_cost / t_tongchi", type: "numeric", note: "Tổng toàn bộ các mục chi phí phát sinh trong đợt điều trị" },
      { no: 2, docField: "Tiền khám bệnh", example: "42,000 đ", table: "hms_fee / bh_ct01", column: "hfe_exam_amount / t_kham", type: "numeric", note: "Chi phí công khám của bác sĩ" },
      { no: 3, docField: "Tiền ngày giường điều trị", example: "1,250,000 đ", table: "hms_fee / bh_ct01", column: "hfe_bed_amount / t_giuong", type: "numeric", note: "Tiền giường nội trú / ngoại trú theo giá quy định" },
      { no: 4, docField: "Tiền xét nghiệm", example: "680,000 đ", table: "hms_fee / bh_ct01", column: "hfe_lab_amount / t_xn", type: "numeric", note: "Tổng xét nghiệm huyết học, sinh hóa, vi sinh..." },
      { no: 5, docField: "Tiền Chẩn đoán hình ảnh (X-quang, CT, Siêu âm)", example: "450,000 đ", table: "hms_fee / bh_ct01", column: "hfe_image_amount / t_cdha", type: "numeric", note: "Tổng chi phí chẩn đoán hình ảnh và TDCN" },
      { no: 6, docField: "Tiền thuốc, dịch truyền", example: "920,000 đ", table: "hms_fee / bh_ct01", column: "hfe_drug_amount / t_thuoc", type: "numeric", note: "Chi phí thuốc thuộc phạm vi và ngoài phạm vi BHYT" },
      { no: 7, docField: "Tiền Vật tư y tế tiêu hao", example: "150,000 đ", table: "hms_fee / bh_ct01", column: "hfe_material_amount / t_vtyt", type: "numeric", note: "Bơm tiêm, dây truyền, gạc, vật tư can thiệp..." },
      { no: 8, docField: "Quỹ BHYT thanh toán", example: "3,080,000 đ (80%)", table: "hms_fee / bh_ct01", column: "hfe_inspaid_amount / t_bhtt", type: "numeric", note: "Số tiền cơ quan BHXH chi trả theo quyền lợi thẻ" },
      { no: 9, docField: "Người bệnh cùng chi trả", example: "770,000 đ (20%)", table: "hms_fee / bh_ct01", column: "hfe_patpaid_amount / t_bntt", type: "numeric", note: "Số tiền người bệnh phải thanh toán theo tỷ lệ đồng chi trả" },
      { no: 10, docField: "Số tiền tạm ứng / Tạm gửi", example: "1,000,000 đ", table: "hms_doc / hms_fee", column: "hfe_deposit_amount", type: "numeric", note: "Tiền viện phí đã nộp trước khi vào viện" }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN DỮ LIỆU CHO BẢNG KÊ CHI PHÍ KHÁM CHỮA BỆNH (MẪU 01/BV, 02/BV)
-- =========================================================================
SELECT 
    d.hd_docno AS so_ho_so,
    p.hp_fullname AS ho_ten,
    d.hd_cardno AS so_the_bhyt,
    f.hfe_cost AS tong_chi_phi,
    f.hfe_inspaid_amount AS bhyt_thanh_toan,
    f.hfe_patpaid_amount AS nguoi_benh_dong_chi_tra,
    d.hfe_deposit_amount AS tien_tam_ung,
    (d.hfe_deposit_amount - f.hfe_patpaid_amount) AS so_tien_thanh_toan_lai
FROM hms_doc d
JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
LEFT JOIN hms_fee f ON d.hd_docno = f.hfe_docno
WHERE d.hd_docno = 26174151;`
  },
  {
    id: "form_don_thuoc",
    code: "Đơn thuốc Quốc gia",
    standard: "Thông tư 04/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML2)",
    title: "ĐƠN THUỐC NGOẠI TRÚ / ĐƠN THUỐC ĐIỆN TỬ",
    category: "Dược & Đơn thuốc",
    icon: "💊",
    keywords: ["đơn thuốc", "don thuoc", "kê đơn", "ke don", "thuốc", "thuoc", "don thuoc dien tu", "hms_pharma_order", "m_productitem"],
    description: "Đơn thuốc ngoại trú hoặc nội trú ra viện kê cho người bệnh mang về, kèm mã liên thông Hệ thống Đơn thuốc Quốc gia.",
    primaryTables: ["hms_pharma_order", "hms_pharma_order_line", "m_productitem", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Mã đơn thuốc", example: "DT-202608-9812", table: "hms_pharma_order", column: "hpo_orderid", type: "bigint", note: "Mã định danh đơn thuốc trong hệ thống" },
      { no: 2, docField: "Mã đơn thuốc Quốc gia", example: "01001-2608-ABC891", table: "hms_pharma_order", column: "hpo_national_code", type: "varchar(64)", note: "Mã cấp từ Cổng Đơn thuốc Quốc gia (donthuocquocgia.vn)" },
      { no: 3, docField: "Tên thuốc / Biệt dược", example: "Augmentin 1g (Amoxicillin/Acid clavulanic)", table: "m_productitem", column: "mp_name / hpol_productname", type: "varchar(255)", note: "Tên thương mại và hoạt chất chính" },
      { no: 4, docField: "Hàm lượng", example: "1000mg", table: "m_productitem", column: "mp_strength", type: "varchar(100)", note: "Hàm lượng quy chuẩn" },
      { no: 5, docField: "Số lượng kê", example: "14 Viên", table: "hms_pharma_order_line", column: "hpol_qtyissue / hpol_qtyorder", type: "numeric", note: "Số lượng người bệnh nhận" },
      { no: 6, docField: "Đường dùng", example: "Uống", table: "hms_pharma_order_line", column: "hpol_usage", type: "varchar(50)", note: "Uống, Tiêm, Bôi, Đặt..." },
      { no: 7, docField: "Cách dùng / Hướng dẫn", example: "Uống 1 viên/lần x 2 lần/ngày sau khi ăn no (Sáng: 1, Tối: 1)", table: "hms_pharma_order_line", column: "hpol_instruction", type: "varchar(512)", note: "Liều dùng và thời gian uống thuốc chi tiết" },
      { no: 8, docField: "Bác sĩ kê đơn & CCHN", example: "BS.CKI. Nguyễn Hải Đăng (CCHN: 001234/BN-CCHN)", table: "hms_pharma_order (FK sys_user)", column: "hpo_doctor -> sys_user.su_fullname / su_cchn", type: "varchar(128)", note: "Họ tên và chứng chỉ hành nghề của bác sĩ" }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN CHI TIẾT ĐƠN THUỐC CỦA BỆNH NHÂN TRÊN VIMES HIS
-- =========================================================================
SELECT 
    po.hpo_orderid AS ma_don_thuoc,
    d.hd_docno AS so_ho_so,
    p.hp_fullname AS ho_ten_benh_nhan,
    pi.mp_name AS ten_thuoc,
    pi.mp_active_ingredient AS hoat_chat,
    pol.hpol_qtyissue AS so_luong,
    pi.mp_unit AS don_vi,
    pol.hpol_instruction AS cach_dung_loi_dan,
    u.su_fullname AS bac_si_ke_don
FROM hms_pharma_order po
JOIN hms_pharma_order_line pol ON po.hpo_orderid = pol.hpol_orderid
JOIN m_productitem pi ON pol.hpol_product_id = pi.mp_product_id
JOIN hms_doc d ON po.hpo_docno = d.hd_docno
JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
LEFT JOIN sys_user u ON po.hpo_doctor = u.su_userid
WHERE po.hpo_docno = 26174151;`
  },
  {
    id: "form_giay_chung_sinh",
    code: "Mẫu TT 17/2012",
    standard: "Thông tư 17/2012/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY CHỨNG SINH",
    category: "Sản khoa & Tiếp đón",
    icon: "👶",
    keywords: ["chứng sinh", "chung sinh", "giấy chứng sinh", "giay chung sinh", "sinh con", "so sinh", "hms_birthcertificate"],
    description: "Giấy chứng nhận sinh con tại cơ sở y tế phục vụ làm giấy khai sinh và liên thông dữ liệu Dịch vụ công Quốc gia.",
    primaryTables: ["hms_birthcertificate", "hms_patient", "hms_doc"],
    fields: [
      { no: 1, docField: "Mã Giấy chứng sinh", example: "GCS-2026-00451", table: "hms_birthcertificate", column: "hbc_magcs / hb_serial", type: "varchar(24)", note: "Mã số định danh cấp cho trẻ sơ sinh" },
      { no: 2, docField: "Họ và tên mẹ", example: "LÊ THỊ THẢO", table: "hms_birthcertificate", column: "hbc_patientname", type: "varchar(65)", note: "Họ tên sản phụ sinh con" },
      { no: 3, docField: "Số CCCD của mẹ", example: "027195003412", table: "hms_birthcertificate", column: "hbc_idcard", type: "varchar(15)", note: "Căn cước công dân của mẹ" },
      { no: 4, docField: "Họ và tên cha", example: "NGUYỄN VĂN AN", table: "hms_birthcertificate", column: "hbc_tencha", type: "varchar(128)", note: "Họ tên người cha" },
      { no: 5, docField: "Thời điểm sinh", example: "03:15, 20/08/2026", table: "hms_birthcertificate", column: "hbc_datetimeofbirth", type: "timestamp", note: "Ngày giờ phút trẻ chào đời" },
      { no: 6, docField: "Giới tính con", example: "Nam", table: "hms_birthcertificate", column: "hbc_sex", type: "varchar(1)", note: "Giới tính trẻ sơ sinh (M: Nam, F: Nữ)" },
      { no: 7, docField: "Cân nặng khi sinh", example: "3,400 gram", table: "hms_birthcertificate", column: "hbc_weigh", type: "numeric", note: "Trọng lượng của bé lúc sinh (tính theo gram)" },
      { no: 8, docField: "Người đỡ đẻ", example: "NHS. Trần Thị Mai", table: "hms_birthcertificate", column: "hbc_themidwifery", type: "varchar(50)", note: "Nữ hộ sinh hoặc Bác sĩ đỡ đẻ" }
    ],
    sqlSample: `SELECT * FROM hms_birthcertificate WHERE hbc_docno = 26174151;`
  },
  {
    id: "form_giay_hen_kham",
    code: "Mẫu TT 40/2015",
    standard: "Thông tư 40/2015/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY HẸN KHÁM LẠI",
    category: "Khám bệnh & Ngoại trú",
    icon: "📅",
    keywords: ["hẹn khám", "hen kham", "giấy hẹn", "giay hen", "tái khám", "tai kham", "hms_appointment"],
    description: "Giấy hẹn bệnh nhân tái khám định kỳ hoặc kiểm tra lại sau điều trị hưởng chế độ BHYT đúng tuyến.",
    primaryTables: ["hms_appointment", "hms_doc", "hms_patient"],
    fields: [
      { no: 1, docField: "Ngày hẹn khám lại", example: "15/09/2026", table: "hms_appointment / hms_doc", column: "ha_appoint_date / hd_reexam_date", type: "date", note: "Ngày hẹn tái khám có giá trị trong 10 ngày làm việc" },
      { no: 2, docField: "Lý do hẹn khám lại", example: "Đo lại thính lực và nội soi tai mũi họng kiểm tra", table: "hms_appointment", column: "ha_reason", type: "varchar(255)", note: "Chỉ định cận lâm sàng hoặc thăm dò chức năng cần làm lại" },
      { no: 3, docField: "Bác sĩ hẹn khám", example: "BS.CKI. Nguyễn Hải Đăng", table: "hms_appointment (FK sys_user)", column: "ha_doctor -> sys_user.su_fullname", type: "varchar(128)", note: "Bác sĩ chỉ định hẹn tái khám" }
    ],
    sqlSample: `SELECT a.*, p.hp_fullname FROM hms_appointment a JOIN hms_patient p ON a.ha_patientno = p.hp_patientno WHERE a.ha_docno = 26174151;`
  },
  {
    id: "form_tom_tat_benh_an",
    code: "Mẫu TT 18/2022",
    standard: "Thông tư 18/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "TÓM TẮT HỒ SƠ BỆNH ÁN",
    category: "Nội trú & EMR",
    icon: "📋",
    keywords: ["tóm tắt bệnh án", "tom tat benh an", "trích sao", "trich sao", "trích sao bệnh án", "hms_summary_record", "hms_clinical_record"],
    description: "Bản tóm tắt quá trình điều trị nội trú, kết quả xét nghiệm chính, diễn biến bệnh lý và hướng dẫn điều trị tiếp theo.",
    primaryTables: ["hms_clinical_record", "hms_doc", "hms_patient", "sys_user"],
    fields: [
      { no: 1, docField: "Quá trình bệnh lý và diễn biến lâm sàng", example: "Bệnh nhân vào viện vì nghe kém tai trái đột ngột...", table: "hms_clinical_record", column: "hcr_disease_process / quatrinh_benhly", type: "text", note: "Tóm tắt từ lúc nhập viện đến khi xuất viện" },
      { no: 2, docField: "Tóm tắt kết quả cận lâm sàng", example: "Thính lực đồ: Điếc tiếp nhận tai trái 65dB, CT Sọ não: Bình thường", table: "hms_clinical_record", column: "hcr_lab_summary / ketqua_canlamsang", type: "text", note: "Các kết quả xét nghiệm, CĐHA tiêu biểu" },
      { no: 3, docField: "Phương pháp điều trị", example: "Thuốc giãn mạch, Corticoid liều cao, Vitamin nhóm B", table: "hms_clinical_record", column: "hcr_treatment_method", type: "text", note: "Phương pháp nội khoa / ngoại khoa đã áp dụng" },
      { no: 4, docField: "Tình trạng người bệnh ra viện", example: "Tai trái nghe rõ hơn, hết chóng mặt, toàn trạng ổn định", table: "hms_clinical_record", column: "hcr_discharge_status / hd_ttrang_rv", type: "varchar(255)", note: "Đánh giá kết quả điều trị: Khỏi, Đỡ, Không đổi, Nặng hơn" }
    ],
    sqlSample: `SELECT cr.hcr_docno, cr.hcr_recordno, cr.hcr_treatment_method, cr.hcr_diagnostic FROM hms_clinical_record cr WHERE cr.hcr_docno = 26174151;`
  }
];

class SchemaLookupEngine {
  constructor() {
    this.schema = window.VIMES_SCHEMA || { metadata: {}, sections: [], tables: [] };
    this.forms = window.VIMES_CLINICAL_FORMS || [];
    this.searchMode = "table"; // "table" | "column" | "form"
    this.selectedSection = "all";
    this.selectedPrefix = "all";
    this.currentTable = null;
    this.currentForm = null;
    this.columnInvertedIndex = new Map();
    this.buildIndex();
  }

  buildIndex() {
    if (!this.schema.tables) return;
    this.columnInvertedIndex.clear();

    this.schema.tables.forEach(table => {
      table.columns.forEach(col => {
        const cLower = col.name.toLowerCase();
        if (!this.columnInvertedIndex.has(cLower)) {
          this.columnInvertedIndex.set(cLower, []);
        }
        this.columnInvertedIndex.get(cLower).push({
          tableName: table.name,
          tableTitle: table.title || table.name,
          tableTopic: table.topic || table.section,
          tableDesc: table.description || "",
          tableSection: table.section,
          tableSectionId: table.sectionId,
          tableType: table.type,
          colName: col.name,
          colDesc: col.description || `Trường ${col.name}`,
          colType: col.type,
          isPk: col.isPk,
          nullable: col.nullable,
          defaultVal: col.default
        });
      });
    });
  }

  /**
   * Search Medical Forms & Clinical Documents
   */
  searchByForm(query, sectionFilter = "all") {
    const rawQ = (query || "").trim();
    if (!rawQ) {
      return this.forms.map(f => ({ score: 1, ...f }));
    }

    const q = rawQ.toLowerCase();
    const qNorm = DocxTableParser ? DocxTableParser.removeAccents(q) : q;

    const matchedForms = [];

    this.forms.forEach(form => {
      const fTitleLower = form.title.toLowerCase();
      const fCodeLower = form.code.toLowerCase();
      const fDescLower = form.description.toLowerCase();
      const fTitleNorm = DocxTableParser ? DocxTableParser.removeAccents(fTitleLower) : fTitleLower;
      const fDescNorm = DocxTableParser ? DocxTableParser.removeAccents(fDescLower) : fDescLower;

      let score = 0;

      // Exact keyword match
      if (form.keywords.some(k => k === q || (DocxTableParser && DocxTableParser.removeAccents(k) === qNorm))) {
        score = 120;
      } else if (fTitleNorm.includes(qNorm)) {
        score = 100;
      } else if (fCodeLower.includes(q)) {
        score = 90;
      } else if (form.keywords.some(k => k.includes(q) || (DocxTableParser && DocxTableParser.removeAccents(k).includes(qNorm)))) {
        score = 80;
      } else if (fDescNorm.includes(qNorm)) {
        score = 60;
      } else {
        // Match in specific fields of the form
        const matchedField = form.fields.find(fld => {
          const fldNameNorm = DocxTableParser ? DocxTableParser.removeAccents(fld.docField.toLowerCase()) : fld.docField.toLowerCase();
          const colNorm = fld.column.toLowerCase();
          return fldNameNorm.includes(qNorm) || colNorm.includes(q);
        });
        if (matchedField) {
          score = 50;
        }
      }

      if (score > 0) {
        matchedForms.push({ score, ...form });
      }
    });

    matchedForms.sort((a, b) => b.score - a.score);
    return matchedForms;
  }

  getFormById(formId) {
    if (!formId) return null;
    return this.forms.find(f => f.id === formId) || null;
  }

  /**
   * Search by column name OR column Vietnamese description / meaning
   */
  searchByColumn(query, sectionFilter = "all", prefixFilter = "all") {
    const rawQ = (query || "").trim();
    if (!rawQ) return [];

    const q = rawQ.toLowerCase();
    const qNorm = DocxTableParser ? DocxTableParser.removeAccents(q) : q;

    const matchedItems = [];

    this.schema.tables.forEach(table => {
      if (sectionFilter !== "all" && table.sectionId !== sectionFilter && table.uiModuleId !== sectionFilter) return;
      if (prefixFilter !== "all" && !table.name.startsWith(prefixFilter)) return;

      const tNameNorm = DocxTableParser ? DocxTableParser.removeAccents(table.name.toLowerCase()) : table.name.toLowerCase();
      const tTitleNorm = DocxTableParser ? DocxTableParser.removeAccents((table.title || "").toLowerCase()) : (table.title || "").toLowerCase();
      const tTopicNorm = DocxTableParser ? DocxTableParser.removeAccents((table.topic || "").toLowerCase()) : (table.topic || "").toLowerCase();

      table.columns.forEach(col => {
        const cNameLower = col.name.toLowerCase();
        const cDescLower = (col.description || "").toLowerCase();
        const cNameNorm = DocxTableParser ? DocxTableParser.removeAccents(cNameLower) : cNameLower;
        const cDescNorm = DocxTableParser ? DocxTableParser.removeAccents(cDescLower) : cDescLower;

        let matchScore = 0;

        if (cNameLower === q) matchScore = 100;
        else if (cNameLower.startsWith(q)) matchScore = 80;
        else if (cNameLower.includes(q)) matchScore = 60;
        else if (cDescNorm.includes(qNorm)) matchScore = 50;
        else if (cNameNorm.includes(qNorm)) matchScore = 40;
        else if (tNameNorm.includes(qNorm) || tTitleNorm.includes(qNorm) || tTopicNorm.includes(qNorm)) matchScore = 30;

        if (matchScore > 0) {
          matchedItems.push({
            score: matchScore,
            tableName: table.name,
            tableTitle: table.title || table.name,
            tableTopic: table.topic || table.section,
            tableDesc: table.description || "",
            tableSection: table.section,
            tableSectionId: table.sectionId,
            uiModuleId: table.uiModuleId,
            uiModuleName: table.uiModuleName,
            tableType: table.type,
            colName: col.name,
            colDesc: col.description || `Trường dữ liệu ${col.name}`,
            colType: col.type,
            isPk: col.isPk,
            nullable: col.nullable,
            defaultVal: col.default
          });
        }
      });
    });

    matchedItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.isPk && !b.isPk) return -1;
      if (!a.isPk && b.isPk) return 1;
      return a.tableName.localeCompare(b.tableName);
    });

    return matchedItems;
  }

  /**
   * Search by table name, table Vietnamese title, topic or description
   */
  searchByTable(query, sectionFilter = "all", prefixFilter = "all") {
    const rawQ = (query || "").trim();
    const q = rawQ.toLowerCase();
    const qNorm = DocxTableParser ? DocxTableParser.removeAccents(q) : q;

    const matchedTables = [];

    this.schema.tables.forEach(table => {
      if (sectionFilter !== "all" && table.sectionId !== sectionFilter && table.uiModuleId !== sectionFilter) return;
      if (prefixFilter !== "all" && !table.name.startsWith(prefixFilter)) return;

      if (!rawQ) {
        matchedTables.push({ score: 1, ...table });
        return;
      }

      const tNameLower = table.name.toLowerCase();
      const tTitleLower = (table.title || "").toLowerCase();
      const tTopicLower = (table.topic || "").toLowerCase();
      const tDescLower = (table.description || "").toLowerCase();

      const tNameNorm = DocxTableParser ? DocxTableParser.removeAccents(tNameLower) : tNameLower;
      const tTitleNorm = DocxTableParser ? DocxTableParser.removeAccents(tTitleLower) : tTitleLower;
      const tTopicNorm = DocxTableParser ? DocxTableParser.removeAccents(tTopicLower) : tTopicLower;
      const tDescNorm = DocxTableParser ? DocxTableParser.removeAccents(tDescLower) : tDescLower;

      let score = 0;
      if (tNameLower === q) score = 100;
      else if (tNameLower.startsWith(q)) score = 80;
      else if (tNameLower.includes(q)) score = 60;
      else if (tTitleNorm.includes(qNorm)) score = 50;
      else if (tTopicNorm.includes(qNorm)) score = 40;
      else if (tDescNorm.includes(qNorm)) score = 30;
      else if (tNameNorm.includes(qNorm)) score = 20;

      if (score > 0) {
        matchedTables.push({ score, ...table });
      }
    });

    matchedTables.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    return matchedTables;
  }

  getTableByName(tableName) {
    if (!tableName) return null;
    const tLower = tableName.trim().toLowerCase();
    return this.schema.tables.find(t => t.name.toLowerCase() === tLower) || null;
  }

  highlight(text, query) {
    if (!text || !query) return text || "";
    const q = query.trim();
    if (!q) return text;
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return String(text).replace(regex, '<mark class="highlight-term">$1</mark>');
    } catch (e) {
      return text;
    }
  }

  generateSelectSql(table) {
    if (!table || !table.columns) return "";
    const colList = table.columns.map(c => `  ${c.name} -- ${c.description || ''}`).join(",\n");
    const pkCols = table.columns.filter(c => c.isPk).map(c => `${c.name} = ?`);
    const whereClause = pkCols.length > 0 ? `WHERE ${pkCols.join(" AND ")}` : "-- WHERE điều kiện";

    return `-- ===============================================================
-- Bảng: ${table.name} (${table.title || ''})
-- Chủ đề: ${table.topic || table.section}
-- Tổng số cột/biến: ${table.columns.length} cột
-- ===============================================================
SELECT
${colList}
FROM ${table.name}
${whereClause}
LIMIT 100;`;
  }
}

window.schemaLookupEngine = new SchemaLookupEngine();
