const supabase = require("../supabaseClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase configuration not set." });
  }

  const productId = req.query.product_id;
  if (!productId) {
    return res.status(400).json({ error: "Missing product_id" });
  }

  if (req.method === "PUT") {
    const payload = req.body || {};
    const updates = {};

    if ("name" in payload) updates.name = payload.name;
    if ("category" in payload) updates.category = payload.category;
    if ("description" in payload) updates.description = payload.description;
    if ("price" in payload) updates.price = Number(payload.price);
    if ("originalPrice" in payload)
      updates.original_price = Number(payload.originalPrice);
    if ("stock" in payload) updates.stock = payload.stock;
    if ("trending" in payload) updates.trending = Boolean(payload.trending);
    if ("newArrival" in payload)
      updates.new_arrival = Boolean(payload.newArrival);
    if ("images" in payload) updates.images = payload.images;
    if ("tags" in payload) updates.tags = payload.tags;
    if ("sizes" in payload) updates.sizes = payload.sizes;
    if ("updatedAt" in payload) updates.updated_at = Number(payload.updatedAt);

    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Allow", "PUT, DELETE, OPTIONS");
  return res.status(405).json({ error: "Method not allowed" });
};

module.exports = corsMiddleware(handler);
