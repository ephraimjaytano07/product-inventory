-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 30, 2026 at 07:58 AM
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
-- Database: `product_inventory_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) NOT NULL DEFAULT '',
  `supplier_id` int(11) DEFAULT NULL,
  `purchase_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category`, `supplier_id`, `purchase_price`, `selling_price`, `stock`, `created_at`) VALUES
(1, 'Infinix Note 40', 'Infinix flagship phone 2024', '', 2, 12999.00, 15999.00, 87, '2026-04-27 13:48:40'),
(2, 'iPhone 15', 'Apple iPhone 15 128GB', '', 3, 54999.00, 62999.00, 16, '2026-04-27 13:48:40'),
(3, 'Samsung Galaxy A55', 'Samsung mid-range phone', '', 4, 24999.00, 28999.00, 15, '2026-04-27 13:48:40'),
(4, 'MacBook Air M2', 'Auto-added from delivery', '', 3, 79999.00, 95998.80, 16, '2026-04-27 13:53:35'),
(34, 'CJD', 'all around', 'Robot', NULL, 100000.00, 100000.00, 1, '2026-04-28 14:02:22');

-- --------------------------------------------------------

--
-- Table structure for table `requests`
--

CREATE TABLE `requests` (
  `id` int(11) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `requested_by_role` enum('Admin','Staff') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `requests`
--

INSERT INTO `requests` (`id`, `requested_by`, `requested_by_role`, `created_at`) VALUES
(1, 1, 'Admin', '2026-04-27 13:48:41'),
(2, 5, 'Staff', '2026-04-27 13:48:41'),
(3, 1, 'Admin', '2026-04-27 13:51:20'),
(4, 1, 'Admin', '2026-04-27 13:52:16'),
(5, 1, 'Admin', '2026-04-28 13:28:43'),
(6, 5, 'Staff', '2026-04-28 13:43:31'),
(7, 1, 'Admin', '2026-04-28 13:44:59'),
(8, 1, 'Admin', '2026-04-28 13:45:41');

-- --------------------------------------------------------

--
-- Table structure for table `request_items`
--

CREATE TABLE `request_items` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('Pending Admin Approval','Approved','Declined','Out for Delivery','Rejected','Delivered') NOT NULL DEFAULT 'Pending Admin Approval'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `request_items`
--

INSERT INTO `request_items` (`id`, `request_id`, `supplier_id`, `product_name`, `unit_price`, `quantity`, `status`) VALUES
(1, 1, 2, 'Infinix Note 40', 12999.00, 10, 'Delivered'),
(2, 1, 3, 'iPhone 15', 54999.00, 5, 'Delivered'),
(3, 2, 4, 'Samsung Galaxy A55', 24999.00, 8, 'Approved'),
(4, 3, 3, 'MacBook Air M2', 79999.00, 24, 'Out for Delivery'),
(5, 4, 3, 'MacBook Air M2', 79999.00, 16, 'Delivered'),
(6, 5, 2, 'Infinix Note 40', 12999.00, 50, 'Delivered'),
(7, 6, 2, 'Infinix Note 40', 12999.00, 12, 'Delivered'),
(8, 7, 3, 'iPhone 15', 54999.00, 1, 'Delivered'),
(9, 8, 4, 'Samsung 65\" QLED', 89999.00, 1, 'Approved');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_stocks`
--

CREATE TABLE `supplier_stocks` (
  `id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier_stocks`
--

INSERT INTO `supplier_stocks` (`id`, `supplier_id`, `name`, `description`, `price`, `stock`, `created_at`) VALUES
(1, 2, 'Infinix Note 40', 'Infinix flagship phone 2024', 12999.00, 6, '2026-04-27 13:48:40'),
(2, 2, 'Infinix Smart 8', 'Budget smartphone', 5499.00, 80, '2026-04-27 13:48:40'),
(3, 3, 'iPhone 15', 'Apple iPhone 15 128GB', 54999.00, 14, '2026-04-27 13:48:40'),
(4, 3, 'MacBook Air M2', 'Apple MacBook Air M2 chip', 79999.00, 0, '2026-04-27 13:48:40'),
(5, 4, 'Samsung Galaxy A55', 'Samsung mid-range phone', 24999.00, 40, '2026-04-27 13:48:40'),
(6, 4, 'Samsung 65\" QLED', 'Samsung QLED 4K Smart TV', 89999.00, 10, '2026-04-27 13:48:40');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Supplier','Staff') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'NJ Cajada', 'adminnj@gmail.com', 'admin123', 'Admin', '2026-04-27 13:48:40'),
(2, 'Infinix Corp', 'infinixcorp@gmail.com', 'supplier123', 'Supplier', '2026-04-27 13:48:40'),
(3, 'Apple', 'apple@gmail.com', 'supplier123', 'Supplier', '2026-04-27 13:48:40'),
(4, 'Samsung', 'samsung@gmail.com', 'supplier123', 'Supplier', '2026-04-27 13:48:40'),
(5, 'Eyah Miranda', 'eyah@gmail.com', 'staff123', 'Staff', '2026-04-27 13:48:40');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requested_by` (`requested_by`);

--
-- Indexes for table `request_items`
--
ALTER TABLE `request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `supplier_stocks`
--
ALTER TABLE `supplier_stocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`);

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
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `requests`
--
ALTER TABLE `requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `request_items`
--
ALTER TABLE `request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `supplier_stocks`
--
ALTER TABLE `supplier_stocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `requests`
--
ALTER TABLE `requests`
  ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `request_items`
--
ALTER TABLE `request_items`
  ADD CONSTRAINT `request_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `supplier_stocks`
--
ALTER TABLE `supplier_stocks`
  ADD CONSTRAINT `supplier_stocks_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
