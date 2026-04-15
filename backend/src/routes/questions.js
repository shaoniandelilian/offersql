const express = require('express');
const {
  loadQuestionsFromFrontend,
  getQuestionById,
  toQuestionSummary,
  toQuestionDetail,
  getLibrariesMeta,
} = require('../services/questionCatalog');

const router = express.Router();

router.get('/', (req, res) => {
  const questions = loadQuestionsFromFrontend();
  const data = questions.map((q) => toQuestionSummary(q, req.user));
  const libraries = getLibrariesMeta(questions, req.user);

  res.json({
    success: true,
    data,
    meta: {
      libraries,
    },
  });
});

router.get('/:questionId', (req, res) => {
  const question = getQuestionById(req.params.questionId);
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在',
    });
  }

  return res.json({
    success: true,
    data: toQuestionDetail(question, req.user),
  });
});

module.exports = router;
