import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
// ✅ FIX CORS - Add this specific configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
// ✅ Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'carelink.demo@gmail.com',
    pass: process.env.EMAIL_PASS || 'demo123'
  }
});
// ✅ Email Function 
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: '"CareLink" <carelink.demo@gmail.com>',
      to: to,
      subject: subject,
      html: html
    });
    console.log("✅ Email sent to:", to);
    return true;
  } catch (emailError) {
    console.log("📧 Email simulation (not actually sent):", to);
    console.log("Subject:", subject);
    return true; // Demo-তে error দিবেনা
  }
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "carelink_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const upload = multer({
  dest: "uploads/", 
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const uploadsDir = path.resolve(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.static(path.resolve(__dirname, "public")));

const handleImageUpload = (req, res, next) => {
  if (req.file) {
   
    const newPath = path.join(uploadsDir, req.file.originalname);
    fs.renameSync(req.file.path, newPath);
    req.body.image = `/uploads/${req.file.originalname}`;
  } else if (req.body.image) {
   
  }
  next();
};


async function setupDatabase() {
  const connection = await pool.getConnection();
  try {

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'nurse', 'patient') DEFAULT 'patient',
        status ENUM('active', 'inactive') DEFAULT 'active'
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT,
        nurse_id INT,
        appointment_date DATETIME,
        status ENUM('pending','approved','cancelled','rescheduled','unassigned') DEFAULT 'pending',
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (nurse_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT,
        amount DECIMAL(10,2),
        status ENUM('paid','pending') DEFAULT 'pending',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);


    await connection.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        category VARCHAR(50),
        fullContent TEXT,
        date DATETIME,
        image VARCHAR(255),
        author_id INT,
        status ENUM('draft','published') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
await connection.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('payment', 'appointment', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
await connection.query(`
  CREATE TABLE IF NOT EXISTS nurse_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nurse_id INT,
    appointment_id INT,
    service_amount DECIMAL(10,2),
    commission_percentage DECIMAL(5,2) DEFAULT 70.00,
    nurse_amount DECIMAL(10,2),
    payment_status ENUM('pending','paid') DEFAULT 'pending',
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nurse_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
  )
`);
await connection.query(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    service_needed VARCHAR(100),
    message TEXT,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
    console.log("✅ Database setup completed!");
  } catch (err) {
    console.error("❌ Database setup error:", err);
  } finally {
    connection.release();
  }
}





app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});


app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role || "patient"]
    );
    res.json({ id: result.insertId, message: "User registered successfully" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows.length > 0) {
      res.json({ user: rows[0] });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});


app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, status FROM users"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


app.post("/api/users", async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // এখন Password Required
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role]
    );

    // Manual Share System (No Auto Email)
    console.log("📋 Manual Share - User Credentials:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);

    res.json({ 
      id: result.insertId, 
      message: "User created successfully! ✅",
      credentials: {
        email: email,
        password: password,  // Admin-এর দেওয়া Password
        login_url: "http://localhost:3000/login.html",
        note: "Please share these credentials manually with the user"
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to create user: " + err.message });
  }
});
app.patch("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;
  try {
    await pool.query(
      "UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?",
      [name, email, role, status, id]
    );
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user: " + err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user: " + err.message });
  }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.patient_id, a.nurse_id, a.appointment_date, a.status,
              p.name AS patient_name, n.name AS nurse_name
       FROM appointments a
       LEFT JOIN users p ON a.patient_id = p.id
       LEFT JOIN users n ON a.nurse_id = n.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});
app.get("/api/appointments/patient/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name as nurse_name 
       FROM appointments a 
       LEFT JOIN users u ON a.nurse_id = u.id 
       WHERE a.patient_id = ?`,
      [patient_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient appointments" });
  }
});

app.post("/api/appointments", async (req, res) => {
  const { patient_id, nurse_id, appointment_date, status } = req.body;
  if (!patient_id || !appointment_date)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.query(
      "INSERT INTO appointments (patient_id, nurse_id, appointment_date, status) VALUES (?, ?, ?, ?)",
      [patient_id, nurse_id || null, appointment_date, status || "pending"]
    );
    res.json({
      id: result.insertId,
      message: "Appointment created successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create appointment: " + err.message });
  }
});

app.patch("/api/appointments/:id", async (req, res) => {
  const { id } = req.params;
  const { status, nurse_id, appointment_date } = req.body;
  try {
    const updates = [];
    const values = [];
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    if (nurse_id) {
      updates.push("nurse_id = ?");
      values.push(nurse_id);
    }
    if (appointment_date) {
      updates.push("appointment_date = ?");
      values.push(appointment_date);
    }
    if (!updates.length)
      return res.status(400).json({ error: "No updates provided" });

    values.push(id);
    await pool.query(
      `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    res.json({ message: "Appointment updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update appointment: " + err.message });
  }
});

