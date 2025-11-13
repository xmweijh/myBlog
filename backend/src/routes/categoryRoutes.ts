import { Router } from 'express'
import * as categoryController from '../controllers/categoryController'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/', categoryController.listCategories)
router.get('/:id', categoryController.getCategory)
router.post('/', requireAuth, requireAdmin, categoryController.createCategory)
router.put('/:id', requireAuth, requireAdmin, categoryController.updateCategory)
router.delete('/:id', requireAuth, requireAdmin, categoryController.deleteCategory)

export default router
