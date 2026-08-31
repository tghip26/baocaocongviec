/**
 * tool-schema-lookup.js
 * Comprehensive Semantic Database Schema, Column Variable & Medical Clinical Form Lookup Engine for VIMES HIS.
 * Multi-dimensional search:
 *  1. Table Mode (Tra cứu Bảng CSDL)
 *  2. Column / Variable Mode (Tra cứu Biến / Cột)
 *  3. Medical Form & Document Mode (Tra cứu Mẫu Biểu / Giấy tờ y tế: Giấy ra viện, Chuyển tuyến, Bảng kê, Đơn thuốc...)
 */

// REGISTRY CÁC BIỂU MẪU Y TẾ & BẢN ĐỒ ÁNH XẠ TRƯỜNG DỮ LIỆU CSDL VIMES HIS
// Tên biến (column) sử dụng TÊN THỰC TẾ trong CSDL VIMES – đã kiểm tra với pgAdmin 4
window.VIMES_CLINICAL_FORMS = [
  {
    id: "form_giay_ra_vien",
    code: "MS: 02/TT25",
    standard: "Thông tư 18/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY RA VIỆN",
    category: "Nội trú & Xuất viện",
    icon: "📄",
    keywords: ["giấy ra viện", "giay ra vien", "mã đt kcb", "ma dt kcb", "hd_ma_doituong_kcb", "ra viện", "02/tt25", "mau 02", "xuat vien", "nghi them", "nghi bhxh", "giay chung nhan ra vien", "hms_discharge_certificate", "hms_clinical_record", "hms_doc",
               "hp_surname", "hp_midname", "hp_firstname", "hp_birthdate", "hp_sex", "hp_ethnic", "hp_occupation", "hp_sin",
               "hp_dtladdr", "hp_provid", "hp_distid", "hp_villid", "hd_docno", "hd_admitdate", "hd_enddate", "hd_icd",
               "hd_diagnostic", "hd_cardno", "hc_cardno", "hd_yofage", "hd_mofage", "hd_enddept", "hd_doctor",
               "hcr_docno", "hcr_recordno", "hcr_admitdate", "hcr_dischargedate", "hcr_doctor",
               "hcr_treatment_method", "hcr_note", "hcr_rest_days", "hcr_rest_from", "hcr_rest_to"],
    description: "Giấy tờ hành chính và chuyên môn xác nhận người bệnh kết thúc đợt điều trị nội trú, lưu trữ hồ sơ bệnh án và xác nhận thời gian nghỉ việc hưởng chế độ BHXH.",
    primaryTables: ["hms_doc", "hms_patient", "hms_clinical_record", "hms_card", "bh_ct01", "bh_ct03", "sys_user"],
    fields: [
      {
        no: 1,
        docField: "Số lưu trữ / Mã lưu khoa",
        example: "TMH/47151",
        table: "hms_clinical_record / hms_doc",
        column: "hcr_recordno / hd_recordno",
        type: "varchar(20)",
        note: "Số lưu trữ hồ sơ bệnh án khoa điều trị (VD: Khoa Tai Mũi Họng). Khóa liên kết: hcr_docno = hd_docno"
      },
      {
        no: 2,
        docField: "Số hồ sơ (Mã đợt tiếp đón KCB)",
        example: "26174151",
        table: "hms_doc",
        column: "hd_docno",
        type: "bigint",
        note: "Mã định danh duy nhất của lượt KCB – Khóa chính kết nối xuyên suốt toàn bộ CSDL VIMES (hms_doc, hms_clinical_record, hms_fee, bh_ct01...)"
      },
      {
        no: 3,
        docField: "Họ tên người bệnh",
        example: "NGUYỄN VĂN TUẤN",
        table: "hms_patient / hms_doc",
        column: "hp_surname, hp_midname, hp_firstname / hd_fullname",
        type: "varchar(15) / varchar(30) / varchar(20)",
        note: "Họ (hp_surname) + Tên đệm (hp_midname) + Tên (hp_firstname). Liên kết: hms_doc.hd_patientno = hms_patient.hp_patientno. Trong hms_doc có hd_fullname (họ tên ghép sẵn)"
      },
      {
        no: 4,
        docField: "Ngày/tháng/năm sinh",
        example: "10/10/1997",
        table: "hms_patient",
        column: "hp_birthdate",
        type: "date",
        note: "Ngày sinh đầy đủ định dạng DD/MM/YYYY. Câu lệnh in: TO_CHAR(hp_birthdate, 'DD/MM/YYYY')"
      },
      {
        no: 5,
        docField: "Tuổi người bệnh",
        example: "29",
        table: "hms_doc",
        column: "hd_yofage, hd_mofage",
        type: "integer",
        note: "hd_yofage = Tuổi (năm). hd_mofage = Tuổi tháng (dùng cho trẻ < 6 tuổi). Được tính từ hp_birthdate khi lưu hồ sơ"
      },
      {
        no: 6,
        docField: "Nam / Nữ (Giới tính)",
        example: "Nam",
        table: "hms_patient",
        column: "hp_sex",
        type: "varchar(1)",
        note: "Quy ước: 'M' hoặc '1' = Nam, 'F' hoặc '2' = Nữ. Hiển thị: CASE WHEN hp_sex IN ('M','1') THEN 'Nam' ELSE 'Nữ' END"
      },
      {
        no: 7,
        docField: "Dân tộc",
        example: "Kinh",
        table: "hms_patient (FK sys_ethnic)",
        column: "hp_ethnic → sys_ethnic.se_name",
        type: "integer → varchar(64)",
        note: "hp_ethnic lưu mã số dân tộc. JOIN sys_ethnic se ON p.hp_ethnic = se.se_id để lấy tên (1: Kinh, 2: Tày, 3: Thái...)"
      },
      {
        no: 8,
        docField: "Nghề nghiệp",
        example: "Công nhân",
        table: "hms_patient (FK sys_occupation)",
        column: "hp_occupation → sys_occupation.so_name",
        type: "integer → varchar(128)",
        note: "hp_occupation lưu mã nghề nghiệp. JOIN sys_occupation so ON p.hp_occupation = so.so_id để lấy tên nghề"
      },
      {
        no: 9,
        docField: "Số CCCD / CMT / Hộ chiếu",
        example: "027097002405",
        table: "hms_patient",
        column: "hp_sin",
        type: "varchar(13)",
        note: "hp_sin = Số định danh cá nhân (CCCD 12 số, CMT 9 số, hoặc Hộ chiếu dạng FR8716994). Đây là trường thực tế trong CSDL VIMES – KHÔNG phải hp_idcard"
      },
      {
        no: 10,
        docField: "Ngày cấp CCCD / Hộ chiếu",
        example: "27/04/2021",
        table: "hms_patient",
        column: "hp_iddate",
        type: "date",
        note: "Ngày cấp giấy tờ định danh. Kiểm tra tên cột thực tế trên từng phiên bản VIMES (có thể là hp_iddate hoặc hp_id_date)"
      },
      {
        no: 11,
        docField: "Mã ĐT KCB (Đối tượng KCB BHYT)",
        example: "DN4",
        table: "hms_doc",
        column: "hd_ma_doituong_kcb",
        type: "character varying(4)",
        note: "Mã đối tượng KCB BHYT (VD: DN4, HT2, TE1...). Ô Mã ĐT KCB trên màn hình Tiếp nhận / Thông tin thẻ"
      },
      {
        no: 11.5,
        docField: "Mã số BHXH / Thẻ BHYT số",
        example: "DN424272131563527008",
        table: "hms_card / hms_doc / bh_ct01",
        column: "hc_cardno / hd_cardno",
        type: "varchar(25)",
        note: "hc_cardno trong hms_card = số thẻ BHYT đầy đủ. hd_cardno trong hms_doc = số thẻ tại thời điểm KCB. 10 số cuối là mã BHXH cá nhân"
      },
      {
        no: 12,
        docField: "Địa chỉ người bệnh",
        example: "Xã Phù Lãng, Tỉnh Bắc Ninh",
        table: "hms_patient",
        column: "hp_dtladdr, hp_villid, hp_distid, hp_provid",
        type: "varchar(254) / integer / integer / integer",
        note: "hp_dtladdr = địa chỉ chi tiết (tên đường, số nhà). hp_provid → Tỉnh/TP, hp_distid → Quận/Huyện, hp_villid → Xã/Phường (đều FK vào danh mục hành chính)"
      },
      {
        no: 13,
        docField: "Vào viện lúc (Giờ phút, ngày tháng năm)",
        example: "09 giờ 28 phút, ngày 21 tháng 08 năm 2026",
        table: "hms_doc / hms_clinical_record / bh_ct01",
        column: "hd_admitdate / hcr_admitdate",
        type: "timestamp without time zone",
        note: "hd_admitdate = thời điểm tiếp đón tại CSKB. hcr_admitdate = thời điểm vào khoa điều trị. Định dạng BHYT (XML): YYYYMMDDHHMM"
      },
      {
        no: 14,
        docField: "Ra viện lúc (Giờ phút, ngày tháng năm)",
        example: "11 giờ 30 phút, ngày 27 tháng 08 năm 2026",
        table: "hms_doc / hms_clinical_record / bh_ct01",
        column: "hd_enddate / hcr_dischargedate",
        type: "timestamp without time zone",
        note: "hd_enddate = ngày đóng hồ sơ/thanh toán viện phí. hcr_dischargedate = thời điểm bác sĩ xác nhận xuất viện trên hồ sơ bệnh án"
      },
      {
        no: 15,
        docField: "Chẩn đoán ra viện (Mã ICD + Tên bệnh)",
        example: "[H91.2] Điếc đột ngột tai trái ngày thứ 4",
        table: "hms_doc / hms_clinical_record / bh_ct01",
        column: "hd_icd, hd_diagnostic / hcr_main_icd, hcr_diagnostic",
        type: "varchar(13) + varchar(512)",
        note: "hd_icd = mã ICD-10, hd_diagnostic = tên bệnh. Bệnh phụ kèm theo: hd_reldisease. Trong hms_clinical_record: hcr_main_icd + hcr_diagnostic"
      },
      {
        no: 16,
        docField: "Phương pháp điều trị",
        example: "Nội khoa",
        table: "hms_clinical_record / hms_doc",
        column: "hcr_treatment_method / hd_treatmethod",
        type: "varchar(254) / text",
        note: "hcr_treatment_method trong hms_clinical_record = Nội khoa, Phẫu thuật, Thủ thuật, Chăm sóc điều dưỡng..."
      },
      {
        no: 17,
        docField: "Ghi chú / Lời dặn & Số ngày nghỉ thêm BHXH",
        example: "Ra viện. Nghỉ thêm 07 ngày từ ngày 28/08/2026 đến hết ngày 02/09/2028",
        table: "hms_clinical_record",
        column: "hcr_note, hcr_rest_days, hcr_rest_from, hcr_rest_to",
        type: "text + integer + date + date",
        note: "hcr_rest_days = số ngày nghỉ hưởng chế độ ốm đau BHXH. hcr_rest_from, hcr_rest_to = từ ngày – đến ngày. hcr_note = lời dặn BS"
      },
      {
        no: 18,
        docField: "Khoa phòng điều trị kết thúc",
        example: "Khoa Tai Mũi Họng (TMH)",
        table: "hms_doc (FK hms_dept)",
        column: "hd_enddept → hms_dept.hd_name",
        type: "varchar(7) → varchar(128)",
        note: "hd_enddept = mã khoa cuối. JOIN hms_dept dept ON d.hd_enddept = dept.hd_deptid để lấy tên khoa"
      },
      {
        no: 19,
        docField: "Người hành nghề KCB (Bác sĩ điều trị ký tên)",
        example: "BS. Hoàng Văn Minh",
        table: "hms_clinical_record (FK sys_user)",
        column: "hcr_doctor → sys_user.su_fullname, su_cchn",
        type: "varchar(15) → varchar(128)",
        note: "hcr_doctor = userid của BS điều trị. JOIN sys_user u ON hcr_doctor = u.su_userid để lấy su_fullname (họ tên) và su_cchn (chứng chỉ hành nghề)"
      },
      {
        no: 20,
        docField: "Đại diện đơn vị (Trưởng khoa / Giám đốc ký tên)",
        example: "TS.BS. Nguyễn Đình Tâm",
        table: "hms_doc / hms_dept (FK sys_user)",
        column: "hd_doctor → sys_user.su_fullname",
        type: "varchar(15) → varchar(128)",
        note: "hd_doctor = userid của Trưởng khoa hoặc Giám đốc ký duyệt. JOIN sys_user u ON hd_doctor = u.su_userid"
      }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN DỮ LIỆU ĐẦY ĐỦ CHO GIẤY RA VIỆN (MS: 02/TT25) TRÊN VIMES HIS
-- =========================================================================
SELECT 
    p.hp_patientno                                          AS ma_benh_nhan,
    d.hd_docno                                             AS so_ho_so,
    cr.hcr_recordno                                        AS so_luu_tru_khoa,
    -- Họ tên người bệnh (ghép từ 3 trường thực tế hms_patient)
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname,''), ' ', p.hp_firstname)) AS ho_ten_nguoi_benh,
    TO_CHAR(p.hp_birthdate, 'DD/MM/YYYY')                  AS ngay_thang_nam_sinh,
    d.hd_yofage                                            AS tuoi,
    d.hd_mofage                                            AS tuoi_thang,
    CASE WHEN p.hp_sex IN ('M', '1') THEN 'Nam' ELSE 'Nữ' END AS gioi_tinh,
    se.se_name                                             AS dan_toc,
    socc.so_name                                           AS nghe_nghiep,
    -- Số CCCD/CMT/Hộ chiếu lưu trong hp_sin (varchar 13)
    p.hp_sin                                               AS so_cccd_cmt_hochieu,
    -- Địa chỉ: chi tiết + mã hành chính
    p.hp_dtladdr                                           AS dia_chi_chitiet,
    p.hp_villid                                            AS ma_xa_phuong,
    p.hp_distid                                            AS ma_quan_huyen,
    p.hp_provid                                            AS ma_tinh_tp,
    d.hd_cardno                                            AS ma_the_bhyt,
    SUBSTRING(d.hd_cardno FROM 6 FOR 10)                   AS ma_so_bhxh,
    TO_CHAR(d.hd_admitdate, 'HH24:MI, DD/MM/YYYY')         AS vao_vien_luc,
    TO_CHAR(d.hd_enddate, 'HH24:MI, DD/MM/YYYY')           AS ra_vien_luc,
    d.hd_icd                                               AS ma_icd_chan_doan,
    d.hd_diagnostic                                        AS ten_chan_doan,
    COALESCE(cr.hcr_treatment_method, d.hd_treatmethod)    AS phuong_phap_dieu_tri,
    cr.hcr_note                                            AS ghi_chu_loi_dan,
    cr.hcr_rest_days                                       AS so_ngay_nghi_bhxh,
    cr.hcr_rest_from                                       AS tu_ngay_nghi,
    cr.hcr_rest_to                                         AS den_ngay_nghi,
    dept.hd_name                                           AS khoa_dieu_tri,
    u_treat.su_fullname                                    AS bac_si_dieu_tri,
    u_treat.su_cchn                                        AS cchn_bac_si,
    u_head.su_fullname                                     AS truong_khoa_giam_doc
