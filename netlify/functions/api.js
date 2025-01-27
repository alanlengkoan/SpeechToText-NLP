import express, {
    Router
} from "express";
import cors from "cors";
import dialogflow from "@google-cloud/dialogflow";
import {
    Voice
} from "./models/voice.js";
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
} from "./configs/firebase.js";
import serverless from 'serverless-http';

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

const router = Router();

// untuk tampilkan halaman utama
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "hello world"
    }, 200);
});

// untuk mengambil data voice
router.get("/voice", async (req, res) => {
    const voice = await Voice();

    res.json({
        success: true,
        message: "success",
        data: voice
    }, 200);
});

// untuk mendeteksi bahasa
router.post("/detect", async (req, res) => {
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

// untuk memberikan respon terjemahan
router.post("/webhook", async (req, res) => {
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

app.use('/api/', router);

export const handler = serverless(app);

// const port = process.env.PORT || 5000;
// const host = process.env.HOST || 'localhost';

// app.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}/api`);
// });