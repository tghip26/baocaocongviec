/**
 * api/duty.js
 * Vercel Serverless Function - Đồng bộ dữ liệu Lịch Trực Phòng CNTT & Firebase Bridge
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQzhi52oGxKo1nDsKiL4MHrw-7e-AwJC0",
  projectId: "congcunghiepvu"
};

const RTDB_CANDIDATES = [
  process.env.FIREBASE_URL,
  "https://congcunghiepvu-default-rtdb.asia-southeast1.firebasedatabase.app",
  "https://congcunghiepvu-default-rtdb.firebaseio.com",
  "https://congcunghiepvu.firebaseio.com"
].filter(Boolean);

let inMemoryData = {
  metadata: {
    lastUpdated: new Date().toISOString(),
    updatedBy: "system",
    updaterName: "Firebase Bridge (congcunghiepvu)",
    version: "3.2.0"
  },
  staffList: [],
  accounts: [],
  schedules: {}
};

// Tìm endpoint Firebase Realtime Database đang hoạt động
async function findActiveFirebaseUrl() {
  for (const base of RTDB_CANDIDATES) {
    const cleanBase = base.replace(/\/+$/, "");
    const testUrl = `${cleanBase}/.json?shallow=true`;
    try {
      const resp = await fetch(testUrl, { method: "GET", headers: { "Accept": "application/json" } });
      if (resp.status !== 404) {
        return cleanBase;
      }
    } catch (e) {}
  }
  return null;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { subpath, action } = req.query;

  // Endpoint kiểm tra trạng thái kết nối
  if (action === "ping") {
    const activeRtdb = await findActiveFirebaseUrl();
    return res.status(200).json({
      status: "online",
      projectId: FIREBASE_CONFIG.projectId,
      activeRealtimeDb: activeRtdb || "Chưa tạo cơ sở dữ liệu trên Firebase Console",
      inMemoryTimestamp: inMemoryData.metadata.lastUpdated
    });
  }

  // GET: Lấy dữ liệu lịch trực
  if (req.method === "GET") {
    const activeRtdb = await findActiveFirebaseUrl();
    if (activeRtdb) {
      try {
        const fbUrl = `${activeRtdb}/duty_roster.json`;
        const fbResp = await fetch(fbUrl);
        if (fbResp.ok) {
          const data = await fbResp.json();
          if (data && typeof data === "object") {
            // Đồng bộ ngược vào cache bộ nhớ
            if (data.staffList) inMemoryData.staffList = data.staffList;
            if (data.accounts) inMemoryData.accounts = data.accounts;
            if (data.schedules) inMemoryData.schedules = data.schedules;
            if (data.metadata) inMemoryData.metadata = data.metadata;
            return res.status(200).json(data);
          }
        }
      } catch (e) {
        console.warn("Firebase RTDB fetch error:", e);
      }
    }
    return res.status(200).json(inMemoryData);
  }

  // PUT / POST: Cập nhật dữ liệu
  if (req.method === "PUT" || req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      if (!body) {
        return res.status(400).json({ error: "Dữ liệu gửi lên không hợp lệ" });
      }

      if (subpath === "staffList" && Array.isArray(body)) {
        inMemoryData.staffList = body;
      } else if (subpath === "accounts" && Array.isArray(body)) {
        inMemoryData.accounts = body;
      } else if (subpath && subpath.startsWith("schedules/")) {
        const monthKey = subpath.replace("schedules/", "");
        inMemoryData.schedules[monthKey] = body;
      } else if (typeof body === "object") {
        if (body.staffList) inMemoryData.staffList = body.staffList;
        if (body.accounts) inMemoryData.accounts = body.accounts;
        if (body.schedules) {
          inMemoryData.schedules = { ...inMemoryData.schedules, ...body.schedules };
        }
        if (body.metadata) inMemoryData.metadata = body.metadata;
      }

      inMemoryData.metadata.lastUpdated = new Date().toISOString();

      // Đẩy lên Firebase Realtime Database nếu đã kích hoạt
      const activeRtdb = await findActiveFirebaseUrl();
      if (activeRtdb) {
        try {
          const fbUrl = `${activeRtdb}/duty_roster${subpath ? "/" + subpath : ""}.json`;
          await fetch(fbUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
        } catch (e) {
          console.warn("Firebase RTDB push error:", e);
        }
      }

      return res.status(200).json({
        success: true,
        lastUpdated: inMemoryData.metadata.lastUpdated,
        activeRtdb: activeRtdb || "in-memory"
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
