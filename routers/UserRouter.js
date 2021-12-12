import Router from 'express';
import UserController from '../controllers/UserController.js'
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import SetUserMiddleware from '../middlewares/SetUserMiddleware.js';

const router = new Router();

router.post('/register', UserController.registration);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.post('/sendmail', AuthMiddleware, UserController.sendNewActivationMail);
router.post('/user/subscribe', AuthMiddleware, UserController.subscribeToUser);
router.post('/user/unsubscribe', AuthMiddleware, UserController.unsubscribeFromUser);

router.get('/sendmail', AuthMiddleware, UserController.getActivationMailCooldown);
router.get('/user', SetUserMiddleware, UserController.getOne);
router.get('/refresh', UserController.refresh);
router.get('/activate', UserController.activate);
router.get('/user/:id/stats', UserController.getProfileStats);

router.put('/avatar', AuthMiddleware, UserController.updateAvatar);
router.put('/user', AuthMiddleware, UserController.updateUser);

export default router;