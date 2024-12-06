import express from "express";
import ServerlessHttp from "serverless-http";

const app = express();

app.get("/.netlify/functions/api", (req, res) => {
    res.json({
        "message": "Hello World"
    });
});

const handler = ServerlessHttp(app);

module.exports.handler = async (event, context) => {
    return await handler(event, context);
}