import { Router } from 'express'
import * as tagController from '../controllers/tagController'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/', tagController.listTags)
router.get('/:id', tagController.getTag)
router.post('/', requireAuth, requireAdmin, tagController.createTag)
router.put('/:id', requireAuth, requireAdmin, tagController.updateTag)
router.delete('/:id', requireAuth, requireAdmin, tagController.deleteTag)

export default router
