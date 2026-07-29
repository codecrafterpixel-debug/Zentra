const cors = require("cors");

const corsMiddleware = cors({
  origin: true,
  methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

const handler = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ status: "ok" });
};

module.exports = corsMiddleware(handler);
