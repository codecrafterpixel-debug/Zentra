const cors = require("cors");
const crypto = require("crypto");
const supabase = require("./supabaseClient");

const handler = async (req, res) => {
  const slug = Array.isArray(req.query.slug)
    ? req.query.slug
    : [req.query.slug];
  const [resource, id] = slug;

  if (!resource) {
    return res.status(404).json({ error: "Not found" });
  }

  if (resource === "health" && req.method === "GET") {
    return res.status(200).json({ status: "ok" });
  }

  if (!supabase) {
    return res.status(500).json({ error: "Supabase configuration not set." });
  }

  if (resource === "products") {
    if (req.method === "GET" && !id) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        return res.status(500).json({ error: error.message || error });
      }
      return res.status(200).json(data || []);
    }

    if (req.method === "POST" && !id) {
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

    if (id) {
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
        if ("updatedAt" in payload)
          updates.updated_at = Number(payload.updatedAt);

        const { error } = await supabase
          .from("products")
          .update(updates)
          .eq("id", id);
        if (error) {
          return res.status(500).json({ error: error.message || error });
        }
        return res.status(200).json({ ok: true });
      }

      if (req.method === "DELETE") {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) {
          return res.status(500).json({ error: error.message || error });
        }
        return res.status(200).json({ ok: true });
      }
    }
  }

  if (resource === "requests") {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message || error });
      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      if (!payload.userId || !payload.userName || !payload.productName || !payload.address) {
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
      if (error) return res.status(500).json({ error: error.message || error });
      return res.status(200).json({ ok: true, request });
    }

    if (req.method === "PATCH") {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      if (!payload.id) return res.status(400).json({ error: "missing request id" });
      const updates = { updated_at: Number(payload.updatedAt || Date.now()) };
      if ("status" in payload) updates.status = payload.status;
      if ("adminNotes" in payload) updates.adminNotes = payload.adminNotes;
      const { error } = await supabase.from("requests").update(updates).eq("id", payload.id);
      if (error) return res.status(500).json({ error: error.message || error });
      return res.status(200).json({ ok: true });
    }
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE, PATCH");
  return res.status(405).json({ error: "Method not allowed" });
};

module.exports = cors()(handler);
