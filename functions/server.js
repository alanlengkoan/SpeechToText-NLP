import express from "express";
import dotEnv from "dotenv";
import ServerlessHttp from "serverless-http";

dotEnv.config({
    path: "./.env"
});

const app = express();

app.get("/.netlify/functions/api", (req, res) => {
    res.json({
        "message": "Hello World"
    });
});

ServerlessHttp(app);