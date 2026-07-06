/**
 * RoomFlow Backend — server.js
 * ------------------------------------------------------------
 * Chức năng: Đăng nhập (email/mật khẩu thật, bcrypt + JWT),
 * Tạo lịch họp mới, Quản lý cuộc họp (xem / sửa / xóa) — CRUD đầy đủ.
 * Dữ liệu lưu thật trên PostgreSQL (Supabase).
 *
 * Cách chạy:
 *   1) cp .env.example .env   rồi điền DATABASE_URL từ Supabase
 *   2) npm install
 *   3) npm start
 * ------------------------------------------------------------
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

if (!process.env.DATABASE_URL) {
  console.error('❌ Thiếu DATABASE_URL trong file .env — xem hướng dẫn trong .env.example');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase yêu cầu SSL
});

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------
// Khởi tạo bảng + dữ liệu mẫu
// ------------------------------------------------------------
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INT NOT NULL,
      location TEXT,
      equipment TEXT[] DEFAULT '{}'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      organizer_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      organizer_name TEXT NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      attendees TEXT[] DEFAULT '{}',
      equipment TEXT[] DEFAULT '{}',
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  const { rows: empCount } = await pool.query('SELECT COUNT(*)::int AS c FROM employees');
  if (empCount[0].c === 0) {
    console.log('🌱 Seeding dữ liệu mẫu...');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);
    const employees = [
      ['Nguyễn Văn An', 'an.nguyen@roomflow.com'],
      ['Trần Thị Bình', 'binh.tran@roomflow.com'],
      ['Lê Hoàng Cường', 'cuong.le@roomflow.com'],
      ['Phạm Thu Dung', 'dung.pham@roomflow.com'],
      ['Hoàng Minh Đức', 'duc.hoang@roomflow.com'],
    ];
    for (const [name, email] of employees) {
      await pool.query(
        'INSERT INTO employees (name, email, password_hash, department) VALUES ($1,$2,$3,$4)',
        [name, email, defaultPasswordHash, 'Phòng Kinh doanh']
      );
    }

    const rooms = [
      ['Phòng họp A101', 8, 'Tầng 1', ['Máy chiếu', 'Bảng trắng']],
      ['Phòng họp B203', 12, 'Tầng 2', ['TV màn hình', 'Micro', 'Bảng trắng']],
      ['Phòng họp C305', 20, 'Tầng 3', ['Máy chiếu', 'Hệ thống âm thanh']],
      ['Phòng họp nhỏ D101', 4, 'Tầng 1', ['Bảng trắng']],
    ];
    for (const [name, capacity, location, equipment] of rooms) {
      await pool.query(
        'INSERT INTO rooms (name, capacity, location, equipment) VALUES ($1,$2,$3,$4)',
        [name, capacity, location, equipment]
      );
    }
    console.log('✅ Seed xong: 5 nhân viên (mật khẩu mặc định: 123456), 4 phòng.');
  }
}

// ------------------------------------------------------------
// Middleware xác thực JWT
// ------------------------------------------------------------
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập (thiếu token).' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    }
    const { rows } = await pool.query('SELECT * FROM employees WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, department: user.department },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ------------------------------------------------------------
// ROOMS
// ------------------------------------------------------------
app.get('/api/rooms', authMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM rooms ORDER BY name ASC');
  res.json(rows);
});

// ------------------------------------------------------------
// MEETINGS — helper: kiểm tra trùng lịch
// ------------------------------------------------------------
async function findOverlaps({ roomId, startTime, endTime, excludeId }) {
  const params = [roomId, startTime, endTime];
  let query = `
    SELECT id, title, start_time, end_time
    FROM meetings
    WHERE room_id = $1 AND start_time < $3 AND end_time > $2
  `;
  if (excludeId) {
    params.push(excludeId);
    query += ` AND id <> $4`;
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

// GET /api/meetings?from=ISO&to=ISO  -> danh sách cuộc họp trong khoảng thời gian (vd 1 tuần)
app.get('/api/meetings', authMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT m.*, r.name AS room_name, r.location AS room_location
      FROM meetings m
      JOIN rooms r ON r.id = m.room_id
    `;
    const params = [];
    if (from && to) {
      params.push(from, to);
      query += ` WHERE m.start_time < $2 AND m.end_time > $1`;
    }
    query += ' ORDER BY m.start_time ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ khi tải danh sách cuộc họp.' });
  }
});

// POST /api/meetings -> Tạo lịch họp mới
app.post('/api/meetings', authMiddleware, async (req, res) => {
  try {
    const { title, roomId, startTime, endTime, attendees, equipment, description } = req.body;

    if (!title || !roomId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (tên cuộc họp, phòng, giờ bắt đầu/kết thúc).' });
    }
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'Giờ kết thúc phải sau giờ bắt đầu.' });
    }
    if (new Date(endTime) <= new Date()) {
      return res.status(400).json({ error: 'Không thể tạo cuộc họp trong quá khứ.' });
    }

    const overlaps = await findOverlaps({ roomId, startTime, endTime });
    if (overlaps.length > 0) {
      return res.status(409).json({
        error: `Phòng đã được đặt trong khoảng thời gian này bởi cuộc họp "${overlaps[0].title}".`,
        conflicts: overlaps,
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO meetings (title, room_id, organizer_id, organizer_name, start_time, end_time, attendees, equipment, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        title,
        roomId,
        req.user.id,
        req.user.name,
        startTime,
        endTime,
        attendees || [],
        equipment || [],
        description || '',
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo cuộc họp.' });
  }
});

// PUT /api/meetings/:id -> Sửa cuộc họp (chỉ người tổ chức)
app.put('/api/meetings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy cuộc họp.' });

    if (existing.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Bạn chỉ có thể sửa cuộc họp do chính mình tạo.' });
    }
    if (new Date(existing.start_time) <= new Date()) {
      return res.status(400).json({ error: 'Cuộc họp đã diễn ra hoặc đang diễn ra, không thể chỉnh sửa.' });
    }

    const { title, roomId, startTime, endTime, attendees, equipment, description } = req.body;
    const newRoomId = roomId ?? existing.room_id;
    const newStart = startTime ?? existing.start_time;
    const newEnd = endTime ?? existing.end_time;

    if (new Date(newStart) >= new Date(newEnd)) {
      return res.status(400).json({ error: 'Giờ kết thúc phải sau giờ bắt đầu.' });
    }

    const overlaps = await findOverlaps({ roomId: newRoomId, startTime: newStart, endTime: newEnd, excludeId: id });
    if (overlaps.length > 0) {
      return res.status(409).json({
        error: `Phòng đã được đặt trong khoảng thời gian này bởi cuộc họp "${overlaps[0].title}".`,
        conflicts: overlaps,
      });
    }

    const { rows } = await pool.query(
      `UPDATE meetings SET
        title = $1, room_id = $2, start_time = $3, end_time = $4,
        attendees = $5, equipment = $6, description = $7
       WHERE id = $8 RETURNING *`,
      [
        title ?? existing.title,
        newRoomId,
        newStart,
        newEnd,
        attendees ?? existing.attendees,
        equipment ?? existing.equipment,
        description ?? existing.description,
        id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật cuộc họp.' });
  }
});

// DELETE /api/meetings/:id -> Xóa cuộc họp (chỉ người tổ chức)
app.delete('/api/meetings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy cuộc họp.' });

    if (existing.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Bạn chỉ có thể xóa cuộc họp do chính mình tạo.' });
    }

    await pool.query('DELETE FROM meetings WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa cuộc họp.' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 RoomFlow backend (Postgres/Supabase) đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Không kết nối được database:', err.message);
    process.exit(1);
  });
