import ApiError from "../exceptions/ApiError.js";
import TokenService from "../services/TokenService.js";

export default function (req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const splittedHeader = authHeader.split(' ');
        const accessToken = splittedHeader[1];

        if (!accessToken || splittedHeader[0] !== 'Bearer') {
            req.user = null;
            next();
            return;
        }

        const userData = TokenService.validateAccessToken(accessToken);
        if(!userData) {
            throw next(ApiError.UnauthorizedError());
        }

        req.user = userData;
        next();
    } catch (e) {
        req.user = null;
        next();
    }
}