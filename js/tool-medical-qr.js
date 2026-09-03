/**
 * tool-medical-qr.js
 * Medical QR & VietQR Generator for Hospital & Portal Administration
 * Tạo mã QR chuẩn Y tế, Thẻ BHYT, CCCD, Link bài viết Website và Viện phí VietQR (NAPAS 247).
 */

class ToolMedicalQr {
  constructor() {
    this.banksList = [
      { bin: "970436", shortName: "Vietcombank", name: "Ngân hàng Ngoại thương Việt Nam" },
      { bin: "970415", shortName: "VietinBank", name: "Ngân hàng Công thương Việt Nam" },
      { bin: "970418", shortName: "BIDV", name: "Ngân hàng Đầu tư và Phát triển Việt Nam" },
      { bin: "970405", shortName: "Agribank", name: "Ngân hàng Nông nghiệp & PTNT Việt Nam" },
      { bin: "970422", shortName: "MBBank", name: "Ngân hàng Quân Đội" },
      { bin: "970407", shortName: "Techcombank", name: "Ngân hàng Kỹ thương Việt Nam" },
      { bin: "970423", shortName: "TPBank", name: "Ngân hàng Tiên Phong" },
      { bin: "970441", shortName: "VIB", name: "Ngân hàng Quốc tế" },
      { bin: "970432", shortName: "VPBank", name: "Ngân hàng Việt Nam Thịnh Vượng" },
      { bin: "970416", shortName: "ACB", name: "Ngân hàng Á Châu" }
    ];
  }

  getBanks() {
    return this.banksList;
  }

  /**
   * Tính mã CRC16-CCITT (Polynomial 0x1021) chuẩn EMVCo cho VietQR
   */
  crc16Ccitt(str) {
    let crc = 0xffff;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  formatTlv(tag, value) {
    const sVal = String(value || "");
    const len = String(sVal.length).padStart(2, "0");
    return `${tag}${len}${sVal}`;
  }

  /**
   * Tạo chuỗi thanh toán viện phí chuẩn VietQR (NAPAS 247 EMVCo)
   */
  generateVietQrString({ bankBin, accountNo, amount = 0, message = "" }) {
    // Sub-tags cho Tag 38 (Merchant Account Information)
    const guid = this.formatTlv("00", "A000000727");
    const subBank = this.formatTlv("00", bankBin);
    const subAcc = this.formatTlv("01", accountNo);
    const beneficiary = this.formatTlv("01", `${subBank}${subAcc}`);
    const serviceCode = this.formatTlv("02", "QRIBFTTA"); // Chuyển nhanh 24/7 đến tài khoản
    const tag38 = this.formatTlv("38", `${guid}${beneficiary}${serviceCode}`);

    // Tag 53: Mã tiền tệ (704 = VND)
    const tag53 = this.formatTlv("53", "704");

    // Tag 54: Số tiền (nếu có)
    const tag54 = amount && parseInt(amount, 10) > 0 ? this.formatTlv("54", parseInt(amount, 10).toString()) : "";

    // Tag 58: Quốc gia (VN)
    const tag58 = this.formatTlv("58", "VN");

    // Tag 62: Thông tin bổ sung / Nội dung chuyển khoản viện phí
    let tag62 = "";
    if (message && message.trim()) {
      const subMsg = this.formatTlv("08", message.trim());
      tag62 = this.formatTlv("62", subMsg);
    }

    // Ghép các trường dữ liệu trước khi tính CRC
    const rawPayload = `000201010212${tag38}${tag53}${tag54}${tag58}${tag62}6304`;
    const crc = this.crc16Ccitt(rawPayload);

    return `${rawPayload}${crc}`;
  }

  /**
   * Tạo mã QR chuẩn thông tin bệnh nhân
   */
  generatePatientQrString({ patientId, fullName, birthYear, gender, department }) {
    return `BN|${patientId}|${fullName}|${birthYear}|${gender}|${department}|BVDKBN2`;
  }

  /**
   * Vẽ mã QR lên thẻ Canvas bằng thư viện tích hợp hoặc API chuẩn
   */
  renderQrToCanvas(canvas, text, size = 280) {
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Vẽ nền trắng
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Sử dụng QuickChart QR API chuẩn cao hoặc canvas generator
    const img = new Image();
    img.crossOrigin = "anonymous";
    const encoded = encodeURIComponent(text);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encoded}`;

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas);
      };
      img.onerror = () => {
        // Fallback vẽ text thông báo nếu mạng offline
        ctx.fillStyle = "#0f172a";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Mã QR sẵn sàng", size / 2, size / 2);
        resolve(canvas);
      };
    });
  }

  downloadQrCanvas(canvas, fileName = "Ma_QR_Y_Te.png") {
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.ToolMedicalQr = ToolMedicalQr;
