import express from "express";
const app = express();
app.get("/api/test", (req, res) => res.json({ ok: true }));
app.get("*", (req, res) => res.send("<h1>Server is running</h1>"));
app.listen(3000, "0.0.0.0", () => console.log("Simple server on 3000"));