FROM hms_doc d
JOIN hms_patient p     ON d.hd_patientno = p.hp_patientno
LEFT JOIN hms_clinical_record cr  ON d.hd_docno = cr.hcr_docno
LEFT JOIN hms_dept dept           ON d.hd_enddept = dept.hd_deptid
LEFT JOIN sys_ethnic se           ON p.hp_ethnic = se.se_id
LEFT JOIN sys_occupation socc     ON p.hp_occupation = socc.so_id
LEFT JOIN sys_user u_treat        ON cr.hcr_doctor = u_treat.su_userid
LEFT JOIN sys_user u_head         ON d.hd_doctor = u_head.su_userid
WHERE d.hd_docno = 26174151; -- Thay số hồ sơ cần tra cứu`
  },
  {
    id: "form_giay_chuyen_tuyen",
    code: "Mẫu số 06/BHYT",
    standard: "Thông tư 40/2015/TT-BYT & Quyết định 130/QĐ-BYT",
    title: "GIẤY CHUYỂN TUYẾN KCB BHYT",
    category: "Tiếp đón & Chuyển viện",
    icon: "🚑",
    keywords: ["giấy chuyển tuyến", "giay chuyen tuyen", "chuyển viện", "chuyen vien", "chuyển tuyến", "chuyen tuyen", "06/bhyt", "mau 06", "hms_transfer_paper", "hd_transplace",
               "hp_surname", "hp_firstname", "hd_docno", "hd_cardno", "hd_tohosid", "hd_transicd", "hd_transdiagn", "hd_transdate", "hd_transreason", "htp_docno", "htp_clinical_summary"],
    description: "Giấy tờ hành chính và chuyên môn chuyển người bệnh lên tuyến trên hoặc sang bệnh viện chuyên khoa điều trị.",
    primaryTables: ["hms_doc", "hms_patient", "hms_transfer_paper", "bh_ct01", "sys_hospital", "sys_user"],
    fields: [
      { no: 1, docField: "Số giấy chuyển tuyến", example: "CT-2026/08-142", table: "hms_transfer_paper / hms_doc", column: "htp_docno / hd_paper_trans", type: "varchar(48)", note: "Số lưu giấy chuyển tuyến liên thông Cổng BHYT" },
      { no: 2, docField: "Cơ sở KCB chuyển đến", example: "Bệnh viện Bạch Mai (Mã: 01001)", table: "hms_doc (FK sys_hospital)", column: "hd_tohosid → sys_hospital.sh_name", type: "varchar(7) → varchar(128)", note: "hd_tohosid = mã CSKCB tuyến trên. JOIN sys_hospital sh ON hd_tohosid = sh.sh_hospital_id để lấy tên bệnh viện" },
      { no: 3, docField: "Họ tên người bệnh", example: "TRẦN VĂN AN", table: "hms_patient", column: "hp_surname, hp_midname, hp_firstname", type: "varchar(15/30/20)", note: "Ghép: CONCAT(hp_surname,' ',hp_midname,' ',hp_firstname). Hoặc lấy hd_fullname từ hms_doc" },
      { no: 4, docField: "Mã thẻ BHYT", example: "HT2424272131563", table: "hms_card / hms_doc", column: "hc_cardno / hd_cardno", type: "varchar(25)", note: "hc_cardno trong hms_card = số thẻ hiện tại. hd_cardno trong hms_doc = số thẻ tại thời điểm KCB" },
      { no: 5, docField: "Tóm tắt bệnh lý & Quá trình điều trị", example: "Bệnh nhân điều trị 5 ngày không đỡ, khó thở tăng dần...", table: "hms_transfer_paper / hms_doc", column: "htp_clinical_summary / hd_transdiagn", type: "text / varchar(512)", note: "htp_clinical_summary trong bảng transfer_paper. hd_transdiagn trong hms_doc" },
      { no: 6, docField: "Chẩn đoán lúc chuyển tuyến", example: "[J18.9] Viêm phổi nặng biến chứng suy hô hấp", table: "hms_doc", column: "hd_transicd, hd_transdiagn", type: "varchar(11) + varchar(254)", note: "hd_transicd = mã ICD, hd_transdiagn = tên bệnh chẩn đoán khi làm thủ tục chuyển" },
      { no: 7, docField: "Lý do chuyển tuyến", example: "1: Đủ điều kiện chuyển tuyến", table: "hms_doc", column: "hd_transreason", type: "integer", note: "1: Đúng tuyến chuyên môn kỹ thuật; 2: Theo nguyện vọng người bệnh" },
      { no: 8, docField: "Thời gian chuyển tuyến", example: "14:00, 25/08/2026", table: "hms_doc / hms_transfer_paper", column: "hd_transdate / htp_transfer_time", type: "timestamp", note: "hd_transdate trong hms_doc = thời điểm bàn giao lên xe vận chuyển" }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN DỮ LIỆU CHO GIẤY CHUYỂN TUYẾN KCB BHYT (MẪU 06/BHYT)
-- =========================================================================
SELECT 
    d.hd_docno                                AS so_ho_so,
    TRIM(CONCAT(p.hp_surname,' ',COALESCE(p.hp_midname,''),' ',p.hp_firstname)) AS ho_ten_nguoi_benh,
    d.hd_cardno                               AS so_the_bhyt,
    sh.sh_name                                AS benh_vien_chuyen_den,
    sh.sh_hospital_id                         AS ma_cskcb_den,
    d.hd_transicd                             AS ma_icd_chuyen,
    d.hd_transdiagn                           AS chan_doan_chuyen,
    d.hd_transdate                            AS ngay_chuyen,
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
    keywords: ["bảng kê", "bang ke", "bảng kê 01", "bang ke 01", "01/bv", "02/bv", "chi phí", "vien phi", "bhyt thanh toan", "hms_fee", "bh_ct01", "bh_ct02",
               "hfe_cost", "hfe_exam_amount", "hfe_bed_amount", "hfe_lab_amount", "hfe_image_amount", "hfe_drug_amount", "hfe_material_amount",
               "hfe_inspaid_amount", "hfe_patpaid_amount", "hfe_deposit_amount", "t_tongchi", "t_bhtt", "t_bntt", "t_thuoc", "t_xn", "t_kham", "t_cdha", "t_vtyt"],
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
      { no: 10, docField: "Số tiền tạm ứng / Tạm gửi", example: "1,000,000 đ", table: "hms_fee", column: "hfe_deposit_amount", type: "numeric", note: "Tiền viện phí đã nộp trước khi vào viện" }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN DỮ LIỆU CHO BẢNG KÊ CHI PHÍ KHÁM CHỮA BỆNH (MẪU 01/BV, 02/BV)
-- =========================================================================
SELECT 
    d.hd_docno                        AS so_ho_so,
    TRIM(CONCAT(p.hp_surname,' ',COALESCE(p.hp_midname,''),' ',p.hp_firstname)) AS ho_ten,
    d.hd_cardno                       AS so_the_bhyt,
    f.hfe_cost                        AS tong_chi_phi,
    f.hfe_exam_amount                 AS tien_kham,
    f.hfe_bed_amount                  AS tien_giuong,
    f.hfe_lab_amount                  AS tien_xet_nghiem,
    f.hfe_image_amount                AS tien_cdha,
    f.hfe_drug_amount                 AS tien_thuoc,
    f.hfe_material_amount             AS tien_vtu_yteu,
    f.hfe_inspaid_amount              AS bhyt_thanh_toan,
    f.hfe_patpaid_amount              AS nguoi_benh_dong_chi_tra,
    f.hfe_deposit_amount              AS tien_tam_ung,
    (f.hfe_deposit_amount - f.hfe_patpaid_amount) AS so_tien_thanh_toan_lai
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
    keywords: ["đơn thuốc", "don thuoc", "kê đơn", "ke don", "thuốc", "thuoc", "don thuoc dien tu", "hms_pharma_order", "m_productitem",
               "hpo_orderid", "hpo_national_code", "hpo_doctor", "hpo_docno", "mp_name", "mp_strength", "mp_unit", "mp_active_ingredient",
               "hpol_qtyissue", "hpol_qtyorder", "hpol_usage", "hpol_instruction", "hpol_product_id", "hpol_orderid"],
    description: "Đơn thuốc ngoại trú hoặc nội trú ra viện kê cho người bệnh mang về, kèm mã liên thông Hệ thống Đơn thuốc Quốc gia.",
    primaryTables: ["hms_pharma_order", "hms_pharma_order_line", "m_productitem", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Mã đơn thuốc (nội bộ)", example: "9812", table: "hms_pharma_order", column: "hpo_orderid", type: "bigint", note: "Mã định danh đơn thuốc trong hệ thống VIMES (Khóa chính)" },
      { no: 2, docField: "Mã đơn thuốc Quốc gia", example: "01001-2608-ABC891", table: "hms_pharma_order", column: "hpo_national_code", type: "varchar(64)", note: "Mã cấp từ Cổng Đơn thuốc Quốc gia (donthuocquocgia.vn)" },
      { no: 3, docField: "Số hồ sơ liên kết", example: "26174151", table: "hms_pharma_order", column: "hpo_docno", type: "bigint", note: "FK liên kết đến hms_doc.hd_docno" },
      { no: 4, docField: "Tên thuốc / Biệt dược", example: "Augmentin 1g (Amoxicillin/Acid clavulanic)", table: "m_productitem / hms_pharma_order_line", column: "mp_name / hpol_productname", type: "varchar(255)", note: "mp_name = tên thuốc trong danh mục. hpol_productname = tên ghi trên đơn" },
      { no: 5, docField: "Hoạt chất", example: "Amoxicillin + Acid Clavulanic", table: "m_productitem", column: "mp_active_ingredient", type: "varchar(255)", note: "Hoạt chất chính của thuốc theo danh mục dược quốc gia" },
      { no: 6, docField: "Hàm lượng", example: "1000mg", table: "m_productitem", column: "mp_strength", type: "varchar(100)", note: "Hàm lượng quy chuẩn" },
      { no: 7, docField: "Đơn vị tính", example: "Viên / Lọ / Ống", table: "m_productitem", column: "mp_unit", type: "varchar(30)", note: "Đơn vị đóng gói nhỏ nhất của thuốc" },
      { no: 8, docField: "Số lượng kê", example: "14", table: "hms_pharma_order_line", column: "hpol_qtyissue, hpol_qtyorder", type: "numeric", note: "hpol_qtyissue = số lượng thực cấp, hpol_qtyorder = số lượng kê đơn" },
      { no: 9, docField: "Đường dùng", example: "Uống", table: "hms_pharma_order_line", column: "hpol_usage", type: "varchar(50)", note: "Uống, Tiêm, Bôi, Đặt, Nhỏ mắt..." },
      { no: 10, docField: "Cách dùng / Hướng dẫn", example: "Uống 1 viên/lần x 2 lần/ngày sau khi ăn no (Sáng: 1, Tối: 1)", table: "hms_pharma_order_line", column: "hpol_instruction", type: "varchar(512)", note: "Liều dùng, thời gian và hướng dẫn uống thuốc chi tiết" },
      { no: 11, docField: "Bác sĩ kê đơn & CCHN", example: "BS.CKI. Nguyễn Hải Đăng (CCHN: 001234/BN-CCHN)", table: "hms_pharma_order (FK sys_user)", column: "hpo_doctor → sys_user.su_fullname, su_cchn", type: "varchar(128)", note: "hpo_doctor = userid. JOIN sys_user u ON hpo_doctor = u.su_userid để lấy su_fullname và su_cchn" }
    ],
    sqlSample: `-- =========================================================================
