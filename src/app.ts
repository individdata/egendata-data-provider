import express, { Application, Request, Response } from "express";
import compression from "compression";
import jsonld from "jsonld";
import { SolidNodeClient } from "solid-node-client";

import generateToken from "./util/generate-token";
import { readFileSync } from "node:fs";

const app: Application = express();

// Express configuration
app.set("port", process.env.PORT || 3001);

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(compression());

generateToken().then(async () => {
	const credentials = JSON.parse(
    readFileSync("./sink-credentials.json", "utf8")
  );
  const client = new SolidNodeClient();
  const session = await client.login(credentials);
	if (!session.isLoggedIn) throw new Error("Could not login as source");
	console.log("Logged in as: ", session.webId);
});
// Log in to pod
// (async () => {
	
//   const credentials = JSON.parse(
//     readFileSync("./sink-credentials.json", "utf8")
//   );
//   const client = new SolidNodeClient();
//   const session = await client.login(credentials);
	
// 	if (!session.isLoggedIn) throw new Error("Could not login as source");
// 	console.log("Logged in as: ", session.webId);
// })();



app.get("/", (req: Request, res: Response) =>
  res.send("Welcome to AF Data Provider App")
);

app.get("/toto", (req: Request, res: Response) => {
  res.send("Hello toto");
});

export default app;
