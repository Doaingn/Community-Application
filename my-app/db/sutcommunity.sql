-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 01, 2025 at 02:13 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sutcommunity`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`) VALUES
(1, 'Education'),
(2, 'Entertainment'),
(3, 'Sports'),
(4, 'Food & Drink'),
(5, 'Finance'),
(6, 'Music'),
(7, 'Fashion'),
(8, 'Business'),
(9, 'Science'),
(10, 'Art & Culture');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `comment_id` int NOT NULL,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`comment_id`, `post_id`, `user_id`, `comment_text`, `created_at`, `updated_at`) VALUES
(1, 46, 1, 'dddd', '2025-05-15 08:11:54', NULL),
(2, 46, 1, 'dssdsd', '2025-05-15 08:12:40', NULL),
(3, 46, 2, 'ddd', '2025-05-15 08:19:54', NULL),
(4, 46, 2, 'dsdsd', '2025-05-15 08:20:38', NULL),
(5, 46, 2, 'sdsd', '2025-05-15 08:23:00', NULL),
(6, 46, 5, 'สวัสดีครับ', '2025-05-15 08:24:21', NULL),
(7, 45, 5, 'สวยจังอ่ะ', '2025-05-15 08:35:51', NULL),
(8, 43, 5, 'น่าจะตกนะครับ', '2025-05-15 08:36:05', NULL),
(9, 45, 3, 'sawatdee', '2025-05-15 08:42:03', NULL),
(10, 45, 2, 'K ja', '2025-05-15 08:42:27', NULL),
(11, 43, 3, 'hi', '2025-05-15 12:54:10', NULL),
(12, 46, 2, 'เทสแจ้งเตือนจากเค้กหาก๊อก', '2025-05-16 17:45:07', NULL),
(13, 43, 3, 'Hiii', '2025-05-16 20:56:56', NULL),
(14, 46, 1, 'eiei', '2025-05-16 21:00:32', NULL),
(15, 43, 3, 'hrloo', '2025-05-17 14:56:18', NULL),
(17, 44, 3, 'hi', '2025-06-01 10:25:30', NULL),
(18, 42, 3, 'เราไปด้วย', '2025-06-01 10:25:53', NULL),
(19, 42, 1, 'ไปด้วยครับ', '2025-06-01 10:26:59', NULL),
(20, 55, 1, 'วิวสวยมาก', '2025-06-01 10:27:17', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `followers`
--

CREATE TABLE `followers` (
  `follower_id` int NOT NULL,
  `followed_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `followers`
--

INSERT INTO `followers` (`follower_id`, `followed_id`) VALUES
(3, 1),
(3, 2),
(2, 3);

-- --------------------------------------------------------

--
-- Table structure for table `likes`
--

CREATE TABLE `likes` (
  `like_id` int NOT NULL,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `likes`
--

INSERT INTO `likes` (`like_id`, `post_id`, `user_id`) VALUES
(40, 45, 2),
(63, 45, 3),
(67, 46, 3),
(72, 44, 1),
(76, 46, 2),
(78, 46, 1),
(79, 43, 3),
(84, 54, 3),
(89, 43, 2),
(91, 44, 2),
(92, 55, 2),
(93, 42, 3),
(94, 44, 3),
(95, 42, 1),
(96, 55, 1),
(97, 60, 2);

-- --------------------------------------------------------

--
-- Table structure for table `media_files`
--

CREATE TABLE `media_files` (
  `media_id` int NOT NULL,
  `post_id` int DEFAULT NULL,
  `media_type` enum('image','video') DEFAULT NULL,
  `media_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `media_files`
--

INSERT INTO `media_files` (`media_id`, `post_id`, `media_type`, `media_url`, `created_at`) VALUES
(1, 42, 'image', '/uploads/file-1746864756568.jpg', '2025-05-10 08:12:37'),
(2, 42, 'image', '/uploads/file-1746864756674.jpg', '2025-05-10 08:12:37'),
(3, 42, 'video', '/uploads/file-1746864756878.mp4', '2025-05-10 08:12:37'),
(17, 55, 'video', '/uploads/file-1748681500561.mp4', '2025-05-31 08:51:40');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int NOT NULL,
  `notification_type` enum('like','comment','follow','report') NOT NULL,
  `reference_id` int NOT NULL,
  `message` text,
  `status` enum('unread','read') DEFAULT 'unread',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `sender_avatar` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `notification_type`, `reference_id`, `message`, `status`, `created_at`, `user_id`, `sender_id`, `sender_avatar`) VALUES
(22, 'like', 44, 'canny กดถูกใจโพสต์ของคุณ', 'read', '2025-06-01 10:24:24', 1, 2, 'uploads\\file-1748680781846.jpeg'),
(23, 'like', 55, 'canny กดถูกใจโพสต์ของคุณ', 'unread', '2025-06-01 10:24:25', 3, 2, 'uploads\\file-1748680781846.jpeg'),
(24, 'like', 42, 'gok กดถูกใจโพสต์ของคุณ', 'unread', '2025-06-01 10:25:18', 2, 3, 'uploads\\file-1747489409983.jpeg'),
(25, 'like', 44, 'gok กดถูกใจโพสต์ของคุณ', 'unread', '2025-06-01 10:25:20', 1, 3, 'uploads\\file-1747489409983.jpeg'),
(26, 'comment', 44, 'gok คอมเม้นต์โพสต์ของคุณ', 'unread', '2025-06-01 10:25:30', 1, 3, 'uploads\\file-1747489409983.jpeg'),
(27, 'comment', 42, 'gok คอมเม้นต์โพสต์ของคุณ', 'unread', '2025-06-01 10:25:53', 2, 3, 'uploads\\file-1747489409983.jpeg'),
(28, 'like', 42, 'WaiyaVoot กดถูกใจโพสต์ของคุณ', 'unread', '2025-06-01 10:26:43', 2, 1, 'uploads\\file-1748688156175.jpeg'),
(29, 'like', 55, 'WaiyaVoot กดถูกใจโพสต์ของคุณ', 'unread', '2025-06-01 10:26:46', 3, 1, 'uploads\\file-1748688156175.jpeg'),
(30, 'comment', 42, 'WaiyaVoot คอมเม้นต์โพสต์ของคุณ', 'unread', '2025-06-01 10:26:59', 2, 1, 'uploads\\file-1748688156175.jpeg'),
(31, 'comment', 55, 'WaiyaVoot คอมเม้นต์โพสต์ของคุณ', 'unread', '2025-06-01 10:27:18', 3, 1, 'uploads\\file-1748688156175.jpeg'),
(32, 'like', 60, 'canny กดถูกใจโพสต์ของคุณ', 'unread', '2025-06-01 10:55:19', 2, 2, 'uploads\\file-1748680781846.jpeg');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `post_id` int NOT NULL,
  `topic` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `category_id` int DEFAULT NULL,
  `p_user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`post_id`, `topic`, `description`, `location`, `latitude`, `longitude`, `created_at`, `category_id`, `p_user_id`) VALUES
(42, 'หาเพื่อนเที่ยวเขาใหญ่', 'ไปเขาใหญ่ 3 วัน 2 คืน ขึ้นรถซาเล้งไปค่ะ ใครไปด้วยเม้นเลยย', 'ตำบล บุฝ้าย, ตำบล บุฝ้าย, ปราจีนบุรี, ประเทศไทย', '14.31092290', '101.53044150', '2025-06-01 10:06:03', 3, 2),
(44, 'My Topic', 'Post description', 'Bangkok', '13.75630000', '100.50180000', '2025-05-15 06:54:40', 2, 1),
(55, 'ปั่นจักรยานเล่นกัน', 'มาชมวิวกันค่ะ', 'V2H5+83H, ตำบล สุรนารี, นครราชสีมา, ประเทศไทย', '14.87851110', '102.00860180', '2025-06-01 10:40:02', 3, 3),
(60, 'fgg', 'dgg', NULL, NULL, NULL, '2025-06-01 10:54:48', 3, 2);

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `report_id` int NOT NULL,
  `report_post_id` int NOT NULL,
  `report_by_user_id` int NOT NULL,
  `reason` varchar(50) NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Pending',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`report_id`, `report_post_id`, `report_by_user_id`, `reason`, `status`, `date`) VALUES
(1, 34, -1, 'Test1', 'Pending', '2025-05-15 07:13:30'),
(22, 41, 1, 'Harassment or Bullying', 'Pending', '2025-05-15 08:39:12'),
(23, 41, 2, 'Spam', 'Pending', '2025-05-15 08:39:12'),
(24, 41, 3, 'Hate Speech', 'Pending', '2025-05-15 08:39:12'),
(25, 41, 4, 'Copyright Violation', 'Pending', '2025-05-15 08:39:12'),
(26, 41, 5, 'Fake Account', 'Pending', '2025-05-15 08:39:12'),
(27, 41, 6, 'Inappropriate Content', 'Pending', '2025-05-15 08:39:12'),
(28, 41, 7, 'Privacy Violation', 'Pending', '2025-05-15 08:39:12'),
(29, 41, 8, 'Spam', 'Pending', '2025-05-15 08:39:12'),
(30, 41, 9, 'Harassment or Bullying', 'Pending', '2025-05-15 08:39:12'),
(31, 41, 10, 'Fake Account', 'Pending', '2025-05-15 08:39:12'),
(32, 41, 11, 'Hate Speech', 'Pending', '2025-05-15 08:39:12'),
(33, 41, 12, 'Inappropriate Content', 'Pending', '2025-05-15 08:39:12'),
(34, 41, 13, 'Privacy Violation', 'Pending', '2025-05-15 08:39:12'),
(35, 41, 14, 'Spam', 'Pending', '2025-05-15 08:39:12'),
(36, 41, 15, 'Copyright Violation', 'Pending', '2025-05-15 08:39:12'),
(37, 41, 16, 'Harassment or Bullying', 'Pending', '2025-05-15 08:39:12'),
(38, 41, 17, 'Fake Account', 'Pending', '2025-05-15 08:39:12'),
(39, 41, 18, 'Hate Speech', 'Pending', '2025-05-15 08:39:12'),
(40, 41, 19, 'Inappropriate Content', 'Pending', '2025-05-15 08:39:12'),
(41, 41, 20, 'Privacy Violation', 'Pending', '2025-05-15 08:39:12'),
(42, 42, 3, 'Spam', 'pending', '2025-05-16 09:40:26'),
(43, 43, 3, 'Privacy Violation', 'pending', '2025-05-16 10:07:33'),
(44, 44, 3, 'Spam', 'pending', '2025-05-16 12:13:13'),
(45, 46, 1, 'Hate Speech', 'pending', '2025-05-16 18:53:17');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(10) NOT NULL,
  `avatar` varchar(100) NOT NULL,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `expo_push_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `email`, `created_at`, `role`, `avatar`, `bio`, `expo_push_token`) VALUES
