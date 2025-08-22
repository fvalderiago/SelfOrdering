-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 22, 2025 at 05:17 AM
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
-- Database: `self_ordering`
--

-- --------------------------------------------------------

--
-- Table structure for table `dietary_preferences`
--

CREATE TABLE `dietary_preferences` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dietary_preferences`
--

INSERT INTO `dietary_preferences` (`id`, `name`, `description`) VALUES
(1, 'Vegetarian', 'For vegetarians'),
(2, 'Gluten-free', 'For gluten-free.');

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` int(5) NOT NULL,
  `faqTitle` varchar(100) NOT NULL,
  `faqDetail` varchar(255) NOT NULL,
  `isFeatured` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `faqTitle`, `faqDetail`, `isFeatured`) VALUES
(1, 'What is a self-ordering restaurant system?', 'A self-ordering system allows customers to browse the menu, place orders, customize dishes, and pay directly from a digital device like a tablet, kiosk, or mobile phone, reducing wait times and streamlining operations.\r\n\r\n', 1),
(2, 'Can I customize my order?', 'Yes, you can adjust the number of items and select dietary preferences.\r\n', 1),
(3, 'Can I order multiple items at once?', 'Yes, you can add multiple items to your cart before confirming the order.\r\n\r\n', 1),
(4, 'How can I track my order?', 'After placing your order, you can view its status in real-time. The kitchen or chef updates the order status [e.g., In Progress (Being Prepared), Completed (Ready to Serve)].', 1);

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `foodID` int(5) NOT NULL,
  `foodTypeID` int(6) NOT NULL,
  `foodName` varchar(200) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `discount` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `foodImage` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `isFeatured` tinyint(1) DEFAULT NULL,
  `lastModified` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foods`
--

INSERT INTO `foods` (`foodID`, `foodTypeID`, `foodName`, `price`, `description`, `discount`, `foodImage`, `isFeatured`, `lastModified`) VALUES
(1, 33, 'Italian Tomato Bruschetta', 18.00, 'Sun-kissed and scrummy, the antipasto ace that brings a taste of Italy straight to your table', '0', '/uploads/foods/c3ab78db-179c-40ff-883b-cbb6da8a3320.png', 1, '2025-08-21 22:39:19'),
(2, 38, 'Burger', 22.00, 'Classic American Burger', '0', '/uploads/foods/ca0cdeb0-d77e-46f6-9643-832ace732ba7.png', 1, NULL),
(3, 38, 'Meatlovers Pizza', 35.00, 'Topped with melty cheese, pepperoni cups, Italian sausage, and bacon', '0', '/uploads/foods/907ad2d6-450f-4539-9755-642c45fd9c52.png', 1, NULL),
(4, 38, 'Double cheesburgers', 38.00, 'Perfect tender, juicy, double cheeseburger with easy burger sauce', '0', '/uploads/foods/cfb8f7d3-4046-46f3-b3fa-8a79c7672643.png', 1, NULL),
(5, 38, 'Chinese Lo Mein Noodles', 24.00, 'Delicious and quick; added with colorful veggies and protein', '0', '/uploads/foods/018de5d9-5040-453f-a216-372c43480375.png', 1, NULL),
(6, 38, 'Fried Chicken', 35.00, 'Supercrunchy Buttermilk Fried Chicken', '25', '/uploads/foods/988c1234-1d16-455a-8237-dc976ca02e33.png', 1, NULL),
(7, 55, 'Strawberry Panna Cotta', 16.00, 'Creamy, sweet, and delicious Italian dessert', '10', '/uploads/foods/6fd1f0f7-0beb-4d61-b8a5-348324418d49.png', 1, NULL),
(8, 55, 'Tiramisu Espresso Cup', 15.00, 'Classic Italian dessert tiramisu, better in mini portion', '10', '/uploads/foods/68c4eef7-64e1-4364-8a8f-2087c9e0652c.png', 1, NULL),
(9, 38, 'Spicy Penne Pasta', 29.00, 'Creamy Penne Pasta', '0', '/uploads/foods/74b76c0f-ff3c-4250-8919-825afbfb5736.png', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `foodtypes`
--

CREATE TABLE `foodtypes` (
  `foodTypeID` int(5) NOT NULL,
  `foodType` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foodtypes`
--

