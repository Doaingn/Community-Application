require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const app = express();
const { Expo } = require('expo-server-sdk'); //push noti
const expo = new Expo(); //push noti

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "zaqwe.2348@gmail.com",
    pass: process.env.EMAIL_PASS || "zlbi qvvg egbw nivp",
  },
});

app.use(cors());
app.use(express.json());

const otpStorage = new Map();
const resetTokenStorage = new Map();

// Helper function เพื่อสร้าง OTP 6 หลัก
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function เพื่อสร้าง reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `file-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|mp4/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) {
      return cb(null, true);
    } else {
      cb("Error: File type not supported!");
    }
  },
  limits: { fileSize: 1000 * 1024 * 1024 }, // 10MB
});

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sutcommunity",
});

//push noti function
async function sendPushNotification(expoPushToken, title, body) {
  // Validate the token
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  // Create the push message
  const messages = [{
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { extraData: 'your data here' },
  }];

  try {
    console.log("📤 Sending push notification to:", expoPushToken);
    const ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log('✅ Push notification sent successfully:', ticketChunk);
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
  }
}




app.post("/api/register", upload.single("avatar"), (req, res) => {
  const { username, email, password, role } = req.body;
  const avatar = req.file ? req.file.path : "assets/deprofile.png";

  const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailQuery, [email], (err, emailResult) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (emailResult.length > 0)
      return res.status(409).json({ error: "email_exists" });

    const checkUsernameQuery = "SELECT * FROM users WHERE username = ?";
    db.query(checkUsernameQuery, [username], (err, usernameResult) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (usernameResult.length > 0)
        return res.status(409).json({ error: "username_exists" });

      const insertQuery =
        "INSERT INTO users (username, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)";
      db.query(
        insertQuery,
        [username, email, password, role, avatar],
        (err) => {
          if (err)
            return res.status(500).json({ error: "Registration failed." });
          res.status(201).json({ message: "User registered successfully!" });
        }
      );
    });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Username and password are required" });

  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (result.length > 0)
      res.status(200).json({ message: "Login successful", user: result[0] });
    else res.status(401).json({ error: "Invalid username or password" });
  });
});

app.post("/posts", upload.array("media", 10), (req, res) => {
  const {
    topic,
    description,
    p_user_id,
    category_id,
    location,
    latitude,
    longitude,
  } = req.body;
  if (!topic || !description || !p_user_id)
    return res.status(400).json({ message: "Missing required fields" });

  db.beginTransaction((err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });

    const postQuery = `
      INSERT INTO posts (topic, description, p_user_id, category_id, location, latitude, longitude, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    const postParams = [
      topic,
      description,
      p_user_id,
      category_id || null,
      location || null,
      latitude || null,
      longitude || null,
    ];

    db.query(postQuery, postParams, (err, result) => {
      if (err)
        return db.rollback(() =>
          res
            .status(500)
            .json({ message: "Error creating post", error: err.message })
        );

      const postId = result.insertId;
      const files = req.files || [];

      if (files.length > 0) {
        const mediaFiles = files.map((file) => ({
          post_id: postId,
          media_type: file.mimetype.includes("image") ? "image" : "video",
          media_url: `/uploads/${file.filename}`,
        }));

        const mediaQuery =
          "INSERT INTO media_files (post_id, media_type, media_url) VALUES ?";
        const values = mediaFiles.map((file) => [
          file.post_id,
          file.media_type,
          file.media_url,
        ]);

        db.query(mediaQuery, [values], (err) => {
          if (err)
            return db.rollback(() =>
              res.status(500).json({
                message: "Error saving media files",
                error: err.message,
              })
            );

          db.commit((err) => {
            if (err)
              return db.rollback(() =>
                res
                  .status(500)
                  .json({ message: "Transaction error", error: err.message })
              );
            res.status(201).json({
              message: "Post created successfully with media",
              post_id: postId,
              media_count: mediaFiles.length,
            });
          });
        });
      } else {
        db.commit((err) => {
          if (err)
            return db.rollback(() =>
              res
                .status(500)
                .json({ message: "Transaction error", error: err.message })
            );
          res.status(201).json({
            message: "Post created successfully without media",
            post_id: postId,
          });
        });
      }
    });
  });
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT * FROM users WHERE user_id = ?", [userId], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length > 0) res.json(result[0]);
    else res.status(404).json({ error: "User not found" });
  });
});

