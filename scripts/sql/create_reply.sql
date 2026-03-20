-- 回复表（comment_id=所属评论，reply_to_reply_id=回复给谁），无外键
-- 执行：mysql -u root -p blog < scripts/sql/create_reply.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `reply` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `comment_id` BIGINT NOT NULL COMMENT '所属评论id',
  `reply_to_reply_id` BIGINT NULL COMMENT '回复给谁：NULL=回复评论，非NULL=回复某条回复的id',
  `account` VARCHAR(255) NOT NULL DEFAULT '',
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_comment_id` (`comment_id`),
  INDEX `idx_reply_to_reply_id` (`reply_to_reply_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回复';
