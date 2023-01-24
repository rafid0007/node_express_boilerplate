import express from 'express';
import ApiRouter from './api/index.js';
const RootRoute = express.Router();

// routes for all apis
RootRoute.use('/api/v1', ApiRouter);

// route for home url
RootRoute.get('/', (req, res) => {
    res.send(`Welcome to the Server. Currently we are in ${process.env.NODE_ENV} mode. Please use the /api/v1 route to access the API.`);
});

export default RootRoute;