app.put("/users/:id", upload.single("avatar"), (req, res) => {
  const userId = req.params.id;
  const { username, email, password, role, bio } = req.body; // เพิ่ม bio ใน req.body
  const avatar = req.file ? req.file.path : null;

  let updateFields = [];
  let updateValues = [];

  if (username) {
    updateFields.push("username = ?");
    updateValues.push(username);
  }
  if (email) {
    updateFields.push("email = ?");
    updateValues.push(email);
  }
  if (password) {
    updateFields.push("password = ?");
    updateValues.push(password);
  }
  if (role) {
    updateFields.push("role = ?");
    updateValues.push(role);
  }
  if (bio) { // เพิ่มการตรวจสอบ bio
    updateFields.push("bio = ?");
    updateValues.push(bio);
  }
  if (avatar) {
    updateFields.push("avatar = ?");
    updateValues.push(avatar);
  }

  if (updateFields.length === 0)
    return res.status(400).json({ error: "No fields to update" });

  updateValues.push(userId);
  const query = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`;

  db.query(query, updateValues, (err, result) => {
    if (err) return res.status(500).json({ error: "Update failed" });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated successfully" });
  });
});

// ดึงโพสต์ทั้งหมด
app.get("/posts", (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const query = `
    SELECT 
      posts.*, 
      users.username, 
      users.avatar AS user_avatar,
      IFNULL(likes.liked, 0) AS liked,  -- ใช้ IFNULL เพื่อตรวจสอบว่าโพสต์นั้นถูกไลค์หรือไม่
      IFNULL(like_count.like_count, 0) AS like_count  -- นับจำนวนไลค์
    FROM posts
    JOIN users ON posts.p_user_id = users.user_id
    LEFT JOIN (
      SELECT post_id, user_id, 1 AS liked
      FROM likes
      WHERE user_id = ?
    ) AS likes ON posts.post_id = likes.post_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS like_count
      FROM likes
      GROUP BY post_id
    ) AS like_count ON posts.post_id = like_count.post_id
    ORDER BY posts.created_at DESC;
  `;

  db.query(query, [userId], (err, result) => {
    if (err) return res.status(500).send(err);

    const postsWithMedia = result;
    let counter = postsWithMedia.length;

    if (counter === 0) return res.json([]); // หากไม่มีโพสต์ให้ส่งกลับเป็นอาเรย์ว่าง

    postsWithMedia.forEach((post, index) => {
      db.query(
        "SELECT * FROM media_files WHERE post_id = ?",
        [post.post_id],
        (mediaErr, mediaResult) => {
          postsWithMedia[index].media_files = mediaErr ? [] : mediaResult;
          counter--;
          if (counter === 0) res.json(postsWithMedia); // ส่งผลลัพธ์ทั้งหมดเมื่อครบทุกโพสต์
        }
      );
    });
  });
});

// ดึงโพสต์ของผู้ใช้เฉพาะ user_id ที่ระบุ (เพิ่มเติม)
/*app.get("/posts/user/:userId", (req, res) => {
  const { userId } = req.params;
  const viewerId = req.query.viewerId; // ID ของผู้ที่กำลังเข้าดูโพสต์

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const query = `
    SELECT 
      posts.*, 
      users.username, 
      users.avatar AS user_avatar,
      IFNULL(likes.liked, 0) AS liked,
      IFNULL(like_count.like_count, 0) AS like_count
    FROM posts
    JOIN users ON posts.p_user_id = users.user_id
    LEFT JOIN (
      SELECT post_id, user_id, 1 AS liked
      FROM likes
      WHERE user_id = ?
    ) AS likes ON posts.post_id = likes.post_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS like_count
      FROM likes
      GROUP BY post_id
    ) AS like_count ON posts.post_id = like_count.post_id
    WHERE posts.p_user_id = ?
    ORDER BY posts.created_at DESC;
  `;

  db.query(query, [viewerId || 0, userId], (err, result) => {
    if (err) {
      console.error("Error fetching user posts:", err);
      return res.status(500).send(err);
    }

    const postsWithMedia = result;
    let counter = postsWithMedia.length;

    if (counter === 0) return res.json([]);

    postsWithMedia.forEach((post, index) => {
      db.query(
        "SELECT * FROM media_files WHERE post_id = ?",
        [post.post_id],
        (mediaErr, mediaResult) => {
          postsWithMedia[index].media_files = mediaErr ? [] : mediaResult;
          counter--;
          if (counter === 0) res.json(postsWithMedia);
        }
      );
    });
  });
});*/

app.get("/posts/user/:userId", (req, res) => {
  const { userId } = req.params;
  const viewerId = req.query.viewerId; // ID ของผู้ที่กำลังเข้าดูโพสต์

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // สร้าง query
  const query = `
    SELECT 
      posts.*, 
      users.username, 
      users.avatar AS user_avatar,
      IFNULL(likes.liked, 0) AS liked,
      IFNULL(like_count.like_count, 0) AS like_count
    FROM posts
    JOIN users ON posts.p_user_id = users.user_id
    LEFT JOIN (
      SELECT post_id, user_id, 1 AS liked
      FROM likes
      WHERE user_id = ?
    ) AS likes ON posts.post_id = likes.post_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS like_count
      FROM likes
      GROUP BY post_id
    ) AS like_count ON posts.post_id = like_count.post_id
    WHERE posts.p_user_id = ?
    ORDER BY posts.created_at DESC;
  `;

  // คิวรี่ดึงโพสต์
  db.query(query, [viewerId || 0, userId], (err, result) => {
    if (err) {
      console.error("Error fetching user posts:", err);
      return res.status(500).send(err);
    }

    const postsWithMedia = result;
    let counter = postsWithMedia.length;

    if (counter === 0) {
      return res.json([]); // ถ้าไม่มีโพสต์ ให้ส่งกลับเป็นอาร์เรย์ว่าง
    }

    // ดึง media ของแต่ละโพสต์
    postsWithMedia.forEach((post, index) => {
      db.query(
        "SELECT * FROM media_files WHERE post_id = ?",
        [post.post_id],
        (mediaErr, mediaResult) => {
          // ตรวจสอบความผิดพลาดในคำสั่ง SQL สำหรับ media
          postsWithMedia[index].media_files = mediaErr ? [] : mediaResult;
          counter--;

          // ส่งข้อมูลทั้งหมดเมื่อครบทุกโพสต์
          if (counter === 0) {
            res.json(postsWithMedia);
          }
        }
      );
    });
  });
});

app.get("/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, result) => {
    if (err)
      return res.status(500).send({ error: "Failed to fetch categories" });
    res.json(result);
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//ไลก์แล้วแจ้งเตือนได้ + push noti
app.post("/api/like", (req, res) => {
  const { postId, userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ error: "postId and userId are required" });
  }

  const checkLikeQuery = "SELECT * FROM likes WHERE post_id = ? AND user_id = ?";
  db.query(checkLikeQuery, [postId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to check like status" });

    if (results.length > 0) {
      return res.status(400).json({ message: "You have already liked this post" });
    }

    const insertQuery = "INSERT INTO likes (post_id, user_id) VALUES (?, ?)";
    db.query(insertQuery, [postId, userId], (err) => {
      if (err) return res.status(500).json({ error: "Failed to record like" });

      const getPostOwnerQuery = "SELECT p_user_id FROM posts WHERE post_id = ?";
      db.query(getPostOwnerQuery, [postId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch post owner" });

        const postOwnerId = result[0].p_user_id;

        const getSenderInfoQuery = "SELECT username, avatar FROM users WHERE user_id = ?";
        db.query(getSenderInfoQuery, [userId], (err, senderResult) => {
          if (err) return res.status(500).json({ error: "Failed to fetch sender info" });

          const senderUsername = senderResult[0].username;
          const senderAvatar = senderResult[0].avatar;

          const notificationQuery = `
            INSERT INTO notifications (user_id, sender_id, notification_type, reference_id, message, sender_avatar)
            VALUES (?, ?, 'like', ?, ?, ?)
          `;
          db.query(notificationQuery, [postOwnerId, userId, postId, `${senderUsername} กดถูกใจโพสต์ของคุณ`, senderAvatar], (err) => {
            if (err) return res.status(500).json({ error: "Failed to create notification" });

            // Fetch Expo Push Token and send push notification
            const getExpoTokenQuery = "SELECT expo_push_token FROM users WHERE user_id = ?";
            db.query(getExpoTokenQuery, [postOwnerId], async (err, tokenResult) => {
              if (!err && tokenResult[0]?.expo_push_token) {
                const expoPushToken = tokenResult[0].expo_push_token;
                await sendPushNotification(
                  expoPushToken,
                  'การแจ้งเตือนใหม่',
                  `${senderUsername} กดถูกใจโพสต์ของคุณ`
                );
              }
            });

            const countQuery = "SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?";
            db.query(countQuery, [postId], (countErr, countResult) => {
              if (countErr) return res.status(500).json({ error: "Failed to fetch like count" });

              res.status(201).json({
                message: "Post liked successfully",
                like_count: countResult[0].like_count,
                liked: true,
              });
            });
          });
        });
      });
    });
  });
});

app.post("/api/unlike", (req, res) => {
  const { postId, userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ error: "postId and userId are required" });
  }

  const deleteQuery = "DELETE FROM likes WHERE post_id = ? AND user_id = ?";
  db.query(deleteQuery, [postId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to remove like" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Like not found" });
    }

    const countQuery =
      "SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?";
    db.query(countQuery, [postId], (countErr, countResult) => {
      if (countErr)
        return res.status(500).json({ error: "Failed to fetch like count" });

      res.status(200).json({
        message: "Post unliked successfully",
        like_count: countResult[0].like_count,
        liked: false,
      });
    });
  });
});

// Get comments for a post
app.get("/api/comments/:postId", (req, res) => {
  const postId = req.params.postId;

  const query = `
    SELECT 
      comments.*,
      users.username,
      users.avatar AS user_avatar
    FROM comments
    JOIN users ON comments.user_id = users.user_id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC
  `;

  db.query(query, [postId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch comments" });
    res.json(result);
  });
});

// Create new comment + push noti
app.post("/api/comments", (req, res) => {
  const { postId, userId, commentText } = req.body;

  if (!postId || !userId || !commentText) {
    return res.status(400).json({ error: "postId, userId, and commentText are required" });
  }

  const query = `
    INSERT INTO comments (post_id, user_id, comment_text, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `;

  db.query(query, [postId, userId, commentText], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to post comment" });

    const getPostOwnerQuery = "SELECT p_user_id FROM posts WHERE post_id = ?";
    db.query(getPostOwnerQuery, [postId], (err, postOwnerResult) => {
      if (err) return res.status(500).json({ error: "Failed to fetch post owner" });

      const postOwnerId = postOwnerResult[0].p_user_id;

      const getSenderInfoQuery = "SELECT username, avatar FROM users WHERE user_id = ?";
      db.query(getSenderInfoQuery, [userId], (err, senderResult) => {
        if (err) return res.status(500).json({ error: "Failed to fetch sender info" });

        const senderUsername = senderResult[0].username;
        const senderAvatar = senderResult[0].avatar;

        const notificationQuery = `
          INSERT INTO notifications (user_id, sender_id, notification_type, reference_id, message, sender_avatar)
          VALUES (?, ?, 'comment', ?, ?, ?)
        `;
        db.query(notificationQuery, [postOwnerId, userId, postId, `${senderUsername} คอมเม้นต์โพสต์ของคุณ`, senderAvatar], (err) => {
          if (err) return res.status(500).json({ error: "Failed to create notification" });

          // Fetch Expo Push Token and send push notification
          const getExpoTokenQuery = "SELECT expo_push_token FROM users WHERE user_id = ?";
          db.query(getExpoTokenQuery, [postOwnerId], async (err, tokenResult) => {
            if (!err && tokenResult[0]?.expo_push_token) {
              const expoPushToken = tokenResult[0].expo_push_token;
              await sendPushNotification(
                expoPushToken,
                'การแจ้งเตือนใหม่',
                `${senderUsername} คอมเม้นต์โพสต์ของคุณ`
              );
            }
          });

          res.status(201).json({
            message: "Comment posted successfully",
            commentId: result.insertId,
          });
        });
      });
    });
  });
});


// Update comment
app.put("/api/comments/:commentId", (req, res) => {
  const commentId = req.params.commentId;
  const { userId, commentText } = req.body;

  console.log('Update comment request:', {
    commentId,
    userId,
    commentText,
    userIdType: typeof userId
  });

  if (!userId || !commentText) {
    return res.status(400).json({ error: "userId and commentText are required" });
  }

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของ comment หรือไม่
  const checkOwnerQuery = "SELECT user_id FROM comments WHERE comment_id = ?";
  console.log('Executing check owner query:', checkOwnerQuery, 'with commentId:', commentId);
  
  db.query(checkOwnerQuery, [commentId], (err, result) => {
    if (err) {
      console.error('Database error in check owner query:', err);
      return res.status(500).json({ error: "Failed to check comment ownership" });
    }
    
    console.log('Check owner query result:', result);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const commentOwnerId = result[0].user_id;
    const requestUserId = parseInt(userId);
    
    console.log('Ownership check:', {
      commentOwnerId,
      requestUserId,
      commentOwnerIdType: typeof commentOwnerId,
      requestUserIdType: typeof requestUserId,
      isEqual: commentOwnerId === requestUserId
    });

    if (commentOwnerId !== requestUserId) {
      return res.status(403).json({ error: "You can only edit your own comments" });
    }

    // อัปเดต comment
    const updateQuery = `
      UPDATE comments 
      SET comment_text = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE comment_id = ?
    `;

    console.log('Executing update query:', updateQuery, 'with params:', [commentText, commentId]);

    db.query(updateQuery, [commentText, commentId], (err, updateResult) => {
      if (err) {
        console.error('Database error in update query:', err);
        return res.status(500).json({ error: "Failed to update comment" });
      }

      console.log('Update query result:', updateResult);

      res.json({ 
        message: "Comment updated successfully",
        commentId: commentId
      });
    });
  });
});

// Delete comment
app.delete("/api/comments/:commentId", (req, res) => {
  const commentId = req.params.commentId;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของ comment หรือไม่
  const checkOwnerQuery = "SELECT user_id FROM comments WHERE comment_id = ?";
  db.query(checkOwnerQuery, [commentId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to check comment ownership" });
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (result[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    // ลบ comment
    const deleteQuery = "DELETE FROM comments WHERE comment_id = ?";
    db.query(deleteQuery, [commentId], (err, deleteResult) => {
      if (err) return res.status(500).json({ error: "Failed to delete comment" });

      res.json({ 
        message: "Comment deleted successfully",
        commentId: commentId
      });
    });
  });
});

app.get("/api/counts", (req, res) => {
  const counts = {};

  // Query นับจำนวน users
  const userCountQuery = "SELECT COUNT(*) AS userCount FROM users";
  // Query นับจำนวน posts
  const postCountQuery = "SELECT COUNT(*) AS postCount FROM posts";
  // Query นับจำนวน reports
  const reportCountQuery = "SELECT COUNT(*) AS reportCount FROM reports";

  db.query(userCountQuery, (err, userResult) => {
    if (err) return res.status(500).json({ error: "Failed to count users" });
    counts.users = userResult[0].userCount;

    db.query(postCountQuery, (err, postResult) => {
      if (err) return res.status(500).json({ error: "Failed to count posts" });
      counts.posts = postResult[0].postCount;

      db.query(reportCountQuery, (err, reportResult) => {
        if (err)
          return res.status(500).json({ error: "Failed to count reports" });
        counts.reports = reportResult[0].reportCount;

        res.json(counts);
      });
    });
  });
});

app.get("/api/users/monthly", (req, res) => {
  const query = `
    SELECT
      YEAR(created_at) AS year,
      MONTH(created_at) AS month,
      COUNT(*) AS user_count
    FROM users
    GROUP BY year, month
    ORDER BY year, month;
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching monthly user signups:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(result);
  });
});

