import sequelize from "../models/index.js";
import CalculatePostTimestamps from "../functions/calculatePostTimestamps.js";
import UserService from "../services/UserService.js";
import PostDto from "../dtos/PostDto.js";
import UserDto from "../dtos/UserDto.js";

import sqlz from 'sequelize';
const {Op, QueryTypes, Model, Sequelize} = sqlz;

class PostService {
    async create (data) {
        let result;
        
        const newPost = await sequelize.models.post.create({
            textContent : data.textContent,
            userId: data.userId,
            type: 'post'
        })

        
        if (data.from !== null) {
            const posts = await sequelize.query(
                `
                SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                    FROM public.posts
                    LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                    LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                    WHERE "posts"."type" = 'post' and "posts"."createdAt" >= :fromTimestamp and "posts"."id" >= :fromId
                    GROUP BY "posts"."id"
                    ORDER BY "posts"."createdAt" DESC;
                `,
                {
                    replacements : {...data.from},
                    type : QueryTypes.SELECT
                }
            )
            result = posts;
        } else {
            result = [newPost];
        }
        

        const content = await this.formatPosts(result);
        return content;
    }

    async formatPosts (posts) {
        let content = [];
        let userDtos = {};

        for (let i = 0; i < posts.length; i++) {
            const createdAt = CalculatePostTimestamps(posts[i].createdAt)
            const updatedAt = CalculatePostTimestamps(posts[i].updatedAt)
            
            if (posts[i] instanceof Model) {
                posts[i].setDataValue('createdAt', createdAt)
                posts[i].setDataValue('updatedAt', updatedAt)
            } else {
                posts[i].createdAt = createdAt
                posts[i].updatedAt = updatedAt
            }

            if (typeof userDtos[posts[i].userId] == 'undefined') {
                userDtos[posts[i].userId] = new UserDto(await UserService.getById(posts[i].userId))
            }

            content.push(new PostDto(
                posts[i], 
                userDtos[posts[i].userId]
            ));
        }

        return content;
    }

    async getAllByUserId (userId) {
        const posts = await sequelize.models.post.findAll({
            where: {userId},
            order: [
                ['createdAt', 'DESC']
            ]
        });

        const content = await this.formatPosts(posts);
        return content;
    }

    async getAll (user) {
        // const test = await sequelize.models.post.findAll({
        //     attributes: {
        //         include : [
        //             'id', 'textContent', 'createdAt', 'updatedAt', 'userId',
        //             [Sequelize.fn('COUNT', [Sequelize.literal(`DISTINCT "Likes.id"`), Sequelize.col('Likes.id')]), 'likesCount'], 
        //             [Sequelize.fn('COUNT', [Sequelize.literal(`DISTINCT "CmComments.id"`), Sequelize.col('CmComments.id')]), 'commentsCount']
        //         ]
        //     },
        //     where : {
        //         type : 'post'
        //     },
        //     order : [['createdAt', 'DESC']],
        //     include : [
        //         {
        //             model : sequelize.models.user,
        //             as : 'Likes',
        //             attributes: [],
        //             required : false
        //         },
        //         {
        //             model : sequelize.models.post,
        //             as : 'CmComments',
        //             attributes: [],
        //             required : false
        //         }
        //     ],
        //     group : 'post.id'
        // });

        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE "posts"."type" = 'post'
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC;
            `,
            {
                type : QueryTypes.SELECT
            }
        )

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return content;
    }

    async getFeed (user, params) {
        let canLoadMore = false;
        params.forSubs = params.forSubs == 'true';
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE 
                    "posts"."type" = 'post'
                    ${params.forSubs ? 'and ("posts"."userId" in (SELECT "userId" FROM public.subscribitions WHERE "subscriberId" = :userId) or "posts"."userId" = :userId)' : ''}
                GROUP BY 
                    "posts"."id"
                ORDER BY 
                    "posts"."createdAt" DESC, "posts"."id" DESC
                LIMIT 11;
            `,
            {
                replacements : {
                    userId : user.id
                },
                type : QueryTypes.SELECT
            }
        )

