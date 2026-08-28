import os
import re
import json

def get_table_topic_and_description(tbl_name, section_name, section_id):
    t_lower = tbl_name.lower()
    
    # Pre-defined mapping for standard tables
    known_tables = {
        "hms_patient": ("Danh mục Hồ sơ Bệnh nhân", "Quản lý Bệnh nhân & Tiếp đón", "Lưu trữ thông tin định danh người bệnh (Mã bệnh nhân, họ tên, ngày sinh, CCCD, địa chỉ, nghề nghiệp, nơi làm việc)"),
        "hms_doc": ("Hồ sơ Khám bệnh & Tiếp đón", "Quản lý Bệnh nhân & Tiếp đón", "Lưu thông tin mỗi lượt tiếp đón/khám bệnh của bệnh nhân (Số hồ sơ, ngày tiếp đón, đối tượng BHYT, khoa phòng)"),
        "hms_outpatient": ("Hồ sơ Khám Ngoại trú", "Quản lý Bệnh nhân & Tiếp đón", "Thông tin đợt khám và điều trị ngoại trú của người bệnh"),
        "hms_outpatient_record": ("Phiếu Khám Ngoại trú", "Hồ sơ Bệnh án & EMR", "Chi tiết diễn biến khám, kết quả khám lâm sàng ngoại trú"),
        "hms_birthcertificate": ("Giấy Chứng sinh", "Quản lý Bệnh nhân & Tiếp đón", "Quản lý dữ liệu chứng sinh trẻ sơ sinh, cấp mã định danh và liên thông cổng DVC"),
        "hms_patientdeath": ("Giấy Báo tử & Trích lục Tử vong", "Quản lý Bệnh nhân & Tiếp đón", "Lưu trữ hồ sơ tử vong, nguyên nhân tử vong và trích lục hộ tịch"),
        "hms_relative": ("Thông tin Thân nhân Bệnh nhân", "Quản lý Bệnh nhân & Tiếp đón", "Người liên hệ khẩn cấp, bố mẹ, người giám hộ của bệnh nhân"),
        "hiv_patient": ("Hồ sơ Bệnh nhân Điều trị HIV/ARV", "Quản lý Bệnh nhân & Tiếp đón", "Theo dõi bệnh nhân HIV, phác đồ ARV và nơi đăng ký điều trị"),
        "chemo_optimizer_patient": ("Hồ sơ Phác đồ Hóa chất Ung bướu", "Hồ sơ Bệnh án & EMR", "Tối ưu hóa và kiểm soát liều lượng phác đồ hóa trị cho bệnh nhân ung bướu"),
        "hms_clinical_record": ("Bệnh án Lâm sàng", "Hồ sơ Bệnh án & EMR", "Tổng hợp bệnh án, tiền sử bệnh, quá trình điều trị của bệnh nhân"),
        "hms_treatment_record": ("Phiếu Điều trị Nội trú", "Hồ sơ Bệnh án & EMR", "Theo dõi y lệnh, diễn biến bệnh hàng ngày của bệnh nhân nội trú"),
        "hms_operation": ("Phiếu Phẫu thuật - Thủ thuật (PTTT)", "Hồ sơ Bệnh án & EMR", "Biên bản phẫu thuật, phương pháp vô cảm, kíp mổ và tường trình phẫu thuật"),
        "m_productitem": ("Danh mục Thuốc, Vật tư & Hóa chất", "Dược, Kê đơn & Kho Dược", "Bảng dữ liệu gốc thuốc, vật tư y tế, hoạt chất, hàm lượng, đường dùng"),
        "m_transaction": ("Phiếu Giao dịch Nhập - Xuất Kho Dược", "Dược, Kê đơn & Kho Dược", "Quản lý phiếu nhập kho từ nhà cung cấp, xuất khoa phòng, chuyển kho, xuất bệnh nhân"),
        "m_transaction_line": ("Chi tiết Mặt hàng Giao dịch Kho Dược", "Dược, Kê đơn & Kho Dược", "Từng mặt hàng thuốc/vật tư trong phiếu nhập xuất, số lượng, đơn giá, số lô, hạn dùng"),
        "m_storage": ("Danh mục Kho Dược & Tủ trực", "Dược, Kê đơn & Kho Dược", "Danh sách các kho thuốc chẵn, kho lẻ, kho vật tư và tủ trực khoa phòng"),
        "m_productitem_storage": ("Tồn kho Thuốc & Vật tư", "Dược, Kê đơn & Kho Dược", "Theo dõi số lượng tồn kho thực tế của từng loại thuốc tại từng kho"),
        "m_price": ("Bảng giá Thuốc & Vật tư y tế", "Dược, Kê đơn & Kho Dược", "Quản lý các mức giá mua, giá bán BHYT và giá bán viện phí dịch vụ"),
        "m_supplier": ("Danh mục Nhà cung cấp / Công ty Dược", "Dược, Kê đơn & Kho Dược", "Thông tin các nhà thầu, công ty cung ứng dược phẩm"),
        "m_manufacture": ("Danh mục Hãng sản xuất Thuốc", "Dược, Kê đơn & Kho Dược", "Danh sách nhà sản xuất dược phẩm và trang thiết bị"),
        "m_unit": ("Danh mục Đơn vị tính Dược", "Dược, Kê đơn & Kho Dược", "Đơn vị tính: Viên, Lọ, Ống, Hộp, Vỉ, Gói, Chai..."),
        "hms_fee": ("Tổng hợp Viện phí & Chi phí Khám chữa bệnh", "Viện phí & BHYT", "Bảng tổng hợp viện phí của bệnh nhân theo từng đợt khám"),
        "hms_fee_invoice": ("Hóa đơn Thu Viện phí & Đồng chi trả", "Viện phí & BHYT", "Quản lý biên lai, hóa đơn điện tử thu tiền khám chữa bệnh"),
        "hms_fee_deposit": ("Phiếu Thu Tạm ứng Viện phí", "Viện phí & BHYT", "Quản lý tiền tạm ứng nội trú, hoàn ứng và thanh toán ra viện"),
        "hms_fee_refund": ("Phiếu Hoàn trả Viện phí", "Viện phí & BHYT", "Quản lý các khoản hoàn tiền cho người bệnh"),
        "hms_fee_list": ("Danh mục Bảng giá Dịch vụ Kỹ thuật", "Viện phí & BHYT", "Bảng giá khám bệnh, xét nghiệm, chẩn đoán hình ảnh, thủ thuật"),
        "hms_fee_detail": ("Chi tiết Chỉ định & Bảng kê Chi phí", "Viện phí & BHYT", "Từng dịch vụ bệnh nhân sử dụng kèm mức hưởng BHYT và viện phí"),
        "sys_user": ("Tài khoản Người dùng Hệ thống", "Danh mục Dùng chung & Cấu hình", "Quản lý tài khoản đăng nhập cán bộ, bác sĩ, điều dưỡng, thu ngân"),
        "sys_dept": ("Danh mục Khoa / Phòng ban", "Danh mục Dùng chung & Cấu hình", "Danh sách các khoa lâm sàng, cận lâm sàng và phòng ban chức năng"),
        "sys_room": ("Danh mục Buồng bệnh / Phòng khám", "Danh mục Dùng chung & Cấu hình", "Quản lý danh sách phòng khám, buồng điều trị, giường bệnh"),
        "sys_company": ("Thông tin Bệnh viện / Cơ sở Y tế", "Danh mục Dùng chung & Cấu hình", "Tên cơ sở, mã cơ sở KCB BHYT, địa chỉ, cơ quan chủ quản"),
        "sys_permission": ("Phân quyền Chức năng Hệ thống", "Danh mục Dùng chung & Cấu hình", "Bảng phân quyền chi tiết các chức năng cho từng nhóm người dùng"),
        "emr_document": ("Hồ sơ Bệnh án Điện tử (EMR)", "Hồ sơ Bệnh án & EMR", "Văn bản, biểu mẫu bệnh án điện tử tích hợp ký số"),
        "emr_sign": ("Thông tin Ký số Bệnh án Điện tử", "Hồ sơ Bệnh án & EMR", "Chứng thư số, thời gian ký, trạng thái ký số của bác sĩ"),
        "nrs_care_record": ("Phiếu Chăm sóc Điều dưỡng", "Hồ sơ Bệnh án & EMR", "Theo dõi dấu hiệu sinh tồn, y lệnh điều dưỡng, chăm sóc bệnh nhân"),
        "nrs_infusion_orders": ("Y lệnh Truyền dịch", "Hồ sơ Bệnh án & EMR", "Quản lý y lệnh truyền dịch, tốc độ truyền, thời gian bắt đầu/kết thúc"),
        "bh_xml1": ("Dữ liệu XML1 BHYT - Tổng hợp Khám chữa bệnh", "Viện phí & BHYT", "Dữ liệu XML1 gửi cổng giám định BHYT theo QĐ 4210 / QĐ 130"),
        "bh_xml2": ("Dữ liệu XML2 BHYT - Chi tiết Thuốc", "Viện phí & BHYT", "Bảng kê chi tiết thuốc BHYT thanh toán gửi cổng giám định"),
        "bh_xml3": ("Dữ liệu XML3 BHYT - Chi tiết Dịch vụ Kỹ thuật & Vật tư", "Viện phí & BHYT", "Bảng kê DVKT, xét nghiệm, CĐHA gửi cổng giám định BHYT"),
        "bh_xml4": ("Dữ liệu XML4 BHYT - Chi tiết Diễn biến Lâm sàng", "Viện phí & BHYT", "Thông tin diễn biến lâm sàng của bệnh nhân gửi cổng BHYT"),
        "bh_xml5": ("Dữ liệu XML5 BHYT - Chi tiết Diễn biến Cận lâm sàng", "Viện phí & BHYT", "Kết quả xét nghiệm, CĐHA liên thông giám định BHYT"),
        "lims_order": ("Chỉ định Xét nghiệm (LIS)", "Cận lâm sàng, LIS & PACS", "Phiếu chỉ định xét nghiệm từ bác sĩ sang hệ thống LIS"),
        "lims_result": ("Kết quả Xét nghiệm (LIS)", "Cận lâm sàng, LIS & PACS", "Kết quả đo chỉ số xét nghiệm huyết học, sinh hóa, vi sinh"),
        "pacs_study": ("Ca chụp Chẩn đoán Hình ảnh (PACS)", "Cận lâm sàng, LIS & PACS", "Thông tin chỉ định chụp X-quang, CT, MRI, Siêu âm và kết luận"),
        "hrm_employee": ("Hồ sơ Nhân sự & Cán bộ Y tế", "Phân hệ Mở rộng Khác", "Quản lý lý lịch, chứng chỉ hành nghề, chức danh cán bộ y tế"),
        "fam_asset": ("Quản lý Tài sản & Trang thiết bị Y tế", "Phân hệ Mở rộng Khác", "Danh mục máy móc thiết bị y tế, tình trạng sử dụng, bảo dưỡng")
    }

    if t_lower in known_tables:
        return known_tables[t_lower]

    # Smart pattern inference for tables
    topic = section_name
    vn_name = tbl_name
    desc = f"Bảng dữ liệu thuộc phân hệ {section_name}"

    if t_lower.startswith("hms_"):
        suffix = t_lower[4:]
        topic = "Quản lý Bệnh viện (HMS)"
        vn_name = f"Quản lý {suffix.replace('_', ' ').title()}"
        desc = f"Bảng lưu trữ thông tin nghiệp vụ khám chữa bệnh ({suffix})"
    elif t_lower.startswith("m_"):
        suffix = t_lower[2:]
        topic = "Dược, Vật tư & Kho (Pharmacy)"
        vn_name = f"Dược phẩm & Kho - {suffix.replace('_', ' ').title()}"
        desc = f"Bảng dữ liệu quản lý thuốc, vật tư y tế và kho vận ({suffix})"
    elif t_lower.startswith("sys_") or t_lower.startswith("system_"):
        suffix = t_lower[4:] if t_lower.startswith("sys_") else t_lower[7:]
        topic = "Hệ thống & Danh mục Dùng chung"
        vn_name = f"Cấu hình Hệ thống - {suffix.replace('_', ' ').title()}"
        desc = f"Bảng danh mục dùng chung hoặc cấu hình hệ thống ({suffix})"
    elif t_lower.startswith("emr_"):
        suffix = t_lower[4:]
        topic = "Bệnh án Điện tử (EMR)"
        vn_name = f"Bệnh án Điện tử - {suffix.replace('_', ' ').title()}"
        desc = f"Bảng quản lý dữ liệu bệnh án điện tử và mẫu biểu số hóa ({suffix})"
    elif t_lower.startswith("nrs_"):
        suffix = t_lower[4:]
        topic = "Y lệnh & Điều dưỡng (Nursing)"
        vn_name = f"Nghiệp vụ Điều dưỡng - {suffix.replace('_', ' ').title()}"
        desc = f"Bảng theo dõi chăm sóc bệnh nhân và y lệnh điều dưỡng ({suffix})"
    elif t_lower.startswith("bh_") or "bhyt" in t_lower:
        topic = "Bảo Hiểm Y Tế & Giám Định"
        vn_name = f"Liên thông BHYT - {tbl_name}"
        desc = "Bảng dữ liệu phục vụ đối soát, giám định và gửi cổng BHYT quốc gia"
    elif t_lower.startswith("lims_"):
        topic = "Xét nghiệm Y khoa (LIS)"
        vn_name = f"Hệ thống Xét nghiệm - {tbl_name[5:].replace('_', ' ').title()}"
        desc = "Bảng lưu trữ kết nối máy xét nghiệm, chỉ định và kết quả LIS"
    elif t_lower.startswith("pacs_") or t_lower.startswith("dicom_"):
        topic = "Chẩn đoán Hình ảnh (PACS/RIS)"
        vn_name = f"Chẩn đoán Hình ảnh - {tbl_name}"
        desc = "Bảng lưu thông tin chỉ định hình ảnh, lưu trữ DICOM và kết luận"
    elif t_lower.startswith("hrm_"):
        topic = "Nhân sự & Tiền lương (HRM)"
        vn_name = f"Quản lý Nhân sự - {tbl_name[4:].replace('_', ' ').title()}"
        desc = "Bảng dữ liệu thông tin nhân viên, cán bộ, bằng cấp, chấm công"
    elif t_lower.startswith("fam_"):
        topic = "Quản lý Tài sản & Thiết bị (FAM)"
        vn_name = f"Quản lý Tài sản - {tbl_name[4:].replace('_', ' ').title()}"
        desc = "Bảng dữ liệu tài sản, máy móc y tế, khấu hao và bảo trì"
    elif t_lower.startswith("hiv_"):
        topic = "Điều trị HIV/ARV"
        vn_name = f"Chuyên khoa HIV - {tbl_name}"
        desc = "Bảng theo dõi hồ sơ bệnh nhân và thuốc điều trị ARV"
    elif t_lower.startswith("chemo_"):
        topic = "Ung bướu & Hóa trị"
        vn_name = f"Phác đồ Hóa trị - {tbl_name}"
        desc = "Bảng dữ liệu thuốc hóa chất và phác đồ ung bướu"
    elif t_lower.startswith("portal_"):
        topic = "Cổng Thông tin Bệnh nhân (Portal)"
        vn_name = f"Cổng Dịch vụ Bệnh nhân - {tbl_name}"
        desc = "Bảng tích hợp tra cứu kết quả trực tuyến cho người bệnh"
    elif t_lower.startswith("qms_"):
        topic = "Xếp hàng Tự động (QMS)"
        vn_name = f"Hệ thống Xếp hàng - {tbl_name}"
        desc = "Bảng quản lý cấp số thứ tự khám bệnh và gọi loa tự động"

    return vn_name, topic, desc