// API ดึงจำนวนผู้สมัครรายวัน 7 วันล่าสุด
app.get("/api/users/daily", (req, res) => {
  const query = `
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS user_count
    FROM users
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY date
    ORDER BY date;
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching daily user signups:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(result);
  });
});

// ดึงรายงานทั้งหมด พร้อมข้อมูลโพสต์และผู้รายงาน
app.get("/api/reports", (req, res) => {
  const query = `
    SELECT r.report_id, r.report_post_id, r.report_by_user_id, r.reason, r.status, r.date,
           p.topic AS post_topic,
           u.username AS reporter_username
    FROM reports r
    LEFT JOIN posts p ON r.report_post_id = p.post_id
    LEFT JOIN users u ON r.report_by_user_id = u.user_id
    ORDER BY r.date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Failed to fetch reports:", err);
      return res.status(500).json({ error: "Failed to fetch reports" });
    }
    res.json(results);
  });
});

app.get("/api/reports", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM reports ORDER BY date DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (connection) await connection.end();
  }
});

// API FOLLOW ข้างล่างทั้งหมดจ้าาา แพนเพิ่ม

// Follow API

//ฟอลแล้วแจ้งเตือน + push noti
app.post("/api/follow", (req, res) => {
  const { userId, followingId } = req.body;

  if (!userId || !followingId) {
    return res.status(400).json({ error: "userId and followingId are required" });
  }

  const checkFollowQuery = "SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?";
  db.query(checkFollowQuery, [userId, followingId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to check follow status" });

    if (result.length > 0) {
      return res.status(400).json({ error: "Already following this user" });
    }

    const insertQuery = "INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)";
    db.query(insertQuery, [userId, followingId], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to follow user" });

      if (result.affectedRows > 0) {
        const getSenderInfoQuery = "SELECT username, avatar FROM users WHERE user_id = ?";
        db.query(getSenderInfoQuery, [userId], (err, senderResult) => {
          if (err) return res.status(500).json({ error: "Failed to fetch sender info" });

          const senderUsername = senderResult[0].username;
          const senderAvatar = senderResult[0].avatar;

          const notificationQuery = `
            INSERT INTO notifications (user_id, sender_id, notification_type, reference_id, message, sender_avatar)
            VALUES (?, ?, 'follow', ?, ?, ?)
          `;
          db.query(notificationQuery, [followingId, userId, userId, `${senderUsername} เริ่มติดตามคุณแล้ว`, senderAvatar], (err) => {
            if (err) return res.status(500).json({ error: "Failed to create notification" });

            // Fetch Expo Push Token and send push notification
            const getExpoTokenQuery = "SELECT expo_push_token FROM users WHERE user_id = ?";
            db.query(getExpoTokenQuery, [followingId], async (err, tokenResult) => {
              if (!err && tokenResult[0]?.expo_push_token) {
                const expoPushToken = tokenResult[0].expo_push_token;
                await sendPushNotification(
                  expoPushToken,
                  'การแจ้งเตือนใหม่',
                  `${senderUsername} เริ่มติดตามคุณแล้ว`
                );
              }
            });

            res.status(201).json({ message: "Followed successfully" });
          });
        });
      } else {
        res.status(400).json({ error: "Failed to follow user" });
      }
    });
  });
});


