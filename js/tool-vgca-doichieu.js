/**
 * tool-vgca-doichieu.js
 * Logic Tác vụ 1: ĐỐI CHIẾU DỮ LIỆU WORD & EXCEL SSO -> Xuất Ket_qua.xlsx (19 cột chuẩn VGCA)
 */

const DEFAULT_ORG1 = "ỦY BAN NHÂN DÂN TỈNH BẮC NINH";
const DEFAULT_ORG2 = "SỞ Y TẾ";
const DEFAULT_ORG3 = "BỆNH VIỆN ĐA KHOA BẮC NINH SỐ 2";
const DEFAULT_PROVINCE = "Bắc Ninh";

/**
 * Đọc file Excel SSO để trích xuất bản đồ ánh xạ tài khoản (Họ tên, CCCD -> Email công vụ)
 */
async function loadSsoMapFromExcel(fileOrBuffer, logFunc = () => {}) {
  const ssoMap = new Map();
  let arrayBuffer = fileOrBuffer;
  if (fileOrBuffer instanceof Blob) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  }

  try {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!rows || rows.length === 0) continue;

      const header = rows[0].map(c => DocxTableParser.cleanText(c));
      let nameIdx = -1, emailIdx = -1, cccdIdx = -1;

      header.forEach((col, idx) => {
        const cLower = col.toLowerCase();
        if ((cLower.includes("tên") || cLower.includes("họ tên") || cLower.includes("ho ten")) && nameIdx === -1) {
          nameIdx = idx;
        }
        if ((cLower.includes("tên đăng nhập") || cLower.includes("ten dang nhap") || cLower.includes("email") || cLower.includes("thư điện tử") || cLower.includes("thu dien tu")) && emailIdx === -1) {
          emailIdx = idx;
        }
        if ((cLower.includes("description") || cLower.includes("cccd") || cLower.includes("cmt") || cLower.includes("cmnd")) && cccdIdx === -1) {
          cccdIdx = idx;
        }
      });

      if (nameIdx === -1) nameIdx = 0;
      if (emailIdx === -1) emailIdx = 1;
      if (cccdIdx === -1 && header.length >= 6) cccdIdx = 5;

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const nameVal = row[nameIdx];
        const emailVal = row[emailIdx];
        const cccdVal = cccdIdx !== -1 && cccdIdx < row.length ? row[cccdIdx] : "";

        if (nameVal && emailVal) {
          const emailClean = DocxTableParser.cleanEmail(emailVal);
          const kName = DocxTableParser.normName(nameVal);
          const kCccd = DocxTableParser.normCccd(cccdVal);

          if (kName && kCccd) {
            ssoMap.set(`${kName}__${kCccd}`, emailClean);
          }
          if (kName && !ssoMap.has(kName)) {
            ssoMap.set(kName, emailClean);
          }
          if (kCccd && !ssoMap.has(kCccd)) {
            ssoMap.set(kCccd, emailClean);
          }
        }
      }
    }
  } catch (err) {
    logFunc(`⚠️ Lỗi đọc dữ liệu SSO: ${err.message}`);
  }

  return ssoMap;
}

/**
 * Trích xuất danh sách nhân sự từ một danh sách các file Word (.docx)
 */
