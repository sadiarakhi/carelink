-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 27, 2025 at 07:33 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `carelink_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `nurse_id` int(11) DEFAULT NULL,
  `appointment_date` datetime DEFAULT NULL,
  `status` enum('pending','approved','cancelled','rescheduled','unassigned') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `nurse_id`, `appointment_date`, `status`) VALUES
(1, 1, 2, '2025-08-27 10:00:00', 'cancelled'),
(2, 1, 2, '2025-08-28 14:00:00', 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `excerpt` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `fullContent` text DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `status` enum('draft','published') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `content`, `excerpt`, `category`, `fullContent`, `date`, `image`, `author_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Sample Blog Post', '<p>This is a sample blog post.</p>', 'A short excerpt for a sample post.', 'foods', '<p>This is the full content of the sample blog post, with more details and rich HTML.</p>', '2025-08-26 00:00:00', 'linear-gradient(135deg, #667eea, #764ba2)', 3, 'published', '2025-08-26 17:45:28', '2025-08-27 17:23:19'),
(2, 'Sample Blog Post', '<p>This is a sample blog post.</p>', 'A short excerpt for a sample post.', 'Health', '<p>This is the full content of the sample blog post, with more details and rich HTML.</p>', '2025-08-13 00:00:00', '/uploads/534811058_746188531673988_5082958973330466817_n.jpg', 2, 'published', '2025-08-27 16:02:17', '2025-08-27 17:05:24'),
(3, 'Sample Blog Post', 'This is a sample blog post.', 'A short excerpt for a sample post.', 'Health', 'This is the full content of the sample blog post, with more details and rich HTML.', '2025-08-27 00:00:00', 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', 1, 'published', '2025-08-27 17:25:35', '2025-08-27 17:25:35'),
(4, 'Sample Blog Post', 'This is a sample blog post.', 'A short excerpt for a sample post.', 'Health', 'This is the full content of the sample blog post, with more details and rich HTML.', '2025-08-27 00:00:00', 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', 1, 'published', '2025-08-27 17:25:38', '2025-08-27 17:25:38'),
(5, 'Sample Blog Post', 'This is a sample blog post.', 'A short excerpt for a sample post.', 'Health', 'This is the full content of the sample blog post, with more details and rich HTML.', '2025-08-27 00:00:00', 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', 1, 'published', '2025-08-27 17:25:40', '2025-08-27 17:25:40'),
(6, 'Sample Blog Post', 'This is a sample blog post.', 'A short excerpt for a sample post.', 'Health', 'This is the full content of the sample blog post, with more details and rich HTML.', '2025-08-27 00:00:00', 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', 1, 'published', '2025-08-27 17:25:43', '2025-08-27 17:25:43');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `status` enum('paid','pending') DEFAULT 'pending',
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `patient_id`, `amount`, `status`, `payment_date`) VALUES
(1, 1, 150.00, 'paid', '2025-08-25 03:00:00'),
(2, 1, 200.00, 'pending', '2025-08-26 05:00:00');
-- --------------------------------------------------------

--
-- Table structure for table `nurse_payments`
--

CREATE TABLE `nurse_payments` (
  `id` int(11) NOT NULL,
  `nurse_id` int(11) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `service_amount` decimal(10,2) DEFAULT NULL,
  `commission_percentage` decimal(5,2) DEFAULT 70.00,
  `nurse_amount` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('pending','paid') DEFAULT 'pending',
  `payment_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','nurse','patient') DEFAULT 'patient',
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`) VALUES
(1, 'John Doe', 'patient@example.com', 'patient', 'patient', 'active'),
(2, 'Jane Smith', 'nurse@example.com', 'nurse', 'nurse', 'active'),
(3, 'Dr. Brown', 'admin@example.com', 'admin', 'admin', 'active'),
(4, 'firo', 'firo@mail.com', '123456', 'patient', 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `nurse_id` (`nurse_id`);

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`);
--
-- Indexes for table `nurse_payments`
--
ALTER TABLE `nurse_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nurse_id` (`nurse_id`),
  ADD KEY `appointment_id` (`appointment_id`);
--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `nurse_payments`
--
ALTER TABLE `nurse_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`nurse_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `blogs`
--
ALTER TABLE `blogs`
  ADD CONSTRAINT `blogs_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
--
-- Constraints for table `nurse_payments`
--
ALTER TABLE `nurse_payments`
  ADD CONSTRAINT `nurse_payments_ibfk_1` FOREIGN KEY (`nurse_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nurse_payments_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;
--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
