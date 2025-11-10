import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';
const router = Router();

/**
 * @route   POST /api/categories
 * @desc    创建分类
 * @access  Private (管理员)
 */
router.post('/', authenticate, requireAdmin, categoryController.createCategory);

/**
 * @route   GET /api/categories
 * @desc    获取分类列表
 * @access  Public
 */
router.get('/', categoryController.listCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    获取分类详情
 * @access  Public
 */
router.get('/:id', categoryController.getCategory);

/**
 * @route   PUT /api/categories/:id
 * @desc    更新分类
 * @access  Private (管理员)
 */
router.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    删除分类
 * @access  Private (管理员)
 */
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

export default router;