-- TRUY VẤN CHI TIẾT ĐƠN THUỐC CỦA BỆNH NHÂN TRÊN VIMES HIS
-- =========================================================================
SELECT 
    po.hpo_orderid                    AS ma_don_thuoc,
    d.hd_docno                        AS so_ho_so,
    TRIM(CONCAT(p.hp_surname,' ',COALESCE(p.hp_midname,''),' ',p.hp_firstname)) AS ho_ten_benh_nhan,
    pi.mp_name                        AS ten_thuoc,
    pi.mp_active_ingredient           AS hoat_chat,
    pi.mp_strength                    AS ham_luong,
    pol.hpol_qtyissue                 AS so_luong,
    pi.mp_unit                        AS don_vi,
    pol.hpol_usage                    AS duong_dung,
    pol.hpol_instruction              AS cach_dung_loi_dan,
    u.su_fullname                     AS bac_si_ke_don
FROM hms_pharma_order po
JOIN hms_pharma_order_line pol ON po.hpo_orderid = pol.hpol_orderid
JOIN m_productitem pi             ON pol.hpol_product_id = pi.mp_product_id
JOIN hms_doc d                    ON po.hpo_docno = d.hd_docno
JOIN hms_patient p                ON d.hd_patientno = p.hp_patientno
LEFT JOIN sys_user u              ON po.hpo_doctor = u.su_userid
WHERE po.hpo_docno = 26174151;`
  },
  {
    id: "form_giay_chung_sinh",
    code: "Mẫu TT 17/2012",
    standard: "Thông tư 17/2012/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY CHỨNG SINH",
    category: "Sản khoa & Tiếp đón",
    icon: "👶",
    keywords: ["chứng sinh", "chung sinh", "giấy chứng sinh", "giay chung sinh", "sinh con", "so sinh", "hms_birthcertificate",
               "hbc_magcs", "hbc_patientname", "hbc_idcard", "hbc_tencha", "hbc_datetimeofbirth", "hbc_sex", "hbc_weigh", "hbc_themidwifery", "hbc_docno"],
    description: "Giấy chứng nhận sinh con tại cơ sở y tế phục vụ làm giấy khai sinh và liên thông dữ liệu Dịch vụ công Quốc gia.",
    primaryTables: ["hms_birthcertificate", "hms_patient", "hms_doc"],
    fields: [
      { no: 1, docField: "Mã Giấy chứng sinh", example: "GCS-2026-00451", table: "hms_birthcertificate", column: "hbc_magcs", type: "varchar(24)", note: "Mã số định danh Giấy chứng sinh cấp cho trẻ sơ sinh. Liên kết hồ sơ: hbc_docno = hms_doc.hd_docno" },
      { no: 2, docField: "Họ và tên mẹ", example: "LÊ THỊ THẢO", table: "hms_birthcertificate", column: "hbc_patientname", type: "varchar(65)", note: "Họ tên sản phụ (người mẹ). Liên kết hms_patient qua hbc_patientno" },
      { no: 3, docField: "Số CCCD / CMT / Hộ chiếu mẹ", example: "027195003412", table: "hms_birthcertificate / hms_patient", column: "hbc_idcard / hp_sin", type: "varchar(15) / varchar(13)", note: "hbc_idcard trong hms_birthcertificate. hp_sin trong hms_patient = số định danh của mẹ" },
      { no: 4, docField: "Họ và tên cha", example: "NGUYỄN VĂN AN", table: "hms_birthcertificate", column: "hbc_tencha", type: "varchar(128)", note: "Họ tên người cha (ghi theo khai báo)" },
      { no: 5, docField: "Thời điểm sinh", example: "03:15, 20/08/2026", table: "hms_birthcertificate", column: "hbc_datetimeofbirth", type: "timestamp", note: "Ngày giờ phút trẻ chào đời xác nhận bởi NHS/BS" },
      { no: 6, docField: "Giới tính con", example: "Nam", table: "hms_birthcertificate", column: "hbc_sex", type: "varchar(1)", note: "Giới tính trẻ sơ sinh (M: Nam, F: Nữ)" },
      { no: 7, docField: "Cân nặng khi sinh", example: "3,400 gram", table: "hms_birthcertificate", column: "hbc_weigh", type: "numeric", note: "Trọng lượng của bé lúc sinh (tính theo gram)" },
      { no: 8, docField: "Người đỡ đẻ (Nữ hộ sinh / Bác sĩ)", example: "NHS. Trần Thị Mai", table: "hms_birthcertificate", column: "hbc_themidwifery", type: "varchar(50)", note: "Tên nữ hộ sinh hoặc Bác sĩ đỡ đẻ" }
    ],
    sqlSample: `SELECT bc.hbc_magcs, bc.hbc_patientname, bc.hbc_idcard, bc.hbc_tencha,
       TO_CHAR(bc.hbc_datetimeofbirth,'HH24:MI DD/MM/YYYY') AS thoi_diem_sinh,
       CASE WHEN bc.hbc_sex IN ('M','1') THEN 'Nam' ELSE 'Nữ' END AS gioi_tinh_be,
       bc.hbc_weigh AS can_nang_gram, bc.hbc_themidwifery AS nguoi_do_de
