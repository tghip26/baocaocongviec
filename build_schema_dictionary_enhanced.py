import os
import re
import json

def get_vimes_ui_module(tbl_name, section_id):
    t = tbl_name.lower()
    
    # 1. Tiếp đón bệnh nhân
    if t in ["hms_patient", "hms_doc", "hms_relative", "hms_birthcertificate", "hms_patientdeath", "hms_patient_files", "hms_patient_record", "qms_patient", "hiv_patient", "portal_patient_profiles"]:
        return "ui_tiepdon", "Tiếp đón bệnh nhân (Giao diện Tiếp nhận, Quản lý Tiếp đón)"
    
    # 2. Quản lý khám bệnh
    if t in ["hms_outpatient", "hms_outpatient_record", "hms_html_view_exam", "hms_patient_tmp"] or t.startswith("hms_exam") or t.startswith("hms_opd"):
        return "ui_khambenh", "Quản lý khám bệnh (Phòng khám ngoại trú, Khám chuyên khoa)"
        
    # 3. Quản lý điều trị nội trú
    if t in ["hms_treatment_record", "hms_clinical_record", "emr_document", "emr_sign", "emr_template", "nrs_care_record", "nrs_infusion_orders", "nrs_infusion_bags", "hms_operation", "chemo_optimizer_patient"] or t.startswith("emr_") or t.startswith("nrs_") or t.startswith("hms_treat") or t.startswith("hms_inpatient"):
        return "ui_noitru", "Quản lý điều trị nội trú (Bệnh án nội trú, Y lệnh, Chăm sóc EMR)"
        
    # 4. Quản lý dược
    if t.startswith("m_") and not t.startswith("m_asset"):
        return "ui_duoc", "Quản lý dược (Bán hàng, Đơn thuốc, Tủ trực, Xuất - Nhập kho)"
        
    # 5. Quản lý viện phí
    if t.startswith("hms_fee") or t in ["hms_fee", "hms_fee_invoice", "hms_fee_deposit", "hms_fee_refund", "hms_fee_detail", "hms_fee_list", "hms_fee_exempt", "hms_fee_discount"]:
        return "ui_vienphi", "Quản lý viện phí (Thu phí, Hóa đơn, Tạm ứng, Hoàn ứng, Bảng kê)"
        
    # 6. Quản lý chẩn đoán hình ảnh
    if t.startswith("pacs_") or t.startswith("dicom_") or "pacs" in t or "imaging" in t or "xray" in t:
        return "ui_cdha", "Quản lý chẩn đoán hình ảnh (X-quang, CT, MRI, Siêu âm, PACS/RIS)"
        
    # 7. Quản lý xét nghiệm
    if t.startswith("lims_") or "lab" in t or "test" in t or "xetnghiem" in t:
        return "ui_xetnghiem", "Quản lý xét nghiệm (Huyết học, Sinh hóa, Vi sinh, LIS)"
        
    # 8. Quản lý vật tư
    if "vattu" in t or "asset" in t or t.startswith("fam_") or "equipment" in t or "material" in t:
        return "ui_vattu", "Quản lý vật tư & Thiết bị y tế (Vật tư tiêu hao, Tài sản, Thiết bị)"
        
    # 9. Báo cáo thống kê & BHYT
    if t.startswith("bh_") or t.startswith("bhyt") or "statistic" in t or "report" in t:
        return "ui_baocao", "Báo cáo thống kê & Cổng BHYT (XML 1-5, Báo cáo KCB, Giám định)"
        
    # 10. Thiết lập bệnh viện
    if t.startswith("sys_") or t.startswith("system_") or "config" in t or "setting" in t:
        return "ui_thietlap", "Thiết lập bệnh viện & Hệ thống (Khoa phòng, Người dùng, Phân quyền)"

    # Fallbacks based on section
    if section_id == "patient": return "ui_tiepdon", "Tiếp đón bệnh nhân (Giao diện Tiếp nhận)"
    if section_id == "clinical": return "ui_noitru", "Quản lý điều trị nội trú (EMR & Bệnh án)"
    if section_id == "pharmacy": return "ui_duoc", "Quản lý dược (Kho dược & Đơn thuốc)"
    if section_id == "paraclinical": return "ui_xetnghiem", "Quản lý cận lâm sàng (Xét nghiệm & CĐHA)"
    if section_id == "billing": return "ui_vienphi", "Quản lý viện phí (Thu phí & BHYT)"
    if section_id == "system": return "ui_thietlap", "Thiết lập bệnh viện (Danh mục & Hệ thống)"
    if section_id == "integration": return "ui_baocao", "Báo cáo & Tích hợp Cổng Quốc gia"
    
    return "ui_thietlap", "Thiết lập bệnh viện & Mở rộng"

