import UserService from "../services/UserService.js";

const refreshTokenCookieOptions = {
    maxAge : process.env.REFRESH_ALIVE_DAYS * 24 * 60 * 60 * 1000,
    secure : process.env.NODE_ENV !== "development",
    httpOnly : true,
    sameSite : process.env.NODE_ENV !== "development" ? 'None' : false
}

class UserController {
    async registration (req, res, next) {
        try {
            const userData = await UserService.register(req.body);
            res.cookie('refreshToken', userData.refreshToken, refreshTokenCookieOptions);

            res.status(201).json(userData);
        } catch (e) {
            next(e);
        }
    }

    async login (req, res, next) {
        try {
            const userData = await UserService.login(req.body);
            res.cookie('refreshToken', userData.refreshToken, refreshTokenCookieOptions);

            res.status(200).json(userData);
        } catch (e) {
            next(e);
        }
    }

    async logout (req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            const token = await UserService.logout(refreshToken);
            res.clearCookie('refreshToken');

            res.status(200).json(token);
        } catch (e) {
            next(e);
        }
    }

    async refresh (req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            const userData = await UserService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, refreshTokenCookieOptions);

            res.status(200).json(userData);
        } catch (e) {
            res.clearCookie('refreshToken');
            next(e);
        }
    }

    async restore (req, res, next) {

    }

    async updateAvatar (req, res, next) {
        try {
            const avatar = req.body.data;
            const userData = await UserService.updateAvatar(avatar, req.user.id, req.cookies.refreshToken);
            res.cookie('refreshToken', userData.refreshToken, refreshTokenCookieOptions);

            res.status(200).json(userData);
        } catch (e) {
            next(e);
        }
    }

    async activate (req, res, next) {
        try {
            const status = await UserService.activate(req.query.user, req.query.link);
            res.redirect(process.env.APP_URL);
        } catch (e) {
            next(e);
        }
    }

    async sendNewActivationMail (req, res, next) {
        try {
            const dateAfterCooldown = await UserService.sendNewActivationMail(req.user.id);
            res.status(200).json(dateAfterCooldown);
        } catch (e) {
            next(e);
        }
    }

    async getActivationMailCooldown (req, res, next) {
        try {
            const dateAfterCooldown = await UserService.getActivationMailCooldown(req.user.id);
            res.status(200).json(dateAfterCooldown);
        } catch (e) {
            next(e);
        }
    }

    async getOne (req, res, next) {
        try {
            const userData = await UserService.getByUsername(req.query.username, req?.user);
            res.status(200).json(userData);
        } catch (e) {
            next(e);
        }
    }

    async updateUser (req, res, next) {
        try {
            const userData = await UserService.updateUser(req.body, req.user.id, req.cookies.refreshToken);
            res.cookie('refreshToken', userData.refreshToken, refreshTokenCookieOptions);

            res.status(200).json(userData);
        } catch (e) {
            next(e);
        }
    }

    async subscribeToUser (req, res, next) {
        try {
            const subsData = await UserService.subscribeToUser(req.user, req.body.id);
            res.status(200).json(subsData);
        } catch (e) {
            next(e);
        }
    }

    async unsubscribeFromUser (req, res, next) {
        try {
            const subsData = await UserService.unsubscribeFromUser(req.user, req.body.id);
            res.status(200).json(subsData);
        } catch (e) {
            next(e);
        }
    }

    async getProfileStats (req, res, next) {
        try {
            const userData = await UserService.getProfileStats(req.params.id);
            res.status(200).json(userData);
        } catch (e) {
            next(e);
        }
    }
}

export default new UserController();