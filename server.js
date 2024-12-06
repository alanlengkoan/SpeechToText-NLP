import express from "express";
import expressEjsLayouts from "express-ejs-layouts";
import cors from "cors";
import path from "path";
import {
    fileURLToPath
} from "url";
import router from "./src/router/routes.js";

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

app.use(router);

const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost';

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});