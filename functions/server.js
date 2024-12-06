import express from "express";
import ServerlessHttp from "serverless-http";

const app = express();
const router = express.Router();

app.use(router);

router.get("/", (req, res) => {
    res.json({
        "message": "Hello World"
    });
});

export async function handler(event, context) {
    return ServerlessHttp(app)(event, context);
}