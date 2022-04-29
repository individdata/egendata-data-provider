import express, { Application, Request, Response } from "express";
import compression from "compression";
import jsonld from "jsonld";
import { SolidNodeClient } from "solid-node-client";


import generateClientCredentials, { setupPod, subscribeInbox } from "./util/generateClientCredentials.js";
import { WebhookController } from "./controller/webhookController.js";
import { port } from "./constants/index.js";

// import { readFileSync } from "node:fs";

const app: Application = express();

// Express configuration
app.set("port", port);

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(compression());

(async () => {
  const { accessToken, dpopKey } = await generateClientCredentials();
  await setupPod(accessToken, dpopKey);
  await subscribeInbox(accessToken, dpopKey);
})();



app.get("/", (req: Request, res: Response) =>
  res.send("Welcome to AF Data Provider App")
);

app.post("/webhook", WebhookController);

export default app;
