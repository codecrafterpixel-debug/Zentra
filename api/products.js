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
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json(data || []);
  }

  if (req.method === "POST") {
    const payload = req.body || {};
    if (!payload.name || !payload.category || !payload.description) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const product = {
      id: payload.id || crypto.randomBytes(8).toString("hex"),
      name: payload.name,
      category: payload.category,
      description: payload.description,
      price: Number(payload.price || 0),
      original_price: Number(payload.originalPrice || 0),
      stock: payload.stock || "instock",
      trending: Boolean(payload.trending),
      new_arrival: Boolean(payload.newArrival),
      images: payload.images || [],
      tags: payload.tags || [],
      sizes: payload.sizes || [],
      created_at: Number(payload.createdAt || Date.now()),
      updated_at: Number(payload.updatedAt || Date.now()),
    };

    const { error } = await supabase.from("products").insert(product);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  return res.status(405).json({ error: "Method not allowed" });
};
