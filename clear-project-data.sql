-- 清空项目相关数据脚本
-- 按照外键依赖关系，从子表到父表的顺序删除

-- 1. 删除工作流执行相关数据
DELETE FROM novel_anime_workflow_execution_log;
DELETE FROM novel_anime_workflow_execution_node;
DELETE FROM novel_anime_workflow_execution;

-- 2. 删除工作流定义相关数据
DELETE FROM novel_anime_workflow_connection;
DELETE FROM novel_anime_workflow_node;
DELETE FROM novel_anime_workflow;

-- 3. 删除处理管道相关数据
DELETE FROM novel_anime_processing_stage;
DELETE FROM novel_anime_processing_pipeline;

-- 4. 删除剧集相关数据
DELETE FROM novel_anime_episode_scene;
DELETE FROM novel_anime_episode;

-- 5. 删除场景相关数据
DELETE FROM novel_anime_scene_character;
DELETE FROM novel_anime_scene;

-- 6. 删除角色相关数据
DELETE FROM novel_anime_character_relationship;
DELETE FROM novel_anime_character;

-- 7. 删除章节数据
DELETE FROM novel_anime_chapter;

-- 8. 删除小说数据
DELETE FROM novel_anime_novel;

-- 9. 删除项目数据（最后删除，因为其他表都依赖它）
DELETE FROM novel_anime_project;

-- 显示清理结果
SELECT 'Projects cleared' as status;
