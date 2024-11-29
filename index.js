import express from "express";
import expressEjsLayouts from "express-ejs-layouts";
import cors from "cors";
import path from "path";
import {
    fileURLToPath
} from "url";
import {
    voice
} from "./src/models/voice.js";

const app = express();

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '/public')));

app.use(expressEjsLayouts);

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/src/views'));

app.set('layout extractScripts', true);

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost';

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

app.get("/", (req, res) => {
    var data = {
        halaman: 'Home',
        layout: 'base',
    };

    res.render('home', data);
});

app.get("/voice", async (req, res) => {
    const list = await voice();

    var data = {
        halaman: 'Voice',
        layout: 'base',
        list: list
    };

    res.render('voice', data);
});