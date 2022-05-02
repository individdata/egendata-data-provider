import express, { Application, Request, Response } from "express";
import compression from "compression";
import jsonld from "jsonld";
import { SolidNodeClient } from "solid-node-client";

import generateClientCredentials, { setupPod, subscribeInbox } from "./util/generateClientCredentials.js";
import { WebhookController } from "./controller/webhookController.js";
import { port, keyPath, podProviderBaseUrl } from "./constants/index.js";

import { loadKey } from "./util/vc.js";

const sourceUrl = `${podProviderBaseUrl}/arbetsformedlingen/`;
const key = await loadKey(keyPath, { id: `${sourceUrl}key`, controller: `${sourceUrl}controller` });
const webHookController = new WebhookController(key);

const app: Application = express();

// Express configuration
app.set("port", port);

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(compression());

(async () => {
  const { accessToken, dpopKey } = await generateClientCredentials();
  console.log("accessToken:", accessToken);
  console.log("dpopKey:", dpopKey);
  const setupPodResult = await setupPod(accessToken, dpopKey);
  console.log("setupPodResult:", setupPodResult);
  const subscriptionResponse = await subscribeInbox(accessToken, dpopKey);
  console.log("Subscription response:", subscriptionResponse);
})();



app.get("/", (req: Request, res: Response) =>
  res.send("Welcome to AF Data Provider App")
);

app.post("/webhook", (req, res) => webHookController.handle(req, res));

export default app;