        if (posts.length > 10) {
            canLoadMore = true;
            posts.pop();
        }

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return {
            posts : content,
            canLoadMore
        };
    }

    async loadMore (user, params) {
        let canLoadMore = false;
        params.forSubs = params.forSubs == 'true';
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE 
                    "posts"."type" = 'post' and 
                    "posts"."createdAt" <= :fromTimestamp and 
                    "posts"."id" < :fromId 
                    ${params.forSubs ? 'and ("posts"."userId" in (SELECT "userId" FROM public.subscribitions WHERE "subscriberId" = :userId) or "posts"."userId" = :userId)' : ''}
                GROUP BY 
                    "posts"."id"
                ORDER BY 
                    "posts"."createdAt" DESC, 
                    "posts"."id" DESC
                LIMIT 11;
            `,
            {
                replacements : {
                    ...params,
                    userId : user.id
                },
                type : QueryTypes.SELECT
            }
        )

        if (posts.length > 10) {
            canLoadMore = true;
            posts.pop();
        }

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return {
            posts : content,
            canLoadMore
        };
    }

    async syncPosts (user, params) {
        params.forSubs = params.forSubs == 'true';
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE 
                    "posts"."type" = 'post' and 
                    "posts"."createdAt" >= :fromTimestamp and 
                    "posts"."id" >= :fromId
                    ${params.forSubs ? 'and ("posts"."userId" in (SELECT "userId" FROM public.subscribitions WHERE "subscriberId" = :userId) or "posts"."userId" = :userId)' : ''}
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC;
            `,
            {
                replacements : {
                    ...params,
                    userId : user.id
                },
                type : QueryTypes.SELECT
            }
        )

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return content;
    }

    async getById (postId, user) {
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE "posts"."type" = 'post' and "posts"."id" = :postId
                GROUP BY "posts"."id";
            `,
            {
                replacements : {postId : parseInt(postId)},
                type : QueryTypes.SELECT
            }
        )

        if (posts.length == 0) return null;

        if (user) {
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];

                if (post.likesCount > 0) {
                    const isUserLiked = await sequelize.models.like.findOne({
                        where : {
                            userId : user.id,
                            postId : post.id
                        }
                    })

                    if (isUserLiked) post.currentUserLiked = true;
                }
            }
        }

        const content = await this.formatPosts(posts);
        return content[0];
    }

    async createComment (commentData) {
        const newComment = await sequelize.models.post.create({
            textContent : commentData.textContent,
            userId: commentData.userId,
            type: 'comment'
        })

        await sequelize.models.comment.create({
            postId : commentData.postId,
            commentId : newComment.id
        })

        let comments;
        if (commentData.from > 0) {
            comments = await sequelize.query(
                `
                SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", false as "currentUserLiked"
                    FROM public.comments
                    INNER JOIN (public.posts LEFT JOIN public.likes on "posts"."id" = "likes"."postId") on "posts"."id" = "comments"."commentId"
                    WHERE "posts"."type" = 'comment' and "posts"."createdAt" >= :fromTimestamp and "posts"."id" >= :fromId and "comments"."postId" = :postId
                    GROUP BY "posts"."id"
                    ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC;
                `,
                {
                    replacements : {
                        ...data.from, 
                        postId : commentData.postId
                    },
                    type : QueryTypes.SELECT
                }
            )
        } else {
            comments = await sequelize.query(
                `
                SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", false as "currentUserLiked"
                    FROM public.comments
                    INNER JOIN (public.posts LEFT JOIN public.likes on "posts"."id" = "likes"."postId") on "posts"."id" = "comments"."commentId"
                    WHERE "posts"."id" = :postId
                    GROUP BY "posts"."id"
                    ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC;
                `,
                {
                    replacements : {
                        postId : parseInt(newComment.id)
                    },
                    type : QueryTypes.SELECT
                }
            )
        }
        
        const content = this.formatPosts(comments);
        return content;
    }

    async getComments (postId, user) {
        const comments = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", false as "currentUserLiked"
                FROM public.comments
                INNER JOIN (public.posts LEFT JOIN public.likes on "posts"."id" = "likes"."postId") on "posts"."id" = "comments"."commentId"
                WHERE "comments"."postId" = :postId
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC;
            `,
            {
                replacements : {postId : parseInt(postId)},
                type : QueryTypes.SELECT
            }
        )

        if (user) {
            await this.checkLikedByUser(comments, user);
        }
        
        const content = await this.formatPosts(comments);
        return content;
    }

    async addLike (postId, userId) {
        const existingLike = await sequelize.models.like.findOne({
            where : {postId, userId}
        })

        if (!existingLike) {
            await sequelize.models.like.create({postId, userId})
        }

        const likesCount = await sequelize.models.like.count({
            where : {postId}
        });

        return likesCount;
    }

    async removeLike (postId, userId) {
        const deletedLike = await sequelize.models.like.destroy({
            where : {postId, userId}
        })

        const likesCount = await sequelize.models.like.count({
            where : {postId}
        });

        return likesCount;
    }

    async deletePost (id) {
        //deleting comments 
        await sequelize.query(
            `
            DELETE FROM public.posts
            WHERE "posts"."id" IN (
                SELECT "posts"."id" FROM public.posts
                INNER JOIN public.comments on "posts"."id" = "comments"."commentId"
                WHERE "comments"."postId" = :postId
            )
            `,
            {
                replacements : {postId : parseInt(id)},
                type : QueryTypes.DELETE
            }
        )

        //deleting post 
        await sequelize.models.post.destroy({
            where : {id}
        })

        return id;
    }

    async getNewPosts (from) {
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE "posts"."type" = 'post' and "posts"."id" > :postId
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC;
            `,
            {
                replacements : {postId : parseInt(from)},
                type : QueryTypes.SELECT
            }
        )

        const content = await this.formatPosts(posts);
        return content;
    }

    async checkLikedByUser (posts, user) {
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];

            if (post.likesCount > 0) {
                const isUserLiked = await sequelize.models.like.findOne({
                    where : {
                        userId : user.id,
                        postId : post.id
                    }
                })

                if (isUserLiked) post.currentUserLiked = true;
            }
        }
        return posts;
    }

    async getUserPosts (user, targetUserId) {
        let canLoadMore = false;
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE "posts"."type" = 'post' and "posts"."userId" = :targetUserId
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC
                LIMIT 11;
            `,
            {
                replacements : {targetUserId},
                type : QueryTypes.SELECT
            }
        )

        if (posts.length > 10) {
            canLoadMore = true;
            posts.pop();
        }

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return {
            posts : content,
            canLoadMore
        };
    }

    async syncUserPosts (user, targetUserId, from) {
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE "posts"."type" = 'post' and "posts"."createdAt" >= :fromTimestamp and "posts"."id" >= :fromId and "posts"."userId" = :targetUserId
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC;
            `,
            {
                replacements : {
                    targetUserId,
                    ...from
                },
                type : QueryTypes.SELECT
            }
        )

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return content;
    }

    async loadMoreUserPosts (user, targetUserId, from) {
        let canLoadMore = false;
        const posts = await sequelize.query(
            `
            SELECT "posts".*, COUNT(DISTINCT "likes"."id") as "likesCount", COUNT(DISTINCT "comments"."id") as "commentsCount", false as "currentUserLiked"
                FROM public.posts
                LEFT JOIN public.likes on "posts"."id" = "likes"."postId"
                LEFT JOIN public.comments on "posts"."id" = "comments"."postId"
                WHERE "posts"."type" = 'post' and "posts"."createdAt" <= :fromTimestamp and "posts"."id" < :fromId and "posts"."userId" = :targetUserId
                GROUP BY "posts"."id"
                ORDER BY "posts"."createdAt" DESC, "posts"."id" DESC
                LIMIT 11;
            `,
            {
                replacements : {
                    targetUserId,
                    ...from
                },
                type : QueryTypes.SELECT
            }
        )

        if (posts.length > 10) {
            canLoadMore = true;
            posts.pop();
        }

        if (user) {
            await this.checkLikedByUser(posts, user);
        }

        const content = await this.formatPosts(posts);
        return {
            posts : content,
            canLoadMore
        };
    }
}

export default new PostService();