(-1, 'Admin', '1', '', '2025-05-14 23:44:29', '', 'uploads\\file-1747222151277.png', '', NULL),
(1, 'WaiyaVoot', '123', '', '2025-04-22 17:00:00', 'member', 'uploads\\file-1748688156175.jpeg', '', NULL),
(2, 'canny', '0000', 'cakkle@gmail.com', '2025-05-02 08:52:16', 'member', 'uploads\\file-1748680781846.jpeg', 'hi', NULL),
(3, 'gok', '1234', 'gokk@gmail.com', '2025-05-02 08:59:15', 'member', 'uploads\\file-1747489409983.jpeg', 'อยากรู้จักเดี๋ยวจัดให้', NULL),
(4, 'barreldisincentivize', '123456', 'xsz8g@dcpa.net', '2025-05-15 00:50:55', 'member', '', '', NULL),
(5, 'CoolWolf28 ', '123', '', '2025-02-10 10:00:00', 'member', '', '', NULL),
(6, 'blueFalcon92', 'Z8qP@7mxLf!', 'bluefalcon92@example.com', '2025-01-04 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Adventure seeker and tech lover.', NULL),
(7, 'sunnyMango21', '3#NkLp9sRt', 'sunnymango21@example.net', '2025-01-17 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Passionate about tropical fruits and sunshine.', NULL),
(8, 'pixelTiger', 'aG7^vKlPzQ9', 'pixeltiger@mail.com', '2025-01-21 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Digital artist and coder by heart.', NULL),
(9, 'aquaNova88', 'Tp#9JmXvY2!', 'aquanova88@domain.org', '2025-02-03 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Ocean explorer and stargazer.', NULL),
(10, 'neonVortex', 'Mx5!qZbJ3Fc', 'neonvortex@mail.net', '2025-02-09 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Lover of all things neon and futuristic.', NULL),
(11, 'rubyRocket12', 'F8@pXnRtVzQ', 'rubyrocket12@example.com', '2025-02-16 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Rocket scientist in training.', NULL),
(12, 'cyberFalcon7', 'G7$LkNvOp9!', 'cyberfalcon7@webmail.com', '2025-02-24 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Cybersecurity enthusiast and bird watcher.', NULL),
(13, 'electricJet', 'J9#XmLp3Vsq', 'electricjet@example.org', '2025-02-28 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Flying high on electricity and dreams.', NULL),
(14, 'lavaPhoenix9', 'B6%NzTkQrVx', 'lavaphoenix9@mail.net', '2025-03-09 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Rising from the ashes every day.', NULL),
(15, 'icyComet45', 'P3!XkVmLcJq', 'icycomet45@domain.com', '2025-03-17 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Cold as ice, fast as a comet.', NULL),
(16, 'starBlaze31', 'Z5@LpVmKrJy', 'starblaze31@example.net', '2025-03-24 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Blazing trails through the stars.', NULL),
(17, 'ghostWolf22', 'R7!MkVqTpLz', 'ghostwolf22@mail.com', '2025-04-01 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Silent but always watching.', NULL),
(18, 'silverArrow5', 'V9@XtPlMqFc', 'silverarrow5@webmail.org', '2025-04-08 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Sharp, fast, and on point.', NULL),
(19, 'turboJet88', 'H8#PnLrVzQw', 'turbojet88@example.com', '2025-04-13 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Speed is my middle name.', NULL),
(20, 'cosmicTiger7', 'D4%XkVmJlNp', 'cosmictiger7@mail.net', '2025-04-20 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Roaring through the cosmos.', NULL),
(21, 'velvetDragon9', 'K6!VzPmQlJx', 'velvetsdragon9@domain.com', '2025-04-28 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Smooth and powerful like velvet.', NULL),
(22, 'frostByte55', 'L2$TxNvPcQr', 'frostbyte55@example.net', '2025-05-03 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Cold coder with a warm heart.', NULL),
(23, 'neonShadow3', 'Q7!VkMpLtXz', 'neoshadow3@mail.com', '2025-05-07 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Shadow moves in neon lights.', NULL),
(24, 'midnightWolf', 'C9%JmLpVxQr', 'midnightwolf@webmail.org', '2025-05-11 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Howling at the midnight moon.', NULL),
(25, 'blazingStar6', 'N3#XvLqMpJz', 'blazingstar6@domain.com', '2025-05-13 10:00:00', 'member', 'uploads/file-1746175936788.jpeg', 'Shining bright in the night sky.', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `violationtypes`
--

CREATE TABLE `violationtypes` (
  `id` int NOT NULL,
  `violation_type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `violationtypes`
--

INSERT INTO `violationtypes` (`id`, `violation_type`) VALUES
(1, 'Hate Speech'),
(2, 'Copyright Violation'),
(3, 'Privacy Violation'),
(4, 'Fake Account'),
(5, 'Harassment or Bullying'),
(6, 'Inappropriate Content'),
(7, 'Spam');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `followers`
--
ALTER TABLE `followers`
  ADD PRIMARY KEY (`follower_id`,`followed_id`),
  ADD KEY `followed_id` (`followed_id`);

--
-- Indexes for table `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`like_id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `media_files`
--
ALTER TABLE `media_files`
  ADD PRIMARY KEY (`media_id`),
  ADD KEY `post_id` (`post_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `user_id` (`p_user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `post_id` (`report_post_id`),
  ADD KEY `fk_report_user_id` (`report_by_user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `violationtypes`
--
ALTER TABLE `violationtypes`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `comment_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `likes`
--
ALTER TABLE `likes`
  MODIFY `like_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `media_files`
--
ALTER TABLE `media_files`
  MODIFY `media_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `post_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `violationtypes`
--
ALTER TABLE `violationtypes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `followers`
--
ALTER TABLE `followers`
  ADD CONSTRAINT `followers_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `followers_ibfk_2` FOREIGN KEY (`followed_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `media_files`
--
ALTER TABLE `media_files`
  ADD CONSTRAINT `media_files_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `user_id` FOREIGN KEY (`p_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
