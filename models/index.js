import sqlz from 'sequelize';

//Импорт моделей
import postModel from './PostModel.js';
import userModel from './UserModel.js';
import tokenModel from './TokenModel.js';
import commentModel from './CommentModel.js';
import likeModel from './LikeModel.js';
import subscribitionModel from './SubscribitionModel.js';

const {Sequelize} = sqlz;

const sequelize = process.env.DATABASE_URL 
    ? new Sequelize(process.env.DATABASE_URL)
    : new Sequelize(
        process.env.PG_DB, 
        process.env.PG_DB_USER, 
        process.env.PG_DB_PASS, 
        {
            dialect : process.env.PG_DB_DIALECT,
            host : process.env.PG_DB_HOST,
            port : process.env.PG_DB_PORT
        }
    )

//Определение моделей
const Post = sequelize.define(postModel.modelName, postModel.attributes);
const User = sequelize.define(userModel.modelName, userModel.attributes);
const Token = sequelize.define(tokenModel.modelName, tokenModel.attributes, tokenModel.props);
const Comment = sequelize.define(commentModel.modelName, commentModel.attributes, commentModel.props);
const Like = sequelize.define(likeModel.modelName, likeModel.attributes, likeModel.props);
const Subscribe = sequelize.define(subscribitionModel.modelName, subscribitionModel.attributes, subscribitionModel.props);

//Зависимости
User.hasMany(Post, {onDelete : 'cascade'});
User.hasOne(Token, {onDelete : 'cascade'})

Post.belongsToMany(Post, {through : Comment, as : 'CmPosts', foreignKey: 'postId'});
Post.belongsToMany(Post, {through : Comment, as : 'CmComments', foreignKey: 'commentId', onDelete : 'cascade'});

Post.belongsToMany(User, {through : Like, as : 'Likes', foreignKey: 'postId', onDelete : 'cascade'});
User.belongsToMany(Post, {through : Like, as : 'LkUsers', foreignKey: 'userId'});

User.belongsToMany(User, {through : Subscribe, as : 'SubUser', foreignKey: 'userId'});
User.belongsToMany(User, {through : Subscribe, as : 'SubSubscriber', foreignKey: 'subscriberId', onDelete : 'cascade'});

Token.belongsTo(User);

export default sequelize;