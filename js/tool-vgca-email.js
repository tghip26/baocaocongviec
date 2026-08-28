/**
 * tool-vgca-email.js
 * Logic Tác vụ 3: TỔNG HỢP DANH SÁCH XIN CẤP EMAIL CÔNG VỤ -> Xuất DANH_SACH_EMAIL_CONG_VU.txt
 * Chuẩn hóa Họ tên, SĐT 10 số, CCCD 12 số, Ghi chú mặc định 'Cấp mới'
 */

async function processVgcaEmail(wordFiles, logFunc = () => {}, progressFunc = () => {}) {
  logFunc("=== BẮT ĐẦU TÁC VỤ 3: TỔNG HỢP DANH SÁCH XIN CẤP EMAIL CÔNG VỤ ===");
  progressFunc(5);

  const orgConfig = ToolVgcaDoiChieu.getOrgConfig();
  const totalFiles = wordFiles.length;
  const records = [];
  let validCccdCount = 0;

  const headers = ["STT", "Họ và tên", "Ngày sinh", "Di động", "Số CCCD", "Đơn vị công tác", "Chức vụ", "Ghi chú"];

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
        let nameIdx = -1, dobIdx = -1, phoneIdx = -1, cccdIdx = -1, unitIdx = -1, posIdx = -1, noteIdx = -1;

        header.forEach((col, idx) => {
          const cNoAcc = DocxTableParser.removeAccents(col);
          if ((cNoAcc.includes("ho va ten") || cNoAcc.includes("ho ten")) && nameIdx === -1) nameIdx = idx;
          else if (cNoAcc.includes("ngay sinh") && dobIdx === -1) dobIdx = idx;
          else if ((cNoAcc.includes("sdt") || cNoAcc.includes("dien thoai") || cNoAcc.includes("di dong")) && phoneIdx === -1) phoneIdx = idx;
          else if ((cNoAcc.includes("cccd") || cNoAcc.includes("cmt") || cNoAcc.includes("cmnd")) && !cNoAcc.includes("noi cap") && !cNoAcc.includes("ngay cap") && cccdIdx === -1) cccdIdx = idx;
          else if ((cNoAcc.includes("don vi") || cNoAcc.includes("co quan") || cNoAcc.includes("to chuc")) && unitIdx === -1) unitIdx = idx;
          else if (cNoAcc.includes("chuc vu") && posIdx === -1) posIdx = idx;
          else if (cNoAcc.includes("ghi chu") && noteIdx === -1) noteIdx = idx;
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
                const cccdValFmt = DocxTableParser.formatCccdOutput(rawCccd);
                const unitVal = unitIdx !== -1 && unitIdx < vals.length ? DocxTableParser.normalizeUnitName(vals[unitIdx], orgConfig.org3) : orgConfig.org3;
                const posVal = posIdx !== -1 && posIdx < vals.length ? DocxTableParser.normalizePosition(vals[posIdx]) : "Nhân viên";
                let noteVal = noteIdx !== -1 && noteIdx < vals.length ? DocxTableParser.cleanText(vals[noteIdx]) : "Cấp mới";
                if (!noteVal) noteVal = "Cấp mới";

                if (DocxTableParser.isValidCccd(cccdValFmt)) validCccdCount++;

                records.push([normName, dobVal, phoneVal, cccdValFmt, unitVal, posVal, noteVal]);
                logFunc(`  + [${normName}] - CCCD: ${cccdValFmt} - Đơn vị: ${unitVal}`);
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
  logFunc(`🎉 ĐÃ XUẤT THÀNH CÔNG FILE EMAIL CÔNG VỤ: ${records.length} bản ghi`);
  logFunc(`  - CCCD hợp lệ: ${validCccdCount} / ${records.length}`);
  logFunc(`==========================================`);
  progressFunc(100);

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [];
  lines.push(headers.map(escapeCsv).join(","));
  records.forEach((r, idx) => {
    lines.push([idx + 1, ...r].map(escapeCsv).join(","));
  });

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
  const previewRows = records.map((r, idx) => [idx + 1, ...r]);

  return {
    blob,
    headers,
    totalRecords: records.length,
    validCccdCount,
    invalidCccdCount: records.length - validCccdCount,
    previewRows
  };
}

window.ToolVgcaEmail = {
  processVgcaEmail
};