// Unfollow API
app.delete("/api/unfollow", (req, res) => {
  const { userId, followingId } = req.body;

  if (!userId || !followingId) {
    console.log("Missing userId or followingId"); // เพิ่มการ debug เมื่อข้อมูลหายไป
    return res
      .status(400)
      .json({ error: "userId and followingId are required" });
  }

  console.log(
    "Unfollow request: userId =",
    userId,
    "followingId =",
    followingId
  ); // เพิ่มการ debug เพื่อตรวจสอบข้อมูล

  const deleteQuery =
    "DELETE FROM followers WHERE follower_id = ? AND followed_id = ?";

  db.query(deleteQuery, [userId, followingId], (err, result) => {
    if (err) {
      console.error("Error deleting follow data:", err); // เพิ่มการ log ข้อผิดพลาด
      return res.status(500).json({ error: "Failed to unfollow user" });
    }

    if (result.affectedRows === 0) {
      console.log("Unfollow failed, no relationship found");
      return res.status(404).json({ error: "Follow relationship not found" });
    }

    console.log("Unfollow successful:", result); // เพิ่มการ debug เพื่อตรวจสอบว่าการยกเลิกการติดตามสำเร็จ
    res.status(200).json({ message: "Unfollowed successfully" });
  });
});

//ดึง followers
app.get("/api/followers/:userId", (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT users.user_id, users.username, users.avatar
    FROM followers
    JOIN users ON followers.follower_id = users.user_id
    WHERE followers.followed_id = ?
  `;

  db.query(query, [userId], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch followers" });
    res.json(result);
  });
});

//ดึงรายชื่อคนที่ผู้ใช้กำลังติดตาม (Following)
app.get("/api/following/:userId", (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT users.user_id, users.username, users.avatar
    FROM followers
    JOIN users ON followers.followed_id = users.user_id
    WHERE followers.follower_id = ?
  `;

  db.query(query, [userId], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch following" });
    res.json(result);
  });
});

// API ดึงจำนวนผู้ติดตามของผู้ใช้
app.get("/api/followers_count/:userId", (req, res) => {
  const { userId } = req.params;

  // ใช้คำสั่ง SQL เพื่อดึงจำนวนผู้ติดตาม
  const query = `
    SELECT COUNT(*) AS followers_count
    FROM followers
    WHERE followed_id = ?;
  `;

  db.query(query, [userId], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch followers count" });

    // ส่งจำนวนผู้ติดตามกลับไปยัง frontend
    res.json({ followers_count: result[0].followers_count });
  });
});

// API ดึงจำนวนที่ผู้ใช้กำลังติดตาม (Following count)
app.get("/api/following_count/:userId", (req, res) => {
  const { userId } = req.params;

  // ใช้คำสั่ง SQL เพื่อดึงจำนวนที่กำลังติดตาม
  const query = `
    SELECT COUNT(*) AS following_count
    FROM followers
    WHERE follower_id = ?;
  `;

  db.query(query, [userId], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch following count" });

    // ส่งจำนวนที่กำลังติดตามกลับไปยัง frontend
    res.json({ following_count: result[0].following_count });
  });
});

//ลบแก้ไขรายงานโพสต์
// แสดงโพสต์
app.get("/posts/:postId", (req, res) => {
  const postId = req.params.postId;
  const userId = req.query.userId || 0; // รับ userId เพื่อเช็ค liked

  const query = `
    SELECT 
      posts.*, 
      users.username, 
      users.avatar AS user_avatar,
      IFNULL(like_count.like_count, 0) AS like_count,
      IF(likes.user_id IS NOT NULL, 1, 0) AS liked
    FROM posts
    JOIN users ON posts.p_user_id = users.user_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS like_count
      FROM likes
      GROUP BY post_id
    ) AS like_count ON posts.post_id = like_count.post_id
    LEFT JOIN likes ON posts.post_id = likes.post_id AND likes.user_id = ?
    WHERE posts.post_id = ?
  `;

  db.query(query, [userId, postId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length === 0)
      return res.status(404).json({ error: "Post not found" });

    const post = result[0];

    db.query(
      "SELECT * FROM media_files WHERE post_id = ?",
      [postId],
      (mediaErr, mediaResult) => {
        post.media_files = mediaErr ? [] : mediaResult;
        res.json(post);
      }
    );
  });
});

app.put("/posts/:postId", upload.array("media", 10), (req, res) => {
  const { postId } = req.params;
  const {
    topic,
    description,
    p_user_id,
    category_id,
    location,
    latitude,
    longitude,
  } = req.body;

  // ตรวจสอบว่าเรามีข้อมูลที่จำเป็นหรือไม่
  if (!topic || !description || !p_user_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // เริ่มการทำธุรกรรม
  db.beginTransaction((err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });

    // คำสั่ง SQL สำหรับการอัปเดตโพสต์
    const postQuery = `
      UPDATE posts 
      SET topic = ?, description = ?, p_user_id = ?, category_id = ?, location = ?, latitude = ?, longitude = ?, created_at = CURRENT_TIMESTAMP
      WHERE post_id = ?`;
    const postParams = [
      topic,
      description,
      p_user_id,
      category_id || null,
      location || null,
      latitude || null,
      longitude || null,
      postId,
    ];

    db.query(postQuery, postParams, (err, result) => {
      if (err)
        return db.rollback(() =>
          res
            .status(500)
            .json({ message: "Error updating post", error: err.message })
        );

      // ตรวจสอบว่าได้รับไฟล์สื่อใหม่หรือไม่
      const files = req.files || [];

      // ถ้ามีการอัปโหลดสื่อใหม่ ให้แทรกสื่อใหม่ลงในฐานข้อมูล
      if (files.length > 0) {
        const mediaFiles = files.map((file) => ({
          post_id: postId,
          media_type: file.mimetype.includes("image") ? "image" : "video",
          media_url: `/uploads/${file.filename}`,
        }));

        const mediaQuery =
          "INSERT INTO media_files (post_id, media_type, media_url) VALUES ?";
        const values = mediaFiles.map((file) => [
          file.post_id,
          file.media_type,
          file.media_url,
        ]);

        db.query(mediaQuery, [values], (err) => {
          if (err)
            return db.rollback(() =>
              res.status(500).json({
                message: "Error saving media files",
                error: err.message,
              })
            );

          db.commit((err) => {
            if (err)
              return db.rollback(() =>
                res
                  .status(500)
                  .json({ message: "Transaction error", error: err.message })
              );
            res.status(200).json({
              message: "Post updated successfully with new media",
              post_id: postId,
              media_count: mediaFiles.length,
            });
          });
        });
      } else {
        // ถ้าไม่มีการอัปโหลดสื่อใหม่ ก็ไม่ต้องทำอะไรกับสื่อเก่า
        db.commit((err) => {
          if (err)
            return db.rollback(() =>
              res
                .status(500)
                .json({ message: "Transaction error", error: err.message })
            );
          res.status(200).json({
            message: "Post updated successfully without new media",
            post_id: postId,
          });
        });
      }
    });
  });
});

