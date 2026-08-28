import os
import re
import json

def parse_database_schema():
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

        # Match section headers: ## 📁 Phần 1: ...
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
                current_table = {
                    "name": tbl_name,
                    "type": tbl_type,
                    "sectionId": current_section_id,
                    "section": current_section_name,
                    "columns": []
                }
                tables.append(current_table)
                continue

        # Match column row in table
        # | STT | Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định |
        if current_table and line_s.startswith("|") and not line_s.startswith("| :---") and not line_s.startswith("| STT") and not line_s.startswith("|STT"):
            parts = [p.strip() for p in line_s.split("|")]
            if len(parts) >= 5:
                # parts[0] is '', parts[1] is STT, parts[2] is Col Name, parts[3] is Data Type, parts[4] is Nullable, parts[5] is Default
                col_raw = parts[2]
                type_raw = parts[3].replace("`", "") if len(parts) > 3 else ""
                null_raw = parts[4].replace("*", "") if len(parts) > 4 else "YES"
                def_raw = parts[5].replace("`", "") if len(parts) > 5 else ""

                is_pk = ("\U0001f511" in col_raw) or ("🔑" in col_raw) or ("PRIMARY" in col_raw) or ("**`" in col_raw and "🔑" in line_s)
                # Clean column name
                col_name = re.sub(r"[\*`\U0001f511🔑]", "", col_raw).strip()

                if col_name and not col_name.lower().startswith("tên cột") and not col_name.isdigit():
                    current_table["columns"].append({
                        "name": col_name,
                        "type": type_raw,
                        "isPk": is_pk,
                        "nullable": "NO" not in null_raw.upper(),
                        "default": def_raw
                    })

    # Summary
    total_cols = sum(len(t["columns"]) for t in tables)
    print(f"Parsed {len(tables)} tables and {total_cols} columns successfully.")

    # Build Column Inverted Index: column_name -> list of table names
    col_index = {}
    for t in tables:
        t_name = t["name"]
        for c in t["columns"]:
            c_name = c["name"].lower()
            if c_name not in col_index:
                col_index[c_name] = []
            if t_name not in col_index[c_name]:
                col_index[c_name].append(t_name)

    print(f"Built inverted column index with {len(col_index)} unique column names.")

    data_payload = {
        "metadata": {
            "title": "Từ Điển Schema Cơ Sở Dữ Liệu VIMES",
            "version": "1.0",
            "totalTables": len(tables),
            "totalColumns": total_cols,
            "uniqueColumnNames": len(col_index)
        },
        "sections": sections,
        "tables": tables
    }

    # Write to js/vimes-schema-data.js (as window.VIMES_SCHEMA for instant zero-lag access)
    with open("js/vimes-schema-data.js", "w", encoding="utf-8") as out_js:
        out_js.write("/** Auto-generated VIMES Database Schema Dictionary **/\n")
        out_js.write("window.VIMES_SCHEMA = ")
        json.dump(data_payload, out_js, ensure_ascii=False, indent=None)
        out_js.write(";\n")

    print("Saved to js/vimes-schema-data.js successfully.")

if __name__ == "__main__":
    parse_database_schema()