FROM hms_birthcertificate bc WHERE bc.hbc_docno = 26174151;`
  },
  {
    id: "form_giay_hen_kham",
    code: "Mẫu TT 40/2015",
    standard: "Thông tư 40/2015/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY HẸN KHÁM LẠI",
    category: "Khám bệnh & Ngoại trú",
    icon: "📅",
    keywords: ["hẹn khám", "hen kham", "giấy hẹn", "giay hen", "tái khám", "tai kham", "hms_appointment",
               "ha_appoint_date", "hd_reexam_date", "ha_reason", "ha_doctor", "ha_docno", "ha_patientno"],
    description: "Giấy hẹn bệnh nhân tái khám định kỳ hoặc kiểm tra lại sau điều trị hưởng chế độ BHYT đúng tuyến.",
    primaryTables: ["hms_appointment", "hms_doc", "hms_patient"],
    fields: [
      { no: 1, docField: "Ngày hẹn khám lại", example: "15/09/2026", table: "hms_appointment / hms_doc", column: "ha_appoint_date / hd_reexam_date", type: "date", note: "ha_appoint_date trong hms_appointment. hd_reexam_date trong hms_doc. Có giá trị trong 10 ngày làm việc" },
      { no: 2, docField: "Lý do hẹn khám lại", example: "Đo lại thính lực và nội soi tai mũi họng kiểm tra", table: "hms_appointment", column: "ha_reason", type: "varchar(255)", note: "Chỉ định cận lâm sàng hoặc thăm dò chức năng cần làm lại" },
      { no: 3, docField: "Bác sĩ hẹn khám", example: "BS.CKI. Nguyễn Hải Đăng", table: "hms_appointment (FK sys_user)", column: "ha_doctor → sys_user.su_fullname", type: "varchar(128)", note: "ha_doctor = userid BS. JOIN sys_user u ON ha_doctor = u.su_userid để lấy họ tên" }
    ],
    sqlSample: `SELECT a.ha_appoint_date, a.ha_reason, u.su_fullname AS bac_si_hen_kham,
       TRIM(CONCAT(p.hp_surname,' ',COALESCE(p.hp_midname,''),' ',p.hp_firstname)) AS ho_ten