// ลบโพสต์
app.delete("/api/posts/:postId", (req, res) => {
  const { postId } = req.params;

  const deletePostQuery = "DELETE FROM posts WHERE post_id = ?";
  const deleteMediaQuery = "DELETE FROM media_files WHERE post_id = ?";

  // เริ่มต้นการทำธุรกรรม
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Database error" });

    db.query(deleteMediaQuery, [postId], (err) => {
      if (err)
        return db.rollback(() =>
          res.status(500).json({ error: "Error deleting media" })
        );

      db.query(deletePostQuery, [postId], (err, result) => {
        if (err)
          return db.rollback(() =>
            res.status(500).json({ error: "Error deleting post" })
          );

        db.commit((err) => {
          if (err)
            return db.rollback(() =>
              res.status(500).json({ error: "Transaction error" })
            );
          res.json({ message: "Post deleted successfully" });
        });
      });
    });
  });
});

// รายงานโพสต์แจ้งเตือนได้
app.post("/api/reports", (req, res) => {
  const { postId, userId, reason } = req.body;

  // Check if the reason is valid
  const checkReasonQuery =
    "SELECT * FROM violationtypes WHERE violation_type = ?";
  db.query(checkReasonQuery, [reason], (err, result) => {
    if (err) {
      console.error("Error checking reason:", err);
      return res.status(500).json({ error: "Error checking reason" });
    }

    if (result.length === 0) {
      return res.status(400).json({ error: "Invalid violation reason" });
    }

    // If the reason is valid, insert the report into the `reports` table
    const insertQuery = `
      INSERT INTO reports (report_post_id, report_by_user_id, reason, status, date) 
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `;
    db.query(insertQuery, [postId, userId, reason], (err, result) => {
      if (err) {
        console.error("Error reporting post:", err);
        return res.status(500).json({ error: "Failed to report post" });
      }

      // Get the post owner ID from the post table
      const getPostOwnerQuery = "SELECT p_user_id FROM posts WHERE post_id = ?";
      db.query(getPostOwnerQuery, [postId], (err, postOwnerResult) => {
        if (err) {
          console.error("Error fetching post owner:", err);
          return res.status(500).json({ error: "Failed to fetch post owner" });
        }

        if (postOwnerResult.length > 0) {
          const postOwnerId = postOwnerResult[0].p_user_id;

          // ดึงข้อมูลของผู้ที่รายงานโพสต์ (sender)
          const getSenderInfoQuery =
            "SELECT username, avatar FROM users WHERE user_id = ?";
          db.query(getSenderInfoQuery, [userId], (err, senderResult) => {
            if (err) {
              console.error("Error fetching sender info:", err);
              return res
                .status(500)
                .json({ error: "Failed to fetch sender info" });
            }

            const senderUsername = senderResult[0].username;
            const senderAvatar = senderResult[0].avatar;

            // Insert notification for the post owner
            const insertNotificationQuery = `
              INSERT INTO notifications (user_id, sender_id, notification_type, reference_id, message, sender_avatar, status, created_at) 
              VALUES (?, ?, 'report', ?, ?, ?, 'unread', CURRENT_TIMESTAMP)
            `;
            db.query(
              insertNotificationQuery,
              [
                postOwnerId,
                userId,
                postId,
                `Your post has been reported for: ${reason}`,
                senderAvatar,
              ],
              (err) => {
                if (err) {
                  console.error("Error inserting notification:", err);
                  return res
                    .status(500)
                    .json({ error: "Failed to send notification" });
                }

                res.status(201).json({
                  message: "Post reported successfully and notification sent",
                });
              }
            );
          });
        } else {
          res.status(404).json({ error: "Post owner not found" });
        }
      });
    });
  });
});

//ดึงตัวเลือกรายงานโพสต์
app.get("/api/violationtypes", (req, res) => {
  const query = "SELECT violation_type FROM violationtypes";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching violation types" });
    }
    res.status(200).json(results.map((row) => row.violation_type));
  });
});

app.put("/api/reports/:id/status", (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const updateQuery = "UPDATE reports SET status = ? WHERE report_id = ?";
  db.query(updateQuery, [status, reportId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update report status" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.status(200).json({ message: "Report status updated successfully" });
  });
});

app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("Failed to fetch users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(results);
  });
});