def get_column_vietnamese_description(col_name, tbl_name):
    c_lower = col_name.lower()
    
    # Exact / common column names
    col_dict = {
        # Patient identifiers & demographic
        "hp_patientno": "Mã định danh bệnh nhân (Patient ID)",
        "patientno": "Mã bệnh nhân",
        "patient_id": "Mã bệnh nhân",
        "patient_name": "Họ và tên bệnh nhân",
        "hp_surname": "Họ và tên đệm bệnh nhân",
        "hp_midname": "Tên đệm bệnh nhân",
        "hp_firstname": "Tên bệnh nhân",
        "hp_birthdate": "Ngày sinh bệnh nhân",
        "hp_sex": "Giới tính (M: Nam, F: Nữ)",
        "sex": "Giới tính (M/F)",
        "gender": "Giới tính",
        "hp_idcard": "Số Căn cước công dân (CCCD) / CMND",
        "idcard": "Số CCCD / CMND",
        "id_card": "Số CCCD / CMND",
        "hp_address": "Địa chỉ thường trú người bệnh",
        "address": "Địa chỉ",
        "hp_career": "Nghề nghiệp người bệnh",
        "career": "Nghề nghiệp",
        "hp_ethnic": "Dân tộc",
        "ethnic": "Dân tộc",
        "hp_phone": "Số điện thoại liên hệ",
        "phone": "Số điện thoại",
        "phone_number": "Số điện thoại",
        "hp_workplace": "Nơi làm việc / Cơ quan công tác",
        "workplace": "Nơi làm việc",
        "hp_provinceno": "Mã Tỉnh / Thành phố",
        "hp_districtno": "Mã Quận / Huyện",
        "hp_wardno": "Mã Xã / Phường",
        "provinceno": "Mã Tỉnh / Thành phố",
        "districtno": "Mã Quận / Huyện",
        "wardno": "Mã Xã / Phường",
        
        # Admission & clinical visit (hd_)
        "hd_docno": "Số hồ sơ khám bệnh / Mã đợt tiếp đón",
        "docno": "Số hồ sơ khám bệnh / Đợt tiếp đón",
        "doc_no": "Số hồ sơ khám bệnh",
        "hd_patientno": "Mã bệnh nhân trong hồ sơ khám",
        "hd_admitdate": "Ngày giờ tiếp đón / Vào viện",
        "admitdate": "Ngày giờ tiếp đón vào viện",
        "admit_date": "Ngày giờ vào viện",
        "hd_enddate": "Ngày giờ kết thúc khám / Ra viện",
        "enddate": "Ngày giờ kết thúc đợt khám",
        "end_date": "Ngày giờ kết thúc",
        "hd_status": "Trạng thái hồ sơ khám (Chờ khám, Đang khám, Đã khám...)",
        "status": "Trạng thái xử lý",
        "hd_icd": "Mã chẩn đoán bệnh chính (ICD-10)",
        "icd10": "Mã bệnh theo chuẩn ICD-10",
        "icd_code": "Mã bệnh ICD-10",
        "hd_diagnostic": "Chẩn đoán ban đầu của Bác sĩ",
        "diagnostic": "Chẩn đoán bệnh",
        "diagnosis": "Chẩn đoán bệnh",
        "hd_deptid": "Mã khoa tiếp nhận khám",
        "hd_roomid": "Mã phòng khám chỉ định",
        "hd_doctor": "Mã / Tên Bác sĩ tiếp đón khám",
        "doctor_id": "Mã định danh Bác sĩ",
        "doctor_name": "Họ tên Bác sĩ",
        "doctor": "Bác sĩ phụ trách",
        "hd_object": "Đối tượng khám (1: BHYT, 2: Viện phí, 3: Dịch vụ...)",
        "hd_cardno": "Mã thẻ Bảo hiểm Y tế (BHYT)",
        "cardno": "Mã số thẻ BHYT",
        "card_id": "Mã thẻ / ID định danh thẻ",
        "card_no": "Mã thẻ BHYT",
        "hfe_invoiceno": "Số hóa đơn thu viện phí",
        "invoiceno": "Số hóa đơn thu viện phí",
        "invoice_no": "Số hóa đơn",
        "invoicedate": "Ngày lập hóa đơn viện phí",
        
        # Fee & Billing
        "hfe_amount": "Tổng số tiền viện phí phát sinh",
        "amount": "Số tiền / Tổng tiền",
        "total_amount": "Tổng thành tiền",
        "hfe_insurance_amount": "Số tiền Quỹ BHYT thanh toán",
        "insurance_amount": "Số tiền BHYT chi trả",
        "hfe_patient_amount": "Số tiền Người bệnh cùng chi trả",
        "patient_amount": "Số tiền người bệnh phải thanh toán",
        "hfe_deposit_amount": "Số tiền người bệnh tạm ứng",
        "deposit_amount": "Số tiền tạm ứng",
        "hfe_exempt_amount": "Số tiền được miễn giảm",
        "exempt_amount": "Số tiền miễn giảm",
        "price": "Đơn giá",
        "unit_price": "Đơn giá",
        "unitprice": "Đơn giá",
        "quantity": "Số lượng",
        "qty": "Số lượng",
        
        # Pharmacy & Inventory (m_)
        "m_productitem_id": "Mã định danh thuốc / vật tư y tế",
        "productitem_id": "Mã thuốc / vật tư y tế",
        "product_id": "Mã sản phẩm / thuốc",
        "product_name": "Tên thuốc / hoạt chất / vật tư",
        "product_code": "Mã quản lý thuốc",
        "m_product_name": "Tên thuốc / hóa chất / vật tư y tế",
        "m_storage_id": "Mã kho dược lưu trữ",
        "storage_id": "Mã kho dược",
        "storage_name": "Tên kho dược",
        "m_lot_number": "Số lô sản xuất của thuốc",
        "lot_number": "Số lô thuốc",
        "lotno": "Số lô sản xuất",
        "m_exp_date": "Hạn sử dụng của thuốc / vật tư",
        "exp_date": "Hạn sử dụng",
        "expire_date": "Hạn sử dụng",
        "m_manufacture_id": "Mã nhà sản xuất thuốc",
        "m_supplier_id": "Mã nhà cung ứng / công ty thầu",
        "supplier_id": "Mã nhà cung cấp",
        "m_unit_id": "Mã đơn vị tính (Viên, Hộp, Chai...)",
        "unit_id": "Mã đơn vị tính",
        "unit_name": "Tên đơn vị tính",
        
        # Department & Room
        "deptid": "Mã Khoa / Phòng ban",
        "dept_id": "Mã Khoa / Phòng ban",
        "dept_name": "Tên Khoa / Phòng ban",
        "sd_id": "Mã Khoa phòng",
        "sd_name": "Tên Khoa phòng",
        "roomid": "Mã Phòng khám / Buồng bệnh",
        "room_id": "Mã Phòng khám / Buồng bệnh",
        "room_name": "Tên Phòng khám / Buồng bệnh",
        "sr_id": "Mã Buồng phòng",
        "sr_name": "Tên Buồng phòng",
        
        # System & Audit
        "created_by": "Người tạo bản ghi (Tài khoản)",
        "created_date": "Ngày giờ tạo bản ghi",
        "create_date": "Ngày giờ tạo",
        "create_user": "Người tạo",
        "modified_by": "Người cập nhật bản ghi gần nhất",
        "modified_date": "Ngày giờ cập nhật gần nhất",
        "update_date": "Ngày giờ cập nhật",
        "update_user": "Người cập nhật",
        "is_active": "Trạng thái kích hoạt (Y: Có hiệu lực, N: Hết hiệu lực)",
        "active": "Trạng thái kích hoạt",
        "note": "Ghi chú / Diễn giải nghiệp vụ",
        "notes": "Ghi chú bổ sung",
        "remark": "Ghi chú diễn giải",
        "description": "Mô tả chi tiết"
    }

    if c_lower in col_dict:
        return col_dict[c_lower]

    # Rule-based generator for remaining fields
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

