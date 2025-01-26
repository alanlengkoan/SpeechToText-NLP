import express, {
    Router
} from "express";
import serverless from 'serverless-http';

const app = express();

const router = Router();

router.get("/", (req, res) => {
    res.send("hello world");
});

router.get("/halo", (req, res) => {
    res.json({
        message: "hai world"
    });
});

app.use('/api/', router);

export const handler = serverless(app);