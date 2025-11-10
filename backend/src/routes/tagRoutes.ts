import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { authenticate, requireAdmin } from '../middleware/auth';
const router = Router();

/**
 * @route   POST /api/tags
 * @desc    创建标签
 * @access  Private (管理员)
 */
router.post('/', authenticate, requireAdmin, tagController.createTag);

/**
 * @route   GET /api/tags
 * @desc    获取标签列表
 * @access  Public
 */
router.get('/', tagController.listTags);

/**
 * @route   GET /api/tags/:id
 * @desc    获取标签详情
 * @access  Public
 */
router.get('/:id', tagController.getTag);

/**
 * @route   PUT /api/tags/:id
 * @desc    更新标签
 * @access  Private (管理员)
 */
router.put('/:id', authenticate, requireAdmin, tagController.updateTag);

/**
 * @route   DELETE /api/tags/:id
 * @desc    删除标签
 * @access  Private (管理员)
 */
router.delete('/:id', authenticate, requireAdmin, tagController.deleteTag);

export default router;
