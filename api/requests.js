const crypto = require("crypto");
const supabase = require("./supabaseClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase configuration not set." });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json(data || []);
  }

  if (req.method === "POST") {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (
      !payload.userId ||
      !payload.userName ||
      !payload.productName ||
      !payload.address
    ) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const request = {
      id: payload.id || crypto.randomBytes(8).toString("hex"),
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail || "",
      userPhone: payload.userPhone || "",
      productName: payload.productName,
      description: payload.description || "",
      size: payload.size || "",
      quantity: Number(payload.quantity || 1),
      address: payload.address,
      status: payload.status || "pending",
      adminNotes: payload.adminNotes || "",
      created_at: Number(payload.createdAt || Date.now()),
      updated_at: Number(payload.updatedAt || Date.now()),
    };

    const { error } = await supabase.from("requests").insert(request);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true, request });
  }

  if (req.method === "PATCH") {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (!payload.id) {
      return res.status(400).json({ error: "missing request id" });
    }

    const updates = {};
    if ("status" in payload) updates.status = payload.status;
    if ("adminNotes" in payload) updates.admin_notes = payload.adminNotes;
    if ("updatedAt" in payload) updates.updated_at = Number(payload.updatedAt);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "nothing to update" });
    }

    const { error } = await supabase
      .from("requests")
      .update(updates)
      .eq("id", payload.id);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  return res.status(405).json({ error: "Method not allowed" });
};