app.get("/api/payments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.*, u.name AS patient_name FROM payments p JOIN users u ON p.patient_id = u.id"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

app.post("/api/payments", async (req, res) => {
  const { patient_id, amount, status } = req.body;
  if (!patient_id || !amount)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.query(
      "INSERT INTO payments (patient_id, amount, status) VALUES (?, ?, ?)",
      [patient_id, amount, status || "pending"]
    );
    res.json({ id: result.insertId, message: "Payment recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to record payment: " + err.message });
  }
});

app.get("/api/blogs", async (req, res) => {
  try {
    const { category } = req.query;
    let query =
      "SELECT b.*, u.name AS author_name FROM blogs b JOIN users u ON b.author_id = u.id";
    let params = [];
    if (category) {
      query += " WHERE b.category = ?";
      params.push(category);
    }
    query += " ORDER BY b.created_at DESC";
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

app.get("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[blog]] = await pool.query(
      "SELECT b.*, u.name AS author_name FROM blogs b JOIN users u ON b.author_id = u.id WHERE b.id = ?",
      [id]
    );
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

app.post(
  "/api/blogs",
  upload.single("image"),
  handleImageUpload,
  async (req, res) => {
    const {
      title,
      content,
      excerpt,
      category,
      fullContent,
      date,
      author_id,
      status,
    } = req.body;
    const image = req.body.image || null;
    if (!title || !content || !author_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const [userCheck] = await pool.query(
        "SELECT id FROM users WHERE id = ?",
        [author_id]
      );
      if (!userCheck.length) {
        return res.status(400).json({ error: "Invalid author_id" });
      }
      const [result] = await pool.query(
        "INSERT INTO blogs (title, content, excerpt, category, fullContent, date, image, author_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          title,
          content,
          excerpt,
          category,
          fullContent,
          date,
          image,
          author_id,
          status || "draft",
        ]
      );
      res.json({ id: result.insertId, message: "Blog created successfully" });
    } catch (err) {
      console.error("Error creating blog:", err);
      res.status(500).json({ error: "Failed to create blog" });
    }
  }
);
// Updated Payments API
app.get("/api/payments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS patient_name, a.id AS appointment_id 
       FROM payments p 
       JOIN users u ON p.patient_id = u.id
       LEFT JOIN appointments a ON p.appointment_id = a.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

app.get("/api/payments/patient/:patient_id", async (req, res) => {
  const { patient_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT p.*, a.id AS appointment_id 
       FROM payments p 
       LEFT JOIN appointments a ON p.appointment_id = a.id
       WHERE p.patient_id = ? 
       ORDER BY p.created_at DESC`,
      [patient_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient payments" });
  }
});

app.post("/api/payments", async (req, res) => {
  const { patient_id, amount, status, payment_method, payment_type, appointment_id } = req.body;
  if (!patient_id || !amount)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.query(
      "INSERT INTO payments (patient_id, amount, status, payment_method, payment_type, appointment_id) VALUES (?, ?, ?, ?, ?, ?)",
      [patient_id, amount, status || "pending", payment_method, payment_type, appointment_id]
    );
    res.json({ id: result.insertId, message: "Payment recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to record payment: " + err.message });
  }
});

app.post("/api/blogs/sample", async (req, res) => {
  // Assuming a static author_id for the sample blog post
  const sampleAuthorId = 1;
  try {
    const [result] = await pool.query(
      "INSERT INTO blogs (title, content, excerpt, category, fullContent, date, author_id, status, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "Sample Blog Post",
        "This is a sample blog post.",
        "A short excerpt for a sample post.",
        "Health",
        "This is the full content of the sample blog post, with more details and rich HTML.",
        new Date().toISOString().slice(0, 10),
        sampleAuthorId,
        "published",
        "linear-gradient(135deg, #667eea, #764ba2)",
      ]
    );
    res.json({
      id: result.insertId,
      message: "Sample blog created successfully",
    });
  } catch (err) {
    console.error("Error creating sample blog:", err);
    res.status(500).json({ error: "Failed to create sample blog" });
  }
});

app.put(
  "/api/blogs/:id",
  upload.single("image"),
  handleImageUpload,
  async (req, res) => {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      fullContent,
      date,
      author_id,
      status,
    } = req.body;
    const image = req.body.image || null;
    if (!title || !content || !author_id)
      return res.status(400).json({ error: "Missing required fields" });
    try {
      const [userCheck] = await pool.query(
        "SELECT id FROM users WHERE id = ?",
        [author_id]
      );
      if (!userCheck.length) {
        return res.status(400).json({ error: "Invalid author_id" });
      }
      await pool.query(
        "UPDATE blogs SET title = ?, content = ?, excerpt = ?, category = ?, fullContent = ?, date = ?, image = ?, author_id = ?, status = ? WHERE id = ?",
        [
          title,
          content,
          excerpt,
          category,
          fullContent,
          date,
          image,
          author_id,
          status,
          id,
        ]
      );
      res.json({ message: "Blog updated successfully" });
    } catch (err) {
      console.error("Error updating blog:", err);
      res.status(500).json({ error: "Failed to update blog" });
    }
  }
);

app.delete("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM blogs WHERE id = ?", [id]);
    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});
// Notifications API
app.post("/api/notifications", async (req, res) => {
  const { user_id, title, message, type } = req.body;
  if (!user_id || !title || !message)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [user_id, title, message, type || "system"]
    );
    res.json({ id: result.insertId, message: "Notification sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send notification: " + err.message });
  }
});

app.get("/api/notifications/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});
// Contact Messages API
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, service, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required" });
  }

  try {
    // 1. Message Save করো
    const [result] = await pool.query(
      "INSERT INTO contact_messages (name, email, phone, service_needed, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, service, message]
    );

    // 2. Auto Response Email
    try {
      await transporter.sendMail({
        from: '"CareLink Support" <carelink.demo@gmail.com>',
        to: email,
        subject: 'We Received Your Message - CareLink',
        html: `
          <h2>Thank You for Contacting CareLink! 🙏</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We have received your message and our team will contact you within 24 hours.</p>
          <p><strong>Your Message:</strong> ${message}</p>
          <p><strong>Service Needed:</strong> ${service || 'Not specified'}</p>
          <br/>
          <p>Best regards,<br/>CareLink Team</p>
        `
      });
      console.log("✅ Contact confirmation sent to:", email);
    } catch (emailError) {
      console.log("📧 Contact email simulation (not actually sent):", email);
    }

    res.json({ 
      id: result.insertId, 
      message: "Your message has been sent successfully! We'll contact you soon." 
    });

  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get all contact messages (for admin)
app.get("/api/contact-messages", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM contact_messages ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
});

// Update message status (mark as read/replied)
app.patch("/api/contact-messages/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    await pool.query(
      "UPDATE contact_messages SET status = ? WHERE id = ?",
      [status, id]
    );
    res.json({ message: "Message status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update message status" });
  }
});

app.get("/api/dashboard/stats", async (req, res) => {
   try {
    const [[totalUsers]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users"
    );
     const [[totalAppointments]] = await pool.query(
       "SELECT COUNT(*) AS count FROM appointments"
    );
    const [[pendingAppointments]] = await pool.query(
      "SELECT COUNT(*) AS count FROM appointments WHERE status='pending'"
    );
    const [[totalNurses]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role='nurse'"
    );
    const [[totalBlogs]] = await pool.query(
      "SELECT COUNT(*) AS count FROM blogs"
    );

    res.json({
      totalUsers: totalUsers.count,
     totalAppointments: totalAppointments.count,
      pendingAppointments: pendingAppointments.count,
      totalNurses: totalNurses.count,
      totalBlogs: totalBlogs.count,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
 });
// Nurse Payment Calculation
app.post("/api/nurse-payments/calculate", async (req, res) => {
  const { appointment_id } = req.body;
  
  try {
    const [[appointment]] = await pool.query(
      `SELECT a.*, p.amount as service_fee 
       FROM appointments a 
       LEFT JOIN payments p ON a.id = p.appointment_id 
       WHERE a.id = ?`, 
      [appointment_id]
    );
    
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    
    const commission = 70; // 70% commission for nurse
    const nurseAmount = (appointment.service_fee * commission) / 100;
    
    // Save nurse payment record
    const [result] = await pool.query(
      `INSERT INTO nurse_payments (nurse_id, appointment_id, service_amount, commission_percentage, nurse_amount) 
       VALUES (?, ?, ?, ?, ?)`,
      [appointment.nurse_id, appointment_id, appointment.service_fee, commission, nurseAmount]
    );
    
    res.json({ 
      id: result.insertId, 
      nurse_amount: nurseAmount,
      message: "Nurse payment calculated successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate nurse payment" });
  }
});

// Pay Nurse
app.post("/api/nurse-payments/pay", async (req, res) => {
  const { nurse_payment_id } = req.body;
  
  try {
    await pool.query(
      "UPDATE nurse_payments SET payment_status = 'paid', payment_date = NOW() WHERE id = ?",
      [nurse_payment_id]
    );
    
    res.json({ message: "Nurse payment completed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to pay nurse" });
  }
});

// Get all nurse payments
app.get("/api/nurse-payments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT np.*, u.name as nurse_name, a.id as appointment_id
       FROM nurse_payments np
       JOIN users u ON np.nurse_id = u.id
       JOIN appointments a ON np.appointment_id = a.id
       ORDER BY np.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch nurse payments" });
  }
});
// Nurse Payments APIs
app.get("/api/nurse-payments", async (req, res) => {
  try {
    const { status, nurse_id } = req.query;
    
    let query = `
      SELECT np.*, u.name as nurse_name, a.id as appointment_id
      FROM nurse_payments np
      JOIN users u ON np.nurse_id = u.id
      JOIN appointments a ON np.appointment_id = a.id
    `;
    
    const params = [];
    
    // Filter by status
    if (status && status !== 'all') {
      query += " WHERE np.payment_status = ?";
      params.push(status);
    }
    
    // Filter by nurse_id
    if (nurse_id) {
      if (params.length > 0) {
        query += " AND np.nurse_id = ?";
      } else {
        query += " WHERE np.nurse_id = ?";
      }
      params.push(nurse_id);
    }
    
    query += " ORDER BY np.created_at DESC";
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching nurse payments:", err);
    res.status(500).json({ error: "Failed to fetch nurse payments" });
  }
});

// Get nurse payments by nurse_id
app.get("/api/nurse-payments/nurse/:nurse_id", async (req, res) => {
  const { nurse_id } = req.params;
  const { status } = req.query;
  
  try {
    let query = `
      SELECT np.*, u.name as nurse_name, a.id as appointment_id
      FROM nurse_payments np
      JOIN users u ON np.nurse_id = u.id
      JOIN appointments a ON np.appointment_id = a.id
      WHERE np.nurse_id = ?
    `;
    
    const params = [nurse_id];
    
    if (status && status !== 'all') {
      query += " AND np.payment_status = ?";
      params.push(status);
    }
    
    query += " ORDER BY np.created_at DESC";
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching nurse payments:", err);
    res.status(500).json({ error: "Failed to fetch nurse payments" });
  }
});

// Pay nurse - Updated version
app.post("/api/nurse-payments/pay", async (req, res) => {
  const { nurse_payment_id } = req.body;
  
  try {
    // Check if payment exists
    const [[payment]] = await pool.query(
      "SELECT * FROM nurse_payments WHERE id = ?",
      [nurse_payment_id]
    );
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    if (payment.payment_status === 'paid') {
      return res.status(400).json({ error: "Payment already completed" });
    }
    
    // Update payment status
    await pool.query(
      "UPDATE nurse_payments SET payment_status = 'paid', payment_date = NOW() WHERE id = ?",
      [nurse_payment_id]
    );
    
    // Create notification for nurse
    const [[nurse]] = await pool.query(
      "SELECT name FROM users WHERE id = ?",
      [payment.nurse_id]
    );
    
    if (nurse) {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [
          payment.nurse_id,
          "Payment Received",
          `Your payment of $${payment.nurse_amount} for appointment #${payment.appointment_id} has been processed.`,
          "payment"
        ]
      );
    }
    
    res.json({ 
      message: "Nurse payment completed successfully",
      payment_id: nurse_payment_id
    });
  } catch (err) {
    console.error("Error paying nurse:", err);
    res.status(500).json({ error: "Failed to pay nurse: " + err.message });
  }
});

setupDatabase().then(async () => {
// await insertDemoData();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});