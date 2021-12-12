import sqlz from 'sequelize';
const {Op} = sqlz;
import jwt from "jsonwebtoken";
import sequelize from "../models/index.js";
import ApiError from '../exceptions/ApiError.js';

class TokenService {
    generateTokens (payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_ACCESS, {'expiresIn' : '60s'})
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {'expiresIn' : (process.env.REFRESH_ALIVE_DAYS + 'd')})

        return {accessToken, refreshToken};
    }

    validateAccessToken (token) {
        try {
            const validatedToken = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
            return validatedToken;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    validateRefreshToken (token) {
        try {
            const validatedToken = jwt.verify(token, process.env.JWT_SECRET_REFRESH);
            return validatedToken;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async updateToken (userId, oldRefreshToken, refreshToken) {
        const token = await sequelize.models.token.findOne({
            where: {
                userId,
                refreshToken : oldRefreshToken
            }
        })

        if (!token) throw ApiError.UnauthorizedError();

        token.setDataValue('refreshToken', refreshToken);
        await token.save()
    }

    async saveToken (userId, refreshToken) {
        await sequelize.models.token.create({ userId, refreshToken });
    }

    async clearToken (refreshToken) {
        try {
            const dbData = await sequelize.models.token.destroy({where:{refreshToken}});
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async findTokenFromDb (refreshToken) {
        const dbData = await sequelize.models.token.findOne({
            where : {
                refreshToken
            }
        });
        return dbData;
    }

    async deleteExpiredTokens (toDate) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - process.env.REFRESH_ALIVE_DAYS);

        console.log(currentDate);

        await sequelize.models.token.destroy({
            where : {
                updatedAt : {
                    [Op.lt] : currentDate
                }
            }
        });
    }
}

export default new TokenService();