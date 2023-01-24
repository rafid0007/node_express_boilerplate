import app from './app.js';
import connectDatabase from './config/database.js';
import dotenv from 'dotenv';

// Handling Uncaught Exception
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
});

// Config
dotenv.config({ path: 'config/config.env' });

// Connecting to database
connectDatabase();

const server = app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is working on :${process.env.PORT || 8000}`);
});

// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);

    server.close(() => {
        process.exit(1);
    });
});