app.get("/api/posts", (req, res) => {
  const query = `
    SELECT posts.*, users.username, users.avatar AS user_avatar
    FROM posts
    JOIN users ON posts.p_user_id = users.user_id
    ORDER BY posts.created_at DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Failed to fetch posts:", err);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    const postsWithMedia = results;
    let counter = postsWithMedia.length;

    if (counter === 0) return res.json([]);

    postsWithMedia.forEach((post, index) => {
      db.query(
        "SELECT * FROM media_files WHERE post_id = ?",
        [post.post_id],
        (mediaErr, mediaResults) => {
          postsWithMedia[index].media_files = mediaErr ? [] : mediaResults;
          counter--;
          if (counter === 0) res.json(postsWithMedia);
        }
      );
    });
  });
});

app.put("/api/posts/:postId", (req, res) => {
  const postId = req.params.postId;
  const { topic, description, location } = req.body;

  if (!topic && !description && !location) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  let updateFields = [];
  let updateValues = [];

  if (topic) {
    updateFields.push("topic = ?");
    updateValues.push(topic);
  }

  if (description) {
    updateFields.push("description = ?");
    updateValues.push(description);
  }

  if (location !== undefined) {
    updateFields.push("location = ?");
    updateValues.push(location);
  }

  // Add postId to the end of values array
  updateValues.push(postId);

  const query = `UPDATE posts SET ${updateFields.join(", ")} WHERE post_id = ?`;

  db.query(query, updateValues, (err, result) => {
    if (err) {
      console.error("Failed to update post:", err);
      return res.status(500).json({ error: "Failed to update post" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ message: "Post updated successfully" });
  });
});

// API endpoint สำหรับลบผู้ใช้
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;

  // ตรวจสอบก่อนว่ามีโพสต์ที่สร้างโดยผู้ใช้นี้หรือไม่
  db.query(
    "SELECT * FROM posts WHERE p_user_id = ?",
    [userId],
    (postErr, postResults) => {
      if (postErr) {
        return res.status(500).json({ error: "Failed to check user posts" });
      }

      // ถ้ามีโพสต์ที่สร้างโดยผู้ใช้นี้ ให้ลบโพสต์ทั้งหมดก่อน
      if (postResults.length > 0) {
        // สร้างรายการ post_id ทั้งหมด
        const postIds = postResults.map((post) => post.post_id);

        // ลบ reports ที่เกี่ยวข้องกับโพสต์ของผู้ใช้
        const deleteReportsQuery =
          "DELETE FROM reports WHERE report_post_id IN (?)";
        db.query(deleteReportsQuery, [postIds], (reportsErr) => {
          if (reportsErr) {
            return res
              .status(500)
              .json({ error: "Failed to delete related reports" });
          }

          // ลบ media files ที่เกี่ยวข้องกับโพสต์ของผู้ใช้
          const deleteMediaQuery =
            "DELETE FROM media_files WHERE post_id IN (?)";
          db.query(deleteMediaQuery, [postIds], (mediaErr) => {
            if (mediaErr) {
              return res
                .status(500)
                .json({ error: "Failed to delete related media files" });
            }

            // ลบ likes ที่เกี่ยวข้องกับโพสต์ของผู้ใช้
            const deleteLikesQuery = "DELETE FROM likes WHERE post_id IN (?)";
            db.query(deleteLikesQuery, [postIds], (likesErr) => {
              if (likesErr) {
                return res
                  .status(500)
                  .json({ error: "Failed to delete related likes" });
              }

              // ลบโพสต์ของผู้ใช้
              const deletePostsQuery = "DELETE FROM posts WHERE p_user_id = ?";
              db.query(deletePostsQuery, [userId], (postsErr) => {
                if (postsErr) {
                  return res
                    .status(500)
                    .json({ error: "Failed to delete user posts" });
                }

                // ท้ายที่สุด ลบผู้ใช้
                deleteUser(userId, res);
              });
            });
          });
        });
      } else {
        // ถ้าไม่มีโพสต์ ลบผู้ใช้ได้เลย
        deleteUser(userId, res);
      }
    }
  );
});

// ฟังก์ชันสำหรับลบผู้ใช้
function deleteUser(userId, res) {
  // ลบ reports ที่ผู้ใช้นี้เป็นคนรายงาน
  db.query(
    "DELETE FROM reports WHERE report_by_user_id = ?",
    [userId],
    (reportErr) => {
      if (reportErr) {
        return res.status(500).json({ error: "Failed to delete user reports" });
      }

      // ลบ likes ที่ผู้ใช้นี้กดไลค์
      db.query("DELETE FROM likes WHERE user_id = ?", [userId], (likeErr) => {
        if (likeErr) {
          return res.status(500).json({ error: "Failed to delete user likes" });
        }

        // ลบผู้ใช้จากระบบ
        db.query(
          "DELETE FROM users WHERE user_id = ?",
          [userId],
          (userErr, result) => {
            if (userErr) {
              return res.status(500).json({ error: "Failed to delete user" });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ error: "User not found" });
            }

            return res
              .status(200)
              .json({ message: "User deleted successfully" });
          }
        );
      });
    }
  );
}

app.get("/api/posts/search", (req, res) => {
  const searchQuery = req.query.query;

  if (!searchQuery) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const query = `
    SELECT posts.*, users.username, users.avatar AS user_avatar
    FROM posts
    JOIN users ON posts.p_user_id = users.user_id
    WHERE posts.topic LIKE ? OR posts.description LIKE ?
    ORDER BY posts.created_at DESC;
  `;

  const searchParam = `%${searchQuery}%`;

  db.query(query, [searchParam, searchParam], (err, results) => {
    if (err) {
      console.error("Failed to search posts:", err);
      return res.status(500).json({ error: "Failed to search posts" });
    }

    const postsWithMedia = results;
    let counter = postsWithMedia.length;

    if (counter === 0) return res.json([]);

    postsWithMedia.forEach((post, index) => {
      db.query(
        "SELECT * FROM media_files WHERE post_id = ?",
        [post.post_id],
        (mediaErr, mediaResults) => {
          postsWithMedia[index].media_files = mediaErr ? [] : mediaResults;
          counter--;
          if (counter === 0) res.json(postsWithMedia);
        }
      );
    });
  });
});

// Improved API endpoint for deleting users with proper transaction handling
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;

  // Start a transaction for all deletion operations
  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Database transaction error" });
    }

    // 1. Delete all comments made by this user
    db.query(
      "DELETE FROM comments WHERE user_id = ?",
      [userId],
      (commentErr) => {
        if (commentErr) {
          console.error("Failed to delete user comments:", commentErr);
          return db.rollback(() =>
            res.status(500).json({ error: "Failed to delete user comments" })
          );
        }

        // 2. Delete all followers/following relationships
        db.query(
          "DELETE FROM followers WHERE follower_id = ? OR followed_id = ?",
          [userId, userId],
          (followErr) => {
            if (followErr) {
              console.error(
                "Failed to delete follow relationships:",
                followErr
              );
              return db.rollback(() =>
                res
                  .status(500)
                  .json({ error: "Failed to delete follow relationships" })
              );
            }

            // 3. Get all posts by this user to delete related items later
            db.query(
              "SELECT post_id FROM posts WHERE p_user_id = ?",
              [userId],
              (postErr, posts) => {
                if (postErr) {
                  console.error("Failed to retrieve user posts:", postErr);
                  return db.rollback(() =>
                    res
                      .status(500)
                      .json({ error: "Failed to retrieve user posts" })
                  );
                }

                // If user has posts, delete all related content first
                if (posts.length > 0) {
                  const postIds = posts.map((post) => post.post_id);

                  // 4. Delete comments on user's posts
                  db.query(
                    "DELETE FROM comments WHERE post_id IN (?)",
                    [postIds],
                    (commentPostErr) => {
                      if (commentPostErr) {
                        console.error(
                          "Failed to delete post comments:",
                          commentPostErr
                        );
                        return db.rollback(() =>
                          res
                            .status(500)
                            .json({ error: "Failed to delete post comments" })
                        );
                      }

                      // 5. Delete reports related to user's posts
                      db.query(
                        "DELETE FROM reports WHERE report_post_id IN (?)",
                        [postIds],
                        (reportErr) => {
                          if (reportErr) {
                            console.error(
                              "Failed to delete reports:",
                              reportErr
                            );
                            return db.rollback(() =>
                              res
                                .status(500)
                                .json({ error: "Failed to delete reports" })
                            );
                          }

                          // 6. Delete likes related to user's posts
                          db.query(
                            "DELETE FROM likes WHERE post_id IN (?)",
                            [postIds],
                            (likeErr) => {
                              if (likeErr) {
                                console.error(
                                  "Failed to delete likes:",
                                  likeErr
                                );
                                return db.rollback(() =>
                                  res
                                    .status(500)
                                    .json({ error: "Failed to delete likes" })
                                );
                              }

                              // 7. Delete media files related to user's posts
                              db.query(
                                "DELETE FROM media_files WHERE post_id IN (?)",
                                [postIds],
                                (mediaErr) => {
                                  if (mediaErr) {
                                    console.error(
                                      "Failed to delete media files:",
                                      mediaErr
                                    );
                                    return db.rollback(() =>
                                      res.status(500).json({
                                        error: "Failed to delete media files",
                                      })
                                    );
                                  }

                                  deleteUserAndRelatedData(userId, res, db);
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                } else {
                  // No posts, just delete user and directly related data
                  deleteUserAndRelatedData(userId, res, db);
                }
              }
            );
          }
        );
      }
    );
  });
});

// Helper function to delete the user and finalize the transaction
function deleteUserAndRelatedData(userId, res, db) {
  // 8. Delete any reports made by the user
  db.query(
    "DELETE FROM reports WHERE report_by_user_id = ?",
    [userId],
    (reportUserErr) => {
      if (reportUserErr) {
        console.error("Failed to delete user reports:", reportUserErr);
        return db.rollback(() =>
          res.status(500).json({ error: "Failed to delete user reports" })
        );
      }

      // 9. Delete likes by this user
      db.query(
        "DELETE FROM likes WHERE user_id = ?",
        [userId],
        (likeUserErr) => {
          if (likeUserErr) {
            console.error("Failed to delete user likes:", likeUserErr);
            return db.rollback(() =>
              res.status(500).json({ error: "Failed to delete user likes" })
            );
          }

          // 10. Delete user's posts
          db.query(
            "DELETE FROM posts WHERE p_user_id = ?",
            [userId],
            (postDeleteErr) => {
              if (postDeleteErr) {
                console.error("Failed to delete user posts:", postDeleteErr);
                return db.rollback(() =>
                  res.status(500).json({ error: "Failed to delete user posts" })
                );
              }

              // 11. Finally delete the user
              db.query(
                "DELETE FROM users WHERE user_id = ?",
                [userId],
                (userErr, result) => {
                  if (userErr) {
                    console.error("Failed to delete user:", userErr);
                    return db.rollback(() =>
                      res.status(500).json({ error: "Failed to delete user" })
                    );
                  }

                  if (result.affectedRows === 0) {
                    return db.rollback(() =>
                      res.status(404).json({ error: "User not found" })
                    );
                  }

                  // Commit the transaction if everything was successful
                  db.commit((commitErr) => {
                    if (commitErr) {
                      console.error("Commit error:", commitErr);
                      return db.rollback(() =>
                        res
                          .status(500)
                          .json({ error: "Failed to commit transaction" })
                      );
                    }

                    // Successfully deleted user and all related data
                    return res
                      .status(200)
                      .json({ message: "User deleted successfully" });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
}

//ดึงการแจ้งเตือนของผู้ใช้
app.get("/api/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    // ดึงการแจ้งเตือนพร้อมข้อมูลผู้ส่ง
    const query = `
        SELECT 
            n.notification_id, 
            n.notification_type, 
            n.reference_id, 
            n.message, 
            n.status, 
            n.created_at,
            n.sender_id,
            n.user_id,
            sender.username AS sender_username, 
            sender.avatar AS sender_avatar
        FROM notifications n
        LEFT JOIN users sender ON n.sender_id = sender.user_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?;
    `;

    db.query(query, [userId, parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).json({ error: "Failed to fetch notifications" });
        }

        // ปรับปรุงข้อมูลให้เหมาะสมสำหรับ frontend
        const formattedNotifications = results.map(notification => ({
            ...notification,
            sender_avatar: notification.sender_avatar 
                ? notification.sender_avatar 
                : null
        }));

        res.status(200).json({
            message: "Notifications fetched successfully",
            notifications: formattedNotifications,
            hasMore: results.length === parseInt(limit)
        });
    });
});

//อัปเดตสถานะการแจ้งเตือนเป็น 'read'
app.put("/api/notifications/read/:notificationId", (req, res) => {
  const { notificationId } = req.params;

  const query = `
    UPDATE notifications
    SET status = 'read'
    WHERE notification_id = ?
  `;

  db.query(query, [notificationId], (err, result) => {
    if (err) {
      console.error("Failed to update notification status:", err);
      return res
        .status(500)
        .json({ error: "Failed to update notification status" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read" });
  });
});

//อัปเดตสถานะการอ่านทั้งหมดของผู้ใช้
app.put("/api/notifications/read-all/:userId", (req, res) => {
  const { userId } = req.params;

  const query = `
    UPDATE notifications
    SET status = 'read'
    WHERE user_id = ? AND status = 'unread'
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Failed to mark all notifications as read:", err);
      return res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.affectedRows,
    });
  });
});

