import express from "express";
import ServerlessHttp from "serverless-http";

const app = express();

app.get("/", (req, res) => {
    res.json({
        "message": "Hello World"
    });
});

app.get("/.netlify/functions/api", (req, res) => {
    res.json({
        "message": "Hello World"
    });
});

export async function handler(event, context) {
    return ServerlessHttp(app)(event, context);
}