import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new Database(dbPath);

const email = "admin@microtask.pro";
const newPassword = "admin123456";
const hashedPassword = bcrypt.hashSync(newPassword, 10);

const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

if (user) {
  db.prepare("UPDATE users SET password = ?, role = 'admin' WHERE email = ?").run(hashedPassword, email);
  console.log(`Admin password reset for ${email}. New password: ${newPassword}`);
} else {
  db.prepare("INSERT INTO users (name, email, password, role, referral_code) VALUES (?, ?, ?, ?, ?)")
    .run("Admin", email, hashedPassword, "admin", "ADMIN_RESET");
  console.log(`New admin created: ${email}. Password: ${newPassword}`);
}

process.exit(0);
