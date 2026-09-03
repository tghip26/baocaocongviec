/**
 * tool-schema-lookup.js
 * Comprehensive Semantic Database Schema, Column Variable & Medical Clinical Form Lookup Engine for VIMES HIS.
 * Multi-dimensional search:
 *  1. Table Mode (Tra cứu Bảng CSDL)
 *  2. Column / Variable Mode (Tra cứu Biến / Cột)
 *  3. Medical Form & Document Mode (Tra cứu Toàn diện 25 Loại Phiếu Bệnh Viện, Chứng Từ Kho & Mẫu Biểu Y Tế VIMES)
 */

// REGISTRY CÁC LOẠI PHIẾU BỆNH VIỆN, CHỨNG TỪ KHO & BIỂU MẪU Y TẾ VIMES HIS
// Cung cấp trường tạo ra phiếu (slipCreatorField) và mẹo phân biệt nghiệp vụ (distinctionTip)
window.VIMES_CLINICAL_FORMS = [
  // =========================================================================
  // NHÓM 1: CẬN LÂM SÀNG & XÉT NGHIỆM
  // =========================================================================
  {
    id: "form_phieu_chi_dinh_xet_nghiem",
    code: "MS: 03/CLS (Lab Order)",
    standard: "Quy chuẩn HIS Bệnh viện & Cổng Xét nghiệm LIS",
    title: "PHIẾU CHỈ ĐỊNH XÉT NGHIỆM (HUYẾT HỌC, SINH HÓA, VI SINH)",
    category: "Cận lâm sàng & Xét nghiệm",
    icon: "🧪",
    slipCreatorField: "hpc_orderid (Bảng hms_testorder - Khóa chính tạo Số phiếu xét nghiệm)",
    distinctionTip: "Số phiếu 'hpc_orderid' in kèm mã vạch (Barcode) dán lên ống nghiệm. Khi phòng Lab quét mã vạch, máy xét nghiệm tự động nạp danh sách chỉ tiêu theo hpc_orderid này. Khác với hms_pacsorder dùng cho CĐHA!",
    keywords: ["phiếu xét nghiệm", "phieu xet nghiem", "chỉ định xét nghiệm", "chi dinh xet nghiem", "hms_testorder", "hpc_orderid", "hpc_docno", "xét nghiệm máu", "sinh hóa", "huyết học", "nước tiểu", "orderid"],
    description: "Phiếu do bác sĩ khám lâm sàng in ra chỉ định người bệnh đi làm các xét nghiệm cận lâm sàng (Huyết học, Sinh hóa, Nước tiểu, Miễn dịch, Vi sinh...).",
    primaryTables: ["hms_testorder", "hms_testorderline", "hms_doc", "hms_patient", "sys_user", "hms_dept"],
    fields: [
      { no: 1, docField: "Số phiếu chỉ định (Mã vạch Barcode)", example: "2609030012", table: "hms_testorder", column: "hpc_orderid", type: "integer", note: "Khóa chính tạo số phiếu chỉ định XN. Máy in nhãn mã vạch barcode quét trường này" },
      { no: 2, docField: "Số hồ sơ KCB (Mã tiếp đón)", example: "26174151", table: "hms_testorder", column: "hpc_docno", type: "integer", note: "FK liên kết đến hồ sơ đợt khám hms_doc.hd_docno" },
      { no: 3, docField: "Mã người bệnh", example: "98124", table: "hms_testorder", column: "hpc_patientno", type: "integer", note: "FK liên kết đến định danh người bệnh hms_patient.hp_patientno" },
      { no: 4, docField: "Thời gian chỉ định", example: "08:25 03/09/2026", table: "hms_testorder", column: "hpc_orderdate / hpc_createddate", type: "timestamp", note: "Thời điểm bác sĩ lưu và in phiếu chỉ định" },
      { no: 5, docField: "Khoa/Phòng chỉ định", example: "Khoa Khám Bệnh - Phòng 102", table: "hms_testorder (FK hms_dept)", column: "hpc_deptid → hms_dept.hd_name", type: "varchar(7)", note: "Khoa phòng nơi bác sĩ ra y lệnh" },
      { no: 6, docField: "Bác sĩ chỉ định", example: "BS.CKI. Nguyễn Hải Đăng", table: "hms_testorder (FK sys_user)", column: "hpc_doctor → sys_user.su_fullname", type: "varchar(15)", note: "Userid của bác sĩ ra y lệnh xét nghiệm" },
      { no: 7, docField: "Chẩn đoán lâm sàng", example: "[K29.0] Viêm dạ dày cấp", table: "hms_doc", column: "hd_diagnostic, hd_icd", type: "varchar(512)", note: "Chẩn đoán sơ bộ khi chỉ định xét nghiệm" },
      { no: 8, docField: "Trạng thái thực hiện", example: "C: Hoàn thành, O: Đang chờ", table: "hms_testorder", column: "hpc_status, hpc_iscomplete", type: "varchar(1)", note: "Cờ đánh dấu phòng xét nghiệm đã trả đủ kết quả hay chưa" }
    ],
    sqlSample: `-- TRUY VẤN DANH SÁCH PHIẾU CHỈ ĐỊNH XÉT NGHIỆM TRONG NGÀY
SELECT 
    t.hpc_orderid AS "Số Phiếu Chỉ Định XN",
    t.hpc_docno AS "Số Hồ Sơ KCB",
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname,''), ' ', p.hp_firstname)) AS "Họ Tên Bệnh Nhân",
    dept.hd_name AS "Khoa Chỉ Định",
    u.su_fullname AS "Bác Sĩ Chỉ Định",
    TO_CHAR(t.hpc_createddate, 'HH24:MI DD/MM/YYYY') AS "Thời Gian Chỉ Định",
    CASE WHEN t.hpc_iscomplete = 'Y' THEN 'Đã có kết quả' ELSE 'Đang chờ xét nghiệm' END AS "Trạng Thái"
FROM hms_testorder t
INNER JOIN hms_doc d ON t.hpc_docno = d.hd_docno
INNER JOIN hms_patient p ON t.hpc_patientno = p.hp_patientno
LEFT JOIN hms_dept dept ON t.hpc_deptid = dept.hd_deptid
LEFT JOIN sys_user u ON t.hpc_doctor = u.su_userid
WHERE t.hpc_createddate >= CURRENT_DATE
ORDER BY t.hpc_orderid DESC;`
  },
  {
    id: "form_phieu_ket_qua_xet_nghiem",
    code: "MS: 04/XN (Lab Result)",
    standard: "Tiêu chuẩn Kết quả Xét nghiệm BYT & LIS Interfacing",
    title: "PHIẾU KẾT QUẢ XÉT NGHIỆM",
    category: "Cận lâm sàng & Xét nghiệm",
    icon: "🔬",
    slipCreatorField: "hpc_orderid, hpc_line_id (Bảng hms_testorderline - Trường kết quả: hpc_result)",
    distinctionTip: "Chứa kết quả từng chỉ số xét nghiệm (hpc_result), chỉ số tham chiếu bình thường (hpc_norm_low - hpc_norm_high) và cờ báo động bất thường (hpc_isabnormal) cùng người thực hiện chạy máy.",
    keywords: ["kết quả xét nghiệm", "ket qua xet nghiem", "phiếu kết quả", "hms_testorderline", "hpc_result", "trị số bình thường", "chỉ số máu", "chỉ số sinh hóa"],
    description: "Phiếu in kết quả phân tích mẫu xét nghiệm trả về khoa phòng và lưu vào hồ sơ bệnh án của người bệnh.",
    primaryTables: ["hms_testorderline", "hms_testorder", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu chỉ định gốc", example: "2609030012", table: "hms_testorderline", column: "hpc_orderid", type: "integer", note: "Khóa ngoại nối về phiếu chỉ định hms_testorder" },
      { no: 2, docField: "Tên xét nghiệm / Chỉ tiêu", example: "Glucose máu (Đường huyết)", table: "hms_testorderline", column: "hpc_itemid → sys_feename", type: "varchar(128)", note: "Tên chỉ tiêu xét nghiệm" },
      { no: 3, docField: "Kết quả đo được", example: "5.8", table: "hms_testorderline", column: "hpc_result", type: "varchar(64)", note: "Giá trị định lượng hoặc định tính (Âm tính / Dương tính)" },
      { no: 4, docField: "Đơn vị tính", example: "mmol/L", table: "hms_testorderline", column: "hpc_unit", type: "varchar(30)", note: "Đơn vị đo lường quy chuẩn" },
      { no: 5, docField: "Khoảng tham chiếu (Bình thường)", example: "3.9 - 6.4", table: "hms_testorderline", column: "hpc_norm_low, hpc_norm_high", type: "numeric", note: "Giới hạn dưới và giới hạn trên bình thường" },
      { no: 6, docField: "Cảnh báo bất thường", example: "H: Cao, L: Thấp", table: "hms_testorderline", column: "hpc_isabnormal", type: "varchar(1)", note: "Đánh dấu tự động khi kết quả vượt ngoài ngưỡng an toàn" },
      { no: 7, docField: "Kỹ thuật viên / Người thực hiện", example: "KTV. Lê Thị Hà", table: "hms_testorderline", column: "hpc_performer", type: "varchar(15)", note: "Nhân viên phòng xét nghiệm chạy máy" }
    ],
    sqlSample: `SELECT 
    tl.hpc_orderid AS "Số Phiếu XN",
    tl.hpc_itemid AS "Mã Xét Nghiệm",
    tl.hpc_result AS "Kết Quả",
    tl.hpc_unit AS "Đơn Vị",
    tl.hpc_norm_low || ' - ' || tl.hpc_norm_high AS "Trị Số Bình Thường",
    tl.hpc_isabnormal AS "Cảnh Báo",
    tl.hpc_performer AS "Người Thực Hiện"
FROM hms_testorderline tl
WHERE tl.hpc_orderid = 2609030012;`
  },
  {
    id: "form_phieu_chi_dinh_cdha",
    code: "MS: 05/CĐHA (PACS Order)",
    standard: "Quy chuẩn Chẩn đoán hình ảnh & Thăm dò chức năng",
    title: "PHIẾU CHỈ ĐỊNH CHẨN ĐOÁN HÌNH ẢNH & THĂM DÒ CHỨC NĂNG",
    category: "Cận lâm sàng & CĐHA",
    icon: "🩻",
    slipCreatorField: "hpo_orderid (Bảng hms_pacsorder - Khóa chính tạo Số phiếu CĐHA)",
    distinctionTip: "Dùng cho X-Quang, CT-Scanner, MRI, Siêu âm màu, Nội soi, Điện tim (ECG), Điện não (EEG). Trong CSDL VIMES, tiền tố hpo_ của hms_pacsorder là CĐHA, KHÔNG được nhầm với hpo_ của bảng hms_ipharmaorder (thuốc nội trú)!",
    keywords: ["chỉ định cdha", "phiếu cdha", "x-quang", "siêu âm", "ct scanner", "mri", "nội soi", "hms_pacsorder", "hpo_orderid", "điện tim", "thăm dò chức năng"],
    description: "Phiếu chỉ định các dịch vụ chụp X-quang, cắt lớp vi tính CT, cộng hưởng từ MRI, siêu âm, nội soi tiêu hóa, điện tâm đồ.",
    primaryTables: ["hms_pacsorder", "hms_pacsorderline", "hms_doc", "hms_patient", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu chỉ định CĐHA", example: "2609030088", table: "hms_pacsorder", column: "hpo_orderid", type: "integer", note: "Khóa chính tạo số phiếu chỉ định CĐHA. Đồng bộ sang PACS Server" },
      { no: 2, docField: "Số hồ sơ KCB", example: "26174151", table: "hms_pacsorder", column: "hpo_docno", type: "integer", note: "FK liên kết hồ sơ hms_doc.hd_docno" },
      { no: 3, docField: "Dịch vụ kỹ thuật chỉ định", example: "Chụp X-quang tim phổi thẳng", table: "hms_pacsorderline", column: "hpol_itemid", type: "varchar(32)", note: "Mã và tên kỹ thuật CĐHA" },
      { no: 4, docField: "Vị trí chụp / Thăm dò", example: "Lồng ngực / Ngực thẳng", table: "hms_pacsorder", column: "hpo_bodypart", type: "varchar(64)", note: "Bộ phận giải phẫu cần khảo sát" },
      { no: 5, docField: "Bác sĩ chỉ định", example: "BS. Nguyễn Văn Tuấn", table: "hms_pacsorder", column: "hpo_doctor", type: "varchar(15)", note: "Bác sĩ lâm sàng ra y lệnh" }
    ],
    sqlSample: `SELECT 
    po.hpo_orderid AS "Số Phiếu CĐHA",
    po.hpo_docno AS "Số Hồ Sơ KCB",
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname,''), ' ', p.hp_firstname)) AS "Họ Tên Bệnh Nhân",
    po.hpo_orderdate AS "Thời Gian Chỉ Định",
    dept.hd_name AS "Khoa Chỉ Định",
    u.su_fullname AS "Bác Sĩ Chỉ Định"
FROM hms_pacsorder po
INNER JOIN hms_patient p ON po.hpo_patientno = p.hp_patientno
LEFT JOIN hms_dept dept ON po.hpo_deptid = dept.hd_deptid
LEFT JOIN sys_user u ON po.hpo_doctor = u.su_userid
WHERE po.hpo_orderdate >= CURRENT_DATE
ORDER BY po.hpo_orderid DESC;`
  },
  {
    id: "form_phieu_ket_qua_cdha_noisoi",
    code: "MS: 06/CĐHA (Imaging Report)",
    standard: "Báo cáo Kết quả Chẩn đoán hình ảnh & Nội soi",
    title: "PHIẾU KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH / SIÊU ÂM / NỘI SOI",
    category: "Cận lâm sàng & CĐHA",
    icon: "🖼️",
    slipCreatorField: "hpo_orderid (Bảng hms_pacsorder, hms_pacsorderline - Mô tả: hpo_result, kết luận: hpo_conclusion)",
    distinctionTip: "Phiếu in trả về có kèm ảnh in màu, phần mô tả chi tiết tổn thương (hpo_result), kết luận (hpo_conclusion) và đề nghị theo dõi của bác sĩ CĐHA.",
    keywords: ["kết quả cdha", "kết quả siêu âm", "kết quả nội soi", "kết quả xquang", "hpo_result", "hpo_conclusion"],
    description: "Phiếu trả kết quả có kèm mô tả hình ảnh tổn thương và kết luận của bác sĩ chuyên khoa Chẩn đoán hình ảnh / Thăm dò chức năng.",
    primaryTables: ["hms_pacsorder", "hms_pacsorderline", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu chỉ định", example: "2609030088", table: "hms_pacsorder", column: "hpo_orderid", type: "integer", note: "Khóa ngoại nối về phiếu chỉ định gốc" },
      { no: 2, docField: "Mô tả hình ảnh tổn thương", example: "Hình ảnh phế trường hai bên sáng đều, không thấy tổn thương khu trú...", table: "hms_pacsorder", column: "hpo_result", type: "text", note: "Mô tả giải phẫu bệnh học chi tiết" },
      { no: 3, docField: "Kết luận của Bác sĩ CĐHA", example: "Hiện tại hình ảnh tim phổi bình thường", table: "hms_pacsorder", column: "hpo_conclusion", type: "text", note: "Kết luận chẩn đoán in đậm trên phiếu" },
      { no: 4, docField: "Bác sĩ đọc kết quả", example: "BS.CKI. Nguyễn Thị Lan", table: "hms_pacsorder (FK sys_user)", column: "hpo_doctor → sys_user.su_fullname", type: "varchar(15)", note: "Bác sĩ CĐHA ký duyệt" }
    ],
    sqlSample: `SELECT po.hpo_orderid AS "Số Phiếu", po.hpo_result AS "Mô Tả", po.hpo_conclusion AS "Kết Luận", u.su_fullname AS "Bác Sĩ CĐHA"
FROM hms_pacsorder po
LEFT JOIN sys_user u ON po.hpo_doctor = u.su_userid
WHERE po.hpo_orderid = 2609030088;`
  },

  // =========================================================================
  // NHÓM 2: DƯỢC & QUẢN LÝ KHO THUỐC / VẬT TƯ
  // =========================================================================
  {
    id: "form_phieu_linh_thuoc_vtyt",
    code: "Mẫu C20-HD (Kho Dược)",
    standard: "Thông tư 22/2011/TT-BYT Quy định tổ chức & hoạt động Khoa Dược",
    title: "PHIẾU LĨNH THUỐC / VẬT TƯ Y TẾ KHOA PHÒNG",
    category: "Dược & Quản lý Kho",
    icon: "📦",
    slipCreatorField: "mt_orderno (Bảng m_transaction - Điều kiện lọc: mt_doctype IN ('DO', 'REQ', 'D'))",
    distinctionTip: "Do ĐIỀU DƯỠNG TRƯỞNG KHOA LÂM SÀNG lập để tổng hợp nhu cầu thuốc, hóa chất, VTYT trong ngày gửi lên Kho Dược lĩnh về tủ trực khoa. Để lọc đúng Phiếu Lĩnh trong CSDL: WHERE mt_doctype = 'DO' hoặc 'REQ'!",
    keywords: ["phiếu lĩnh", "phieu linh", "phiếu lĩnh thuốc", "phiếu lĩnh vật tư", "m_transaction", "mt_orderno", "mt_doctype", "DO", "REQ", "tủ trực"],
    description: "Phiếu tổng hợp y lệnh thuốc và vật tư y tế của cả khoa phòng gửi lên Kho Dược để cấp phát hàng ngày.",
    primaryTables: ["m_transaction", "m_transactionline", "m_productitem", "hms_dept", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu lĩnh (Mã chứng từ)", example: "PLT26-00158", table: "m_transaction", column: "mt_orderno", type: "varchar(15)", note: "Số phiếu lĩnh hiển thị trên phần mềm và bản in" },
      { no: 2, docField: "Loại chứng từ phiếu kho", example: "DO hoặc REQ (Department Order)", table: "m_transaction", column: "mt_doctype", type: "varchar(4)", note: "Quy ước: 'DO'/'REQ' = Phiếu lĩnh; 'PO' = Phiếu nhập; 'EX' = Phiếu xuất; 'TO' = Điều chuyển" },
      { no: 3, docField: "Khoa phòng yêu cầu lĩnh", example: "Khoa Hồi Sức Tích Cực (HSTC)", table: "m_transaction (FK hms_dept)", column: "mt_department_id → hms_dept.hd_name", type: "varchar(7)", note: "Khoa lâm sàng lập phiếu lĩnh" },
      { no: 4, docField: "Kho dược cấp phát", example: "Kho Chẵn Thuốc / Kho BHYT", table: "m_transaction", column: "mt_storage_id", type: "integer", note: "Kho xuất hàng" },
      { no: 5, docField: "Ngày lập phiếu lĩnh", example: "07:30 03/09/2026", table: "m_transaction", column: "mt_createddate", type: "timestamp", note: "Thời điểm điều dưỡng lập phiếu" },
      { no: 6, docField: "Tên thuốc / Vật tư lĩnh", example: "Ceftriaxon 1g (Lọ tiêm)", table: "m_productitem", column: "mp_name", type: "varchar(255)", note: "Tên thuốc hoặc vật tư tiêu hao" },
      { no: 7, docField: "Số lượng yêu cầu & Số lượng thực phát", example: "Yêu cầu: 30, Thực cấp: 30", table: "m_transactionline", column: "mtl_qtyorder, mtl_qtyissue", type: "numeric", note: "mtl_qtyorder = SL xin lĩnh; mtl_qtyissue = SL kho duyệt phát" }
    ],
    sqlSample: `-- TRUY VẤN DANH SÁCH CÁC PHIẾU LĨNH THUỐC / VẬT TƯ CỦA CÁC KHOA
SELECT 
    t.mt_orderno AS "Số Phiếu Lĩnh",
    t.mt_doctype AS "Loại Phiếu",
    dept.hd_name AS "Khoa Lĩnh",
    TO_CHAR(t.mt_createddate, 'HH24:MI DD/MM/YYYY') AS "Ngày Lập Phiếu",
    t.mt_description AS "Diễn Giải / Ghi Chú",
    u.su_fullname AS "Người Lập Phiếu"
FROM m_transaction t
LEFT JOIN hms_dept dept ON t.mt_department_id = dept.hd_deptid
LEFT JOIN sys_user u ON t.mt_createdby = u.su_userid
WHERE t.mt_doctype IN ('DO', 'REQ', 'D') -- Điều kiện Phiếu Lĩnh
  AND t.mt_createddate >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY t.mt_createddate DESC;`
  },
  {
    id: "form_phieu_nhap_kho_duoc",
    code: "Mẫu 01-VT (Bộ Tài Chính)",
    standard: "Thông tư 200/2014/TT-BTC & Chế độ kế toán Dược bệnh viện",
    title: "PHIẾU NHẬP KHO DƯỢC, VẬT TƯ Y TẾ & HÓA CHẤT",
    category: "Dược & Quản lý Kho",
    icon: "📥",
    slipCreatorField: "mt_orderno (Bảng m_transaction - Điều kiện lọc: mt_doctype IN ('PO', 'IN'))",
    distinctionTip: "Do THỦ KHO DƯỢC lập khi nhập hàng giao từ nhà thầu/công ty dược theo hóa đơn mua hàng. Chứa số hóa đơn mua, số lô (mtl_lot), hạn dùng (mtl_exp_date), giá nhập.",
    keywords: ["phiếu nhập kho", "phieu nhap kho", "nhập thuốc", "nhập vật tư", "m_transaction", "mt_orderno", "PO", "IN", "nhà cung cấp"],
    description: "Chứng từ kế toán xác nhận số lượng, quy cách, đơn giá và trị giá hàng hóa dược nhập vào kho bệnh viện.",
    primaryTables: ["m_transaction", "m_transactionline", "m_productitem", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu nhập kho", example: "PNK26-00412", table: "m_transaction", column: "mt_orderno", type: "varchar(15)", note: "Số phiếu nhập kho hiển thị trên sổ kho" },
      { no: 2, docField: "Loại chứng từ nhập kho", example: "PO hoặc IN (Purchase Order / Inward)", table: "m_transaction", column: "mt_doctype", type: "varchar(4)", note: "Quy ước: 'PO' hoặc 'IN' = Phiếu nhập kho mua hàng" },
      { no: 3, docField: "Nhà cung cấp / Công ty dược", example: "Công ty CP Dược phẩm Trung ương 1", table: "m_transaction", column: "mt_partner_id", type: "integer", note: "Đơn vị cung ứng trúng thầu" },
      { no: 4, docField: "Số hóa đơn tài chính GTGT", example: "HD-0049182", table: "m_transaction", column: "mt_invoiceno", type: "varchar(32)", note: "Số hóa đơn đỏ của nhà cung cấp" },
      { no: 5, docField: "Số lô & Hạn dùng", example: "Lô: LO2601 - HD: 12/2028", table: "m_transactionline", column: "mtl_lot, mtl_exp_date", type: "varchar(30), date", note: "Theo dõi hạn dùng theo nguyên tắc FEFO/FIFO" }
    ],
    sqlSample: `SELECT 
    t.mt_orderno AS "Số Phiếu Nhập",
    t.mt_invoiceno AS "Số Hóa Đơn Mua",
    t.mt_createddate AS "Ngày Nhập Kho",
    pi.mp_name AS "Tên Thuốc/Vật Tư",
    tl.mtl_lot AS "Số Lô",
    tl.mtl_exp_date AS "Hạn Dùng",
    tl.mtl_qtyissue AS "Số Lượng Nhập",
    tl.mtl_unitprice AS "Đơn Giá Mua"
FROM m_transaction t
JOIN m_transactionline tl ON t.mt_transaction_id = tl.mtl_transaction_id
JOIN m_productitem pi ON tl.mtl_product_id = pi.mp_product_id
WHERE t.mt_doctype IN ('PO', 'IN')
ORDER BY t.mt_createddate DESC LIMIT 50;`
  },
  {
    id: "form_phieu_xuat_kho_duoc",
    code: "Mẫu 02-VT (Bộ Tài Chính)",
    standard: "Thông tư 200/2014/TT-BTC & Quản lý Kho Dược",
    title: "PHIẾU XUẤT KHO DƯỢC & VẬT TƯ TIÊU HAO",
    category: "Dược & Quản lý Kho",
    icon: "📤",
    slipCreatorField: "mt_orderno (Bảng m_transaction - Điều kiện lọc: mt_doctype IN ('EX', 'OUT'))",
    distinctionTip: "Phiếu xuất kho ra ngoài bệnh viện hoặc xuất thanh lý, xuất phòng dịch, xuất viện trợ. Khác với Phiếu lĩnh khoa phòng (DO) và Phiếu điều chuyển (TO)!",
    keywords: ["phiếu xuất kho", "phieu xuat kho", "xuất thuốc", "xuất vật tư", "m_transaction", "mt_orderno", "EX", "OUT"],
    description: "Chứng từ xác nhận xuất thuốc, vật tư y tế ra khỏi kho phục vụ các mục đích nghiệp vụ bệnh viện.",
    primaryTables: ["m_transaction", "m_transactionline", "m_productitem"],
    fields: [
      { no: 1, docField: "Số phiếu xuất kho", example: "PXK26-00084", table: "m_transaction", column: "mt_orderno", type: "varchar(15)", note: "Số phiếu xuất kho lưu trữ" },
      { no: 2, docField: "Loại chứng từ xuất", example: "EX hoặc OUT (Export / Outward)", table: "m_transaction", column: "mt_doctype", type: "varchar(4)", note: "Quy ước: 'EX' hoặc 'OUT' = Phiếu xuất kho" }
    ],
    sqlSample: `SELECT t.mt_orderno, t.mt_doctype, t.mt_createddate, t.mt_description FROM m_transaction t WHERE t.mt_doctype IN ('EX', 'OUT');`
  },
  {
    id: "form_phieu_dieu_chuyen_kho",
    code: "Mẫu Transfer Order (M_TRANSACTION)",
    standard: "Quy chuẩn Luân chuyển Hàng hóa Dược Nội bộ",
    title: "PHIẾU ĐIỀU CHUYỂN KHO DƯỢC NỘI BỘ",
    category: "Dược & Quản lý Kho",
    icon: "🔄",
    slipCreatorField: "mt_orderno (Bảng m_transaction - Điều kiện: mt_doctype IN ('TO', 'TRA'))",
    distinctionTip: "Chuyển kho nội bộ giữa 2 kho trong bệnh viện. Kho xuất lưu trong mt_storage_id, kho nhận lưu trong mt_storage_to_id. Tồn kho của kho xuất giảm đi và tồn kho của kho nhận tăng lên tương ứng.",
    keywords: ["điều chuyển kho", "chuyển kho", "dieu chuyen", "m_transaction", "mt_orderno", "TO", "TRA", "kho chẵn", "kho lẻ"],
    description: "Chứng từ điều chuyển cơ số thuốc, dịch truyền, VTYT từ kho tổng sang các kho lẻ hoặc quầy phát thuốc bệnh viện.",
    primaryTables: ["m_transaction", "m_transactionline", "m_productitem"],
    fields: [
      { no: 1, docField: "Số phiếu điều chuyển", example: "PDC26-00052", table: "m_transaction", column: "mt_orderno", type: "varchar(15)", note: "Số phiếu điều chuyển kho" },
      { no: 2, docField: "Loại chứng từ", example: "TO hoặc TRA (Transfer Order)", table: "m_transaction", column: "mt_doctype", type: "varchar(4)", note: "Quy ước điều chuyển nội bộ" },
      { no: 3, docField: "Kho xuất đi", example: "Kho Chẵn Thuốc Trung Tâm", table: "m_transaction", column: "mt_storage_id", type: "integer", note: "Kho giảm số lượng tồn" },
      { no: 4, docField: "Kho tiếp nhận", example: "Kho Quầy Phát Thuốc BHYT", table: "m_transaction", column: "mt_storage_to_id", type: "integer", note: "Kho tăng số lượng tồn" }
    ],
    sqlSample: `SELECT t.mt_orderno, t.mt_storage_id, t.mt_storage_to_id, t.mt_createddate FROM m_transaction t WHERE t.mt_doctype IN ('TO', 'TRA');`
  },
  {
    id: "form_phieu_tra_lai_kho_duoc",
    code: "Mẫu Return Slip (Khoa -> Kho Dược)",
    standard: "Quy chuẩn Thu hồi Dược phẩm thừa",
    title: "PHIẾU TRẢ LẠI THUỐC / VẬT TƯ VỀ KHO DƯỢC",
    category: "Dược & Quản lý Kho",
    icon: "↩️",
    slipCreatorField: "mt_orderno (Bảng m_transaction - Điều kiện: mt_doctype IN ('RO', 'RET')) / hms_patient_returndrug",
    distinctionTip: "Khoa lâm sàng trả lại thuốc thừa của bệnh nhân ra viện hoặc đổi thuốc về kho dược. Phiếu này giúp trừ tiền thuốc đã tính cho người bệnh.",
    keywords: ["trả lại thuốc", "tra thuoc", "hoàn trả thuốc", "hms_patient_returndrug", "m_transaction", "RO", "RET"],
    description: "Chứng từ xác nhận khoa lâm sàng hoàn trả các loại thuốc, dịch truyền, vật tư chưa sử dụng về kho Dược để giảm trừ viện phí.",
    primaryTables: ["m_transaction", "hms_patient_returndrug", "m_productitem"],
    fields: [
      { no: 1, docField: "Số phiếu trả lại", example: "PTT26-00019", table: "m_transaction", column: "mt_orderno", type: "varchar(15)", note: "Số phiếu hoàn trả thuốc" },
      { no: 2, docField: "Loại chứng từ", example: "RO hoặc RET (Return Order)", table: "m_transaction", column: "mt_doctype", type: "varchar(4)", note: "Quy ước trả hàng về kho" },
      { no: 3, docField: "Hồ sơ bệnh nhân trả thuốc", example: "26174151", table: "hms_patient_returndrug", column: "hprd_docno", type: "integer", note: "Hồ sơ KCB được giảm trừ chi phí thuốc" }
    ],
    sqlSample: `SELECT t.mt_orderno, t.mt_createddate, t.mt_description FROM m_transaction t WHERE t.mt_doctype IN ('RO', 'RET');`
  },
  {
    id: "form_phieu_y_lenh_thuoc_noitru",
    code: "MS: Y lệnh thuốc EMR",
    standard: "Quy chế Hồ sơ Bệnh án & Y lệnh Dược nội trú",
    title: "PHIẾU Y LỆNH THUỐC NỘI TRÚ (INPATIENT MEDICATION ORDER)",
    category: "Dược & Nội trú",
    icon: "💊",
    slipCreatorField: "hpo_orderid (Bảng hms_ipharmaorder & hms_ipharmaorderline)",
    distinctionTip: "Bác sĩ khoa nội trú chỉ định thuốc tiêm, truyền, uống dùng hàng ngày cho người bệnh nằm viện. Khác với Đơn thuốc ngoại trú (hms_prescription) chỉ dùng khi khám ngoại trú hoặc ra viện mang về!",
    keywords: ["y lệnh thuốc", "y lenh thuoc", "thuốc nội trú", "hms_ipharmaorder", "hpo_orderid", "ipharma", "thuốc tiêm", "truyền dịch"],
    description: "Tờ chỉ định thuốc điều trị hàng ngày trong hồ sơ bệnh án nội trú, được điều dưỡng đối chiếu và thực hiện y lệnh tiêm/uống.",
    primaryTables: ["hms_ipharmaorder", "hms_ipharmaorderline", "m_productitem", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu y lệnh thuốc", example: "148912", table: "hms_ipharmaorder", column: "hpo_orderid", type: "integer", note: "Khóa chính tạo số phiếu y lệnh thuốc nội trú" },
      { no: 2, docField: "Số hồ sơ KCB", example: "26174151", table: "hms_ipharmaorder", column: "hpo_docno", type: "integer", note: "FK nối vào bệnh án hms_doc" },
      { no: 3, docField: "Ngày chỉ định dùng thuốc", example: "03/09/2026", table: "hms_ipharmaorder", column: "hpo_orderdate", type: "timestamp", note: "Ngày người bệnh dùng thuốc" },
      { no: 4, docField: "Tên thuốc & Hàm lượng", example: "Ceftriaxon 1g", table: "m_productitem", column: "mp_name", type: "varchar(255)", note: "Tên thuốc chỉ định" },
      { no: 5, docField: "Số lượng chỉ định trong ngày", example: "2 Lọ", table: "hms_ipharmaorderline", column: "hpol_qtyorder", type: "numeric", note: "Liều lượng dùng trong 24h" },
      { no: 6, docField: "Đường dùng & Thời điểm dùng", example: "Tiêm TM chậm 08h - 16h", table: "hms_ipharmaorderline", column: "hpol_usage, hpol_instruction", type: "varchar(50)", note: "Đường dùng (uống, tiêm bắp, tiêm TM, truyền TM) và giờ dùng" }
    ],
    sqlSample: `SELECT 
    ipo.hpo_orderid AS "Số Y Lệnh Thuốc",
    ipo.hpo_docno AS "Số Hồ Sơ KCB",
    pi.mp_name AS "Tên Thuốc",
    ipol.hpol_qtyorder AS "Số Lượng",
    ipol.hpol_usage AS "Đường Dùng",
    u.su_fullname AS "Bác Sĩ Chỉ Định"
FROM hms_ipharmaorder ipo
JOIN hms_ipharmaorderline ipol ON ipo.hpo_orderid = ipol.hpol_orderid
JOIN m_productitem pi ON ipol.hpol_product_id = pi.mp_product_id
LEFT JOIN sys_user u ON ipo.hpo_doctor = u.su_userid
WHERE ipo.hpo_orderdate >= CURRENT_DATE
ORDER BY ipo.hpo_orderid DESC;`
  },
  {
    id: "form_don_thuoc",
    code: "Đơn thuốc Quốc gia",
    standard: "Thông tư 04/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML2)",
    title: "ĐƠN THUỐC NGOẠI TRÚ / ĐƠN THUỐC ĐIỆN TỬ",
    category: "Dược & Đơn thuốc",
    icon: "💊",
    slipCreatorField: "hp_idx / hp_receptidx (Bảng hms_prescription, m_productitem)",
    distinctionTip: "Đơn thuốc ngoại trú hoặc nội trú ra viện kê cho người bệnh mang về nhà uống, kèm mã liên thông Hệ thống Đơn thuốc Quốc gia (donthuocquocgia.vn). Khác với y lệnh nội trú (hms_ipharmaorder)!",
    keywords: ["đơn thuốc", "don thuoc", "kê đơn", "ke don", "thuốc", "thuoc", "don thuoc dien tu", "hms_prescription", "m_productitem", "hp_idx", "hpol_qtyissue"],
    description: "Đơn thuốc ngoại trú hoặc nội trú ra viện kê cho người bệnh mang về, kèm mã liên thông Hệ thống Đơn thuốc Quốc gia.",
    primaryTables: ["hms_prescription", "hms_prescription_lock", "m_productitem", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Mã đơn thuốc (nội bộ)", example: "9812", table: "hms_prescription", column: "hp_idx", type: "integer", note: "Khóa chính đơn thuốc ngoại trú" },
      { no: 2, docField: "Số hồ sơ liên kết", example: "26174151", table: "hms_prescription", column: "hp_docno", type: "integer", note: "FK liên kết đến hms_doc.hd_docno" },
      { no: 3, docField: "Tên thuốc / Biệt dược", example: "Augmentin 1g (Amoxicillin/Acid clavulanic)", table: "m_productitem", column: "mp_name", type: "varchar(255)", note: "Tên thuốc trong danh mục" },
      { no: 4, docField: "Hoạt chất chính", example: "Amoxicillin + Acid Clavulanic", table: "m_productitem", column: "mp_active_ingredient", type: "varchar(255)", note: "Hoạt chất theo Dược thư Quốc gia" },
      { no: 5, docField: "Số lượng kê", example: "14", table: "hms_prescription", column: "hp_quantity", type: "integer", note: "Số lượng viên/gói/chai" },
      { no: 6, docField: "Bác sĩ kê đơn", example: "BS.CKI. Nguyễn Hải Đăng", table: "hms_prescription (FK sys_user)", column: "hp_createdby → sys_user.su_fullname", type: "varchar(15)", note: "Bác sĩ ký đơn thuốc" }
    ],
    sqlSample: `SELECT p.hp_idx AS "Mã Đơn", p.hp_docno AS "Số Hồ Sơ", p.hp_drugname AS "Tên Thuốc", p.hp_quantity AS "Số Lượng", p.hp_unit AS "Đơn Vị"
FROM hms_prescription p WHERE p.hp_docno = 26174151;`
  },

  // =========================================================================
  // NHÓM 3: VIỆN PHÍ & THU NGÂN
  // =========================================================================
  {
    id: "form_phieu_tam_ung_vien_phi",
    code: "Biên lai C40-HD (Tạm ứng)",
    standard: "Thông tư 200/2014/TT-BTC & Quản lý Viện phí Bệnh viện",
    title: "PHIẾU THU TIỀN TẠM ỨNG VIỆN PHÍ",
    category: "Viện phí & Thu ngân",
    icon: "💰",
    slipCreatorField: "hfe_invoiceno (Bảng hms_fee, hms_fee_invoice - Điều kiện lọc: hfe_type = 'P')",
    distinctionTip: "Cực kỳ quan trọng: Trong bảng hms_fee, ký hiệu chữ 'P' viết tắt của Prepaid / Pre-payment (Tạm ứng). Khi người dùng cần tìm 'Số phiếu tạm ứng' -> tra cứu hfe_invoiceno WHERE hfe_type = 'P'!",
    keywords: ["phiếu tạm ứng", "phieu tam ung", "tạm ứng", "hms_fee", "hfe_type", "P", "hfe_invoiceno", "hfe_deposit_amount", "tiền tạm ứng"],
    description: "Biên lai thu ngân phát hành khi người bệnh nộp tiền tạm ứng lúc làm thủ tục vào viện hoặc nộp bổ sung trong quá trình nằm viện.",
    primaryTables: ["hms_fee", "hms_fee_invoice", "hms_doc", "hms_patient", "sys_user"],
    fields: [
      { no: 1, docField: "Số phiếu / Biên lai tạm ứng", example: "TU26-009182", table: "hms_fee", column: "hfe_invoiceno", type: "varchar(32)", note: "Số biên lai thu tiền tạm ứng trên phần mềm và hóa đơn điện tử" },
      { no: 2, docField: "Loại giao dịch viện phí", example: "P (Prepaid / Tạm ứng)", table: "hms_fee", column: "hfe_type", type: "varchar(2)", note: "Quy ước cốt lõi: 'P' = Tạm ứng; 'R' = Hoàn ứng; 'F' = Quyết toán đợt KCB; 'E' = Thu tiền khám" },
      { no: 3, docField: "Số tiền tạm ứng nộp", example: "2,000,000 đ", table: "hms_fee", column: "hfe_amount / hfe_deposit_amount", type: "numeric", note: "Số tiền người bệnh thực nộp cho thu ngân" },
      { no: 4, docField: "Số hồ sơ KCB", example: "26174151", table: "hms_fee", column: "hfe_docno", type: "integer", note: "FK hồ sơ hms_doc.hd_docno" },
      { no: 5, docField: "Thời điểm thu tiền", example: "09:15 03/09/2026", table: "hms_fee", column: "hfe_createddate", type: "timestamp", note: "Ngày giờ in biên lai" },
      { no: 6, docField: "Thu ngân thu tiền", example: "Đ/c Trần Thị Hương", table: "hms_fee (FK sys_user)", column: "hfe_createdby → sys_user.su_fullname", type: "varchar(32)", note: "Nhân viên thu viện phí ký nhận tiền" }
    ],
    sqlSample: `-- TRUY VẤN TẤT CẢ CÁC PHIẾU THU TẠM ỨNG TRONG NGÀY
SELECT 
    f.hfe_invoiceno AS "Số Phiếu Tạm Ứng",
    f.hfe_docno AS "Số Hồ Sơ KCB",
    TRIM(CONCAT(p.hp_surname, ' ', COALESCE(p.hp_midname,''), ' ', p.hp_firstname)) AS "Họ Tên Bệnh Nhân",
    d.hd_cardno AS "Số Thẻ BHYT",
    f.hfe_amount AS "Số Tiền Tạm Ứng (VNĐ)",
    TO_CHAR(f.hfe_createddate, 'HH24:MI DD/MM/YYYY') AS "Thời Gian Thu",
    u.su_fullname AS "Thu Ngân Thu Tiền"
FROM hms_fee f
INNER JOIN hms_doc d ON f.hfe_docno = d.hd_docno
INNER JOIN hms_patient p ON d.hd_patientno = p.hp_patientno
LEFT JOIN sys_user u ON f.hfe_createdby = u.su_userid
WHERE f.hfe_type = 'P' -- Lọc chính xác Phiếu Tạm Ứng
  AND f.hfe_createddate >= CURRENT_DATE
ORDER BY f.hfe_createddate DESC;`
  },
  {
    id: "form_phieu_hoan_ung_vien_phi",
    code: "Biên lai C41-HD (Hoàn trả)",
    standard: "Chế độ Kế toán & Quản lý Tài chính Bệnh viện",
    title: "PHIẾU HOÀN ỨNG / THOÁI THU VIỆN PHÍ",
    category: "Viện phí & Thu ngân",
    icon: "💸",
    slipCreatorField: "hfe_invoiceno (Bảng hms_fee, hms_fee_refund - Điều kiện lọc: hfe_type = 'R')",
    distinctionTip: "Ký hiệu 'R' trong hfe_type viết tắt của Refund / Return (Hoàn ứng). Bệnh viện trả lại tiền thừa khi bệnh nhân xuất viện: Số tiền hoàn lại = (Tổng tạm ứng) - (Chi phí thực tế cùng chi trả).",
    keywords: ["hoàn ứng", "hoan ung", "thoái thu", "trả lại tiền", "hms_fee", "hfe_type", "R", "hfe_invoiceno", "hfe_refund"],
    description: "Biên lai chi trả lại tiền cho người bệnh khi số tiền tạm ứng lớn hơn số tiền viện phí thực tế người bệnh phải thanh toán lúc ra viện.",
    primaryTables: ["hms_fee", "hms_fee_refund", "hms_doc", "hms_patient"],
    fields: [
      { no: 1, docField: "Số phiếu hoàn ứng", example: "HU26-000412", table: "hms_fee", column: "hfe_invoiceno", type: "varchar(32)", note: "Số phiếu hoàn trả tiền viện phí" },
      { no: 2, docField: "Loại giao dịch", example: "R (Refund / Hoàn ứng)", table: "hms_fee", column: "hfe_type", type: "varchar(2)", note: "Quy ước: 'R' = Hoàn ứng viện phí" },
      { no: 3, docField: "Số tiền hoàn trả", example: "650,000 đ", table: "hms_fee", column: "hfe_amount", type: "numeric", note: "Số tiền bệnh viện chi trả lại người bệnh" }
    ],
    sqlSample: `SELECT f.hfe_invoiceno AS "Số Phiếu Hoàn Ứng", f.hfe_docno, f.hfe_amount AS "Số Tiền Hoàn Trả (VNĐ)", f.hfe_createddate
FROM hms_fee f WHERE f.hfe_type = 'R' AND f.hfe_createddate >= CURRENT_DATE;`
  },
  {
    id: "form_phieu_thu_vien_phi_ra_vien",
    code: "Biên lai Viện phí (Quyết toán)",
    standard: "Nghị định 123/2020/NĐ-CP Hóa đơn chứng từ & QĐ 130/QĐ-BYT",
    title: "HÓA ĐƠN / BIÊN LAI THU VIỆN PHÍ RA VIỆN",
    category: "Viện phí & Thu ngân",
    icon: "🧾",
    slipCreatorField: "hfe_invoiceno (Bảng hms_fee, hms_fee_invoice - Điều kiện lọc: hfe_type = 'F')",
    distinctionTip: "Ký hiệu 'F' viết tắt của Final Settlement / Fee Invoice (Quyết toán viện phí). Quyết toán chi phí toàn bộ đợt điều trị KCB, in kèm Bảng kê chi phí 01/BV hoặc 02/BV.",
    keywords: ["thanh toán ra viện", "hóa đơn viện phí", "biên lai ra viện", "hms_fee", "hfe_type", "F", "hfe_invoiceno", "quyết toán"],
    description: "Hóa đơn / Biên lai thanh toán toàn bộ chi phí đợt KCB trước khi người bệnh làm thủ tục xuất viện.",
    primaryTables: ["hms_fee", "hms_fee_invoice", "hms_doc", "bh_ct01"],
    fields: [
      { no: 1, docField: "Số biên lai / Hóa đơn quyết toán", example: "VP26-004128", table: "hms_fee", column: "hfe_invoiceno", type: "varchar(32)", note: "Số hóa đơn thu tiền quyết toán ra viện" },
      { no: 2, docField: "Loại giao dịch", example: "F (Final / Quyết toán)", table: "hms_fee", column: "hfe_type", type: "varchar(2)", note: "Quy ước: 'F' = Quyết toán ra viện" },
      { no: 3, docField: "Tổng chi phí đợt điều trị", example: "4,500,000 đ", table: "hms_fee", column: "hfe_cost", type: "numeric", note: "Tổng tiền khám, giường, thuốc, xét nghiệm, CĐHA..." },
      { no: 4, docField: "Bảo hiểm Y tế chi trả", example: "3,600,000 đ", table: "hms_fee", column: "hfe_inspaid_amount", type: "numeric", note: "Quỹ BHYT thanh toán theo quyền lợi" },
      { no: 5, docField: "Bệnh nhân thực trả", example: "900,000 đ", table: "hms_fee", column: "hfe_patpaid_amount", type: "numeric", note: "Số tiền người bệnh đồng chi trả" }
    ],
    sqlSample: `SELECT f.hfe_invoiceno AS "Số Hóa Đơn", f.hfe_docno, f.hfe_cost AS "Tổng Chi Phí", f.hfe_inspaid_amount AS "BHYT Trả", f.hfe_patpaid_amount AS "Bệnh Nhân Trả"
FROM hms_fee f WHERE f.hfe_type = 'F' ORDER BY f.hfe_createddate DESC LIMIT 50;`
  },
  {
    id: "form_phieu_thu_kham_ngoaitru",
    code: "Biên lai Phí Ngoại trú",
    standard: "Quy chuẩn Thu viện phí Ngoại trú",
    title: "PHIẾU THU TIỀN KHÁM BỆNH & DỊCH VỤ NGOẠI TRÚ",
    category: "Viện phí & Thu ngân",
    icon: "💵",
    slipCreatorField: "hfe_invoiceno (Bảng hms_fee - Điều kiện lọc: hfe_type = 'E')",
    distinctionTip: "Ký hiệu 'E' viết tắt của Exam Fee (Tiền khám bệnh). Thu tiền công khám ban đầu tại quầy tiếp đón hoặc thanh toán từng dịch vụ ngoại trú chỉ định lẻ.",
    keywords: ["thu tiền khám", "tiền khám", "ngoại trú", "hfe_type", "E", "hms_fee"],
    description: "Biên lai thu tiền công khám bệnh và các dịch vụ kỹ thuật lẻ phát sinh tại khoa khám bệnh ngoại trú.",
    primaryTables: ["hms_fee", "hms_doc"],
    fields: [
      { no: 1, docField: "Số phiếu thu tiền khám", example: "PK26-01584", table: "hms_fee", column: "hfe_invoiceno", type: "varchar(32)", note: "Số phiếu thu công khám" },
      { no: 2, docField: "Loại giao dịch", example: "E (Exam Fee / Phí khám)", table: "hms_fee", column: "hfe_type", type: "varchar(2)", note: "Quy ước: 'E' = Thu tiền khám ngoại trú" }
    ],
    sqlSample: `SELECT f.hfe_invoiceno, f.hfe_docno, f.hfe_amount, f.hfe_createddate FROM hms_fee f WHERE f.hfe_type = 'E';`
  },
  {
    id: "form_bang_ke_01",
    code: "Mẫu 01/BV & 02/BV",
    standard: "Quyết định 6556/QĐ-BYT & QĐ 130/QĐ-BYT (XML1, XML2, XML3)",
    title: "BẢNG KÊ CHI PHÍ KHÁM BỆNH, CHỮA BỆNH (01/BV, 02/BV)",
    category: "Viện phí & Giám định BHYT",
    icon: "🧾",
    slipCreatorField: "ma_lk (Bảng bh_ct01), hfe_docno (Bảng hms_fee)",
    distinctionTip: "Bảng kê 01/BV dùng cho Nội trú, 02/BV dùng cho Ngoại trú. Đây là chứng từ quan trọng nhất đối chiếu giữa bệnh viện và cơ quan Bảo hiểm Xã hội để giám định thanh quyết toán chi phí KCB BHYT.",
    keywords: ["bảng kê", "bang ke", "bảng kê 01", "bang ke 01", "01/bv", "02/bv", "chi phí", "vien phi", "bhyt thanh toan", "hms_fee", "bh_ct01", "bh_ct02"],
    description: "Bảng kê tổng hợp toàn bộ chi phí tiền khám, giường bệnh, xét nghiệm, chẩn đoán hình ảnh, thuốc, vật tư và tỷ lệ thanh toán BHYT.",
    primaryTables: ["hms_fee", "hms_fee_invoice", "hms_fee_item", "hms_doc", "bh_ct01", "bh_ct02"],
    fields: [
      { no: 1, docField: "Tổng chi phí KCB", example: "3,850,000 đ", table: "hms_fee / bh_ct01", column: "hfe_cost / t_tongchi", type: "numeric", note: "Tổng toàn bộ các mục chi phí phát sinh" },
      { no: 2, docField: "Tiền khám bệnh", example: "42,000 đ", table: "hms_fee / bh_ct01", column: "hfe_exam_amount / t_kham", type: "numeric", note: "Chi phí công khám của bác sĩ" },
      { no: 3, docField: "Tiền ngày giường điều trị", example: "1,250,000 đ", table: "hms_fee / bh_ct01", column: "hfe_bed_amount / t_giuong", type: "numeric", note: "Tiền giường nội trú / ngoại trú" },
      { no: 4, docField: "Tiền xét nghiệm", example: "680,000 đ", table: "hms_fee / bh_ct01", column: "hfe_lab_amount / t_xn", type: "numeric", note: "Tổng tiền xét nghiệm" },
      { no: 5, docField: "Tiền CĐHA", example: "450,000 đ", table: "hms_fee / bh_ct01", column: "hfe_image_amount / t_cdha", type: "numeric", note: "Tổng chi phí CĐHA" },
      { no: 6, docField: "Tiền thuốc, dịch truyền", example: "920,000 đ", table: "hms_fee / bh_ct01", column: "hfe_drug_amount / t_thuoc", type: "numeric", note: "Chi phí thuốc BHYT" },
      { no: 7, docField: "Quỹ BHYT thanh toán", example: "3,080,000 đ", table: "hms_fee / bh_ct01", column: "hfe_inspaid_amount / t_bhtt", type: "numeric", note: "Số tiền cơ quan BHXH chi trả" },
      { no: 8, docField: "Người bệnh cùng chi trả", example: "770,000 đ", table: "hms_fee / bh_ct01", column: "hfe_patpaid_amount / t_bntt", type: "numeric", note: "Số tiền người bệnh thanh toán đồng chi trả" }
    ],
    sqlSample: `SELECT d.hd_docno AS so_ho_so, f.hfe_cost AS tong_chi_phi, f.hfe_inspaid_amount AS bhyt_tra, f.hfe_patpaid_amount AS bn_tra
FROM hms_doc d LEFT JOIN hms_fee f ON d.hd_docno = f.hfe_docno WHERE d.hd_docno = 26174151;`
  },

  // =========================================================================
  // NHÓM 4: ĐIỀU TRỊ, CHUYÊN MÔN & BỆNH ÁN EMR
  // =========================================================================
  {
    id: "form_phieu_to_dieu_tri_hang_ngay",
    code: "MS: 05/BV (Treatment Sheet)",
    standard: "Thông tư 46/2018/TT-BYT Quy định Hồ sơ Bệnh án điện tử EMR",
    title: "TỜ ĐIỀU TRỊ HÀNG NGÀY / PHIẾU ĐIỀU TRỊ NỘI TRÚ",
    category: "Điều trị & Bệnh án EMR",
    icon: "📝",
    slipCreatorField: "htr_idx (Khóa chính) & htr_recordno (Số bệnh án) trên bảng hms_treatment_record",
    distinctionTip: "Bác sĩ điều trị viết mỗi ngày 1 tờ: Cột bên trái là Diễn biến bệnh (htr_desc), Cột bên phải là Y lệnh thuốc và chăm sóc (htr_order). Khác với bảng hms_doc là hồ sơ đợt khám tổng thể!",
    keywords: ["tờ điều trị", "to dieu tri", "phiếu điều trị", "diễn biến bệnh", "y lệnh", "hms_treatment_record", "htr_idx", "htr_recordno", "EMR"],
    description: "Văn bản chuyên môn ghi chép diễn biến bệnh nhân theo từng ngày nằm viện, y lệnh dùng thuốc, chế độ ăn và chế độ chăm sóc.",
    primaryTables: ["hms_treatment_record", "hms_clinical_record", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Mã định danh tờ điều trị", example: "58129", table: "hms_treatment_record", column: "htr_idx", type: "integer", note: "Khóa chính tạo từng tờ điều trị riêng biệt theo ngày" },
      { no: 2, docField: "Số lưu trữ bệnh án nội trú", example: "TMH/26-0041", table: "hms_treatment_record", column: "htr_recordno", type: "varchar(15)", note: "Số hồ sơ bệnh án khoa điều trị quản lý" },
      { no: 3, docField: "Số hồ sơ KCB", example: "26174151", table: "hms_treatment_record", column: "htr_docno", type: "integer", note: "FK liên kết hms_doc.hd_docno" },
      { no: 4, docField: "Ngày giờ ghi tờ điều trị", example: "08:00 03/09/2026", table: "hms_treatment_record", column: "htr_createddate", type: "timestamp", note: "Thời điểm bác sĩ thăm khám và ghi chép" },
      { no: 5, docField: "Diễn biến bệnh (Cột trái)", example: "Bệnh nhân tỉnh, tiếp xúc tốt, tai trái giảm ù, không sốt...", table: "hms_treatment_record", column: "htr_desc / htr_progress", type: "text", note: "Triệu chứng cơ năng, thực thể và tiến triển bệnh lý" },
      { no: 6, docField: "Y lệnh điều trị (Cột phải)", example: "1. Ceftriaxon 1g x 02 lọ (Tiêm TM)\n2. Ăn cơm mềm\n3. Chăm sóc cấp 2", table: "hms_treatment_record", column: "htr_order", type: "text", note: "Y lệnh thuốc, dinh dưỡng, theo dõi" },
      { no: 7, docField: "Bác sĩ điều trị ký tên", example: "BS. Hoàng Văn Minh", table: "hms_treatment_record (FK sys_user)", column: "htr_createdby → sys_user.su_fullname", type: "varchar(15)", note: "Bác sĩ trực tiếp thăm khám ký số hoặc ký tay" }
    ],
    sqlSample: `SELECT tr.htr_idx AS "Mã Tờ Điều Trị", tr.htr_recordno AS "Số Bệnh Án", TO_CHAR(tr.htr_createddate, 'HH24:MI DD/MM/YYYY') AS "Ngày", tr.htr_desc AS "Diễn Biến", tr.htr_order AS "Y Lệnh", u.su_fullname AS "Bác Sĩ"
FROM hms_treatment_record tr LEFT JOIN sys_user u ON tr.htr_createdby = u.su_userid WHERE tr.htr_docno = 26174151 ORDER BY tr.htr_createddate ASC;`
  },
  {
    id: "form_phieu_phau_thuat_thu_thuat",
    code: "MS: 08/BV (Operation Sheet)",
    standard: "Quy chuẩn Phẫu thuật - Thủ thuật Ngoại khoa Bộ Y Tế",
    title: "PHIẾU PHẪU THUẬT - THỦ THUẬT / BIÊN BẢN MỔ",
    category: "Điều trị & Ngoại khoa",
    icon: "🩺",
    slipCreatorField: "ho_docno & ho_itemid trên bảng hms_operation",
    distinctionTip: "Biên bản do kíp mổ lập: Phẫu thuật viên chính (ho_surgeon), Bác sĩ gây mê (ho_anesthetist), Phương pháp phẫu thuật, Phương pháp vô cảm, Chẩn đoán trước và sau phẫu thuật.",
    keywords: ["phẫu thuật", "phau thuat", "thủ thuật", "thu thuat", "biên bản mổ", "hms_operation", "ho_docno", "ho_surgeon", "gây mê"],
    description: "Văn bản ghi nhận toàn bộ quá trình thực hiện ca phẫu thuật hoặc thủ thuật xâm lấn, thành phần kíp mổ và phương pháp can thiệp.",
    primaryTables: ["hms_operation", "hms_doc", "sys_user"],
    fields: [
      { no: 1, docField: "Số hồ sơ bệnh nhân phẫu thuật", example: "26174151", table: "hms_operation", column: "ho_docno", type: "integer", note: "FK hồ sơ hms_doc.hd_docno" },
      { no: 2, docField: "Tên phẫu thuật / Thủ thuật", example: "Phẫu thuật nội soi cắt ruột thừa viêm", table: "hms_operation", column: "ho_itemid → sys_feename", type: "varchar(32)", note: "Mã và tên dịch vụ phẫu thuật" },
      { no: 3, docField: "Chẩn đoán trước phẫu thuật", example: "[K35.8] Viêm ruột thừa cấp", table: "hms_operation", column: "ho_icd_pre, ho_diagn_pre", type: "varchar(11), varchar(254)", note: "Chẩn đoán trước khi mổ" },
      { no: 4, docField: "Chẩn đoán sau phẫu thuật", example: "[K35.0] Viêm ruột thừa vỡ mủ", table: "hms_operation", column: "ho_icd_post, ho_diagn_post", type: "varchar(11), varchar(254)", note: "Chẩn đoán thực tế sau mổ" },
      { no: 5, docField: "Phẫu thuật viên chính", example: "BS.CKII. Trần Đình Nam", table: "hms_operation (FK sys_user)", column: "ho_surgeon → sys_user.su_fullname", type: "varchar(15)", note: "Bác sĩ mổ chính" },
      { no: 6, docField: "Bác sĩ gây mê hồi sức", example: "BS. Vũ Thị Hòa", table: "hms_operation (FK sys_user)", column: "ho_anesthetist → sys_user.su_fullname", type: "varchar(15)", note: "Bác sĩ gây mê" }
    ],
    sqlSample: `SELECT o.ho_docno AS "Số Hồ Sơ", o.ho_itemid AS "Mã Phẫu Thuật", u_surg.su_fullname AS "Phẫu Thuật Viên", o.ho_diagn_pre, o.ho_diagn_post
FROM hms_operation o LEFT JOIN sys_user u_surg ON o.ho_surgeon = u_surg.su_userid WHERE o.ho_docno = 26174151;`
  },
  {
    id: "form_phieu_kham_benh_tiepdon",
    code: "MS: 01/KB (Exam Sheet)",
    standard: "Quy chế Khoa Khám bệnh & Tiếp đón Bệnh nhân",
    title: "PHIẾU KHÁM BỆNH / TIẾP ĐÓN NGOẠI TRÚ",
    category: "Tiếp đón & Khám bệnh",
    icon: "📋",
    slipCreatorField: "hd_docno (Bảng hms_doc) & he_receptno (Bảng hms_exam)",
    distinctionTip: "Khi bệnh nhân đến đăng ký KCB, quầy tiếp đón phát sinh hd_docno (Số hồ sơ). Bác sĩ tại phòng khám ghi nhận triệu chứng và xử trí trong bảng hms_exam theo số he_receptno.",
    keywords: ["tiếp đón", "tiep don", "phiếu khám bệnh", "sổ khám bệnh", "hms_doc", "hms_exam", "hd_docno", "he_receptno", "phòng khám"],
    description: "Phiếu ghi nhận thông tin hành chính ban đầu, lý do vào viện, tiền sử bệnh, chỉ số sinh tồn và kết luận xử trí của bác sĩ phòng khám.",
    primaryTables: ["hms_doc", "hms_exam", "hms_patient", "sys_dept", "sys_room"],
    fields: [
      { no: 1, docField: "Số hồ sơ tiếp đón KCB", example: "26174151", table: "hms_doc", column: "hd_docno", type: "integer", note: "Mã đợt khám duy nhất xuyên suốt hệ thống" },
      { no: 2, docField: "Số thứ tự tiếp nhận / Phiếu khám", example: "084", table: "hms_exam", column: "he_receptno", type: "integer", note: "Số thứ tự gọi vào phòng khám trong ngày" },
      { no: 3, docField: "Phòng khám tiếp nhận", example: "Phòng khám Tai Mũi Họng 104", table: "hms_exam (FK sys_room)", column: "he_roomid → sys_room.sr_name", type: "integer", note: "Phòng khám phân bổ" },
      { no: 4, docField: "Thời gian tiếp đón", example: "07:15 03/09/2026", table: "hms_doc", column: "hd_admitdate", type: "timestamp", note: "Thời điểm quét thẻ BHYT / CCCD" },
      { no: 5, docField: "Xử trí của bác sĩ khám", example: "O: Khám xong về, I: Vào nội trú, X: Chuyển viện", table: "hms_doc", column: "hd_status", type: "varchar(1)", note: "Trạng thái kết thúc khám bệnh" }
    ],
    sqlSample: `SELECT d.hd_docno AS "Số Hồ Sơ", TRIM(CONCAT(p.hp_surname,' ',p.hp_firstname)) AS "Bệnh Nhân", d.hd_cardno AS "Số BHYT", d.hd_admitdate AS "Tiếp Đón Lúc", d.hd_diagnostic AS "Chẩn Đoán"
FROM hms_doc d JOIN hms_patient p ON d.hd_patientno = p.hp_patientno WHERE d.hd_admitdate >= CURRENT_DATE ORDER BY d.hd_admitdate DESC;`
  },
  {
    id: "form_giay_ra_vien",
    code: "MS: 02/TT25",
    standard: "Thông tư 18/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY RA VIỆN",
    category: "Nội trú & Xuất viện",
    icon: "📄",
    slipCreatorField: "hcr_recordno (Bảng hms_clinical_record) & hd_docno (Bảng hms_doc)",
    distinctionTip: "Giấy tờ hành chính và chuyên môn kết thúc điều trị nội trú, xác nhận số ngày nghỉ việc hưởng chế độ ốm đau BHXH (hcr_rest_days từ ngày hcr_rest_from đến hcr_rest_to).",
    keywords: ["giấy ra viện", "giay ra vien", "ra viện", "02/tt25", "xuat vien", "nghi them", "nghi bhxh", "hms_clinical_record", "hms_doc", "hcr_rest_days"],
    description: "Giấy tờ hành chính và chuyên môn xác nhận người bệnh kết thúc đợt điều trị nội trú, lưu trữ hồ sơ bệnh án và xác nhận thời gian nghỉ việc hưởng chế độ BHXH.",
    primaryTables: ["hms_doc", "hms_patient", "hms_clinical_record", "hms_card", "bh_ct01", "sys_user"],
    fields: [
      { no: 1, docField: "Số lưu trữ bệnh án nội trú", example: "TMH/47151", table: "hms_clinical_record", column: "hcr_recordno", type: "varchar(20)", note: "Số lưu trữ hồ sơ bệnh án khoa điều trị" },
      { no: 2, docField: "Số hồ sơ KCB", example: "26174151", table: "hms_doc", column: "hd_docno", type: "bigint", note: "Mã định danh lượt KCB" },
      { no: 3, docField: "Vào viện lúc", example: "09:28 21/08/2026", table: "hms_doc", column: "hd_admitdate", type: "timestamp", note: "Thời điểm tiếp đón vào viện" },
      { no: 4, docField: "Ra viện lúc", example: "11:30 27/08/2026", table: "hms_doc", column: "hd_enddate", type: "timestamp", note: "Thời điểm xuất viện" },
      { no: 5, docField: "Chẩn đoán ra viện", example: "[H91.2] Điếc đột ngột tai trái", table: "hms_doc", column: "hd_icd, hd_diagnostic", type: "varchar(13), varchar(512)", note: "Chẩn đoán bệnh chính ra viện" },
      { no: 6, docField: "Phương pháp điều trị", example: "Nội khoa", table: "hms_clinical_record", column: "hcr_treatment_method", type: "varchar(254)", note: "Phương pháp điều trị áp dụng" },
      { no: 7, docField: "Số ngày nghỉ hưởng BHXH", example: "Nghỉ thêm 07 ngày", table: "hms_clinical_record", column: "hcr_rest_days, hcr_rest_from, hcr_rest_to", type: "integer, date, date", note: "Thời gian nghỉ việc hưởng chế độ BHXH" }
    ],
    sqlSample: `SELECT d.hd_docno, cr.hcr_recordno, d.hd_icd, d.hd_diagnostic, cr.hcr_rest_days, cr.hcr_rest_from, cr.hcr_rest_to
FROM hms_doc d LEFT JOIN hms_clinical_record cr ON d.hd_docno = cr.hcr_docno WHERE d.hd_docno = 26174151;`
  },
  {
    id: "form_giay_chuyen_tuyen",
    code: "Mẫu số 06/BHYT",
    standard: "Thông tư 40/2015/TT-BYT & Quyết định 130/QĐ-BYT (XML4)",
    title: "GIẤY CHUYỂN TUYẾN KCB BHYT",
    category: "Tiếp đón & Chuyển viện",
    icon: "🚑",
    slipCreatorField: "htp_id & htp_docno (Bảng hms_transfer_paper, hms_doc)",
    distinctionTip: "Giấy tờ chuyển người bệnh lên bệnh viện tuyến trên điều trị hưởng đúng quyền lợi BHYT. Bệnh viện chuyển đến lưu trong hd_tohosid (FK sys_hospital).",
    keywords: ["giấy chuyển tuyến", "chuyển viện", "chuyển tuyến", "06/bhyt", "hms_transfer_paper", "hd_tohosid", "XML4"],
    description: "Giấy tờ hành chính và chuyên môn chuyển người bệnh lên tuyến trên hoặc sang bệnh viện chuyên khoa điều trị.",
    primaryTables: ["hms_doc", "hms_patient", "hms_transfer_paper", "sys_hospital"],
    fields: [
      { no: 1, docField: "Số giấy chuyển tuyến", example: "CT-2026/08-142", table: "hms_transfer_paper", column: "htp_id, htp_docno", type: "integer", note: "Mã số giấy chuyển tuyến liên thông Cổng BHYT XML4" },
      { no: 2, docField: "Cơ sở KCB chuyển đến", example: "Bệnh viện Bạch Mai (Mã: 01001)", table: "hms_doc (FK sys_hospital)", column: "hd_tohosid → sys_hospital.sh_name", type: "varchar(7)", note: "Bệnh viện tuyến trên tiếp nhận" },
      { no: 3, docField: "Lý do chuyển tuyến", example: "1: Đủ điều kiện chuyển tuyến", table: "hms_doc", column: "hd_transreason", type: "integer", note: "1: Đúng tuyến chuyên môn; 2: Theo nguyện vọng" }
    ],
    sqlSample: `SELECT tp.htp_id, d.hd_docno, sh.sh_name AS benh_vien_den, d.hd_transicd, d.hd_transdiagn
FROM hms_doc d LEFT JOIN hms_transfer_paper tp ON d.hd_docno = tp.htp_docno LEFT JOIN sys_hospital sh ON d.hd_tohosid = sh.sh_hospital_id WHERE d.hd_docno = 26174151;`
  },
  {
    id: "form_giay_chung_sinh",
    code: "Mẫu TT 17/2012",
    standard: "Thông tư 17/2012/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY CHỨNG SINH",
    category: "Sản khoa & Hành chính",
    icon: "👶",
    slipCreatorField: "hbc_idx & hbc_magcs (Bảng hms_birthcertificate)",
    distinctionTip: "Giấy chứng sinh cấp cho trẻ sơ sinh phục vụ làm giấy khai sinh trên Cổng Dịch vụ công Quốc gia. Lưu thông tin mẹ, cha, giờ sinh, cân nặng, giới tính.",
    keywords: ["chứng sinh", "giấy chứng sinh", "sinh con", "so sinh", "hms_birthcertificate", "hbc_magcs", "hbc_weigh"],
    description: "Giấy chứng nhận sinh con tại cơ sở y tế phục vụ làm giấy khai sinh và liên thông dữ liệu Dịch vụ công Quốc gia.",
    primaryTables: ["hms_birthcertificate", "hms_patient", "hms_doc"],
    fields: [
      { no: 1, docField: "Mã Giấy chứng sinh", example: "GCS-2026-00451", table: "hms_birthcertificate", column: "hbc_magcs", type: "varchar(24)", note: "Số định danh Giấy chứng sinh" },
      { no: 2, docField: "Họ và tên mẹ", example: "LÊ THỊ THẢO", table: "hms_birthcertificate", column: "hbc_patientname", type: "varchar(65)", note: "Họ tên sản phụ" },
      { no: 3, docField: "Cân nặng khi sinh", example: "3,400 gram", table: "hms_birthcertificate", column: "hbc_weigh", type: "numeric", note: "Trọng lượng bé khi sinh" },
      { no: 4, docField: "Thời điểm sinh", example: "03:15 20/08/2026", table: "hms_birthcertificate", column: "hbc_datetimeofbirth", type: "timestamp", note: "Ngày giờ bé chào đời" }
    ],
    sqlSample: `SELECT bc.hbc_magcs, bc.hbc_patientname, bc.hbc_weigh, bc.hbc_datetimeofbirth FROM hms_birthcertificate bc WHERE bc.hbc_docno = 26174151;`
  },
  {
    id: "form_giay_bao_tu",
    code: "MS: 04/TT25",
    standard: "Thông tư 24/2020/TT-BYT & Quản lý Hộ tịch Tử vong",
    title: "GIẤY BÁO TỬ",
    category: "Hành chính & Tử vong",
    icon: "🕊️",
    slipCreatorField: "hpd_patientno & hpd_docno (Bảng hms_patientdeath)",
    distinctionTip: "Giấy tờ pháp lý xác nhận người bệnh tử vong tại cơ sở khám chữa bệnh, ghi rõ nguyên nhân tử vong, thời điểm tử vong và địa điểm tử vong.",
    keywords: ["báo tử", "giấy báo tử", "tử vong", "hms_patientdeath", "hpd_diedate", "nguyên nhân tử vong"],
    description: "Giấy tờ pháp lý xác nhận người bệnh tử vong tại cơ sở khám chữa bệnh phục vụ làm thủ tục khai tử theo quy định.",
    primaryTables: ["hms_patientdeath", "hms_doc", "hms_patient"],
    fields: [
      { no: 1, docField: "Mã người bệnh tử vong", example: "98124", table: "hms_patientdeath", column: "hpd_patientno", type: "integer", note: "FK nối hms_patient" },
      { no: 2, docField: "Thời điểm tử vong", example: "23:45 02/09/2026", table: "hms_patientdeath", column: "hpd_diedate", type: "timestamp", note: "Thời điểm xác nhận tử vong" },
      { no: 3, docField: "Nguyên nhân tử vong chính", example: "Sốc nhiễm khuẩn suy đa tạng", table: "hms_patientdeath", column: "hpd_death_reason", type: "varchar(254)", note: "Nguyên nhân gây tử vong" },
      { no: 4, docField: "Địa điểm tử vong", example: "Khoa Hồi Sức Tích Cực", table: "hms_patientdeath", column: "hpd_die_dtladdr", type: "varchar(254)", note: "Nơi người bệnh mất" }
    ],
    sqlSample: `SELECT pd.hpd_patientno, pd.hpd_diedate, pd.hpd_die_dtladdr FROM hms_patientdeath pd WHERE pd.hpd_diedate >= CURRENT_DATE - INTERVAL '30 days';`
  },
  {
    id: "form_giay_hen_kham",
    code: "Mẫu TT 40/2015",
    standard: "Thông tư 40/2015/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "GIẤY HẸN KHÁM LẠI",
    category: "Khám bệnh & Ngoại trú",
    icon: "📅",
    slipCreatorField: "ha_appoint_date (Bảng hms_treatment_appointment, hms_doc)",
    distinctionTip: "Giấy hẹn bệnh nhân tái khám định kỳ hoặc kiểm tra lại sau điều trị hưởng chế độ BHYT đúng tuyến trong vòng 10 ngày làm việc kể từ ngày hẹn.",
    keywords: ["hẹn khám", "giấy hẹn", "tái khám", "hms_treatment_appointment", "ha_appoint_date", "hd_reexam_date"],
    description: "Giấy hẹn bệnh nhân tái khám định kỳ hoặc kiểm tra lại sau điều trị hưởng chế độ BHYT đúng tuyến.",
    primaryTables: ["hms_treatment_appointment", "hms_doc", "hms_patient"],
    fields: [
      { no: 1, docField: "Ngày hẹn khám lại", example: "15/09/2026", table: "hms_treatment_appointment", column: "ha_appoint_date", type: "date", note: "Ngày hẹn bệnh nhân đến tái khám" },
      { no: 2, docField: "Lý do hẹn khám lại", example: "Đo lại thính lực và kiểm tra tai", table: "hms_treatment_appointment", column: "ha_reason", type: "varchar(255)", note: "Nội dung cần kiểm tra lại" }
    ],
    sqlSample: `SELECT a.ha_appoint_date, a.ha_reason FROM hms_treatment_appointment a WHERE a.ha_docno = 26174151;`
  },
  {
    id: "form_tom_tat_benh_an",
    code: "Mẫu TT 18/2022",
    standard: "Thông tư 18/2022/TT-BYT & Quyết định 130/QĐ-BYT (XML5)",
    title: "TÓM TẮT HỒ SƠ BỆNH ÁN",
    category: "Nội trú & EMR",
    icon: "📋",
    slipCreatorField: "hcr_recordno (Bảng hms_clinical_record, hms_doc)",
    distinctionTip: "Bản tóm tắt quá trình điều trị nội trú, kết quả cận lâm sàng chính và tình trạng ra viện cấp cho người bệnh làm thủ tục chuyển viện, giám định y khoa hoặc bảo hiểm nhân thọ.",
    keywords: ["tóm tắt bệnh án", "trích sao", "trích sao bệnh án", "hms_clinical_record", "hcr_disease_process"],
    description: "Bản tóm tắt quá trình điều trị nội trú, kết quả xét nghiệm chính, diễn biến bệnh lý và hướng dẫn điều trị tiếp theo.",
    primaryTables: ["hms_clinical_record", "hms_doc", "hms_patient", "sys_user"],
    fields: [
      { no: 1, docField: "Quá trình bệnh lý", example: "Bệnh nhân vào viện vì nghe kém...", table: "hms_clinical_record", column: "hcr_disease_process", type: "text", note: "Tóm tắt diễn biến lâm sàng" },
      { no: 2, docField: "Tóm tắt kết quả CLS", example: "Thính lực đồ: Điếc tiếp nhận 65dB", table: "hms_clinical_record", column: "hcr_lab_summary", type: "text", note: "Các kết quả xét nghiệm chính" }
    ],
    sqlSample: `SELECT cr.hcr_docno, cr.hcr_disease_process, cr.hcr_lab_summary FROM hms_clinical_record cr WHERE cr.hcr_docno = 26174151;`
  }
];


