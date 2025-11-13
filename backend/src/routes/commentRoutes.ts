import { Router } from 'express'
import * as commentController from '../controllers/commentController'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/article/:articleId', optionalAuth, commentController.getArticleComments)
router.get('/:id', optionalAuth, commentController.getComment)
router.post('/', requireAuth, commentController.createComment)
router.put('/:id', requireAuth, commentController.updateComment)
router.delete('/:id', requireAuth, commentController.deleteComment)

export default router
