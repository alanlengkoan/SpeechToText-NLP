import fs from "fs";
import dialogflow from "dialogflow";
import {
    Router
} from "express";
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp
} from "firebase/firestore";
import {
    voice
} from "./../models/voice.js";
import {
    db
} from "./../configs/firebase.js";

const router = Router();

router.get("/", (req, res) => {
    var data = {
        halaman: 'Home',
        layout: 'base',
    };

    res.render('home/view', data);
});

router.get("/import", (req, res) => {
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

router.get("/idtobu", async (req, res) => {
    var data = {
        halaman: 'Indonesia To Bugis',
        layout: 'base',
    };

    res.render('idtobu/view', data);
});

router.get("/butoid", async (req, res) => {
    const list = await voice();

    var data = {
        halaman: 'Bugis To Indonesia',
        layout: 'base',
        list: list
    };

    res.render('butoid/view', data);
});

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