class SchemaLookupEngine {
  removeAccents(str) {
    if (!str) return "";
    if (typeof DocxTableParser !== "undefined" && DocxTableParser.removeAccents) {
      return DocxTableParser.removeAccents(str);
    }
    return String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

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
    const qNorm = this.removeAccents(q);

    const matchedForms = [];

    this.forms.forEach(form => {
      const fTitleLower = form.title.toLowerCase();
      const fCodeLower = form.code.toLowerCase();
      const fDescLower = form.description.toLowerCase();
      const fCreatorLower = (form.slipCreatorField || "").toLowerCase();
      const fTipLower = (form.distinctionTip || "").toLowerCase();

      const fTitleNorm = this.removeAccents(fTitleLower);
      const fDescNorm = this.removeAccents(fDescLower);
      const fCreatorNorm = this.removeAccents(fCreatorLower);
      const fTipNorm = this.removeAccents(fTipLower);

      let score = 0;

      // Exact keyword or slip creator field match
      if (form.keywords.some(k => k === q || this.removeAccents(k) === qNorm)) {
        score = 120;
      } else if (fCreatorNorm.includes(qNorm) || fCreatorLower.includes(q)) {
        score = 115; // Khớp trường tạo phiếu CSDL -> Ưu tiên cực cao!
      } else if (fTitleNorm.includes(qNorm)) {
        score = 100;
      } else if (fCodeLower.includes(q)) {
        score = 90;
      } else if (form.keywords.some(k => k.includes(q) || this.removeAccents(k).includes(qNorm))) {
        score = 80;
      } else if (fTipNorm.includes(qNorm) || fTipLower.includes(q)) {
        score = 75; // Khớp mẹo phân biệt nghiệp vụ
      } else if (fDescNorm.includes(qNorm)) {
        score = 60;
      } else {
        // Tìm trong fields của biểu mẫu: column name, docField, table, note
        let bestFieldScore = 0;
        form.fields.forEach(fld => {
          const colLower = fld.column.toLowerCase();
          const fldNameNorm = this.removeAccents(fld.docField.toLowerCase());
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
    const qNorm = this.removeAccents(q);

    const matchedItems = [];

    this.schema.tables.forEach(table => {
      if (sectionFilter !== "all" && table.sectionId !== sectionFilter && table.uiModuleId !== sectionFilter) return;
      if (prefixFilter !== "all" && !table.name.startsWith(prefixFilter)) return;

      const tNameNorm = this.removeAccents(table.name.toLowerCase());
      const tTitleNorm = this.removeAccents((table.title || "").toLowerCase());
      const tTopicNorm = this.removeAccents((table.topic || "").toLowerCase());

      table.columns.forEach(col => {
        const cNameLower = col.name.toLowerCase();
        const cDescLower = (col.description || "").toLowerCase();
        const cNameNorm = this.removeAccents(cNameLower);
        const cDescNorm = this.removeAccents(cDescLower);

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
    const qNorm = this.removeAccents(q);

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

      const tNameNorm = this.removeAccents(tNameLower);
      const tTitleNorm = this.removeAccents(tTitleLower);
      const tTopicNorm = this.removeAccents(tTopicLower);
      const tDescNorm = this.removeAccents(tDescLower);

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
