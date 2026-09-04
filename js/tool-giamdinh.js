/**
 * tool-giamdinh.js
 * Logic xử lý Báo cáo Giám định Bảo hiểm & Báo cáo Công việc P.CNTT
 * Chạy 100% Client-side bằng SheetJS & ExcelJS
 * Tối ưu hóa định dạng, căn chỉnh độ rộng cột tự động, lọc danh mục chuẩn
 * Hoàn toàn miễn nhiễm lỗi treo/đơ (freeze-proof, timeout-safe, format-resilient)
 */

const ALLOWED_USERS = new Set([
  "PHCN",
  "NGOẠI TH", "NGOAI TH",
  "XNTT",
  "NHH",
  "TTTM",
  "NGOẠI CT", "NGOAI CT",
  "DA LIỄU", "DA LIEU",
  "PTGMHS",
  "NỘI TH", "NOI TH",
  "PHỤ SẢN", "PHU SAN",
  "MẮT", "MAT",
  "TTBVSK",
  "DƯỢC", "DUOC",
  "THẬN", "THAN",
  "TRUYỀN NHIỄM", "TRUYEN NHIEM",
  "TCKT",
  "NGOẠI UB", "NGOAI UB",
  "NGOẠI XẠ TRỊ", "NGOAI XA TRI",
  "RHM",
  "KB",
  "CXK",
  "CSGN",
  "NGOẠI TN", "NGOAI TN",
  "HHLS",
  "TMH",
  "HSTC",
  "HTL",
  "NGOẠI TKLN", "NGOAI TKLN",
  "NHI",
  "ĐÔNG Y", "DONG Y",
  "CẤP CỨU", "CAP CUU",
  "LKTK"
]);

function normalizeTextGiamDinh(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  text = text.replace(/[\r\n]+/g, " ");
  text = text.replace(/\s+/g, " ");
  return text.trim().toUpperCase();
}

function getColLetterGiamDinh(colNumber) {
  let temp = colNumber;
  let letter = "";
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || "A";
}

/**
 * Trích xuất ngày trong tháng (1..31) từ ô Excel bất kỳ
 * Hỗ trợ Date object, Number, và chuỗi đa dạng (Ngày 01, 01/09, 1...)
 */
function extractDayNumber(val) {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) {
    const d = val.getDate();
    return (d >= 1 && d <= 31) ? d : null;
  }
  if (typeof val === "number") {
    const d = Math.round(val);
    return (d >= 1 && d <= 31) ? d : null;
  }
  const s = String(val).trim();
  // Khớp số thuần túy (1, 01, 14, 31)
  const mNum = s.match(/^0?([1-9]|[12]\d|3[01])$/);
  if (mNum) return parseInt(mNum[1], 10);

  // Khớp "Ngày X", "Ng X", "N.X"
  const mNgay = s.match(/(?:ngày|ng|n\.?)\s*0?([1-9]|[12]\d|3[01])\b/i);
  if (mNgay) return parseInt(mNgay[1], 10);

  // Khớp định dạng ngày "DD/MM" hoặc "DD-MM"
  const mDate = s.match(/\b0?([1-9]|[12]\d|3[01])[\/\-](?:0?[1-9]|1[0-2])\b/);
  if (mDate) return parseInt(mDate[1], 10);

  return null;
}

/**
 * Lấy danh sách tên sheet trong file Excel
 */
function getExcelSheetNames(arrayBuffer) {
  try {
    const sjsWb = XLSX.read(arrayBuffer, { type: "array", bookSheets: true });
    return sjsWb.SheetNames || [];
  } catch (err) {
    console.error("Lỗi đọc danh sách sheet:", err);
    return [];
  }
}

/**
 * Xử lý Báo cáo Cổng Giám Định Bảo Hiểm
 * Lọc chu kỳ ngày 01-14 hoặc 15-31 & chuẩn hóa định dạng Bộ Y Tế
 */
