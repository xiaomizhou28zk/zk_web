-- 文章点赞、收藏关系表（每用户每文章至多一条）
-- 在 blog 库中执行：mysql -u root -p blog < scripts/sql/create_article_engagement.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `article_like` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `article_id` BIGINT NOT NULL,
  `account` VARCHAR(255) NOT NULL COMMENT '用户账号，与 user.account / article.account 一致',
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_article_account` (`article_id`, `account`),
  INDEX `idx_article_id` (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章点赞，按 article_id + account 唯一';

CREATE TABLE IF NOT EXISTS `article_favorite` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `article_id` BIGINT NOT NULL,
  `account` VARCHAR(255) NOT NULL COMMENT '用户账号，与 user.account / article.account 一致',
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_article_account` (`article_id`, `account`),
  INDEX `idx_article_id` (`article_id`),
  INDEX `idx_account_created` (`account`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章收藏，按 article_id + account 唯一；列表按 account + created_at 查询';