async function extractPeopleFromWordFiles(wordFiles, ssoMap, logFunc = () => {}, progressFunc = () => {}) {
  const peopleList = [];
  const totalFiles = wordFiles.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = wordFiles[i];
    const fileName = file.name || `Tệp Word ${i + 1}`;
    logFunc(`📄 Đang xử lý file Word (${i + 1}/${totalFiles}): ${fileName}`);
    progressFunc(Math.floor(((i + 1) / totalFiles) * 80));

    try {
      const tables = await DocxTableParser.extractTables(file, fileName);
      for (let tIdx = 0; tIdx < tables.length; tIdx++) {
        const table = tables[tIdx];
        if (!table || table.length === 0) continue;

        const header = table[0];
        let nameIdx = -1, cccdIdx = -1, dobIdx = -1, issueDateIdx = -1, issuePlaceIdx = -1, phoneIdx = -1, posIdx = -1, unitIdx = -1;

        header.forEach((col, idx) => {
          const cNoAcc = DocxTableParser.removeAccents(col);
          if ((cNoAcc.includes("ho va ten") || cNoAcc.includes("ho ten")) && nameIdx === -1) {
            nameIdx = idx;
          } else if ((cNoAcc.includes("cccd") || cNoAcc.includes("cmt") || cNoAcc.includes("cmnd")) && !cNoAcc.includes("noi cap") && !cNoAcc.includes("ngay cap") && cccdIdx === -1) {
            cccdIdx = idx;
          } else if (cNoAcc.includes("ngay sinh") && dobIdx === -1) {
            dobIdx = idx;
          } else if (cNoAcc.includes("ngay cap") && issueDateIdx === -1) {
            issueDateIdx = idx;
          } else if (cNoAcc.includes("noi cap") && issuePlaceIdx === -1) {
            issuePlaceIdx = idx;
          } else if ((cNoAcc.includes("sdt") || cNoAcc.includes("dien thoai") || cNoAcc.includes("di dong")) && phoneIdx === -1) {
            phoneIdx = idx;
          } else if (cNoAcc.includes("chuc vu") && posIdx === -1) {
            posIdx = idx;
          } else if ((cNoAcc.includes("don vi") || cNoAcc.includes("co quan") || cNoAcc.includes("to chuc")) && unitIdx === -1) {
            unitIdx = idx;
          }
        });

        if (nameIdx !== -1 && cccdIdx !== -1) {
          logFunc(`  -> Tìm thấy bảng dữ liệu (Bảng ${tIdx + 1})`);
          for (let r = 1; r < table.length; r++) {
            const vals = table[r];
            if (vals.length > Math.max(nameIdx, cccdIdx)) {
              const nameVal = vals[nameIdx];
              const cccdVal = vals[cccdIdx];

              if (nameVal && cccdVal && !nameVal.toLowerCase().includes("họ và tên") && !nameVal.toLowerCase().includes("ho va ten")) {
                const kName = DocxTableParser.normName(nameVal);
                const kCccd = DocxTableParser.normCccd(cccdVal);

                let email = "";
                if (ssoMap) {
                  email = ssoMap.get(`${kName}__${kCccd}`) || ssoMap.get(kCccd) || ssoMap.get(kName) || "";
                }

                const dob = dobIdx !== -1 && dobIdx < vals.length ? DocxTableParser.normalizeDate(vals[dobIdx]) : "";
                const issueDate = issueDateIdx !== -1 && issueDateIdx < vals.length ? DocxTableParser.normalizeDate(vals[issueDateIdx]) : "";
                const issuePlace = issuePlaceIdx !== -1 && issuePlaceIdx < vals.length ? DocxTableParser.normalizeIssuePlace(vals[issuePlaceIdx]) : "CCSQLHCVTTXH";
                const phone = phoneIdx !== -1 && phoneIdx < vals.length ? DocxTableParser.cleanText(vals[phoneIdx]) : "";
                const pos = posIdx !== -1 && posIdx < vals.length && vals[posIdx] ? DocxTableParser.cleanText(vals[posIdx]) : "Nhân viên";
                const unit = unitIdx !== -1 && unitIdx < vals.length && vals[unitIdx] ? DocxTableParser.cleanText(vals[unitIdx]) : DEFAULT_ORG3;

                const person = {
                  name: nameVal,
                  dob: dob,
                  cccd: DocxTableParser.formatCccdOutput(cccdVal),
                  issuePlace: issuePlace,
                  issueDate: issueDate,
                  email: email,
                  org1: DEFAULT_ORG1,
                  org2: DEFAULT_ORG2,
                  org3: unit || DEFAULT_ORG3,
                  org4: "",
                  province: DEFAULT_PROVINCE,
                  position: pos,
                  phone: phone,
                  serialOld: "",
                  network: "",
                  isTransfer: "",
                  deviceType: ""
                };
                peopleList.push(person);
                logFunc(`     + Lấy được: ${nameVal} - CCCD: ${person.cccd} -> Email: ${email || "CHƯA CÓ SSO"}`);
              }
            }
          }
        }
      }
    } catch (err) {
      logFunc(`❌ Lỗi đọc file Word ${fileName}: ${err.message}`);
    }
  }

  return peopleList;
}

/**
 * Xử lý chính Tác vụ 1: Xuất Ket_qua.xlsx (19 cột chuẩn VGCA)
 */
