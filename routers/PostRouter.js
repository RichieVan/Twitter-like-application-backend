import Router from 'express';
import PostController from '../controllers/PostController.js'
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import SetUserMiddleware from '../middlewares/SetUserMiddleware.js';

const router = new Router();

router.post('/posts', AuthMiddleware, PostController.create);
router.post('/comments', AuthMiddleware, PostController.createComment);

router.get('/comments/:postId', SetUserMiddleware, PostController.getComments);
router.get('/posts', AuthMiddleware, PostController.getFeed);
router.get('/posts/user/:userId', SetUserMiddleware, PostController.getUserPosts);
router.get('/posts/loadmore', SetUserMiddleware, PostController.loadMore);
router.get('/posts/sync', AuthMiddleware, PostController.syncPosts);
router.get('/posts/user/:userId/sync', SetUserMiddleware, PostController.syncUserPosts);
router.get('/posts/user/:userId/loadmore', SetUserMiddleware, PostController.loadMoreUserPosts);

router.get('/posts/one/:id', SetUserMiddleware, PostController.getById);
router.get('/posts/new', AuthMiddleware, PostController.getNewPosts);

router.put('/posts/like', AuthMiddleware, PostController.addLike);
router.put('/posts/unlike', AuthMiddleware, PostController.removeLike);

router.delete('/posts/:id', AuthMiddleware, PostController.deletePost);

export default router;