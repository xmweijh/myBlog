import { Router } from 'express'
import * as authController from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', requireAuth, authController.getCurrentUser)
router.put('/profile', requireAuth, authController.updateProfile)
router.put('/password', requireAuth, authController.changePassword)

export default router
