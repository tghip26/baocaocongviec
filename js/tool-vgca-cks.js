/**
 * tool-vgca-cks.js
 * Logic Tác vụ 2: TỔNG HỢP DANH SÁCH XIN CẤP CHỮ KÝ SỐ (CKS) -> Xuất DANH_SACH_TONG_HOP.txt
 * Chuẩn hóa Họ tên Title Case, CCCD;Ngày cấp;Nơi cấp và mã hóa UTF-8 BOM
 */

function buildCsvTxtBlob(headers, rows) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [];
  lines.push(headers.map(escapeCsv).join(","));
  rows.forEach((r, idx) => {
    const rowWithStt = [idx + 1, ...r];
    lines.push(rowWithStt.map(escapeCsv).join(","));
  });

  const content = "\uFEFF" + lines.join("\r\n");
  return new Blob([content], { type: "text/plain;charset=utf-8" });
}

async function processVgcaCks(wordFiles, ssoFiles, logFunc = () => {}, progressFunc = () => {}) {
  logFunc("=== BẮT ĐẦU TÁC VỤ 2: TỔNG HỢP DANH SÁCH XIN CẤP CHỮ KÝ SỐ (CKS) ===");
  progressFunc(5);

  const orgConfig = ToolVgcaDoiChieu.getOrgConfig();

  // 1. Đọc SSO Excel nếu có
  let ssoMap = new Map();
  if (ssoFiles && ssoFiles.length > 0) {
    for (const f of ssoFiles) {
      logFunc(`📊 Đang đọc dữ liệu SSO từ: ${f.name}`);
      const map = await ToolVgcaDoiChieu.loadSsoMapFromExcel(f, logFunc);
      map.forEach((val, key) => ssoMap.set(key, val));
    }
    logFunc(`  -> Đã nạp ${ssoMap.size} bản ghi SSO (email công vụ)`);
  } else {
    logFunc("⚠️ [LƯU Ý] Không có file SSO Excel – cột email công vụ sẽ để trống!");
  }

  // 2. Đọc file Word
  const totalFiles = wordFiles.length;
  const records = [];
  let matchedSsoCount = 0;
  let validCccdCount = 0;

  const headers = [
    "STT",
    "Họ và tên",
    "Ngày sinh",
    "Số CMND/ CCCD/Hộ chiếu;Ngày cấp; nơi cấp",
    "Địa chỉ thư điện tử công vụ",
    "Tên cơ quan-tổ chức công tác",
    "Tỉnh/Thành phố",
    "Chức vụ",
    "Số điện thoại di động",
    "Số hiệu chứng thư cũ (nếu có)",
    "SIM PKI"
  ];

  for (let i = 0; i < totalFiles; i++) {
    const file = wordFiles[i];
    const fileName = file.name || `Tệp Word ${i + 1}`;
    logFunc(`\n📄 Đang đọc file Word (${i + 1}/${totalFiles}): ${fileName}`);
    progressFunc(Math.floor(((i + 1) / totalFiles) * 80));

    try {
      const tables = await DocxTableParser.extractTables(file, fileName);
      for (let tIdx = 0; tIdx < tables.length; tIdx++) {
        const table = tables[tIdx];
        if (!table || table.length === 0) continue;

        const header = table[0];
        let nameIdx = -1, dobIdx = -1, phoneIdx = -1, cccdIdx = -1, issueDateIdx = -1, issuePlaceIdx = -1, unitIdx = -1, posIdx = -1;

        header.forEach((col, idx) => {
          const cNoAcc = DocxTableParser.removeAccents(col);
          if ((cNoAcc.includes("ho va ten") || cNoAcc.includes("ho ten")) && nameIdx === -1) nameIdx = idx;
          else if (cNoAcc.includes("ngay sinh") && dobIdx === -1) dobIdx = idx;
          else if ((cNoAcc.includes("sdt") || cNoAcc.includes("dien thoai") || cNoAcc.includes("di dong")) && phoneIdx === -1) phoneIdx = idx;
          else if ((cNoAcc.includes("cccd") || cNoAcc.includes("cmt") || cNoAcc.includes("cmnd")) && !cNoAcc.includes("noi cap") && !cNoAcc.includes("ngay cap") && cccdIdx === -1) cccdIdx = idx;
          else if (cNoAcc.includes("ngay cap") && issueDateIdx === -1) issueDateIdx = idx;
          else if (cNoAcc.includes("noi cap") && issuePlaceIdx === -1) issuePlaceIdx = idx;
          else if ((cNoAcc.includes("don vi") || cNoAcc.includes("co quan") || cNoAcc.includes("to chuc")) && unitIdx === -1) unitIdx = idx;
          else if (cNoAcc.includes("chuc vu") && posIdx === -1) posIdx = idx;
        });

        if (nameIdx !== -1 && cccdIdx !== -1) {
          for (let r = 1; r < table.length; r++) {
            const vals = table[r];
            if (vals.length > Math.max(nameIdx, cccdIdx)) {
              const rawName = vals[nameIdx];
              const rawCccd = vals[cccdIdx];

              if (rawName && rawCccd && !rawName.toLowerCase().includes("họ và tên") && !rawName.toLowerCase().includes("ho va ten")) {
                const normName = DocxTableParser.normalizePersonName(rawName);
                const dobVal = dobIdx !== -1 && dobIdx < vals.length ? DocxTableParser.normalizeDate(vals[dobIdx]) : "";
                const phoneVal = phoneIdx !== -1 && phoneIdx < vals.length ? DocxTableParser.normalizePhoneNumber(vals[phoneIdx]) : "";
                const cccdFmt = DocxTableParser.formatCccdOutput(rawCccd);
                const issueDate = issueDateIdx !== -1 && issueDateIdx < vals.length ? DocxTableParser.normalizeDate(vals[issueDateIdx]) : "";
                const issuePlace = issuePlaceIdx !== -1 && issuePlaceIdx < vals.length ? DocxTableParser.normalizeIssuePlace(vals[issuePlaceIdx]) : "CCSQLHCVTTXH";
                const unitVal = unitIdx !== -1 && unitIdx < vals.length ? DocxTableParser.normalizeUnitName(vals[unitIdx], orgConfig.org3) : orgConfig.org3;
                const posVal = posIdx !== -1 && posIdx < vals.length ? DocxTableParser.normalizePosition(vals[posIdx]) : "Nhân viên";

                const kName = DocxTableParser.normName(normName);
                const kCccd = DocxTableParser.normCccd(rawCccd);
                let email = "";
                if (ssoMap) {
                  email = ssoMap.get(`${kName}__${kCccd}`) || ssoMap.get(kCccd) || ssoMap.get(kName) || "";
                }

                if (email) matchedSsoCount++;
                if (DocxTableParser.isValidCccd(cccdFmt)) validCccdCount++;

                // Cột 4: CCCD;Ngày cấp;Nơi cấp
                let cccdStr = `${cccdFmt};${issueDate};${issuePlace}`.replace(/;+$/, "");

                const rowData = [
                  normName,
                  dobVal,
                  cccdStr,
                  email,
                  unitVal,
                  orgConfig.province,
                  posVal,
                  phoneVal,
                  "", // Serial CTS cũ
                  ""  // SIM PKI
                ];
                records.push(rowData);
                logFunc(`  + [${normName}] - CCCD: ${cccdFmt} -> ${email ? `Email: ${email}` : "⚠️ CHƯA CÓ EMAIL SSO"}`);
              }
            }
          }
        }
      }
    } catch (err) {
      logFunc(`❌ Lỗi đọc file ${fileName}: ${err.message}`);
    }
  }

  if (records.length === 0) {
    throw new Error("Không trích xuất được bản ghi nhân sự nào từ danh sách file Word đã chọn.");
  }

  logFunc(`\n==========================================`);
  logFunc(`🎉 ĐÃ TỔNG HỢP THÀNH CÔNG: ${records.length} bản ghi`);
  logFunc(`  - Khớp email SSO: ${matchedSsoCount} / ${records.length}`);
  logFunc(`  - CCCD hợp lệ: ${validCccdCount} / ${records.length}`);
  logFunc(`==========================================`);
  progressFunc(100);

  const txtBlob = buildCsvTxtBlob(headers, records);
  const previewRows = records.map((r, idx) => [idx + 1, ...r]);

  return {
    blob: txtBlob,
    headers,
    totalRecords: records.length,
    matchedSsoCount,
    missingSsoCount: records.length - matchedSsoCount,
    validCccdCount,
    invalidCccdCount: records.length - validCccdCount,
    previewRows
  };
}

window.ToolVgcaCks = {
  processVgcaCks
};
