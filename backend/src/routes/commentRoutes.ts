import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
const router = Router();

/**
 * @route   POST /api/comments
 * @desc    创建评论
 * @access  Private
 */
router.post('/', authenticate, commentController.createComment);

/**
 * @route   GET /api/comments/article/:articleId
 * @desc    获取文章的评论列表
 * @access  Public
 */
router.get('/article/:articleId', optionalAuthenticate, commentController.getArticleComments);

/**
 * @route   GET /api/comments/:id
 * @desc    获取评论详情
 * @access  Public
 */
router.get('/:id', optionalAuthenticate, commentController.getComment);

/**
 * @route   PUT /api/comments/:id
 * @desc    更新评论
 * @access  Private (作者或管理员)
 */
router.put('/:id', authenticate, commentController.updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    删除评论
 * @access  Private (作者或管理员)
 */
router.delete('/:id', authenticate, commentController.deleteComment);

export default router;
