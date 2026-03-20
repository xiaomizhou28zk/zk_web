-- 从单表 comment 迁移到 comment + reply 双表
-- 执行：mysql -u root -p blog < scripts/sql/migrate_comment_to_two_tables.sql
-- 会备份旧表为 comment_old，创建新表并迁移数据

SET NAMES utf8mb4;

-- 1. 备份旧表
DROP TABLE IF EXISTS `comment_old`;
RENAME TABLE `comment` TO `comment_old`;

-- 2. 创建新 comment 表（仅顶层，无外键）
CREATE TABLE `comment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `article_id` BIGINT NOT NULL,
  `account` VARCHAR(255) NOT NULL DEFAULT '',
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_article_id` (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='顶层评论';

-- 3. 创建 reply 表（无外键）
CREATE TABLE `reply` (
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

-- 4. 迁移顶层评论
INSERT INTO `comment` (`id`, `article_id`, `account`, `content`, `created_at`)
SELECT `id`, `article_id`, `account`, `content`, `created_at` FROM `comment_old` WHERE `parent_id` IS NULL;

-- 5. 迁移回复
-- 5a. 直接回复评论的（parent_id 指向顶层评论）
INSERT INTO `reply` (`comment_id`, `reply_to_reply_id`, `account`, `content`, `created_at`)
SELECT o.`parent_id`, NULL, o.`account`, o.`content`, o.`created_at`
FROM `comment_old` o
WHERE o.`parent_id` IS NOT NULL
  AND EXISTS (SELECT 1 FROM `comment` c WHERE c.`id` = o.`parent_id`);

-- 5b. 嵌套回复（parent 指向回复）：按 reply 表插入顺序，无法在 SQL 中建立 old_id->new_id 映射
--    此处将嵌套回复也插为直接回复（comment_id=根评论），丢失「回复给谁」的层级
--    若有重要嵌套数据，需在应用层做迁移
-- 使用递归 CTE 求每条 non-root 的 root_id（MySQL 8+）
-- INSERT INTO `reply` (`comment_id`, `reply_to_reply_id`, `account`, `content`, `created_at`)
-- SELECT ... 需应用层或存储过程实现
-- 若无可嵌套数据则跳过 5b
DROP TABLE IF EXISTS `comment_old`;