INSERT INTO `foodtypes` (`foodTypeID`, `foodType`) VALUES
(33, 'Starters'),
(38, 'Mains'),
(55, 'Desserts');

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `orderItemID` int(11) NOT NULL,
  `orderID` int(11) NOT NULL,
  `productID` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderitems`
--

INSERT INTO `orderitems` (`orderItemID`, `orderID`, `productID`, `quantity`) VALUES
(1, 1, 1, 1),
(2, 1, 3, 2),
(3, 1, 7, 2);

-- --------------------------------------------------------

--
-- Table structure for table `orderitem_dietary_preferences`
--

CREATE TABLE `orderitem_dietary_preferences` (
  `orderitemID` int(11) NOT NULL,
  `dietaryPreferenceID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderitem_dietary_preferences`
--

INSERT INTO `orderitem_dietary_preferences` (`orderitemID`, `dietaryPreferenceID`) VALUES
(1, 1),
(3, 2);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `orderID` int(11) NOT NULL,
  `tableNumber` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `orderTime` datetime NOT NULL DEFAULT current_timestamp(),
  `specialInstructions` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`orderID`, `tableNumber`, `status`, `orderTime`, `specialInstructions`) VALUES
(1, 5, 'pending', '2025-08-22 11:39:41', 'not too much cheese please');

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `id` int(11) NOT NULL,
  `tableName` varchar(50) NOT NULL,
  `tableImage` varchar(255) NOT NULL,
  `isOccupied` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tables`
--

INSERT INTO `tables` (`id`, `tableName`, `tableImage`, `isOccupied`) VALUES
(5, 'Table for 2', '/uploads/tables/a9050ada-6e10-4962-8bee-0497399a7198.jpg', 0),
(6, 'Table for 4', '/uploads/tables/8b7c4b2b-29a5-411e-9fa2-a7d00d6757f1.jpg', 0),
(7, 'Table for 6', '/uploads/tables/63a783b0-840d-40f1-8bd8-05bd051010b0.jpg', 0),
(8, 'Table for 8', '/uploads/tables/43746b9c-0d8e-41c7-b1dd-72600b3f0794.jpg', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` int(5) NOT NULL,
  `username` varchar(55) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` varchar(32) NOT NULL,
  `reset_token_expiry` datetime NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `username`, `email`, `password`, `role`, `reset_token_expiry`, `reset_token`) VALUES
(1, 'fvalderia@gmail.com', 'fvalderia@gmail.com', '$2b$10$0GzlMHvLxjgzzh3qXYvx7uisCBdV92/NQ7FixswnjlWTJXxqwNNTK', 'admin', '0000-00-00 00:00:00', NULL),
(2, 'chef@currysteps.com', 'chef@currysteps.com', '$2b$10$sFwMldkEtg8iUXk8N4xLfeZ50MlxS5GZGoOHeSVj4Agp6GrOyBoYS', 'chef', '0000-00-00 00:00:00', NULL),
(3, 'john@gmail.com', 'john@gmail.com', '$2b$10$TgdlmiuhNU7P7WCszewGJurdq6PYc6ziBl3VijhHAg8sE.HAAzVOe', 'customer', '0000-00-00 00:00:00', NULL),
(4, 'fvalderia@yahoo.com', 'fvalderia@yahoo.com', '$2b$10$5DU0bruqDsbuglFosdLWzeq88VPbt9SUFumGYwzhtVPHPTCegUHb.', 'customer', '0000-00-00 00:00:00', NULL),
(5, 'sample@sample.com', 'sample@sample.com', '$2b$10$4hFSPQFim.weVpUhysQ9nusgMeJYniPhpNwlBA7U7LB6PWlRQ3UqC', 'customer', '0000-00-00 00:00:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dietary_preferences`
--
ALTER TABLE `dietary_preferences`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`foodID`),
  ADD UNIQUE KEY `foodID` (`foodID`),
  ADD KEY `fk_foodTypeID` (`foodTypeID`);

--
-- Indexes for table `foodtypes`
--
ALTER TABLE `foodtypes`
  ADD PRIMARY KEY (`foodTypeID`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`orderItemID`),
  ADD KEY `orderID` (`orderID`);

--
-- Indexes for table `orderitem_dietary_preferences`
--
ALTER TABLE `orderitem_dietary_preferences`
  ADD PRIMARY KEY (`orderitemID`,`dietaryPreferenceID`),
  ADD KEY `dietaryPreferenceID` (`dietaryPreferenceID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`orderID`);

--
-- Indexes for table `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dietary_preferences`
--
ALTER TABLE `dietary_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `foods`
--
ALTER TABLE `foods`
  MODIFY `foodID` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `orderItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `orderID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tables`
--
ALTER TABLE `tables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userId` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `foods`
--
ALTER TABLE `foods`
  ADD CONSTRAINT `fk_foodTypeID` FOREIGN KEY (`foodTypeID`) REFERENCES `foodtypes` (`foodTypeID`);

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`orderID`) REFERENCES `orders` (`orderID`) ON DELETE CASCADE;

--
-- Constraints for table `orderitem_dietary_preferences`
--
ALTER TABLE `orderitem_dietary_preferences`
  ADD CONSTRAINT `orderitem_dietary_preferences_ibfk_1` FOREIGN KEY (`orderitemID`) REFERENCES `orderitems` (`orderItemID`) ON DELETE CASCADE,
  ADD CONSTRAINT `orderitem_dietary_preferences_ibfk_2` FOREIGN KEY (`dietaryPreferenceID`) REFERENCES `dietary_preferences` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
