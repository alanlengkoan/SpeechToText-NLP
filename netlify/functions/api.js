import express, {
    Router
} from "express";
import expressEjsLayouts from "express-ejs-layouts";
import path from "path";
import {
    fileURLToPath
} from "url";
import serverless from 'serverless-http';

const app = express();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

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