FROM hms_appointment a
JOIN hms_patient p ON a.ha_patientno = p.hp_patientno
LEFT JOIN sys_user u ON a.ha_doctor = u.su_userid
WHERE a.ha_docno = 26174151;`
  },
  {
    id: "form_tom_tat_benh_an",
    code: "Mẫu TT 18/2022",
    standard: "Thông tư 18/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "TÓM TẮT HỒ SƠ BỆNH ÁN",
    category: "Nội trú & EMR",
    icon: "📋",
    keywords: ["tóm tắt bệnh án", "tom tat benh an", "trích sao", "trich sao", "trích sao bệnh án", "hms_summary_record", "hms_clinical_record",
               "hcr_disease_process", "hcr_lab_summary", "hcr_treatment_method", "hcr_discharge_status", "hcr_docno", "hcr_main_icd", "hcr_diagnostic",
               "hcr_admitdate", "hcr_dischargedate", "hcr_doctor", "hcr_note"],
    description: "Bản tóm tắt quá trình điều trị nội trú, kết quả xét nghiệm chính, diễn biến bệnh lý và hướng dẫn điều trị tiếp theo.",
    primaryTables: ["hms_clinical_record", "hms_doc", "hms_patient", "sys_user"],
    fields: [
      { no: 1, docField: "Quá trình bệnh lý và diễn biến lâm sàng", example: "Bệnh nhân vào viện vì nghe kém tai trái đột ngột...", table: "hms_clinical_record", column: "hcr_disease_process", type: "text", note: "Tóm tắt từ lúc nhập viện đến khi xuất viện – tương ứng mẫu XML5 phần 'qu_trinh_benh_ly'" },
      { no: 2, docField: "Tóm tắt kết quả cận lâm sàng", example: "Thính lực đồ: Điếc tiếp nhận tai trái 65dB, CT Sọ não: Bình thường", table: "hms_clinical_record", column: "hcr_lab_summary", type: "text", note: "Các kết quả xét nghiệm, CĐHA tiêu biểu nhất" },
      { no: 3, docField: "Phương pháp điều trị", example: "Thuốc giãn mạch, Corticoid liều cao, Vitamin nhóm B", table: "hms_clinical_record", column: "hcr_treatment_method", type: "text", note: "Phương pháp nội khoa / ngoại khoa đã áp dụng" },
      { no: 4, docField: "Chẩn đoán bệnh chính (ICD khi ra viện)", example: "[H91.2] Điếc đột ngột tai trái", table: "hms_clinical_record", column: "hcr_main_icd, hcr_diagnostic", type: "varchar(13) + text", note: "hcr_main_icd = mã ICD-10, hcr_diagnostic = tên bệnh chi tiết" },
      { no: 5, docField: "Tình trạng người bệnh ra viện", example: "Tai trái nghe rõ hơn, hết chóng mặt, toàn trạng ổn định", table: "hms_clinical_record", column: "hcr_discharge_status", type: "varchar(255)", note: "Đánh giá kết quả điều trị: Khỏi, Đỡ, Không đổi, Nặng hơn, Tử vong" }
    ],
    sqlSample: `SELECT cr.hcr_docno, cr.hcr_recordno, cr.hcr_main_icd, cr.hcr_diagnostic,
       cr.hcr_disease_process, cr.hcr_lab_summary, cr.hcr_treatment_method,
       cr.hcr_discharge_status,
       TO_CHAR(cr.hcr_admitdate,'DD/MM/YYYY HH24:MI') AS vao_khoa,
       TO_CHAR(cr.hcr_dischargedate,'DD/MM/YYYY HH24:MI') AS ra_khoa,
       u.su_fullname AS bac_si_dieu_tri
