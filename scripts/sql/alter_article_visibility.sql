-- 文章可见性：1=首页/推荐可见，2=隐藏（仍可通过链接访问，不展示在首页列表与推荐）
ALTER TABLE `article`
  ADD COLUMN `visibility` TINYINT NOT NULL DEFAULT 1 COMMENT '1可见 2隐藏' AFTER `status`;