def get_table_details(tbl_name, section_name, section_id):
    t_lower = tbl_name.lower()
    
    known_tables = {
        "hms_patient": ("Danh mục Hồ sơ Bệnh nhân", "Tiếp đón bệnh nhân", "Giao diện Quản lý Tiếp đón: Lưu trữ thông tin định danh người bệnh (Mã BN, Họ tên, Ngày sinh, CCCD, Địa chỉ, Nghề nghiệp, SĐT, Nơi làm việc)"),
        "hms_doc": ("Hồ sơ Khám bệnh & Tiếp đón", "Tiếp đón bệnh nhân", "Giao diện Quản lý Tiếp đón: Lưu thông tin lượt tiếp nhận khám bệnh (Số HS, Thẻ BHYT, Đối tượng, Ngày giờ tiếp đón, Phòng khám, Bác sĩ tiếp đón, Tình trạng BN)"),
        "hms_outpatient": ("Hồ sơ Khám Ngoại trú", "Quản lý khám bệnh", "Giao diện Khám Ngoại trú: Quản lý đợt khám chuyên khoa ngoại trú của người bệnh"),
        "hms_outpatient_record": ("Phiếu Khám Ngoại trú", "Quản lý khám bệnh", "Giao diện Khám Ngoại trú: Chi tiết diễn biến khám, kết quả khám lâm sàng ngoại trú"),
        "hms_birthcertificate": ("Giấy Chứng sinh", "Tiếp đón bệnh nhân", "Giao diện Tiếp đón: Quản lý chứng sinh trẻ sơ sinh, cấp mã định danh và liên thông cổng DVC"),
        "hms_patientdeath": ("Giấy Báo tử & Trích lục Tử vong", "Tiếp đón bệnh nhân", "Giao diện Tiếp đón: Lưu trữ hồ sơ tử vong, nguyên nhân và trích lục tử vong"),
        "hms_relative": ("Thông tin Thân nhân Bệnh nhân", "Tiếp đón bệnh nhân", "Giao diện Quản lý Tiếp đón: Người thân, Người liên hệ, Quan hệ, Địa chỉ và SĐT người thân"),
        "hiv_patient": ("Hồ sơ Bệnh nhân Điều trị HIV/ARV", "Tiếp đón bệnh nhân", "Giao diện Khám chuyên khoa: Theo dõi bệnh nhân HIV, phác đồ ARV"),
        "chemo_optimizer_patient": ("Hồ sơ Phác đồ Hóa chất Ung bướu", "Quản lý điều trị nội trú", "Giao diện Nội trú: Tối ưu hóa và kiểm soát liều lượng phác đồ hóa trị"),
        "hms_clinical_record": ("Bệnh án Lâm sàng", "Quản lý điều trị nội trú", "Giao diện Bệnh án: Tổng hợp bệnh án, tiền sử bệnh, quá trình điều trị"),
        "hms_treatment_record": ("Phiếu Điều trị Nội trú", "Quản lý điều trị nội trú", "Giao diện Điều trị Nội trú: Bệnh án, Y lệnh F3, Chăm sóc F4, Bệnh trình điều trị, Theo dõi truyền dịch, CĐ bệnh chính, Bệnh kèm theo"),
        "hms_operation": ("Phiếu Phẫu thuật - Thủ thuật (PTTT)", "Quản lý điều trị nội trú", "Giao diện Điều trị Nội trú: Biên bản PTTT, phương pháp vô cảm, kíp mổ"),
        "m_productitem": ("Danh mục Thuốc, Vật tư & Hóa chất", "Quản lý dược", "Giao diện Quản lý Dược: Danh mục gốc thuốc/vật tư, Tên thuốc/HL, Nước SX, Đơn vị tính, Đường dùng"),
        "m_transaction": ("Phiếu Giao dịch Nhập - Xuất Kho Dược", "Quản lý dược", "Giao diện Quản lý Dược: Bán hàng, Mua hàng, Nhập kho, Xuất khoa phòng, Trả lại thuốc, Đơn bán lẻ"),
        "m_transaction_line": ("Chi tiết Đơn thuốc / Mặt hàng Kho Dược", "Quản lý dược", "Giao diện Đơn thuốc: Tên thuốc /HL, Đơn vị, Số lượng, Đơn giá, Thành tiền, Nước SX, Số lô, Hạn dùng"),
        "m_storage": ("Danh mục Kho Dược & Tủ trực", "Quản lý dược", "Giao diện Kho hàng: Danh mục Kho chẵn, Kho lẻ, Kho bán lẻ và Tủ trực khoa phòng"),
        "m_productitem_storage": ("Tồn kho Thuốc & Vật tư", "Quản lý dược", "Giao diện Kho hàng: Số lượng tồn thực tế của từng thuốc tại từng kho"),
        "m_price": ("Bảng giá Thuốc & Vật tư y tế", "Quản lý dược", "Giao diện Dược: Quản lý giá mua thầu, giá bán BHYT và giá dịch vụ"),
        "m_supplier": ("Danh mục Nhà cung cấp / Công ty Dược", "Quản lý dược", "Giao diện Mua hàng: Thông tin nhà thầu, công ty cung ứng dược phẩm"),
        "m_manufacture": ("Danh mục Hãng sản xuất Thuốc", "Quản lý dược", "Giao diện Quản trị Dược: Danh sách hãng sản xuất"),
        "m_unit": ("Danh mục Đơn vị tính Dược", "Quản lý dược", "Giao diện Dược: Đơn vị tính (Viên, Lọ, Ống, Hộp, Vỉ, Gói, Chai...)"),
        "hms_fee": ("Tổng hợp Viện phí & Chi phí Khám chữa bệnh", "Quản lý viện phí", "Giao diện Quản lý Viện phí: Tổng chi phí, Tổng BH/CS trả, BN Cùng chi trả, Trả chênh lệch, Tổng phải trả, Tổng tạm gửi (A), Tiền chế độ (B), Số tiền thanh toán"),
        "hms_fee_invoice": ("Hóa đơn Thu Viện phí & Đồng chi trả", "Quản lý viện phí", "Giao diện Phiếu thu: Thu phí F2, Quyết toán F3, Tạo HĐĐT, Số hóa đơn, Ngày, Thành tiền, Người thu"),
        "hms_fee_deposit": ("Phiếu Thu Tạm ứng Viện phí", "Quản lý viện phí", "Giao diện Tạm ứng: Quản lý tiền tạm ứng nội trú, hoàn ứng khi ra viện"),
        "hms_fee_refund": ("Phiếu Hoàn trả Viện phí", "Quản lý viện phí", "Giao diện Quản lý Viện phí: Hoàn trả tiền thừa cho người bệnh"),
        "hms_fee_list": ("Danh mục Bảng giá Dịch vụ Kỹ thuật", "Quản lý viện phí", "Giao diện Thiết lập viện phí: Bảng giá khám, xét nghiệm, CĐHA, PTTT"),
        "hms_fee_detail": ("Chi tiết Chi phí Bệnh nhân (Bảng kê)", "Quản lý viện phí", "Giao diện Thông tin phí bệnh nhân: STT, Diễn giải dịch vụ, Đơn vị, Số lượng, Đơn giá, Thành tiền, Thành tiền BH, BH trả, Chênh lệch, Cùng chi trả"),
        "sys_user": ("Tài khoản Người dùng Hệ thống", "Thiết lập bệnh viện", "Giao diện Thiết lập: Tài khoản Bác sĩ, Điều dưỡng, Thu ngân, Dược sĩ, UserID, Mật khẩu, Quyền hạn"),
        "sys_dept": ("Danh mục Khoa / Phòng ban", "Thiết lập bệnh viện", "Giao diện Thiết lập: Danh sách khoa Lâm sàng, Cận lâm sàng, Phòng ban"),
        "sys_room": ("Danh mục Buồng bệnh / Phòng khám", "Thiết lập bệnh viện", "Giao diện Thiết lập: Phòng khám tiếp đón, Buồng điều trị, Giường bệnh"),
        "sys_company": ("Thông tin Bệnh viện / Cơ sở Y tế", "Thiết lập bệnh viện", "Giao diện Thiết lập: Tên bệnh viện (BVĐK Bắc Ninh Số 2), Mã KCB, Địa chỉ"),
        "sys_permission": ("Phân quyền Chức năng Hệ thống", "Thiết lập bệnh viện", "Giao diện Quản trị: Phân quyền chức năng theo vai trò người dùng"),
        "emr_document": ("Hồ sơ Bệnh án Điện tử (EMR)", "Quản lý điều trị nội trú", "Giao diện Bệnh án EMR: Văn bản, phiếu khám, biểu mẫu bệnh án số hóa"),
        "emr_sign": ("Thông tin Ký số Bệnh án Điện tử", "Quản lý điều trị nội trú", "Giao diện Trình ký: Chữ ký số Bác sĩ, Trưởng khoa, Giám đốc"),
        "nrs_care_record": ("Phiếu Chăm sóc Điều dưỡng", "Quản lý điều trị nội trú", "Giao diện Phiếu chăm sóc (F4): Diễn biến, Dấu hiệu sinh tồn, Thực hiện y lệnh"),
        "nrs_infusion_orders": ("Y lệnh Truyền dịch", "Quản lý điều trị nội trú", "Giao diện Theo dõi truyền dịch: Tên dịch truyền, Tốc độ giọt/phút, Thời gian bắt đầu/kết thúc"),
        "bh_xml1": ("Dữ liệu XML1 BHYT - Tổng hợp KCB", "Báo cáo thống kê", "Giao diện Báo cáo BHYT: Dữ liệu XML1 liên thông Cổng Giám định BHYT theo QĐ 130/4210"),
        "bh_xml2": ("Dữ liệu XML2 BHYT - Bảng kê Thuốc", "Báo cáo thống kê", "Giao diện Báo cáo BHYT: Chi tiết thuốc BHYT thanh toán"),
        "bh_xml3": ("Dữ liệu XML3 BHYT - Bảng kê DVKT & Vật tư", "Báo cáo thống kê", "Giao diện Báo cáo BHYT: Chi tiết DVKT, xét nghiệm, CĐHA, vật tư y tế"),
        "bh_xml4": ("Dữ liệu XML4 BHYT - Diễn biến Lâm sàng", "Báo cáo thống kê", "Giao diện Báo cáo BHYT: Thông tin diễn biến lâm sàng người bệnh"),
        "bh_xml5": ("Dữ liệu XML5 BHYT - Diễn biến Cận lâm sàng", "Báo cáo thống kê", "Giao diện Báo cáo BHYT: Kết quả xét nghiệm, CĐHA gửi cổng giám định"),
        "lims_order": ("Chỉ định Xét nghiệm (LIS)", "Quản lý xét nghiệm", "Giao diện Quản lý Xét nghiệm: Phiếu chỉ định từ Bác sĩ chuyển sang hệ thống LIS"),
        "lims_result": ("Kết quả Xét nghiệm (LIS)", "Quản lý xét nghiệm", "Giao diện Quản lý Xét nghiệm: Kết quả đo chỉ số huyết học, sinh hóa, vi sinh"),
        "pacs_study": ("Ca chụp Chẩn đoán Hình ảnh (PACS)", "Quản lý chẩn đoán hình ảnh", "Giao diện Quản lý CĐHA: Chỉ định chụp X-quang, CT, MRI, Siêu âm, DICOM"),
        "hrm_employee": ("Hồ sơ Nhân sự & Cán bộ Y tế", "Thiết lập bệnh viện", "Giao diện Nhân sự: Lý lịch, Bằng cấp, Chứng chỉ hành nghề cán bộ y tế"),
        "fam_asset": ("Quản lý Tài sản & Thiết bị Y tế", "Quản lý vật tư", "Giao diện Quản lý Thiết bị: Danh mục máy móc, thiết bị y tế, bảo dưỡng")
    }

    if t_lower in known_tables:
        vn_name, topic, desc = known_tables[t_lower]
        ui_id, ui_name = get_vimes_ui_module(tbl_name, section_id)
        return vn_name, topic, desc, ui_id, ui_name

    ui_id, ui_name = get_vimes_ui_module(tbl_name, section_id)
    topic = ui_name.split("(")[0].strip()
    vn_name = tbl_name
    desc = f"Bảng dữ liệu thuộc phân hệ {ui_name}"

    if t_lower.startswith("hms_"):
        suffix = t_lower[4:].replace("_", " ").title()
        vn_name = f"Quản lý Bệnh viện - {suffix}"
    elif t_lower.startswith("m_"):
        suffix = t_lower[2:].replace("_", " ").title()
        vn_name = f"Dược & Kho - {suffix}"
    elif t_lower.startswith("sys_") or t_lower.startswith("system_"):
        suffix = (t_lower[4:] if t_lower.startswith("sys_") else t_lower[7:]).replace("_", " ").title()
        vn_name = f"Thiết lập Hệ thống - {suffix}"
    elif t_lower.startswith("emr_"):
        suffix = t_lower[4:].replace("_", " ").title()
        vn_name = f"Bệnh án Điện tử - {suffix}"
    elif t_lower.startswith("nrs_"):
        suffix = t_lower[4:].replace("_", " ").title()
        vn_name = f"Điều dưỡng & Chăm sóc - {suffix}"
    elif t_lower.startswith("bh_"):
        vn_name = f"Dữ liệu BHYT - {tbl_name}"
    elif t_lower.startswith("lims_"):
        vn_name = f"Xét nghiệm LIS - {tbl_name[5:].replace('_', ' ').title()}"
    elif t_lower.startswith("pacs_") or t_lower.startswith("dicom_"):
        vn_name = f"Hình ảnh PACS - {tbl_name}"

    return vn_name, topic, desc, ui_id, ui_name

