import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "zentra")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")


def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        cursor_factory=RealDictCursor,
    )


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/products")
def get_products():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
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
        """
    )
    conn.commit()
    cur.execute("SELECT * FROM products ORDER BY created_at DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.post("/products")
def add_product():
    payload = request.get_json(silent=True) or {}
    if not payload.get("name") or not payload.get("category") or not payload.get("description"):
        return jsonify({"error": "missing required fields"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO products (
            id, name, category, description, price, original_price, stock,
            trending, new_arrival, images, tags, sizes, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            payload.get("id") or os.urandom(8).hex(),
            payload["name"],
            payload["category"],
            payload["description"],
            float(payload.get("price", 0)),
            float(payload.get("originalPrice", 0) or 0),
            payload.get("stock", "instock"),
            bool(payload.get("trending", False)),
            bool(payload.get("newArrival", False)),
            json.dumps(payload.get("images", [])),
            json.dumps(payload.get("tags", [])),
            json.dumps(payload.get("sizes", [])),
            int(payload.get("createdAt") or 0),
            int(payload.get("updatedAt") or 0),
        ),
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"ok": True})


@app.put("/products/<product_id>")
def update_product(product_id):
    payload = request.get_json(silent=True) or {}
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE products
        SET name = COALESCE(%s, name),
            category = COALESCE(%s, category),
            description = COALESCE(%s, description),
            price = COALESCE(%s, price),
            original_price = COALESCE(%s, original_price),
            stock = COALESCE(%s, stock),
            trending = COALESCE(%s, trending),
            new_arrival = COALESCE(%s, new_arrival),
            images = COALESCE(%s, images),
            tags = COALESCE(%s, tags),
            sizes = COALESCE(%s, sizes),
            updated_at = %s
        WHERE id = %s
        """,
        (
            payload.get("name"),
            payload.get("category"),
            payload.get("description"),
            float(payload["price"]) if "price" in payload else None,
            float(payload["originalPrice"]) if "originalPrice" in payload else None,
            payload.get("stock"),
            payload.get("trending"),
            payload.get("newArrival"),
            json.dumps(payload.get("images")) if "images" in payload else None,
            json.dumps(payload.get("tags")) if "tags" in payload else None,
            json.dumps(payload.get("sizes")) if "sizes" in payload else None,
            int(payload.get("updatedAt") or 0),
            product_id,
        ),
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"ok": True})


@app.delete("/products/<product_id>")
def delete_product(product_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