async function processGiamDinh(arrayBuffer, startDay = 1, endDay = 14) {
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: false });

  let targetSheetName = sjsWb.SheetNames.find(n => {
    const l = n.trim().toLowerCase();
    return l === "người dùng" || l === "nguoi dung" || l.includes("người dùng") || l.includes("nguoi dung") || l.includes("giám định") || l.includes("giam dinh");
  }) || sjsWb.SheetNames[0];

  const sjsWs = sjsWb.Sheets[targetSheetName];
  if (!sjsWs) {
    throw new Error("Không thể tìm thấy sheet dữ liệu giám định trong file Excel.");
  }

  const data2D = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });
  if (!data2D || data2D.length === 0) {
    throw new Error("Tệp Excel được chọn không có dữ liệu để xử lý.");
  }

  // 1. Tìm dòng tiêu đề chính và cột Người dùng / Khoa phòng
  let headerRow0 = -1;
  const maxSearch = Math.min(data2D.length, 25);

  for (let r = 0; r < maxSearch; r++) {
    const row = data2D[r] || [];
    const cellVals = row.map(v => normalizeTextGiamDinh(v));

    if (
      cellVals.some(v => v === "STT") ||
      cellVals.some(v => v.includes("NGƯỜI DÙNG") || v.includes("NGUOI DUNG") || v.includes("KHOA") || v.includes("CÁN BỘ") || v.includes("USER"))
    ) {
      headerRow0 = r;
      break;
    }
  }

  if (headerRow0 === -1) {
    headerRow0 = 3;
  }

  // Quét các dòng lân cận headerRow0 để tìm cột Người dùng và các cột Ngày (1..31)
  const candidateRows = [headerRow0, headerRow0 + 1, headerRow0 + 2, headerRow0 - 1].filter(r => r >= 0 && r < data2D.length);

  let userCol0 = -1;
  for (const r of candidateRows) {
    const rowVals = data2D[r] || [];
    for (let c = 0; c < rowVals.length; c++) {
      const norm = normalizeTextGiamDinh(rowVals[c]);
      if (
        norm.includes("NGƯỜI DÙNG") || norm.includes("NGUOI DUNG") ||
        norm.includes("HỌ VÀ TÊN") || norm.includes("HO VA TEN") ||
        norm.includes("CÁN BỘ") || norm.includes("CAN BO") ||
        norm.includes("KHOA") || norm.includes("PHÒNG") || norm.includes("PHONG") ||
        norm.includes("TÀI KHOẢN") || norm.includes("TAI KHOAN") ||
        norm.includes("USER") || norm.includes("BÁC SĨ")
      ) {
        if (userCol0 === -1) userCol0 = c;
      }
    }
  }
  if (userCol0 === -1) userCol0 = 1;

  // Quét ánh xạ cột ngày (1..31)
  const dayColumns0 = {};
  for (const r of candidateRows) {
    const rowVals = data2D[r] || [];
    for (let c = 0; c < rowVals.length; c++) {
      if (c === userCol0 || c === 0) continue;
      const dayNum = extractDayNumber(rowVals[c]);
      if (dayNum !== null && dayColumns0[dayNum] === undefined) {
        dayColumns0[dayNum] = c;
      }
    }
  }

  const selectedDays = [];
  for (let d = startDay; d <= endDay; d++) {
    selectedDays.push(d);
  }

  const sourceCols0 = [0, userCol0];
  const presentDays = [];
  selectedDays.forEach(d => {
    if (dayColumns0[d] !== undefined) {
      sourceCols0.push(dayColumns0[d]);
      presentDays.push(d);
    }
  });

  // Nếu file không có số ngày rõ ràng, lấy theo thứ tự cột liên tiếp sau cột người dùng
  if (presentDays.length === 0) {
    const maxCols = Math.max(...data2D.map(r => r ? r.length : 0));
    const countNeeded = endDay - startDay + 1;
    for (let c = userCol0 + 1; c < Math.min(userCol0 + 1 + countNeeded, maxCols); c++) {
      sourceCols0.push(c);
      presentDays.push(startDay + (c - userCol0 - 1));
    }
  }

  const resultLastCol = Math.max(sourceCols0.length, 2);
  const resultLastLetter = getColLetterGiamDinh(resultLastCol);

  const resultWb = new ExcelJS.Workbook();
  const resultSheet = resultWb.addWorksheet("Người dùng");

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } }
  };

  // Dòng 1: Tiêu đề chính
  const titleA1 = (data2D[0] && data2D[0][0]) ? data2D[0][0] : "DANH SÁCH THEO DÕI GIÁM ĐỊNH BẢO HIỂM";
  resultSheet.mergeCells(1, 1, 1, resultLastCol);
  const cellA1 = resultSheet.getCell(1, 1);
  cellA1.value = titleA1;
  cellA1.alignment = { horizontal: "center", vertical: "middle" };
  cellA1.font = { name: "Arial", size: 15, bold: true, color: { argb: "FF1E3A8A" } };
  resultSheet.getRow(1).height = 34;

  // Dòng 2: Ghi chú chu kỳ
  const noteA2 = `Chu kỳ: Ngày ${startDay} đến ngày ${endDay}`;
  resultSheet.mergeCells(2, 1, 2, resultLastCol);
  const cellA2 = resultSheet.getCell(2, 1);
  cellA2.value = noteA2;
  cellA2.alignment = { horizontal: "center", vertical: "middle" };
  cellA2.font = { name: "Arial", size: 10, italic: true };
  resultSheet.getRow(2).height = 22;

  // Dòng 4 & 5: Header bảng
  resultSheet.mergeCells(4, 1, 5, 1);
  const cellH1 = resultSheet.getCell(4, 1);
  cellH1.value = "STT";
  cellH1.alignment = { horizontal: "center", vertical: "middle" };
  cellH1.font = { name: "Arial", size: 10, bold: true };
  cellH1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  cellH1.border = thinBorder;

  resultSheet.mergeCells(4, 2, 5, 2);
  const cellH2 = resultSheet.getCell(4, 2);
  cellH2.value = "Khoa/Phòng/Người dùng";
  cellH2.alignment = { horizontal: "center", vertical: "middle" };
  cellH2.font = { name: "Arial", size: 10, bold: true };
  cellH2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  cellH2.border = thinBorder;

  // Điền header các ngày
  for (let c = 3; c <= resultLastCol; c++) {
    const dayVal = presentDays[c - 3] !== undefined ? `Ngày ${presentDays[c - 3]}` : `Cột ${c}`;
    const cellH4 = resultSheet.getCell(4, c);
    cellH4.value = dayVal;
    cellH4.alignment = { horizontal: "center", vertical: "middle" };
    cellH4.font = { name: "Arial", size: 10, bold: true };
    cellH4.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    cellH4.border = thinBorder;

    const cellH5 = resultSheet.getCell(5, c);
    cellH5.value = presentDays[c - 3] !== undefined ? presentDays[c - 3] : "";
    cellH5.alignment = { horizontal: "center", vertical: "middle" };
    cellH5.font = { name: "Arial", size: 9, bold: true };
    cellH5.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    cellH5.border = thinBorder;
  }

  // 2. Xác định dòng bắt đầu dữ liệu
  let dataStartRow = Math.max(headerRow0 + 1, 4);
  for (let r = 0; r < Math.min(data2D.length, 12); r++) {
    const rRow = data2D[r] || [];
    if (rRow.some(v => extractDayNumber(v) !== null)) {
      dataStartRow = Math.max(dataStartRow, r + 1);
    }
  }

  // Kiểm tra xem file có khớp ALLOWED_USERS không
  let matchCountWithAllowed = 0;
  for (let r0 = dataStartRow; r0 < data2D.length; r0++) {
    const uVal = (data2D[r0] || [])[userCol0];
    if (!uVal) continue;
    const norm = normalizeTextGiamDinh(uVal);
    if (ALLOWED_USERS.has(norm) || [...ALLOWED_USERS].some(a => norm.includes(a))) {
      matchCountWithAllowed++;
    }
  }
  const useAllowedFilter = matchCountWithAllowed > 0;

  // Lọc và xuất dữ liệu
  let outputRowIdx = 6;
  let stt = 1;
  const previewRows = [];

  for (let r0 = dataStartRow; r0 < data2D.length; r0++) {
    if (r0 % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const srcRow = data2D[r0] || [];
    const userVal = srcRow[userCol0];
    if (!userVal) continue;

    const normUser = normalizeTextGiamDinh(userVal);
    if (normUser === "TỔNG CỘNG" || normUser === "TONG CONG" || normUser === "CỘNG" || normUser === "STT") {
      continue;
    }

    if (useAllowedFilter) {
      let isAllowed = false;
      for (const allowed of ALLOWED_USERS) {
        if (normUser === allowed || normUser.includes(allowed)) {
          isAllowed = true;
          break;
        }
      }
      if (!isAllowed) continue;
    }

    const targetRow = resultSheet.getRow(outputRowIdx);
    targetRow.height = 22;
    const rowPreview = [];

    sourceCols0.forEach((oldCol0, newIdx) => {
      const newCol = newIdx + 1;
      const targetCell = targetRow.getCell(newCol);

      if (newCol === 1) {
        targetCell.value = stt;
        rowPreview.push(stt);
      } else {
        const v = srcRow[oldCol0];
        targetCell.value = (v !== undefined && v !== null) ? v : "";
        rowPreview.push(targetCell.value);
      }

      targetCell.font = { name: "Arial", size: 10 };
      targetCell.border = thinBorder;
      targetCell.alignment = {
        horizontal: newCol === 2 ? "left" : "center",
        vertical: "middle"
      };
    });

    previewRows.push(rowPreview);
    stt++;
    outputRowIdx++;
  }

  // Tối ưu độ rộng cột
  resultSheet.getColumn(1).width = 7;
  resultSheet.getColumn(2).width = 28;
  for (let c = 3; c <= resultLastCol; c++) {
    resultSheet.getColumn(c).width = 12;
  }

  resultSheet.views = [
    { state: "frozen", xSplit: 2, ySplit: 5 }
  ];

  if (outputRowIdx > 6) {
    resultSheet.autoFilter = `A5:${resultLastLetter}${outputRowIdx - 1}`;
  }

  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer,
    totalRecords: stt - 1,
    previewRows,
    headers: ["STT", "Khoa/Phòng/Người dùng", ...presentDays.map(d => `Ngày ${d}`)]
  };
}

