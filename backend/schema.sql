--
-- Table structure for table `users`
--
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `cards`
--
CREATE TABLE IF NOT EXISTS `cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `word` VARCHAR(255) NOT NULL,
  `meaning` TEXT NOT NULL,
  `example_sentence` TEXT,
  `due_date` DATE NOT NULL,
  `stability` DOUBLE NOT NULL,
  `difficulty` DOUBLE NOT NULL,
  `elapsed_days` INT NOT NULL,
  `scheduled_days` INT NOT NULL,
  `reps` INT NOT NULL DEFAULT 0,
  `lapses` INT NOT NULL DEFAULT 0,
  `state` ENUM('New', 'Learning', 'Review', 'Relearning') NOT NULL,
  `last_review` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_id_due_date` (`user_id`, `due_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `review_logs`
--
CREATE TABLE IF NOT EXISTS `review_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `card_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `review_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `rating` INT NOT NULL, -- 1: Again, 2: Hard, 3: Good, 4: Easy
  `elapsed_days` INT NOT NULL,
  `scheduled_days` INT NOT NULL,
  `state` ENUM('New', 'Learning', 'Review', 'Relearning') NOT NULL,
  `due_date` DATE NOT NULL,
  INDEX `idx_card_id` (`card_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;