import express from "express";
import dotEnv from "dotenv";
import ServerlessHttp from "serverless-http";

dotEnv.config({
    path: "./.env"
});

const app = express();

app.get("/.netlify/functions/index", (req, res) => {
    return res.json({
        "message": "Hello World"
    });
});

if (process.env.APP_STAGE === 'dev') {
    const port = process.env.PORT || 5000;
    const host = process.env.HOST || 'localhost';

    app.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
    });
} else {
    const server = ServerlessHttp(app);

    module.exports.handler = async (event, context) => {
        return await server(event, context);
    }
}