// ---------- SEARCH REPORTS API ----------
// Search reports by query string
// GET /api/reports/search
app.get("/api/reports/search", (req, res) => {
  const { query } = req.query;

  // If query is empty, return all reports
  if (!query || query.trim() === "") {
    return res.redirect("/api/reports");
  }

  const searchQuery = `
    SELECT r.report_id, r.report_post_id, r.report_by_user_id, r.reason, r.status, r.date,
           p.topic AS post_topic,
           u.username AS reporter_username
    FROM reports r
    LEFT JOIN posts p ON r.report_post_id = p.post_id
    LEFT JOIN users u ON r.report_by_user_id = u.user_id
    WHERE r.report_id LIKE ? 
    OR r.report_post_id LIKE ? 
    OR r.reason LIKE ? 
    OR p.topic LIKE ? 
    OR u.username LIKE ?
    ORDER BY r.date DESC
  `;

  const searchParam = `%${query}%`;
  const params = [
    searchParam,
    searchParam,
    searchParam,
    searchParam,
    searchParam,
  ];

  db.query(searchQuery, params, (err, results) => {
    if (err) {
      console.error("Failed to search reports:", err);
      return res.status(500).json({ error: "Failed to search reports" });
    }
    res.json(results);
  });
});

// ---------- DELETE REPORT API ----------
// Delete report by ID (for rejecting reports)
// DELETE /api/reports/:id
app.delete("/api/reports/:id", (req, res) => {
  const reportId = req.params.id;

  // First check if report exists
  db.query(
    "SELECT * FROM reports WHERE report_id = ?",
    [reportId],
    (err, results) => {
      if (err) {
        console.error("Error checking report:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Delete report
      db.query(
        "DELETE FROM reports WHERE report_id = ?",
        [reportId],
        (err, result) => {
          if (err) {
            console.error("Error deleting report:", err);
            return res.status(500).json({ error: "Failed to delete report" });
          }

          console.log(`Report ${reportId} deleted successfully`);
          res.json({ message: "Report deleted successfully", reportId });
        }
      );
    }
  );
});

// ---------- UPDATE REPORT STATUS API ----------
// Update report status
// PUT /api/reports/:id/status
app.put("/api/reports/:id/status", (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;

  // Validate status
  const validStatuses = ["Pending", "In-Progress", "Resolved", "Rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  // Update report status
  db.query(
    "UPDATE reports SET status = ? WHERE report_id = ?",
    [status, reportId],
    (err, result) => {
      if (err) {
        console.error("Error updating report status:", err);
        return res
          .status(500)
          .json({ error: "Failed to update report status" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Report not found" });
      }

      console.log(`Report ${reportId} status updated to ${status}`);
      res.json({
        message: "Report status updated successfully",
        reportId,
        status,
      });
    }
  );
});

// ---------- Alternative implementation with async/await ----------
// If you're using async/await pattern, here's how you can rewrite the search endpoint:

app.get("/api/reports/search", async (req, res) => {
  const { query } = req.query;
  let connection;

  try {
    // If query is empty, return all reports
    if (!query || query.trim() === "") {
      return res.redirect("/api/reports");
    }

    connection = await mysql.createConnection(dbConfig);

    const searchQuery = `
      SELECT r.report_id, r.report_post_id, r.report_by_user_id, r.reason, r.status, r.date,
             p.topic AS post_topic,
             u.username AS reporter_username
      FROM reports r
      LEFT JOIN posts p ON r.report_post_id = p.post_id
      LEFT JOIN users u ON r.report_by_user_id = u.user_id
      WHERE r.report_id LIKE ? 
      OR r.report_post_id LIKE ? 
      OR r.reason LIKE ? 
      OR p.topic LIKE ? 
      OR u.username LIKE ?
      ORDER BY r.date DESC
    `;

    const searchParam = `%${query}%`;
    const [rows] = await connection.execute(searchQuery, [
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
    ]);

    res.json(rows);
  } catch (error) {
    console.error("Search reports error:", error);
    res.status(500).json({ error: "Failed to search reports" });
  } finally {
    if (connection) await connection.end();
  }
});

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // ตรวจสอบว่า email มีอยู่ในระบบหรือไม่
  const checkEmailQuery = "SELECT user_id FROM users WHERE email = ?";
  db.query(checkEmailQuery, [email.toLowerCase()], async (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "This E-mail does not exist" });
    }

    try {
      // สร้าง OTP
      const otp = generateOTP();
      const expiryTime = Date.now() + 5 * 60 * 1000; // 5 นาที

      // เก็บ OTP ใน storage
      otpStorage.set(email.toLowerCase(), {
        otp: otp,
        expiryTime: expiryTime,
        userId: result[0].user_id,
      });

      // ส่ง OTP ไปยัง email
      const mailOptions = {
        from: '"Sutcommunity" <zaqwe.2348@gmail.com>',
        to: email,
        subject: "Password Reset - OTP Verification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F58637;">Password Reset Request</h2>
            <p>You have requested to reset your password. Please use the following OTP code to verify your identity:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #75AF2F; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP code will expire in 5 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            
            <p>If you're having trouble, please contact our support team.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        message: "OTP sent successfully",
        expiryTime: expiryTime,
      });
    } catch (error) {
      console.error("Email sending error:", error);
      res.status(500).json({ error: "Failed to send OTP email" });
    }
  });
});

