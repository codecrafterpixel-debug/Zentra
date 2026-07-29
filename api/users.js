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
      .from("users")
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
      !payload.name ||
      !payload.email ||
      !payload.phone ||
      !payload.password
    ) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const user = {
      id: payload.id || crypto.randomBytes(8).toString("hex"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      created_at: Number(payload.createdAt || Date.now()),
    };

    const { error } = await supabase.from("users").insert(user);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true, user });
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  return res.status(405).json({ error: "Method not allowed" });
};
