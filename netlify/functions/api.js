import express from "express";
import cors from "cors";
import serverless from 'serverless-http';
import router from "./router/routes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use('/api/', router);

export const handler = serverless(app);

// const port = process.env.PORT || 5000;
// const host = process.env.HOST || 'localhost';

// app.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}/api`);
// });