// API สำหรับยืนยัน OTP
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const storedData = otpStorage.get(email.toLowerCase());

  if (!storedData) {
    return res.status(400).json({ error: "No OTP found for this email" });
  }

  // ตรวจสอบว่า OTP หมดอายุหรือไม่
  if (Date.now() > storedData.expiryTime) {
    otpStorage.delete(email.toLowerCase());
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // ตรวจสอบ OTP
  if (storedData.otp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // OTP ถูกต้อง - สร้าง reset token
  const resetToken = generateResetToken();
  const tokenExpiryTime = Date.now() + 15 * 60 * 1000; // 15 นาที

  // เก็บ reset token
  resetTokenStorage.set(resetToken, {
    email: email.toLowerCase(),
    userId: storedData.userId,
    expiryTime: tokenExpiryTime,
  });

  // ลบ OTP ที่ใช้แล้ว
  otpStorage.delete(email.toLowerCase());

  res.status(200).json({
    message: "OTP verified successfully",
    resetToken: resetToken,
  });
});

// API สำหรับ reset รหัสผ่าน
app.post("/api/reset-password", (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email, reset token, and new password are required" });
  }

  // ตรวจสอบรูปแบบรหัสผ่าน
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  const passwordRegex = /^[A-Za-z0-9@#$%^&*()_!+\-={}\/:[\]~.]+$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        "Password can only contain letters, numbers, and special characters: @ # $ % ^ & * ( ) _ ! + – = { } \\ / : [ ] ~ .",
    });
  }

  const tokenData = resetTokenStorage.get(resetToken);

  if (!tokenData) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  // ตรวจสอบว่า token หมดอายุหรือไม่
  if (Date.now() > tokenData.expiryTime) {
    resetTokenStorage.delete(resetToken);
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  // ตรวจสอบว่า email ตรงกันหรือไม่
  if (tokenData.email !== email.toLowerCase()) {
    return res
      .status(400)
      .json({ error: "Invalid reset token for this email" });
  }

  // อัปเดตรหัสผ่านในฐานข้อมูล
  const updatePasswordQuery = "UPDATE users SET password = ? WHERE user_id = ?";
  db.query(
    updatePasswordQuery,
    [newPassword, tokenData.userId],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update password" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // ลบ reset token ที่ใช้แล้ว
      resetTokenStorage.delete(resetToken);

      res.status(200).json({ message: "Password reset successfully" });
    }
  );
});

// API เสริม: ยกเลิก reset token (ถ้าผู้ใช้ต้องการยกเลิก)
app.post("/api/cancel-reset", (req, res) => {
  const { email, resetToken } = req.body;

  if (!email || !resetToken) {
    return res
      .status(400)
      .json({ error: "Email and reset token are required" });
  }

  const tokenData = resetTokenStorage.get(resetToken);

  if (tokenData && tokenData.email === email.toLowerCase()) {
    resetTokenStorage.delete(resetToken);
    res.status(200).json({ message: "Reset process cancelled successfully" });
  } else {
    res.status(400).json({ error: "Invalid reset token" });
  }
});

// Cleanup function สำหรับลบ OTP และ token ที่หมดอายุ (ควรรันทุก 5 นาที)
function cleanupExpiredData() {
  const currentTime = Date.now();

  // ลบ OTP ที่หมดอายุ
  for (const [email, data] of otpStorage.entries()) {
    if (currentTime > data.expiryTime) {
      otpStorage.delete(email);
    }
  }

  // ลบ reset token ที่หมดอายุ
  for (const [token, data] of resetTokenStorage.entries()) {
    if (currentTime > data.expiryTime) {
      resetTokenStorage.delete(token);
    }
  }
}

// รัน cleanup ทุก 5 นาที
setInterval(cleanupExpiredData, 5 * 60 * 1000);

module.exports = {
  otpStorage,
  resetTokenStorage,
  generateOTP,
  generateResetToken,
  cleanupExpiredData,
  transporter,
};

//ส่วนของActivityScreenAdd commentMore actions
app.get('/api/posts/activity/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT DISTINCT p.*, u.username, u.avatar AS user_avatar,
      IFNULL(like_count.like_count, 0) AS like_count,
      IF(likes.user_id IS NOT NULL, 1, 0) AS liked
    FROM posts p
    JOIN users u ON p.p_user_id = u.user_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS like_count
      FROM likes
      GROUP BY post_id
    ) AS like_count ON p.post_id = like_count.post_id
    LEFT JOIN likes ON p.post_id = likes.post_id AND likes.user_id = ?
    WHERE p.post_id IN (
      SELECT post_id FROM likes WHERE user_id = ?
      UNION
      SELECT post_id FROM comments WHERE user_id = ?
    )
    ORDER BY p.created_at DESC
  `;

  db.query(query, [userId, userId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    // ดึง media_files ของแต่ละโพสต์
    const postIds = results.map(post => post.post_id);
    if (postIds.length === 0) return res.json([]);

    db.query(
      `SELECT * FROM media_files WHERE post_id IN (?)`,
      [postIds],
      (mediaErr, mediaResults) => {
        if (mediaErr) return res.status(500).json({ error: "Database error on media_files" });

        // แนบ media_files เข้ากับโพสต์
        const mediaMap = {};
        mediaResults.forEach(m => {
          if (!mediaMap[m.post_id]) mediaMap[m.post_id] = [];
          mediaMap[m.post_id].push(m);
        });

        results.forEach(post => {
          post.media_files = mediaMap[post.post_id] || [];
        });

        res.json(results);
      }
    );
  });
});
//ส่วนของActivityScreen


//push noti token
app.post("/api/save-token", (req, res) => {
  const { userId, pushToken } = req.body;
  if (!userId || !pushToken) {
    return res.status(400).json({ error: "Missing userId or pushToken" });
  }

  const query = "UPDATE users SET expo_push_token = ? WHERE user_id = ?";
  db.query(query, [pushToken, userId], (err) => {
    if (err) return res.status(500).json({ error: "Failed to save token" });
    res.json({ message: "Push token saved successfully" });
  });
});

//push noti disable
app.post("/api/disable-push", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const query = "UPDATE users SET expo_push_token = NULL WHERE user_id = ?";
  db.query(query, [userId], (err) => {
    if (err) return res.status(500).json({ error: "Failed to disable push notifications" });
    res.json({ message: "Push notifications disabled successfully" });
  });
});

app.listen(3000, '0.0.0.0', () => {
  console.log("Server running on port 3000");
});
