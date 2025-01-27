import express, {
    Router
} from "express";
import path from "path";
import serverless from 'serverless-http';

const app = express();

const __dirname = path.resolve();

const router = Router();

// untuk tampilkan halaman utama
router.get("/", (req, res) => {
    res.render('halaman utama');
});

app.use('/api/', router);

export const handler = serverless(app);

// const port = process.env.PORT || 5000;
// const host = process.env.HOST || 'localhost';

// app.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}/api`);
// });