import {
    Router
} from "express";
import {
    Voice
} from "../models/voice.js";
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
} from "../configs/firebase.js";
import {
    SessionsClient
} from "@google-cloud/dialogflow";
import fs from "fs";

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

// untuk import data voice ke firebase
router.get("/import", (req, res) => {
    const jsonStringData = fs.readFileSync("./uploads/dataResource.json");
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

        const sessionClient = new SessionsClient(config);
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

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

export default router;