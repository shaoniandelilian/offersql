const express = require('express');
const router = express.Router();
const database = require('../services/database');

/**
 * GET /api/comments/:questionId
 * 获取题目评论
 */
router.get('/:questionId', async (req, res) => {
  const { questionId } = req.params;

  try {
    const comments = await database.getQuestionComments(questionId);
    res.json({
      success: true,
      data: comments.map(c => ({
        id: c.id,
        questionId: c.question_id,
        userId: c.user_id,
        username: c.username,
        content: c.content,
        parentId: c.parent_id,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取评论失败: ' + error.message,
    });
  }
});

/**
 * POST /api/comments
 * 发表题目评论
 */
router.post('/', async (req, res) => {
  const { questionId, content, parentId } = req.body || {};
  const userId = req.user?.id || 'anonymous';
  const username = req.user?.username || 'anonymous';

  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客不可发表评论，请注册后使用',
    });
  }

  if (!questionId) {
    return res.status(400).json({
      success: false,
      error: '题目ID不能为空',
    });
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: '评论内容不能为空',
    });
  }

  const finalContent = content.trim();
  if (finalContent.length > 1000) {
    return res.status(400).json({
      success: false,
      error: '评论内容不能超过 1000 字',
    });
  }

  try {
    let normalizedParentId = null;
    if (parentId !== null && parentId !== undefined && parentId !== '') {
      normalizedParentId = Number(parentId);
      if (!Number.isInteger(normalizedParentId) || normalizedParentId <= 0) {
        return res.status(400).json({
          success: false,
          error: '父评论ID无效',
        });
      }

      const parentComment = await database.getQuestionCommentById(normalizedParentId);
      if (!parentComment) {
        return res.status(400).json({
          success: false,
          error: '父评论不存在',
        });
      }

      if (parentComment.question_id !== questionId) {
        return res.status(400).json({
          success: false,
          error: '不能跨题目回复评论',
        });
      }
    }

    const newCommentId = await database.addQuestionComment({
      questionId,
      userId,
      username,
      content: finalContent,
      parentId: normalizedParentId,
    });

    res.json({
      success: true,
      data: {
        id: newCommentId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发表评论失败: ' + error.message,
    });
  }
});

module.exports = router;
