import express from 'express';
import PostRouter from './PostRouter.js';
import UserRouter from './UserRouter.js';

const app = express();

app.use('/', PostRouter);
app.use('/', UserRouter);

export default app;