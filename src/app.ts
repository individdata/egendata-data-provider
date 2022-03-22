import express, { Application, Request, Response } from "express";
import compression from "compression";
import jsonld from "jsonld";

const app: Application = express();

// Express configuration
app.set("port", process.env.PORT || 3001);

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(compression());

app.get("/", (req: Request, res: Response) => res.send("Welcome to AF Data Provider App"));

app.get("/toto", (req: Request, res: Response) => {
    res.send("Hello toto");
});

export default app;
