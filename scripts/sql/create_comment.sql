-- 顶层评论表（仅存评论，不存回复），无外键
-- 执行前需先迁移或清空旧 comment 表：mysql -u root -p blog < scripts/sql/migrate_comment_to_two_tables.sql
-- 全新部署可直接执行本脚本（需先 DROP 旧表）

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `comment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `article_id` BIGINT NOT NULL,
  `account` VARCHAR(255) NOT NULL DEFAULT '',
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_article_id` (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='顶层评论';
