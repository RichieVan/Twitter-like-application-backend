import ApiError from '../exceptions/ApiError.js';
import sqlz from 'sequelize';
const { ValidationError, UniqueConstraintError } = sqlz;

export default function (error, req, res, next) {
    console.log(error);
    if (error instanceof ApiError) {
        return res.status(error.status).json({message: error.message, errors: error.errors});
    }

    if (error instanceof UniqueConstraintError) {
        let errors = [
            'Пользователь с указанным логином или E-mail\'ом уже существует'
        ]
        
        return res.status(400).json({errors});
    }

    if (error instanceof ValidationError) {
        let errors = error.errors.map((err, index) => {
            return err.message;
        })
        
        return res.status(400).json({errors});
    }

    return res.status(500).json({message: 'Неизвестная ошибка'});
}