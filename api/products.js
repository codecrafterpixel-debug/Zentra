const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

app.get("/health", async (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/products", async (_req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/products", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const {
      id,
      name,
      category,
      description,
      price,
      originalPrice,
      stock,
      trending,
      newArrival,
      images,
      tags,
      sizes,
      createdAt,
      updatedAt,
    } = req.body;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC DEFAULT 0,
        stock TEXT DEFAULT 'instock',
        trending BOOLEAN DEFAULT FALSE,
        new_arrival BOOLEAN DEFAULT FALSE,
        images JSONB DEFAULT '[]'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        sizes JSONB DEFAULT '[]'::jsonb,
        created_at BIGINT DEFAULT 0,
        updated_at BIGINT DEFAULT 0
      )
    `);
    await pool.query(
      `
      INSERT INTO products (id, name, category, description, price, original_price, stock, trending, new_arrival, images, tags, sizes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING
    `,
      [
        id,
        name,
        category,
        description,
        price,
        originalPrice || 0,
        stock || "instock",
        trending || false,
        newArrival || false,
        JSON.stringify(images || []),
        JSON.stringify(tags || []),
        JSON.stringify(sizes || []),
        createdAt || Date.now(),
        updatedAt || Date.now(),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save product" });
  }
});

app.put("/products/:id", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      price,
      originalPrice,
      stock,
      trending,
      newArrival,
      images,
      tags,
      sizes,
      updatedAt,
    } = req.body;
    await pool.query(
      `
      UPDATE products
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          original_price = COALESCE($5, original_price),
          stock = COALESCE($6, stock),
          trending = COALESCE($7, trending),
          new_arrival = COALESCE($8, new_arrival),
          images = COALESCE($9, images),
          tags = COALESCE($10, tags),
          sizes = COALESCE($11, sizes),
          updated_at = COALESCE($12, updated_at)
      WHERE id = $13
    `,
      [
        name,
        category,
        description,
        price,
        originalPrice,
        stock,
        trending,
        newArrival,
        JSON.stringify(images || []),
        JSON.stringify(tags || []),
        JSON.stringify(sizes || []),
        updatedAt || Date.now(),
        id,
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/products/:id", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

const requestedPort = Number(process.env.PORT || 3001);
const port =
  Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`API running on port ${port}`);
});
