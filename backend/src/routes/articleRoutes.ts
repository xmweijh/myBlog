import { Router } from 'express'
import * as articleController from '../controllers/articleController'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/', optionalAuth, articleController.listArticles)
router.get('/:id', optionalAuth, articleController.getArticle)
router.post('/', requireAuth, articleController.createArticle)
router.put('/:id', requireAuth, articleController.updateArticle)
router.delete('/:id', requireAuth, articleController.deleteArticle)
router.get('/user/:userId', optionalAuth, articleController.getUserArticles)

export default router
