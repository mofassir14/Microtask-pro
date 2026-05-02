import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import dotenv from "dotenv";

import { generateSecret, generateURI, verifySync } from "otplib";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as QRCode from "qrcode";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting MicroTask Pro Server...");
  
  const app = express();
  const PORT = 3000;
  let db: any;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check for debugging
  app.get("/api/ping", (req, res) => {
    console.log("Ping received");
    res.json({ status: "pong", timestamp: new Date().toISOString() });
  });

  app.get("/api/debug/schema", (req, res) => {
    try {
      const usersInfo = db.prepare("PRAGMA table_info(users)").all();
      res.json({ users: usersInfo });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Database setup
  console.log("Initializing database...");
  try {
    let dbPath = process.env.DATABASE_URL || "database.sqlite";
    
    // If it looks like a connection string (e.g. postgres://), fallback to local sqlite
    if (dbPath.includes("://")) {
      console.warn("DATABASE_URL looks like a connection string, but better-sqlite3 requires a file path. Falling back to database.sqlite");
      dbPath = "database.sqlite";
    }
    
    const absoluteDbPath = path.resolve(__dirname, dbPath);
    console.log(`Database path: ${absoluteDbPath}`);
    db = new Database(absoluteDbPath);
    console.log("Database initialized.");
  } catch (err: any) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }

  console.log("Setting up database schema...");
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        balance REAL DEFAULT 0,
        total_earned REAL DEFAULT 0,
        total_deposited REAL DEFAULT 0,
        total_withdrawn REAL DEFAULT 0,
        completed_tasks INTEGER DEFAULT 0,
        reputation INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        referral_code TEXT UNIQUE,
        referred_by INTEGER,
        status TEXT DEFAULT 'active',
        two_factor_enabled INTEGER DEFAULT 0,
        two_factor_secret TEXT,
        email_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure 2FA columns exist if table was created before
    try {
      db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      db.exec("ALTER TABLE users ADD COLUMN two_factor_secret TEXT");
    } catch (e) {}
    try {
      db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      db.exec("ALTER TABLE users ADD COLUMN verification_token TEXT");
    } catch (e) {}

    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        reward REAL NOT NULL,
        total_slots INTEGER NOT NULL,
        completed_slots INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS proofs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        user_id INTEGER,
        proof_text TEXT,
        proof_image TEXT,
        status TEXT DEFAULT 'pending',
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_id) REFERENCES jobs(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT, -- 'deposit', 'withdrawal', 'reward', 'referral'
        amount REAL,
        status TEXT DEFAULT 'pending',
        method TEXT,
        sender_number TEXT,
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    console.log("Database schema setup complete.");
  } catch (err) {
    console.error("Database schema setup failed:", err);
    process.exit(1);
  }

  // Seed Admin and Settings
  console.log("Seeding admin and settings...");
  try {
    const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10);
      db.prepare("INSERT INTO users (name, email, password, role, referral_code) VALUES (?, ?, ?, ?, ?)")
        .run("Admin", process.env.ADMIN_EMAIL || "admin@microtask.pro", hashedPassword, "admin", "ADMIN001");
      console.log("Admin user seeded.");
    }

    const seedSettings = [
      ['min_withdrawal', '10'],
      ['min_deposit', '5'],
      ['referral_commission', '5'],
      ['site_name', 'MicroTask Pro'],
    ];

    seedSettings.forEach(([key, value]) => {
      db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    });
    console.log("Settings seeded.");

    // Seed Initial Jobs
    const jobsCount = db.prepare("SELECT COUNT(*) as count FROM jobs").get().count;
    if (jobsCount === 0) {
      const initialJobs = [
        ["YouTube Subscribe & Like", "Subscribe to the channel and like the latest video. Provide screenshot as proof.", "YouTube", 0.05, 100],
        ["Facebook Page Follow", "Follow our official Facebook page and like the pinned post.", "Facebook", 0.03, 200],
        ["App Installation & Review", "Download our app from Play Store, install it, and leave a 5-star review.", "App Install", 0.25, 50],
        ["Quick Survey", "Complete a 2-minute survey about online shopping habits.", "Survey", 0.10, 150],
        ["Watch Video Ads", "Watch 5 short video ads completely.", "Ads", 0.02, 500],
      ];

      const insertJob = db.prepare("INSERT INTO jobs (title, description, category, reward, total_slots) VALUES (?, ?, ?, ?, ?)");
      initialJobs.forEach(job => insertJob.run(...job));
      console.log("Initial jobs seeded.");
    }
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }

  // Ensure transactions table has new columns
  console.log("Ensuring transaction columns exist...");
  try {
    db.prepare("ALTER TABLE transactions ADD COLUMN sender_number TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE transactions ADD COLUMN transaction_id TEXT").run();
  } catch (e) {}
  
  // Ensure users table has new columns
  try {
    db.prepare("ALTER TABLE users ADD COLUMN completed_tasks INTEGER DEFAULT 0").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE users ADD COLUMN reputation INTEGER DEFAULT 0").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE users ADD COLUMN total_withdrawn REAL DEFAULT 0").run();
  } catch (e) {}
  console.log("Database columns check complete.");

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    next();
  };

  const hasRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  // --- API Routes ---
  console.log("Registering API routes...");
  // ... (rest of the routes)

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, referralCode } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    
    try {
      // Check if email already exists
      const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email address already registered. Please use a different email or sign in." });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      let referredBy = null;
      if (referralCode) {
        const referrer = db.prepare("SELECT id FROM users WHERE referral_code = ?").get(referralCode);
        if (referrer) referredBy = referrer.id;
      }
      const result = db.prepare("INSERT INTO users (name, email, password, referral_code, referred_by, email_verified) VALUES (?, ?, ?, ?, ?, ?)")
        .run(name, email, hashedPassword, myReferralCode, referredBy, 1);
      
      res.json({ success: true, userId: result.lastInsertRowid, message: "Registration successful" });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed: users.email")) {
        return res.status(400).json({ error: "Email address already registered." });
      }
      res.status(400).json({ error: "An error occurred during registration. Please try again." });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
    
    if (user.two_factor_enabled) {
      return res.json({ 
        twoFactorRequired: true, 
        userId: user.id 
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "secret");
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, two_factor_enabled: !!user.two_factor_enabled } });
  });

  app.post("/api/auth/2fa/verify-login", (req, res) => {
    const { userId, code } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const verified = verifySync({
      token: code,
      secret: user.two_factor_secret
    });

    if (!verified) return res.status(401).json({ error: "Invalid 2FA code" });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "secret");
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, two_factor_enabled: !!user.two_factor_enabled } });
  });

  app.post("/api/auth/2fa/setup", authenticate, async (req: any, res) => {
    console.log("2FA Setup initiated for user:", req.user.id);
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.two_factor_enabled) return res.status(400).json({ error: "2FA is already enabled" });

      const secret = generateSecret();
      console.log("Secret generated:", secret);

      console.log("Generating keyuri...");
      const otpauth = generateURI({
        issuer: "MicroTask Pro",
        label: user.email,
        secret: secret
      });
      console.log("OTPAuth URI generated");

      console.log("Generating QR Code...");
      if (!QRCode) {
        throw new Error("QRCode is not initialized correctly");
      }
      const qrCode = await QRCode.toDataURL(otpauth);
      console.log("QR Code generated");

      // Temporarily store secret in user record (not enabled yet)
      console.log("Updating user record with secret...");
      db.prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?").run(secret, user.id);
      console.log("User record updated");

      res.json({ secret, qrCode });
    } catch (err: any) {
      console.error("2FA Setup Error:", err);
      res.status(500).json({ 
        error: "Internal server error during 2FA setup", 
        details: err.message,
        stack: err.stack
      });
    }
  });

  app.post("/api/auth/2fa/enable", authenticate, (req: any, res) => {
    const { code } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.two_factor_secret) return res.status(400).json({ error: "2FA setup not initiated" });

    const verified = verifySync({
      token: code,
      secret: user.two_factor_secret
    });

    if (!verified) return res.status(401).json({ error: "Invalid 2FA code" });

    db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?").run(user.id);
    res.json({ success: true });
  });

  app.post("/api/auth/2fa/disable", authenticate, (req: any, res) => {
    const { code } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.two_factor_enabled) return res.status(400).json({ error: "2FA is not enabled" });

    const verified = verifySync({
      token: code,
      secret: user.two_factor_secret
    });

    if (!verified) return res.status(401).json({ error: "Invalid 2FA code" });

    db.prepare("UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?").run(user.id);
    res.json({ success: true });
  });

  app.post("/api/auth/change-password", authenticate, (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedNewPassword, user.id);
    
    res.json({ success: true });
  });

  app.get("/api/user/profile", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, role, balance, total_earned, total_deposited, completed_tasks, reputation, level, referral_code, status, two_factor_enabled FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, two_factor_enabled: !!user.two_factor_enabled });
  });

  app.get("/api/user/activity", authenticate, (req: any, res) => {
    try {
      const transactions = db.prepare(`
        SELECT 'transaction' as type, type as sub_type, amount, status, created_at, NULL as job_title 
        FROM transactions 
        WHERE user_id = ?
      `).all(req.user.id);
      
      const proofs = db.prepare(`
        SELECT 'proof' as type, p.status as sub_type, j.reward as amount, p.created_at, j.title as job_title 
        FROM proofs p
        JOIN jobs j ON p.job_id = j.id
        WHERE p.user_id = ?
      `).all(req.user.id);
      
      const activity = [...transactions, ...proofs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
        
      res.json(activity);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.get("/api/jobs", authenticate, (req, res) => {
    const jobs = db.prepare("SELECT * FROM jobs WHERE status = 'active'").all();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", authenticate, (req, res) => {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    res.json(job);
  });

  app.post("/api/jobs/submit-proof", authenticate, (req: any, res) => {
    const { jobId, proofText, proofImage } = req.body;
    const existing = db.prepare("SELECT id FROM proofs WHERE job_id = ? AND user_id = ?").get(jobId, req.user.id);
    if (existing) return res.status(400).json({ error: "Proof already submitted for this job" });
    db.prepare("INSERT INTO proofs (job_id, user_id, proof_text, proof_image) VALUES (?, ?, ?, ?)")
      .run(jobId, req.user.id, proofText, proofImage);
    res.json({ success: true });
  });

  // Transactions
  app.post("/api/transactions/deposit", authenticate, (req: any, res) => {
    const { amount, method, senderNumber, transactionId } = req.body;
    db.prepare("INSERT INTO transactions (user_id, type, amount, method, sender_number, transaction_id, status) VALUES (?, 'deposit', ?, ?, ?, ?, 'pending')")
      .run(req.user.id, amount, method, senderNumber, transactionId);
    res.json({ success: true });
  });

  app.post("/api/transactions/withdraw", authenticate, (req: any, res) => {
    const { amount, method } = req.body;
    const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
    const minWithdraw = db.prepare("SELECT value FROM settings WHERE key = 'min_withdrawal'").get().value;
    if (amount < parseFloat(minWithdraw)) return res.status(400).json({ error: `Minimum withdrawal is $${minWithdraw}` });
    if (user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
    
    db.transaction(() => {
      // Deduct balance immediately
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, req.user.id);
      // Record transaction
      db.prepare("INSERT INTO transactions (user_id, type, amount, method, status) VALUES (?, 'withdrawal', ?, ?, 'pending')")
        .run(req.user.id, amount, method);
    })();
    
    res.json({ success: true });
  });

  app.get("/api/transactions/history", authenticate, (req: any, res) => {
    const history = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(history);
  });

  // --- Admin Routes ---
  app.get("/api/admin/stats", authenticate, isAdmin, (req, res) => {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    const totalJobs = db.prepare("SELECT COUNT(*) as count FROM jobs").get().count;
    const totalDeposits = db.prepare("SELECT SUM(amount) as sum FROM transactions WHERE type = 'deposit' AND status = 'approved'").get().sum || 0;
    const totalWithdrawals = db.prepare("SELECT SUM(amount) as sum FROM transactions WHERE type = 'withdrawal' AND status = 'approved'").get().sum || 0;
    const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'withdrawal' AND status = 'pending'").get().count;
    const pendingDeposits = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'deposit' AND status = 'pending'").get().count;
    res.json({ totalUsers, totalJobs, totalDeposits, totalWithdrawals, pendingWithdrawals, pendingDeposits });
  });

  app.get("/api/admin/users", authenticate, isAdmin, (req, res) => {
    const users = db.prepare("SELECT * FROM users WHERE role = 'user'").all();
    res.json(users);
  });

  app.post("/api/admin/users/:id/status", authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/balance", authenticate, isAdmin, (req, res) => {
    const { amount, type } = req.body;
    if (type === 'add') {
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, req.params.id);
    } else {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, req.params.id);
    }
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/role", authenticate, isAdmin, (req, res) => {
    const { role } = req.body;
    const allowedRoles = ['basic', 'premium', 'support', 'admin', 'user'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/jobs", authenticate, isAdmin, (req, res) => {
    const { title, description, category, reward, totalSlots } = req.body;
    db.prepare("INSERT INTO jobs (title, description, category, reward, total_slots) VALUES (?, ?, ?, ?, ?)")
      .run(title, description, category, reward, totalSlots);
    res.json({ success: true });
  });

  app.patch("/api/admin/jobs/:id/status", authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    if (status !== 'active' && status !== 'inactive') return res.status(400).json({ error: "Invalid status" });
    db.prepare("UPDATE jobs SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/jobs/:id", authenticate, isAdmin, (req, res) => {
    // Check if there are any proofs for this job before deleting
    const proofs = db.prepare("SELECT COUNT(*) as count FROM proofs WHERE job_id = ?").get(req.params.id).count;
    if (proofs > 0) {
      // If there are proofs, we should probably just deactivate it instead of deleting
      // but if the admin really wants to delete, we could. 
      // For safety, let's just allow deletion but warn or handle it.
      // Actually, better to just delete if requested, or handle foreign keys.
      // The schema has FOREIGN KEY(job_id) REFERENCES jobs(id).
      // So we might need to delete proofs first or use ON DELETE CASCADE (which isn't in schema).
      return res.status(400).json({ error: "Cannot delete job with existing submissions. Deactivate it instead." });
    }
    db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/proofs", authenticate, isAdmin, (req, res) => {
    const proofs = db.prepare(`
      SELECT p.*, u.name as user_name, j.title as job_title, j.reward 
      FROM proofs p 
      JOIN users u ON p.user_id = u.id 
      JOIN jobs j ON p.job_id = j.id 
      WHERE p.status = 'pending'
    `).all();
    res.json(proofs);
  });

  app.post("/api/admin/proofs/:id/approve", authenticate, isAdmin, (req, res) => {
    const proof = db.prepare("SELECT * FROM proofs WHERE id = ?").get(req.params.id);
    if (!proof || proof.status !== 'pending') return res.status(400).json({ error: "Invalid proof" });
    const job = db.prepare("SELECT reward FROM jobs WHERE id = ?").get(proof.job_id);
    db.transaction(() => {
      db.prepare("UPDATE proofs SET status = 'approved' WHERE id = ?").run(req.params.id);
      
      // Update user stats
      db.prepare("UPDATE users SET balance = balance + ?, total_earned = total_earned + ?, completed_tasks = completed_tasks + 1, reputation = reputation + 10 WHERE id = ?").run(job.reward, job.reward, proof.user_id);
      
      // Level up logic
      const userStats = db.prepare("SELECT completed_tasks FROM users WHERE id = ?").get(proof.user_id);
      let newLevel = 1;
      if (userStats.completed_tasks >= 100) newLevel = 6;
      else if (userStats.completed_tasks >= 50) newLevel = 5;
      else if (userStats.completed_tasks >= 30) newLevel = 4;
      else if (userStats.completed_tasks >= 15) newLevel = 3;
      else if (userStats.completed_tasks >= 5) newLevel = 2;
      
      db.prepare("UPDATE users SET level = ? WHERE id = ?").run(newLevel, proof.user_id);

      db.prepare("UPDATE jobs SET completed_slots = completed_slots + 1 WHERE id = ?").run(proof.job_id);
      const user = db.prepare("SELECT referred_by FROM users WHERE id = ?").get(proof.user_id);
      if (user.referred_by) {
        const commissionPercent = parseFloat(db.prepare("SELECT value FROM settings WHERE key = 'referral_commission'").get().value);
        const commission = (job.reward * commissionPercent) / 100;
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(commission, user.referred_by);
        db.prepare("INSERT INTO transactions (user_id, type, amount, status) VALUES (?, 'referral', ?, 'approved')").run(user.referred_by, commission);
      }
    })();
    res.json({ success: true });
  });

  app.post("/api/admin/proofs/:id/reject", authenticate, isAdmin, (req, res) => {
    const { reason } = req.body;
    db.prepare("UPDATE proofs SET status = 'rejected', rejection_reason = ? WHERE id = ?").run(reason, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/transactions", authenticate, isAdmin, (req, res) => {
    const txs = db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `).all();
    res.json(txs);
  });

  app.post("/api/admin/transactions/:id/approve", authenticate, isAdmin, (req, res) => {
    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!tx || tx.status !== 'pending') return res.status(400).json({ error: "Invalid transaction" });
    db.transaction(() => {
      db.prepare("UPDATE transactions SET status = 'approved' WHERE id = ?").run(req.params.id);
      if (tx.type === 'deposit') {
        db.prepare("UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?").run(tx.amount, tx.amount, tx.user_id);
      } else if (tx.type === 'withdrawal') {
        db.prepare("UPDATE users SET total_withdrawn = total_withdrawn + ? WHERE id = ?").run(tx.amount, tx.user_id);
      }
      // Withdrawal balance was already deducted on request
    })();
    res.json({ success: true });
  });

  app.post("/api/admin/transactions/:id/reject", authenticate, isAdmin, (req, res) => {
    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!tx || tx.status !== 'pending') return res.status(400).json({ error: "Invalid transaction" });
    db.transaction(() => {
      db.prepare("UPDATE transactions SET status = 'rejected' WHERE id = ?").run(req.params.id);
      if (tx.type === 'withdrawal') {
        // Refund balance if withdrawal is rejected
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(tx.amount, tx.user_id);
      }
    })();
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/admin/settings", authenticate, isAdmin, (req, res) => {
    const { settings } = req.body;
    Object.entries(settings).forEach(([key, value]) => {
      db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(value, key);
    });
    res.json({ success: true });
  });

  app.get("/api/admin/settings", authenticate, isAdmin, (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist/...");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      const indexPath = path.join(__dirname, "dist", "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("dist/index.html not found. Please run build.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});
