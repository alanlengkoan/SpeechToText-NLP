import express from "express";
import expressEjsLayouts from "express-ejs-layouts";
import cors from "cors";
import path from "path";
import dialogflow from "dialogflow";
import {
    fileURLToPath
} from "url";
import {
    voice
} from "./src/models/voice.js";
import { log } from "console";

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

app.post("/detect", async (req, res) => {
    try {
        const data = req.body;

        const credentials = JSON.parse(process.env.DIALOGFLOW_CREDENTIALS);
        const projectId = credentials.project_id;
        const sessionId = process.env.DIALOGFLOW_SESSION_ID;
        const languageCode = 'id-ID';

        const config = {
            credentials: {
                private_key: credentials.private_key,
                client_email: credentials.client_email,
            }
        };

        const sessionClient = new dialogflow.SessionsClient(config);
        const sessionPath = sessionClient.sessionPath(projectId, sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: data.message,
                    languageCode: languageCode,
                },
            },
        };

        await sessionClient.detectIntent(request);

        res.status(200).send({
            message: "Berhasil",
            text: "Pesan Terkirim"
        });
    } catch (error) {
        res.status(400).send({
            message: "Gagal",
            text: error.message
        });
    }
});

app.post("/webhook", (req, res) => {
    try {
        const data = req.body;
        const result = data.queryResult;

        console.log(result);

        // res.status(200).send({
        //     message: "Berhasil",
        //     text: result.fulfillmentText
        // });
    } catch (error) {
        res.status(400).send({
            message: "Gagal",
            text: error.message
        });
    }
});