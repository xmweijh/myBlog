import { Router } from 'express'
import * as articleController from '../controllers/articleController'
import * as likeController from '../controllers/likeController'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

// 文章 CRUD
router.get('/', optionalAuth, articleController.listArticles)
router.get('/:id', optionalAuth, articleController.getArticle)
router.post('/', requireAuth, articleController.createArticle)
router.put('/:id', requireAuth, articleController.updateArticle)
router.delete('/:id', requireAuth, articleController.deleteArticle)
router.get('/user/:userId', optionalAuth, articleController.getUserArticles)

// 点赞相关路由
router.post('/:id/like', requireAuth, likeController.likeArticle)
router.delete('/:id/like', requireAuth, likeController.unlikeArticle)
router.get('/:id/like/check', optionalAuth, likeController.checkLikeStatus)
router.get('/:id/likes', optionalAuth, likeController.getArticleLikes)

export default router