def get_column_vietnamese_description(col_name, tbl_name):
    c_lower = col_name.lower()
    
    col_dict = {
        # UI Tiếp đón bệnh nhân
        "hp_patientno": "Mã bệnh nhân (Mã BN trên giao diện Tiếp đón & Viện phí)",
        "patientno": "Mã bệnh nhân (Mã BN)",
        "patient_id": "Mã định danh bệnh nhân",
        "patient_name": "Tên bệnh nhân (Họ và tên người bệnh)",
        "hp_surname": "Họ và tên đệm bệnh nhân",
        "hp_midname": "Tên đệm bệnh nhân",
        "hp_firstname": "Tên bệnh nhân",
        "hp_birthdate": "Ngày sinh / Tuổi bệnh nhân",
        "hp_sex": "Giới tính (Nam / Nữ trên form tiếp đón)",
        "sex": "Giới tính (M: Nam, F: Nữ)",
        "gender": "Giới tính",
        "hp_idcard": "Số CMND / CCCD (Số Căn cước công dân)",
        "idcard": "Số CMND / CCCD",
        "id_card": "Số CMND / CCCD",
        "hp_address": "Địa chỉ chi tiết người bệnh",
        "address": "Địa chỉ",
        "hp_career": "Nghề nghiệp người bệnh",
        "career": "Nghề nghiệp",
        "hp_ethnic": "Dân tộc (Kinh, Tày, Nùng...)",
        "ethnic": "Dân tộc",
        "hp_phone": "Điện thoại liên hệ",
        "phone": "Số điện thoại",
        "phone_number": "Số điện thoại",
        "hp_workplace": "Nơi làm việc",
        "workplace": "Nơi làm việc",
        "hp_provinceno": "Tỉnh / Thành phố",
        "hp_districtno": "Quận / Huyện",
        "hp_wardno": "Phường / Xã",
        "provinceno": "Tỉnh / Thành phố",
        "districtno": "Quận / Huyện",
        "wardno": "Phường / Xã",
        "idcard_date": "Ngày cấp CMND / CCCD",
        "ngaycap": "Ngày cấp CMND / CCCD",
        
        # Thân nhân (hms_relative)
        "hr_name": "Họ tên Người thân / Người liên hệ",
        "hr_relationship": "Mối quan hệ với bệnh nhân (Bố, Mẹ, Vợ, Chồng...)",
        "hr_address": "Địa chỉ liên hệ người thân",
        "hr_phone": "SĐT người thân",

        # UI Khám bệnh & Tiếp đón (hms_doc)
        "hd_docno": "Số HS (Số hồ sơ khám bệnh / Mã đợt tiếp đón)",
        "docno": "Số hồ sơ khám (Số HS)",
        "doc_no": "Số hồ sơ khám bệnh",
        "hd_patientno": "Mã BN trong hồ sơ khám",
        "hd_admitdate": "Ngày giờ tiếp đón vào viện",
        "admitdate": "Ngày giờ tiếp đón",
        "admit_date": "Ngày tiếp đón",
        "hd_enddate": "Ngày giờ kết thúc khám / Ra viện",
        "enddate": "Ngày kết thúc đợt khám",
        "hd_status": "Trạng thái hồ sơ khám (Chờ khám, Đang khám, Đã khám...)",
        "status": "Trạng thái xử lý",
        "hd_icd": "Mã ICD-10 bệnh chính (CĐ. Bệnh chính)",
        "icd10": "Mã bệnh theo chuẩn ICD-10",
        "icd_code": "Mã bệnh ICD-10",
        "hd_diagnostic": "Chẩn đoán bệnh của Bác sĩ",
        "diagnostic": "Chẩn đoán bệnh",
        "diagnosis": "Chẩn đoán bệnh",
        "hd_deptid": "Mã Khoa khám chỉ định",
        "hd_roomid": "Phòng khám chỉ định (Phòng)",
        "hd_doctor": "Bác sĩ tiếp đón / khám",
        "doctor_id": "Mã định danh Bác sĩ",
        "doctor_name": "Họ tên Bác sĩ",
        "doctor": "Bác sĩ phụ trách",
        "hd_object": "Đối tượng bệnh nhân (Dịch vụ, BHYT, Khám SK...)",
        "hd_cardno": "Số thẻ Bảo hiểm Y tế (Thẻ / Số thẻ)",
        "cardno": "Số thẻ BHYT",
        "card_id": "Mã thẻ / ID thẻ",
        "card_no": "Số thẻ BHYT",
        "hd_patientstatus": "T/trạng BN (Tình trạng bệnh nhân khi đến khám)",
        "hd_exam_type": "Kiểu khám bệnh",
        "hd_referral_hospital": "Bệnh viện chuyển tuyến đến",
        "hd_referral_no": "Số GCV / Giấy hẹn chuyển tuyến",

        # UI Điều trị nội trú (hms_treatment_record)
        "htr_idx": "Mã đợt điều trị nội trú",
        "htr_status": "Trạng thái điều trị nội trú",
        "htr_doctor": "Bác sĩ điều trị phụ trách",
        "htr_admitdate": "Ngày vào viện điều trị",
        "htr_dischargedate": "Ngày ra viện",
        "htr_icd": "CĐ. Bệnh chính (Mã ICD bệnh chính khi vào khoa)",
        "htr_subicd": "Mã ICD Bệnh kèm theo",
        "htr_diagnostic": "Chẩn đoán bệnh chính nội trú",
        "htr_subdiagnostic": "Chẩn đoán bệnh kèm theo",
        "htr_treatment_direction": "Hướng điều trị nội trú",
        "htr_enddate": "Ngày kết thúc hồ sơ bệnh án",
        "htr_roomid": "Buồng bệnh điều trị",
        "htr_bedno": "Số giường bệnh",

        # UI Quản lý Viện phí (hms_fee, hms_fee_invoice, hms_fee_detail)
        "hfe_invoiceno": "Số Hóa Đơn thu viện phí (Số phiếu thu)",
        "invoiceno": "Số hóa đơn thu viện phí",
        "invoice_no": "Số hóa đơn",
        "invoicedate": "Ngày lập hóa đơn viện phí",
        "hfe_amount": "Tổng chi phí viện phí phát sinh (VNĐ)",
        "amount": "Số tiền / Thành tiền",
        "total_amount": "Tổng thành tiền",
        "hfe_insurance_amount": "Tổng BH / CS trả (Quỹ BHYT thanh toán)",
        "insurance_amount": "Số tiền BHYT chi trả",
        "hfe_patient_amount": "BN Cùng chi trả (Người bệnh thanh toán)",
        "patient_amount": "Tiền người bệnh cùng chi trả",
        "hfe_deposit_amount": "Tổng tạm gửi (A) - Tiền tạm ứng viện phí",
        "deposit_amount": "Tiền tạm ứng",
        "hfe_exempt_amount": "Tiền chế độ (B) - Miễn giảm viện phí",
        "exempt_amount": "Tiền miễn giảm viện phí",
        "price": "Đơn giá",
        "unit_price": "Đơn giá",
        "unitprice": "Đơn giá",
        "quantity": "Số lượng",
        "qty": "Số lượng",
        "created_by": "Người thu / Người tạo phiếu (UserID)",
        "created_date": "Ngày giờ lập phiếu / Ngày tạo",
        "create_date": "Ngày tạo phiếu",
        "create_user": "Người tạo",

        # UI Quản lý Dược phẩm (m_productitem, m_transaction, m_transaction_line)
        "m_productitem_id": "Mã thuốc / vật tư y tế",
        "productitem_id": "Mã định danh thuốc / vật tư",
        "product_id": "Mã thuốc / sản phẩm",
        "product_name": "Tên thuốc / HL (Tên hoạt chất & Hàm lượng)",
        "product_code": "Mã quản lý thuốc",
        "m_product_name": "Tên thuốc / HL (Tên thuốc, hàm lượng, biệt dược)",
        "m_storage_id": "Kho (Mã kho dược xuất / nhập)",
        "storage_id": "Kho dược",
        "storage_name": "Tên kho dược (Kho chẵn, Kho lẻ, Tủ trực)",
        "m_lot_number": "Số lô sản xuất của thuốc",
        "lot_number": "Số lô thuốc",
        "lotno": "Số lô sản xuất",
        "m_exp_date": "Hạn dùng (Hạn sử dụng của thuốc)",
        "exp_date": "Hạn dùng của thuốc",
        "expire_date": "Hạn sử dụng",
        "m_country_id": "Nước SX (Nước sản xuất dược phẩm)",
        "country_name": "Nước sản xuất",
        "m_manufacture_id": "Hãng sản xuất thuốc",
        "m_supplier_id": "Nhà cung cấp / Công ty Dược",
        "supplier_id": "Nhà cung cấp",
        "m_unit_id": "Đơn vị (Đơn vị tính: Viên, Ống, Lọ, Chai...)",
        "unit_id": "Mã đơn vị tính",
        "unit_name": "Đơn vị tính thuốc",
        "m_transaction_id": "Số phiếu giao dịch kho / Đơn thuốc",
        "transaction_no": "Số phiếu giao dịch kho",

        # UI Thiết lập bệnh viện (sys_dept, sys_room, sys_user)
        "deptid": "Mã Khoa / Phòng ban",
        "dept_id": "Mã Khoa / Phòng ban",
        "dept_name": "Tên Khoa / Phòng ban",
        "sd_id": "Mã Khoa phòng",
        "sd_name": "Tên Khoa phòng",
        "roomid": "Phòng (Mã Phòng khám / Buồng bệnh)",
        "room_id": "Mã Buồng bệnh / Phòng khám",
        "room_name": "Tên Phòng khám / Buồng bệnh",
        "sr_id": "Mã Buồng phòng",
        "sr_name": "Tên Buồng phòng",
        "su_id": "UserID (Tên đăng nhập người dùng)",
        "su_username": "Tên đăng nhập hệ thống",
        "su_name": "Họ và tên nhân viên / Bác sĩ",
        
        # System Audit & notes
        "modified_by": "Người sửa đổi bản ghi gần nhất",
        "modified_date": "Ngày giờ cập nhật gần nhất",
        "update_date": "Ngày cập nhật",
        "update_user": "Người cập nhật",
        "is_active": "Trạng thái kích hoạt (Y/N)",
        "active": "Trạng thái kích hoạt",
        "note": "Ghi chú / Diễn giải nghiệp vụ",
        "notes": "Ghi chú bổ sung",
        "remark": "Ghi chú diễn giải",
        "description": "Diễn giải chi tiết"
    }

    if c_lower in col_dict:
        return col_dict[c_lower]

    if c_lower.endswith("_id") or c_lower.endswith("id"):
        base = c_lower.replace("_id", "").replace("id", "").replace("_", " ")
        return f"Mã định danh {base}"
    elif c_lower.endswith("_name") or c_lower.endswith("name"):
        base = c_lower.replace("_name", "").replace("name", "").replace("_", " ")
        return f"Tên gọi / Tiêu đề {base}"
    elif c_lower.endswith("_date") or c_lower.endswith("date"):
        base = c_lower.replace("_date", "").replace("date", "").replace("_", " ")
        return f"Ngày ghi nhận {base}"
    elif c_lower.endswith("_time") or c_lower.endswith("time"):
        base = c_lower.replace("_time", "").replace("time", "").replace("_", " ")
        return f"Thời gian {base}"
    elif c_lower.endswith("_amount") or c_lower.endswith("amount"):
        base = c_lower.replace("_amount", "").replace("amount", "").replace("_", " ")
        return f"Số tiền {base} (VNĐ)"
    elif c_lower.endswith("_qty") or c_lower.endswith("quantity"):
        base = c_lower.replace("_qty", "").replace("quantity", "").replace("_", " ")
        return f"Số lượng {base}"
    elif c_lower.endswith("_status") or c_lower.endswith("status"):
        base = c_lower.replace("_status", "").replace("status", "").replace("_", " ")
        return f"Trạng thái {base}"
    elif c_lower.endswith("_code") or c_lower.endswith("code"):
        base = c_lower.replace("_code", "").replace("code", "").replace("_", " ")
        return f"Mã quản lý {base}"
    elif c_lower.startswith("is_"):
        base = c_lower[3:].replace("_", " ")
        return f"Cờ đánh dấu {base} (Y/N)"
    
    return f"Trường dữ liệu {col_name}"