def build_enhanced_schema():
    dict_file = "DATABASE_SCHEMA_DICTIONARY.md"
    if not os.path.exists(dict_file):
        print(f"Error: {dict_file} not found.")
        return

    with open(dict_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    section_map = {
        "1": ("patient", "Phần 1: Quản lý Bệnh nhân & Tiếp đón", "Quản lý Bệnh nhân, lượt khám, nhân thân, giấy tờ hộ tịch"),
        "2": ("clinical", "Phần 2: Hồ sơ Bệnh án & EMR", "Bệnh án điện tử, phiếu khám, điều trị, phẫu thuật thủ thuật"),
        "3": ("pharmacy", "Phần 3: Dược, Kê đơn & Kho Dược", "Thuốc, vật tư, kho dược, nhập xuất tồn, đơn thuốc"),
        "4": ("paraclinical", "Phần 4: Cận lâm sàng, LIS & PACS", "Xét nghiệm, Chẩn đoán hình ảnh, X-quang, CT, Siêu âm, DICOM"),
        "5": ("billing", "Phần 5: Viện phí & BHYT", "Hóa đơn, tạm ứng, miễn giảm, chi phí điều trị, liên thông BHYT"),
        "6": ("system", "Phần 6: Danh mục Dùng chung & Cấu hình", "Khoa phòng, phòng khám, người dùng, quyền hạn, danh mục hệ thống"),
        "7": ("integration", "Phần 7: Tích hợp & Cổng Quốc gia", "API tích hợp bên thứ 3, liên thông cổng sức khỏe sinh sản, ký số"),
        "8": ("other", "Phần 8: Phân hệ Mở rộng Khác", "Nhân sự HRM, Quản lý tài sản FAM, Đào tạo chỉ đạo tuyến")
    }

    sections = []
    for num, (s_id, s_name, s_desc) in section_map.items():
        sections.append({
            "id": s_id,
            "number": num,
            "name": s_name,
            "description": s_desc
        })

    tables = []
    current_section_id = "patient"
    current_section_name = "Phần 1: Quản lý Bệnh nhân & Tiếp đón"
    current_table = None

    for line in lines:
        line_s = line.strip()

        # Match section header: ## 📁 Phần 1: ...
        sec_match = re.search(r"##\s*📁?\s*Phần\s*(\d+)\s*:\s*(.*)", line_s)
        if sec_match:
            sec_num = sec_match.group(1)
            if sec_num in section_map:
                current_section_id, current_section_name, _ = section_map[sec_num]
            else:
                current_section_id = f"sec_{sec_num}"
                current_section_name = sec_match.group(2).strip()
            continue

        # Match table header: #### 📋 Bảng: `table_name` (BASE TABLE / VIEW)
        if "Bảng:" in line_s or "B\u1ea3ng:" in line_s:
            tbl_match = re.search(r"B[aả]ng:\s*`([^`]+)`\s*\(([^)]+)\)", line_s)
            if tbl_match:
                tbl_name = tbl_match.group(1).strip()
                tbl_type = tbl_match.group(2).strip()

                vn_name, topic, desc = get_table_topic_and_description(tbl_name, current_section_name, current_section_id)

                current_table = {
                    "name": tbl_name,
                    "title": vn_name,
                    "topic": topic,
                    "description": desc,
                    "type": tbl_type,
                    "sectionId": current_section_id,
                    "section": current_section_name,
                    "columns": []
                }
                tables.append(current_table)
                continue

        # Match column row in table
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
    print(f"Enhanced Schema: {len(tables)} tables, {total_cols} columns with Vietnamese descriptions & topics.")

    data_payload = {
        "metadata": {
            "title": "Từ Điển Schema Cơ Sở Dữ Liệu VIMES (Chi Tiết Ghi Chú & Chủ Đề)",
            "version": "2.0",
            "totalTables": len(tables),
            "totalColumns": total_cols
        },
        "sections": sections,
        "tables": tables
    }

    with open("js/vimes-schema-data.js", "w", encoding="utf-8") as out_js:
        out_js.write("/** Auto-generated VIMES Database Schema Dictionary with Semantic Vietnamese Descriptions **/\n")
        out_js.write("window.VIMES_SCHEMA = ")
        json.dump(data_payload, out_js, ensure_ascii=False, indent=None)
        out_js.write(";\n")

    print("Saved to js/vimes-schema-data.js successfully.")

if __name__ == "__main__":
    build_enhanced_schema()
