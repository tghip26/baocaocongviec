/**
 * api/duty.js
 * Vercel Serverless Function - Đồng bộ dữ liệu Lịch Trực Phòng CNTT
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQzhi52oGxKo1nDsKiL4MHrw-7e-AwJC0",
  projectId: "congcunghiepvu"
};

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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { subpath } = req.query;

  // GET: Lấy dữ liệu
  if (req.method === "GET") {
    const firebaseBase = process.env.FIREBASE_URL;
    if (firebaseBase) {
      try {
        const fbUrl = `${firebaseBase.replace(/\/+$/, "")}/duty_roster.json`;
        const fbResp = await fetch(fbUrl);
        if (fbResp.ok) {
          const data = await fbResp.json();
          return res.status(200).json(data || inMemoryData);
        }
      } catch (e) {
        console.warn("Firebase fetch error:", e);
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

      const firebaseBase = process.env.FIREBASE_URL;
      if (firebaseBase) {
        try {
          const fbUrl = `${firebaseBase.replace(/\/+$/, "")}/duty_roster${subpath ? "/" + subpath : ""}.json`;
          await fetch(fbUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
        } catch (e) {
          console.warn("Firebase push error:", e);
        }
      }

      return res.status(200).json({ success: true, lastUpdated: inMemoryData.metadata.lastUpdated });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
