-- 文章浏览日志表，用于热度榜统计
-- 在 blog 库中执行：mysql -u root -p blog < scripts/sql/create_article_view_log.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `article_view_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `article_id` BIGINT NOT NULL,
  `view_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_article_id` (`article_id`),
  INDEX `idx_view_at` (`view_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章浏览记录，用于热度榜统计';
