import express, {
    Router
} from "express";
import expressEjsLayouts from "express-ejs-layouts";
import path from "path";
import serverless from 'serverless-http';

const app = express();

const __dirname = path.resolve();

app.use(expressEjsLayouts);

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/src/views'));

app.set('layout extractScripts', true);

const router = Router();

// untuk tampilkan halaman utama
router.get("/", (req, res) => {
     var data = {
        halaman: 'Home',
        layout: 'base',
    };

    res.render('home/view', data);
});

app.use('/api/', router);

export const handler = serverless(app);

// const port = process.env.PORT || 5000;
// const host = process.env.HOST || 'localhost';

// app.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}/api`);
// });