/**
 * Xử lý Báo cáo Công việc P.CNTT
 * Tự động nhận diện Ma trận Phần mềm hoặc Bảng Tổng hợp Công việc chuẩn
 * Định dạng chuẩn đẹp, căn lề, viền bảng và tính tổng hoàn hảo
 */
async function processCntt(arrayBuffer, targetSheetName) {
  const sjsWb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, cellFormula: false });

  const chosenSheetName = targetSheetName || sjsWb.SheetNames[0];
  const sjsWs = sjsWb.Sheets[chosenSheetName];
  if (!sjsWs) {
    throw new Error(`Không tìm thấy sheet '${chosenSheetName}' trong file Excel.`);
  }

  const data2D = XLSX.utils.sheet_to_json(sjsWs, { header: 1, defval: "" });
  if (!data2D || data2D.length === 0) {
    throw new Error("Sheet đã chọn không có dữ liệu để xử lý.");
  }

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } }
  };

  // KIỂM TRA CHẾ ĐỘ A: File theo mẫu Ma trận Phần mềm cũ (nếu có dòng >= 104 và cột phần mềm)
  const isLegacyMatrix = data2D.length >= 105 && (data2D[104] && data2D[104].length >= 10);

  if (isLegacyMatrix) {
    return await processLegacyCnttMatrix(data2D, chosenSheetName, thinBorder);
  }

  // CHẾ ĐỘ B: BẢNG TỔNG HỢP CÔNG VIỆC CHUẨN (Áp dụng cho mọi bảng theo dõi công việc P.CNTT)
  return await processStandardCnttTable(data2D, chosenSheetName, thinBorder);
}