async function processVgcaDoiChieu(wordFiles, ssoFiles, logFunc = () => {}, progressFunc = () => {}) {
  logFunc("=== BẮT ĐẦU TÁC VỤ 1: ĐỐI CHIẾU DỮ LIỆU WORD & EXCEL SSO ===");
  progressFunc(5);

  // 1. Đọc SSO Excel
  let ssoMap = new Map();
  if (ssoFiles && ssoFiles.length > 0) {
    for (const f of ssoFiles) {
      logFunc(`📊 Đang đọc dữ liệu SSO từ: ${f.name}`);
      const map = await loadSsoMapFromExcel(f, logFunc);
      map.forEach((val, key) => ssoMap.set(key, val));
    }
    logFunc(`  -> Đã nạp ${ssoMap.size} mục ánh xạ SSO.`);
  } else {
    logFunc("⚠️ Không có file SSO Excel được chọn, cột Email công vụ sẽ để trống nếu không khớp.");
  }

  // 2. Đọc file Word
  const peopleList = await extractPeopleFromWordFiles(wordFiles, ssoMap, logFunc, progressFunc);

  if (peopleList.length === 0) {
    throw new Error("Không tìm thấy dữ liệu nhân sự nào trong các file Word đã chọn. Vui lòng kiểm tra lại cấu trúc bảng trong file.");
  }

  logFunc(`\n📊 Tổng số nhân sự trích xuất thành công: ${peopleList.length}`);
  logFunc("📝 Đang tạo tệp Excel Ket_qua.xlsx (19 cột chuẩn VGCA)...");
  progressFunc(90);

  // 3. Tạo file Excel 19 cột bằng ExcelJS
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ket_qua");

  const headers = [
    "STT",
    "Họ tên (bắt buộc)",
    "Ngày sinh (bắt buộc, để dạng dd/MM/YYYY)",
    "CCCC (Căn cước công dân, bắt buộc)",
    "Nơi cấp (Nơi cấp CCCD; để một trong 2 nơi: CCSQLHCVTTXH hoặc CCSĐKQLCTVDLQGVDC)",
    "Ngày cấp (bắt buộc, để dạng dd/MM/YYYY)",
    "Địa chỉ thư điện tử công vụ (bắt buộc)",
    "Tổ chức cấp 1 (bắt buộc)",
    "Tổ chức cấp 2",
    "Tổ chức cấp 3",
    "Tổ chức cấp 4",
    "Tỉnh thành phố (Bắt buộc)",
    "Tỉnh/Thành phố",
    "Chức vụ (Bắt buộc)",
    "Điện thoại",
    "Serial CTS cũ",
    "Nhà mạng (bắt buộc nếu đăng ký SIM)",
    "Là chuyển số (đánh dấu X nếu muốn chuyển số đang dùng sang SIM ký số)",
    "Loại thiết bị( nếu không ghi sẽ là token; là một trong các loại sau: (TOKEN, SIM, SOFT, RSSP, HSM); RSSP là ký số tập trung"
  ];

  const headerRow = ws.getRow(1);
  headers.forEach((h, idx) => {
    headerRow.getCell(idx + 1).value = h;
    headerRow.getCell(idx + 1).font = { name: "Arial", size: 10, bold: true };
    headerRow.getCell(idx + 1).alignment = { vertical: "middle" };
  });

  const previewRows = [];

  peopleList.forEach((p, idx) => {
    const rowNum = idx + 2;
    const row = ws.getRow(rowNum);

    const values = [
      idx + 1,
      p.name,
      p.dob,
      String(p.cccd),
      p.issuePlace,
      p.issueDate,
      p.email,
      p.org1,
      p.org2,
      p.org3,
      p.org4,
      p.province,
      DEFAULT_PROVINCE,
      p.position,
      p.phone,
      p.serialOld,
      p.network,
      p.isTransfer,
      p.deviceType
    ];

    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.numFmt = "@";
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: colIdx === 0 ? "center" : (colIdx === 1 || colIdx === 6 || colIdx === 7 || colIdx === 8 || colIdx === 9 ? "left" : "center")
      };
    });

    previewRows.push(values);
  });

  // Tự động căn độ rộng cột
  ws.columns.forEach((col, idx) => {
    let maxLen = headers[idx] ? headers[idx].length : 15;
    if (idx === 0) maxLen = 6;
    else if (idx === 1) maxLen = 25;
    else if (idx === 6) maxLen = 30;
    else if (idx === 7 || idx === 8 || idx === 9) maxLen = 28;
    else maxLen = Math.min(Math.max(maxLen, 14), 40);
    col.width = maxLen + 2;
  });

  const buffer = await wb.xlsx.writeBuffer();
  progressFunc(100);
  logFunc("🎉 ĐÃ HOÀN TẤT TÁC VỤ 1!");

  return {
    buffer,
    headers,
    totalRecords: peopleList.length,
    previewRows
  };
}

window.ToolVgcaDoiChieu = {
  loadSsoMapFromExcel,
  extractPeopleFromWordFiles,
  processVgcaDoiChieu
};
