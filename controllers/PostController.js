import PostService from "../services/PostService.js";

class PostController {
    async create (req, res, next) {
        try {
            const posts = await PostService.create(req.user, req.body);
            res.status(201).json(posts);
        } catch (e) {
            next(e);
        }
    }

    async createComment (req, res, next) {
        try {
            const comments = await PostService.createComment(req.body);
            res.status(201).json(comments);
        } catch (e) {
            next(e);
        }
    }

    async getComments (req, res, next) {
        try {
            const post = await PostService.getComments(req.params.postId, req.user);
            res.status(201).json(post);
        } catch (e) {
            next(e);
        }
    }

    async getAllByUserId (req, res, next) {
        try {
            const posts = await PostService.getAllByUserId(req.query.userId);
            res.status(200).json(posts);
        } catch (e) {
            next(e);
        }
    }

    async getAll (req, res, next) {
        try {
            const posts = await PostService.getAll(req.user);
            res.status(200).json(posts);
        } catch (e) {
            next(e);
        }
    }

    async getFeed (req, res, next) {
        try {
            const result = await PostService.getFeed(req.user, req.query);
            res.status(200).json(result);
        } catch (e) {
            next(e);
        }
    }

    async loadMore (req, res, next) {
        try {
            const result = await PostService.loadMore(req.user, req.query);
            res.status(200).json(result);
        } catch (e) {
            next(e);
        }
    }

    async syncPosts (req, res, next) {
        try {
            const result = await PostService.syncPosts(req.user, req.query);
            res.status(200).json(result);
        } catch (e) {
            next(e);
        }
    }

    async getById (req, res, next) {
        try {
            console.log(req.params.id);
            const post = await PostService.getById(req.params.id, req.user);
            res.status(200).json(post);
        } catch (e) {
            next(e);
        }
    }

    async addLike (req, res, next) {
        try {
            const likesCount = await PostService.addLike(req.body.id, req.user.id);
            res.status(200).json(likesCount);
        } catch (e) {
            next(e);
        }
    }

    async removeLike (req, res, next) {
        try {
            const likesCount = await PostService.removeLike(req.body.id, req.user.id);
            res.status(200).json(likesCount);
        } catch (e) {
            next(e);
        }
    }

    async deletePost (req, res, next) {
        try {
            const postId = await PostService.deletePost(req.params.id);
            res.status(200).json(postId);
        } catch (e) {
            next(e);
        }
    }

    async getNewPosts (req, res, next) {
        try {
            const posts = await PostService.getNewPosts(req.params.from);
            res.status(201).json(posts);
        } catch (e) {
            next(e);
        }
    }

    async getUserPosts (req, res, next) {
        try {
            const result = await PostService.getUserPosts(req.user, req.params.userId);
            res.status(200).json(result);
        } catch (e) {
            next(e);
        }
    }

    async loadMoreUserPosts (req, res, next) {
        try {
            const result = await PostService.loadMoreUserPosts(req.user, req.params.userId, req.query);
            res.status(200).json(result);
        } catch (e) {
            next(e);
        }
    }

    async syncUserPosts (req, res, next) {
        try {
            const result = await PostService.syncUserPosts(req.user, req.params.userId, req.query);
            res.status(200).json(result);
        } catch (e) {
            next(e);
        }
    }
}

export default new PostController();