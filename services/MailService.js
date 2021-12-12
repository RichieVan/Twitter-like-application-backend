import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class MailService {
    constructor () {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })
    }

    async sendActivationMail (to, userId, link) {
        const activationLink = process.env.BASE_URL + `/api/activate/?user=${userId}&link=${link}`;
        await this.transporter.sendMail({
            from: '"Test site" <rvsweb.dev@gmail.com>',
            to: to,
            subject: 'Подтверждение регистрации пользователя',
            text: '',
            html: `<p>Тестовое сообщение с подтверждением регистрации</p><p>Ссылка: <a href="${activationLink}">${activationLink}<a/></p>`
        })
    }
}

export default new MailService();