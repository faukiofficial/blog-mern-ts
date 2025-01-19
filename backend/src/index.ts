import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import path from 'path';

import { databaseConnect } from './config/databaseConnect';
dotenv.config();
// const __dirname = path.resolve();

databaseConnect();

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));

app.get('/test', (req: Request, res: Response) => {
    res.send('Server is running');
});

// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../frontend/dist')));

//     app.get('*', (req: Request, res: Response) => {
//         res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
//     });
// }

const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})