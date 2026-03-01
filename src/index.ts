import express, { Request, Response } from "express";
import sequelize from "./database";
import { identify } from "./services/identify";

const app = express();
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitespeed Identity Reconciliation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: #1e293b; border-radius: 16px; padding: 40px; max-width: 520px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    h1 { font-size: 1.5rem; margin-bottom: 8px; color: #38bdf8; }
    p.subtitle { font-size: 0.9rem; color: #94a3b8; margin-bottom: 28px; }
    label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; margin-top: 16px; }
    input { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; font-size: 1rem; outline: none; transition: border 0.2s; }
    input:focus { border-color: #38bdf8; }
    button { margin-top: 24px; width: 100%; padding: 14px; border: none; border-radius: 8px; background: #38bdf8; color: #0f172a; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #7dd3fc; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result { margin-top: 24px; background: #0f172a; border-radius: 8px; padding: 16px; display: none; }
    .result h3 { font-size: 0.85rem; color: #38bdf8; margin-bottom: 10px; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-size: 0.85rem; color: #a5f3fc; }
    .error { color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Bitespeed Identity Reconciliation</h1>
    <p class="subtitle">Enter an email and/or phone number to identify a contact.</p>
    <form id="form">
      <label for="email">Email</label>
      <input type="email" id="email" placeholder="e.g. test@example.com">
      <label for="phone">Phone Number</label>
      <input type="text" id="phone" placeholder="e.g. 1234567890">
      <button type="submit" id="btn">Identify</button>
    </form>
    <div class="result" id="result">
      <h3>Response</h3>
      <pre id="output"></pre>
    </div>
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      if (!email && !phone) { alert('Please enter at least one field.'); return; }
      const btn = document.getElementById('btn');
      btn.disabled = true; btn.textContent = 'Loading...';
      try {
        const res = await fetch('/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || null, phoneNumber: phone || null })
        });
        const data = await res.json();
        const out = document.getElementById('output');
        const box = document.getElementById('result');
        box.style.display = 'block';
        out.className = res.ok ? '' : 'error';
        out.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        const box = document.getElementById('result');
        box.style.display = 'block';
        document.getElementById('output').className = 'error';
        document.getElementById('output').textContent = err.message;
      } finally {
        btn.disabled = false; btn.textContent = 'Identify';
      }
    });
  </script>
</body>
</html>
  `);
});

app.post("/identify", async (req: Request, res: Response) => {
  try {
    const result = await identify(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

export default app;