FROM hms_clinical_record cr
LEFT JOIN sys_user u ON cr.hcr_doctor = u.su_userid
WHERE cr.hcr_docno = 26174151;`
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
        // Tìm trong fields của biểu mẫu: column name, docField, table, note
        let bestFieldScore = 0;
        form.fields.forEach(fld => {
          const colLower = fld.column.toLowerCase();
          const fldNameNorm = DocxTableParser ? DocxTableParser.removeAccents(fld.docField.toLowerCase()) : fld.docField.toLowerCase();
          const tableLower = fld.table.toLowerCase();
          const noteLower = (fld.note || "").toLowerCase();

          // Khớp chính xác tên biến trong column (ưu tiên cao nhất)
          if (colLower === q || colLower.split(/[\s,/→\-]+/).some(part => part.trim() === q)) {
            bestFieldScore = Math.max(bestFieldScore, 90); // Tìm đúng tên biến → điểm cao
          } else if (colLower.includes(q)) {
            bestFieldScore = Math.max(bestFieldScore, 75);
          } else if (tableLower.includes(q)) {
            bestFieldScore = Math.max(bestFieldScore, 60);
          } else if (fldNameNorm.includes(qNorm)) {
            bestFieldScore = Math.max(bestFieldScore, 55);
          } else if (noteLower.includes(q)) {
            bestFieldScore = Math.max(bestFieldScore, 40);
          }
        });
        if (bestFieldScore > 0) {
          score = bestFieldScore;
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
