import express from 'express';
import userRoute from './user.route.js';
import authRoute from './auth.route.js';
import authController from '../../controllers/auth.controller.js';

const ApiRouter = express.Router();

// routes
ApiRouter.get('/health', (req, res) => res.send('API is working ' + `in ${process.env.NODE_ENV} mode`));
ApiRouter.use('/auth', authRoute); // example authentication route
ApiRouter.use('/users', authController.authenticate, userRoute); // example users route
/*
    use other routes here
 */

export default ApiRouter;