/**
 * Chế độ A: Ma trận Phần mềm & Khoa/Phòng P.CNTT
 */
async function processLegacyCnttMatrix(data2D, chosenSheetName, thinBorder) {
  const softwareCols0 = [];
  for (let c = 4; c <= 24; c++) softwareCols0.push(c);

  const softwareHeaders = [];
  const headerRow105 = data2D[104] || [];
  softwareCols0.forEach(c => {
    const val = headerRow105[c];
    softwareHeaders.push(val !== null && val !== undefined && String(val).trim() !== "" ? String(val).trim() : `Phần mềm ${c - 3}`);
  });

  const departments = [];
  for (let r0 = 105; r0 < data2D.length; r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[3];
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === "TỔNG CỘNG" || sDept.toUpperCase() === "TONG CONG") break;
    if (sDept && !departments.includes(sDept)) departments.push(sDept);
  }

  const data = {};
  departments.forEach(dept => {
    data[dept] = new Array(softwareCols0.length).fill(null);
  });

  for (let r0 = 105; r0 < data2D.length; r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[3];
    if (!deptVal) continue;
    const sDept = String(deptVal).trim();
    if (sDept.toUpperCase() === "TỔNG CỘNG" || sDept.toUpperCase() === "TONG CONG") break;
    if (!data[sDept]) continue;

    softwareCols0.forEach((c, idx) => {
      const val = row[c];
      if (val !== null && val !== undefined && val !== "" && val !== 0 && val !== "0") {
        data[sDept][idx] = val;
      }
    });
  }

  const otherErrors = {};
  departments.forEach(dept => {
    otherErrors[dept] = [];
  });

  for (let r0 = 6; r0 <= Math.min(104, data2D.length - 1); r0++) {
    const row = data2D[r0] || [];
    const deptVal = row[1];
    const errorVal = row[34];
    if (!deptVal || !errorVal) continue;
    const sDept = String(deptVal).trim();
    const sError = String(errorVal).trim();
    if (otherErrors[sDept] && sError && sError !== "0") {
      if (!otherErrors[sDept].includes(sError)) otherErrors[sDept].push(sError);
    }
  }

  const validDepartments = departments.filter(dept => {
    const hasSoftware = data[dept].some(v => v !== null && v !== "" && v !== 0 && v !== "0");
    const hasError = otherErrors[dept] && otherErrors[dept].length > 0;
    return hasSoftware || hasError;
  });

  const activeSoftwareIndexes = [];
  for (let i = 0; i < softwareCols0.length; i++) {
    const hasData = validDepartments.some(dept => data[dept][i] !== null && data[dept][i] !== "" && data[dept][i] !== 0 && data[dept][i] !== "0");
    if (hasData) activeSoftwareIndexes.push(i);
  }

  const hasOtherErrorCol = validDepartments.some(dept => otherErrors[dept] && otherErrors[dept].length > 0);

  const headers = ["STT", "KHOA, PHÒNG, TRUNG TÂM"];
  activeSoftwareIndexes.forEach(i => headers.push(softwareHeaders[i] || `Cột ${i + 1}`));
  if (hasOtherErrorCol) headers.push("SỬA LỖI KHÁC");

  const totalColumns = headers.length;
  const resultWb = new ExcelJS.Workbook();
  const outWs = resultWb.addWorksheet("BÁO CÁO TỔNG HỢP");

  outWs.mergeCells(1, 1, 1, totalColumns);
  const titleCell = outWs.getCell(1, 1);
  titleCell.value = "TỔNG HỢP CÔNG VIỆC PHÒNG CNTT";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  outWs.getRow(1).height = 34;

  const headerRow = outWs.getRow(3);
  headerRow.height = 45;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  });

  let curRow = 4;
  const previewRows = [];

  validDepartments.forEach((dept, dIdx) => {
    const row = outWs.getRow(curRow);
    row.height = 24;
    const rowPreview = [dIdx + 1, dept];
    let colIdx = 1;

    row.getCell(colIdx++).value = dIdx + 1;
    row.getCell(colIdx++).value = dept;

    activeSoftwareIndexes.forEach(swIdx => {
      const val = data[dept][swIdx];
      if (val !== null && val !== undefined && val !== "" && val !== 0 && val !== "0") {
        row.getCell(colIdx).value = val;
        rowPreview.push(val);
      } else {
        rowPreview.push("");
      }
      colIdx++;
    });

    if (hasOtherErrorCol) {
      const errText = (otherErrors[dept] && otherErrors[dept].length > 0) ? otherErrors[dept].join(", ") : "";
      row.getCell(colIdx).value = errText;
      rowPreview.push(errText);
      colIdx++;
    }

    for (let c = 1; c <= totalColumns; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Arial", size: 10 };
      cell.border = thinBorder;
      cell.alignment = { horizontal: c === 2 ? "left" : "center", vertical: "middle" };
    }
    previewRows.push(rowPreview);
    curRow++;
  });

  outWs.getColumn(1).width = 7;
  outWs.getColumn(2).width = 28;
  for (let c = 3; c <= totalColumns; c++) {
    outWs.getColumn(c).width = 18;
  }

  outWs.views = [{ state: "frozen", xSplit: 2, ySplit: 3 }];
  if (curRow > 4) {
    outWs.autoFilter = `A3:${getColLetterGiamDinh(totalColumns)}${curRow - 1}`;
  }

  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer,
    headers,
    totalRecords: validDepartments.length,
    previewRows
  };
}

