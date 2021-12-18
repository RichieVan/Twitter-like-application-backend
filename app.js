import express from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import sequelize from './models/index.js';
import cookieParser from 'cookie-parser';

//import routers
import PostRouter from './routers/PostRouter.js';
import UserRouter from './routers/UserRouter.js';

//import middlewares
import ErrorMiddleware from './middlewares/ErrorMiddleware.js';

import TokenService from './services/TokenService.js';

const app = express();
const port = process.env.PORT;
export const ApiFolderPath = dirname(fileURLToPath(import.meta.url));

//app.use();
app.use((req, res, next) => { //must use cors() instead
    res.append('Access-Control-Allow-Origin', [process.env.APP_URL]),
    res.append('Access-Control-Allow-Methods', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    res.append('Access-Control-Allow-Headers', ['Content-Type', 'Authorization']);
    res.append('Access-Control-Allow-Credentials', true);
    next();
})
app.use(express.json());
app.use(cookieParser());
app.use(express.static(resolve(ApiFolderPath, 'public')));
app.get('/', (req, res) => {res.send('home')})
app.use('/api', UserRouter);
app.use('/api', PostRouter);
app.use(ErrorMiddleware)

try {
    await sequelize.authenticate();
    await sequelize.sync({alter : true});
    app.listen(port, () => {
        console.log(`App listening at localhost:${port}`);

        await sequelize.query(
            `
                UPDATE public.users
                SET avatar='default'
                WHERE id > 0;
            `
        )


        TokenService.deleteExpiredTokens();
        setInterval(() => {
            TokenService.deleteExpiredTokens();
        }, process.env.REFRESH_ALIVE_DAYS * 24 * 60 * 60 * 1000 / 2);
    })
} catch (e) {
    console.log(e);
}
