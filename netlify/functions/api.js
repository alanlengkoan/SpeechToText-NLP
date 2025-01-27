import express, {
    Router
} from "express";
import cors from "cors";
import path from "path";
import { Voice } from "./models/voice.js";
import serverless from 'serverless-http';

const app = express();

const __dirname = path.resolve();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

const router = Router();

// untuk tampilkan halaman utama
router.get("/", (req, res) => {
    res.send("halaman utama");
});

router.get("/voice", async (req, res) => {
    const voice = await Voice();

    res.json({
        success: true,
        message: "success",
        data: voice
    }, 200);
});

app.use('/api/', router);

export const handler = serverless(app);

// const port = process.env.PORT || 5000;
// const host = process.env.HOST || 'localhost';

// app.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}/api`);
// });