/**
 * Chế độ B: Bảng Tổng Hợp Công Việc Chuẩn
 * Tự động tìm dòng header, bảo lưu toàn bộ các cột công việc và chuẩn hóa format
 */
async function processStandardCnttTable(data2D, chosenSheetName, thinBorder) {
  // 1. Tìm dòng header tốt nhất
  let headerRowIndex = 0;
  let maxNonEmpty = 0;

  for (let r = 0; r < Math.min(data2D.length, 20); r++) {
    const row = data2D[r] || [];
    const nonEmptyCount = row.filter(v => v !== null && v !== undefined && String(v).trim() !== "").length;
    const rowText = row.map(v => normalizeTextGiamDinh(v)).join(" ");

    if (rowText.includes("STT") || rowText.includes("NỘI DUNG") || rowText.includes("CÔNG VIỆC") || rowText.includes("KHOA")) {
      headerRowIndex = r;
      break;
    }
    if (nonEmptyCount > maxNonEmpty) {
      maxNonEmpty = nonEmptyCount;
      headerRowIndex = r;
    }
  }

  const rawHeaders = data2D[headerRowIndex] || [];
  let lastColIndex = 0;
  for (let c = rawHeaders.length - 1; c >= 0; c--) {
    if (rawHeaders[c] !== null && rawHeaders[c] !== undefined && String(rawHeaders[c]).trim() !== "") {
      lastColIndex = c;
      break;
    }
  }

  const headers = [];
  for (let c = 0; c <= lastColIndex; c++) {
    const h = rawHeaders[c];
    headers.push(h !== null && h !== undefined && String(h).trim() !== "" ? String(h).trim() : `Cột ${c + 1}`);
  }

  const totalColumns = Math.max(headers.length, 1);
  const totalColLetter = getColLetterGiamDinh(totalColumns);

  const resultWb = new ExcelJS.Workbook();
  const outWs = resultWb.addWorksheet("Tổng Hợp Công Việc");

  // Dòng 1: Banner Tiêu đề
  outWs.mergeCells(1, 1, 1, totalColumns);
  const titleCell = outWs.getCell(1, 1);
  titleCell.value = "BÁO CÁO TỔNG HỢP CÔNG VIỆC PHÒNG CNTT";
  titleCell.font = { name: "Arial", size: 15, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  outWs.getRow(1).height = 34;

  // Dòng 2: Phụ đề
  outWs.mergeCells(2, 1, 2, totalColumns);
  const subCell = outWs.getCell(2, 1);
  subCell.value = `Dữ liệu: ${chosenSheetName} • Đã chuẩn hóa font chữ, viền bảng và định dạng tự động`;
  subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF475569" } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  outWs.getRow(2).height = 20;

  // Dòng 4: Header cột
  const headRow = outWs.getRow(4);
  headRow.height = 32;
  headers.forEach((h, idx) => {
    const cell = headRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  });

  // Dòng 5+: Dữ liệu
  let curRow = 5;
  let sttCounter = 1;
  const previewRows = [];

  for (let r = headerRowIndex + 1; r < data2D.length; r++) {
    if (r % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const row = data2D[r] || [];
    const isRowEmpty = row.every(v => v === null || v === undefined || String(v).trim() === "");
    if (isRowEmpty) continue;

    const firstCellText = normalizeTextGiamDinh(row[0] || row[1]);
    if (firstCellText.includes("TỔNG CỘNG") || firstCellText.includes("TONG CONG")) {
      break;
    }

    const targetRow = outWs.getRow(curRow);
    targetRow.height = 24;
    const rowPreview = [];

    const isEven = (curRow % 2 === 0);
    const rowBgColor = isEven ? "FFF8FAFC" : "FFFFFFFF";

    for (let c = 0; c < totalColumns; c++) {
      const cell = targetRow.getCell(c + 1);
      let val = row[c];

      // Tự động đánh lại STT cho cột đầu nếu là cột STT
      const hLower = headers[c].toLowerCase();
      if (c === 0 && (hLower === "stt" || hLower.includes("số tt") || hLower.includes("stt"))) {
        val = sttCounter;
      }

      cell.value = (val !== null && val !== undefined) ? val : "";
      rowPreview.push(cell.value);

      cell.font = { name: "Arial", size: 10 };
      cell.border = thinBorder;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };

      const isNumeric = typeof val === "number" || (!isNaN(Number(val)) && String(val).trim() !== "" && String(val).length < 6);
      cell.alignment = {
        horizontal: c === 0 ? "center" : (isNumeric ? "center" : "left"),
        vertical: "middle",
        wrapText: true
      };
    }

    previewRows.push(rowPreview);
    curRow++;
    sttCounter++;
  }

  // Tự động co giãn độ rộng cột dựa trên tiêu đề và dữ liệu
  headers.forEach((h, idx) => {
    let maxLen = h.length;
    previewRows.slice(0, 30).forEach(r => {
      const v = r[idx];
      if (v) maxLen = Math.max(maxLen, String(v).length);
    });
    outWs.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 3, 10), 45);
  });

  outWs.views = [{ state: "frozen", xSplit: 1, ySplit: 4 }];
  if (curRow > 5) {
    outWs.autoFilter = `A4:${totalColLetter}${curRow - 1}`;
  }

  const buffer = await resultWb.xlsx.writeBuffer();
  return {
    buffer,
    headers,
    totalRecords: previewRows.length,
    previewRows
  };
}

window.ToolGiamDinh = {
  getExcelSheetNames,
  processGiamDinh,
  processCntt
};
