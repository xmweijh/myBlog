import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
const router = Router();

/**
 * @route   POST /api/articles
 * @desc    创建文章
 * @access  Private
 */
router.post('/', authenticate, articleController.createArticle);

/**
 * @route   GET /api/articles
 * @desc    获取文章列表（支持分页、筛选、搜索）
 * @access  Public
 */
router.get('/', optionalAuthenticate, articleController.listArticles);

/**
 * @route   GET /api/articles/:id
 * @desc    获取文章详情
 * @access  Public
 */
router.get('/:id', optionalAuthenticate, articleController.getArticle);

/**
 * @route   PUT /api/articles/:id
 * @desc    更新文章
 * @access  Private (作者或管理员)
 */
router.put('/:id', authenticate, articleController.updateArticle);

/**
 * @route   DELETE /api/articles/:id
 * @desc    删除文章
 * @access  Private (作者或管理员)
 */
router.delete('/:id', authenticate, articleController.deleteArticle);

/**
 * @route   GET /api/articles/user/:userId
 * @desc    获取用户的文章列表
 * @access  Public
 */
router.get('/user/:userId', optionalAuthenticate, articleController.getUserArticles);

export default router;