def build_vimes_schema():
    dict_file = "DATABASE_SCHEMA_DICTIONARY.md"
    if not os.path.exists(dict_file):
        print(f"Error: {dict_file} not found.")
        return

    with open(dict_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    vimes_modules = [
        {"id": "all", "name": "Tất cả 10 Phân hệ Giao diện VIMES", "icon": "grid"},
        {"id": "ui_tiepdon", "name": "1. Giao diện Tiếp đón bệnh nhân", "icon": "user-check"},
        {"id": "ui_khambenh", "name": "2. Giao diện Quản lý khám bệnh", "icon": "stethoscope"},
        {"id": "ui_noitru", "name": "3. Giao diện Quản lý điều trị nội trú", "icon": "bed"},
        {"id": "ui_duoc", "name": "4. Giao diện Quản lý dược & Kho thuốc", "icon": "pill"},
        {"id": "ui_vienphi", "name": "5. Giao diện Quản lý viện phí & BHYT", "icon": "credit-card"},
        {"id": "ui_cdha", "name": "6. Giao diện Quản lý chẩn đoán hình ảnh (PACS)", "icon": "camera"},
        {"id": "ui_xetnghiem", "name": "7. Giao diện Quản lý xét nghiệm (LIS)", "icon": "flask-conical"},
        {"id": "ui_vattu", "name": "8. Giao diện Quản lý vật tư & Thiết bị", "icon": "box"},
        {"id": "ui_baocao", "name": "9. Giao diện Báo cáo thống kê & Cổng BHYT", "icon": "bar-chart"},
        {"id": "ui_thietlap", "name": "10. Giao diện Thiết lập bệnh viện & Hệ thống", "icon": "settings"}
    ]

    tables = []
    current_section_id = "patient"
    current_section_name = "Phần 1: Quản lý Bệnh nhân & Tiếp đón"
    current_table = None

    for line in lines:
        line_s = line.strip()

        sec_match = re.search(r"##\s*📁?\s*Phần\s*(\d+)\s*:\s*(.*)", line_s)
        if sec_match:
            sec_num = sec_match.group(1)
            sec_map = {
                "1": ("patient", "Phần 1: Quản lý Bệnh nhân & Tiếp đón"),
                "2": ("clinical", "Phần 2: Hồ sơ Bệnh án & EMR"),
                "3": ("pharmacy", "Phần 3: Dược, Kê đơn & Kho Dược"),
                "4": ("paraclinical", "Phần 4: Cận lâm sàng, LIS & PACS"),
                "5": ("billing", "Phần 5: Viện phí & BHYT"),
                "6": ("system", "Phần 6: Danh mục Dùng chung & Cấu hình"),
                "7": ("integration", "Phần 7: Tích hợp & Cổng Quốc gia"),
                "8": ("other", "Phần 8: Phân hệ Mở rộng Khác")
            }
            if sec_num in sec_map:
                current_section_id, current_section_name = sec_map[sec_num]
            else:
                current_section_id = f"sec_{sec_num}"
                current_section_name = sec_match.group(2).strip()
            continue

        if "Bảng:" in line_s or "B\u1ea3ng:" in line_s:
            tbl_match = re.search(r"B[aả]ng:\s*`([^`]+)`\s*\(([^)]+)\)", line_s)
            if tbl_match:
                tbl_name = tbl_match.group(1).strip()
                tbl_type = tbl_match.group(2).strip()

                vn_name, topic, desc, ui_id, ui_name = get_table_details(tbl_name, current_section_name, current_section_id)

                current_table = {
                    "name": tbl_name,
                    "title": vn_name,
                    "topic": topic,
                    "description": desc,
                    "uiModuleId": ui_id,
                    "uiModuleName": ui_name,
                    "type": tbl_type,
                    "sectionId": current_section_id,
                    "section": current_section_name,
                    "columns": []
                }
                tables.append(current_table)
                continue

        if current_table and line_s.startswith("|") and not line_s.startswith("| :---") and not line_s.startswith("| STT") and not line_s.startswith("|STT"):
            parts = [p.strip() for p in line_s.split("|")]
            if len(parts) >= 5:
                col_raw = parts[2]
                type_raw = parts[3].replace("`", "") if len(parts) > 3 else ""
                null_raw = parts[4].replace("*", "") if len(parts) > 4 else "YES"
                def_raw = parts[5].replace("`", "") if len(parts) > 5 else ""

                is_pk = ("\U0001f511" in col_raw) or ("🔑" in col_raw) or ("PRIMARY" in col_raw) or ("**`" in col_raw and "🔑" in line_s)
                col_name = re.sub(r"[\*`\U0001f511🔑]", "", col_raw).strip()

                if col_name and not col_name.lower().startswith("tên cột") and not col_name.isdigit():
                    vn_col_desc = get_column_vietnamese_description(col_name, current_table["name"])
                    current_table["columns"].append({
                        "name": col_name,
                        "description": vn_col_desc,
                        "type": type_raw,
                        "isPk": is_pk,
                        "nullable": "NO" not in null_raw.upper(),
                        "default": def_raw
                    })

    total_cols = sum(len(t["columns"]) for t in tables)
    print(f"VIMES Complete Schema: {len(tables)} tables, {total_cols} columns mapped to 10 VIMES UI Modules.")

    data_payload = {
        "metadata": {
            "title": "Từ Điển Schema Cơ Sở Dữ Liệu VIMES HIS (Khớp 10 Phân Hệ Giao Diện Ứng Dụng)",
            "version": "3.0",
            "totalTables": len(tables),
            "totalColumns": total_cols
        },
        "vimesModules": vimes_modules,
        "tables": tables
    }

    with open("js/vimes-schema-data.js", "w", encoding="utf-8") as out_js:
        out_js.write("/** Auto-generated VIMES Database Schema Dictionary - 10 UI Module Mapping **/\n")
        out_js.write("window.VIMES_SCHEMA = ")
        json.dump(data_payload, out_js, ensure_ascii=False, indent=None)
        out_js.write(";\n")

    print("Saved to js/vimes-schema-data.js successfully.")

if __name__ == "__main__":
    build_vimes_schema()
