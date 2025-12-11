-- MySQL schema for `cards`, `review_logs`, and `users` tables

CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `cards` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `review_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `card_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `reviewed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `feedback` TEXT,
    FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);