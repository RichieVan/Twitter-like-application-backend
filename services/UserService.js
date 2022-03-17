import sqlz from 'sequelize';
const {Op} = sqlz;

import sequelize from "../models/index.js";
import argon2 from "argon2";
import * as uuid from "uuid";
import MailService from "./MailService.js";
import TokenService from './TokenService.js';
import UserDto from '../dtos/UserDto.js';
import ApiError from '../exceptions/ApiError.js';
import FileService from './FileService.js';

class UserService {
    async validateRegister (data) {
        if (data.password !== data.passwordRepeat) {
            throw ApiError.BadRequest('', ['Пароли не совпадают'])
        }

        Object.keys(data).forEach((value) => {
            data[value] = data[value].trim();
        })

        const user = sequelize.models.user.build({
            username: data.login, 
            password: data.password,
            login: data.login, //will be modified
            email: data.email
        })

        await user.validate({skip : ['passhash']}) // throws error if not validated

        user.activationLink = uuid.v4();
        user.passhash = await argon2.hash(data.password);

        return user;
    }

    async register (data) {
        const user = await this.validateRegister(data);

        await user.save();
        await MailService.sendActivationMail(user.email, user.id, user.activationLink);
        
        const userDataWithTokens = await this.getNewUserDtoWithTokens(user);
        return userDataWithTokens;
    }

    async login (data) {
        const user = await sequelize.models.user.findOne({where: {
            [Op.or] : [
                {login: data.loginOrEmail.toLowerCase()},
                {email: data.loginOrEmail}
            ]
        }});

        if (!user) {throw ApiError.BadRequest('Пользователь не найден. Проверьте правильность введенных данных и попробуйте еще раз')}

        if (!await argon2.verify(user.passhash, data.password)) {throw ApiError.BadRequest('Неверный пароль')}

        const userDataWithTokens = await this.getNewUserDtoWithTokens(user);
        return userDataWithTokens;
    }

    async logout (refreshToken) {
        const count = await TokenService.clearToken(refreshToken);
        return count;
    }

    async activate (id, activationLink) {
        const user = await sequelize.models.user.findOne({
            where: {
                id,
                activationLink
            }
        });

        if (!user) return false;
        
        user.setDataValue('isActivated', true);
        user.setDataValue('activationLink', null);
        await user.save();
        return true;
    }

    async sendNewActivationMail (userId) {
        const user = await sequelize.models.user.findByPk(userId);

        if (user.mailResendCooldown && user.mailResendCooldown > new Date()) {
            return user.mailResendCooldown;
        }

        await MailService.sendActivationMail(user.email, user.id, user.activationLink);

        const dateAfterCooldown = new Date();
        dateAfterCooldown.setSeconds(dateAfterCooldown.getSeconds() + Number(process.env.MAIL_RESEND_COOLDOWN));

        user.setDataValue('mailResendCooldown', dateAfterCooldown);
        await user.save();

        return dateAfterCooldown;
    }

    async getActivationMailCooldown (userId) {
        const user = await sequelize.models.user.findByPk(userId);

        if (user.mailResendCooldown && user.mailResendCooldown > new Date()) {
            return user.mailResendCooldown;
        }

        return null;
    }

    async refresh (refreshToken) {
        if (!refreshToken) throw ApiError.UnauthorizedError();

        const tokenData = await TokenService.findTokenFromDb(refreshToken);
        if (!tokenData) throw ApiError.UnauthorizedError();

        const validationStatus = TokenService.validateRefreshToken(refreshToken);
        if (!validationStatus && !tokenData) throw ApiError.UnauthorizedError();

        const user = await this.getById(tokenData.userId);
        const userDataWithTokens = await this.getUpdatedUserDtoWithTokens(user, refreshToken);

        return userDataWithTokens;
    }

    async getById (id) {
        const user = await sequelize.models.user.findOne({
            where: {id}
        });
        return user;
    }

    async getByUsername (username, currentUser) {
        const userData = await sequelize.models.user.findOne({
            where: {login : username.toLowerCase()}
        });

        if (currentUser) {
            const currentUserSubscribed = await sequelize.models.subscribition.findOne({
                where: {
                    subscriberId : currentUser.id,
                    userId : userData.id
                }
            })

            if (currentUserSubscribed) userData.setDataValue('currentUserSubscribed', true);
        }

        const userDto = new UserDto(userData);

        return userDto;
    }

    async getUpdatedUserDtoWithTokens (user, oldRefreshToken) {
        const userDto = new UserDto(user);
        const tokens = TokenService.generateTokens({...userDto})

        await TokenService.updateToken(userDto.id, oldRefreshToken, tokens.refreshToken);

        return {...tokens, user: userDto};
    }

    async getNewUserDtoWithTokens (user) {
        const userDto = new UserDto(user);
        const tokens = TokenService.generateTokens({...userDto})

        await TokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto};
    }

    // async updateAvatar (avatarData, userId, refreshToken) {
    //     const userData = await sequelize.models.user.findOne({
    //         where: {id : userId}
    //     });

    //     const avatarLink = uuid.v4();
        
    //     await FileService.save('public/uploads/avatar', avatarLink, 'png', avatarData)
    //     if (userData.avatar !== 'default') {
    //         await FileService.delete('public/uploads/avatar', userData.avatar, 'png');
    //     }

    //     userData.setDataValue('avatar', avatarLink);
    //     const updatedUserData = await userData.save();

    //     const result = await this.getUpdatedUserDtoWithTokens(updatedUserData, refreshToken);
        
    //     return result;
    // }

    async updateUser (userData, userId, refreshToken) {
        const user = await sequelize.models.user.findOne({
            where: {id : userId}
        });

        if (userData.avatar && userData.avatar !== user.avatar) {
            const avatarHash = await FileService.uploadImageAndSave(userData.avatar)
            if (user.avatar !== 'default') {
                await FileService.deleteImage(user.avatar)
            }
            userData.avatar = avatarHash;
        }
        
        user.set(userData)
        const updatedUserData = await user.save();
        const result = await this.getUpdatedUserDtoWithTokens(updatedUserData, refreshToken);
        
        return result;
    }

    async subscribeToUser (user, to) {
        if (!user?.id || !to) throw new ApiError.BadRequest();
        
        await sequelize.models.subscribition.create({
            userId : to,
            subscriberId : user.id
        })

        const userSubsCount = await sequelize.models.subscribition.count({
            where : {subscriberId : user.id}
        })

        const targetSubsCount = await sequelize.models.subscribition.count({
            where : {userId : to}
        })

        return {
            userSubsCount,
            targetSubsCount
        };
    }

    async unsubscribeFromUser (user, from) {
        if (!user?.id || !from) throw new ApiError.BadRequest();
        
        await sequelize.models.subscribition.destroy({
            where : {
                userId : from,
                subscriberId : user.id
            }
        })

        const userSubsCount = await sequelize.models.subscribition.count({
            where : {subscriberId : user.id}
        })

        const targetSubsCount = await sequelize.models.subscribition.count({
            where : {userId : from}
        })

        return {
            userSubsCount,
            targetSubsCount
        };
    }

    async getProfileStats (userId) {
        const subsToCount = await sequelize.models.subscribition.count({
            where : {subscriberId : userId}
        })

        const subsFromCount = await sequelize.models.subscribition.count({
            where : {userId}
        })

        const postsCount = await sequelize.models.post.count({
            where : {userId}
        })

        return {
            subsToCount,
            subsFromCount,
            postsCount
        }
    }
}

export default new UserService();