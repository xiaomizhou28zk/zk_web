-- 使 parent_id 可为 NULL，顶层评论使用 NULL 而非 0，避免外键约束失败
-- 执行：mysql -u root -p blog < scripts/sql/alter_comment_parent_id_nullable.sql

SET NAMES utf8mb4;

-- 删除外键（若报错「外键不存在」，可注释本行后重试）
ALTER TABLE `comment` DROP FOREIGN KEY `fk_comment_parent`;

-- 将 parent_id 改为可空，顶层评论为 NULL
ALTER TABLE `comment` MODIFY COLUMN `parent_id` BIGINT NULL DEFAULT NULL;

-- 将原有的 parent_id=0 更新为 NULL
UPDATE `comment` SET `parent_id` = NULL WHERE `parent_id` = 0;

-- 重新添加外键（parent_id 为 NULL 时跳过校验）
ALTER TABLE `comment` ADD CONSTRAINT `fk_comment_parent` 
  FOREIGN KEY (`parent_id`) REFERENCES `comment` (`id`) ON DELETE CASCADE;
