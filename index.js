import express from "express";
import expressEjsLayouts from "express-ejs-layouts";
import cors from "cors";
import path from "path";
import fs from "fs";
import dialogflow from "dialogflow";
import {
    fileURLToPath
} from "url";
import {
    voice
} from "./src/models/voice.js";
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp
} from "firebase/firestore";
import {
    db
} from "./src/configs/firebase.js";
import {
    log
} from "console";

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

    res.render('home/view', data);
});

app.get("/import", (req, res) => {
    const jsonStringData = fs.readFileSync("./public/dataResource.json");
    let dataResource = JSON.parse(jsonStringData);
    let no = 1;

    dataResource.forEach(async (data) => {
        const count = no++;
        const tblVoice = collection(db, 'Voice');
        const qryVoice = query(tblVoice);
        const getVoice = await getDocs(qryVoice);

        if (getVoice.empty) {
            const addData = {
                female: data.female,
                male: data.male,
                text: data.text,
                created: serverTimestamp(),
            }

            addDoc(tblVoice, addData).then((res) => {
                console.log('Voice berhasil ditambahkan => ' + res.id + ' No. ' + count);
            });
        }
    });

    res.status(200).send({
        message: "Berhasil",
    });
});

app.get("/idtobu", async (req, res) => {
    var data = {
        halaman: 'Indonesia To Bugis',
        layout: 'base',
    };

    res.render('idtobu/view', data);
});

app.get("/butoid", async (req, res) => {
    const list = await voice();

    var data = {
        halaman: 'Bugis To Indonesia',
        layout: 'base',
        list: list
    };

    res.render('butoid/view', data);
});

app.post("/detect", async (req, res) => {
    try {
        var translate = [];
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

        const tblTranslate = collection(db, 'Translate');
        const qryTranslate = query(tblTranslate, orderBy('created', 'desc'));
        const docTranslate = await getDocs(qryTranslate);

        docTranslate.forEach((doc) => {
            translate.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).send({
            message: "Berhasil",
            text: "Pesan Terkirim",
            id: translate[0].id,
            fulfillmentText: translate[0].fulfillmentText
        });
    } catch (error) {
        res.status(400).send({
            message: "Gagal",
            text: error.message
        });
    }
});

app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        const result = data.queryResult;

        const tblTranslate = collection(db, 'Translate');
        const qryTranslate = query(tblTranslate);
        const getTranslate = await getDocs(qryTranslate);

        if (getTranslate.empty) {
            console.log('Collection does not exist');

            const data = {
                fulfillmentText: result.fulfillmentText,
                created: serverTimestamp(),
            }

            addDoc(tblTranslate, data).then((res) => {
                console.log('Translate berhasil ditambahkan => ' + res.id);
            });

            res.status(200).send({
                message: "Berhasil",
            });
        } else {
            console.log('Collection does exist');

            const data = {
                fulfillmentText: result.fulfillmentText,
                created: serverTimestamp(),
            }

            addDoc(tblTranslate, data).then((res) => {
                console.log('Translate berhasil ditambahkan => ' + res.id);
            });

            res.status(200).send({
                message: "Berhasil",
            });
        }
    } catch (error) {
        res.status(400).send({
            message: "Gagal",
            text: error.message
        });
    }
});