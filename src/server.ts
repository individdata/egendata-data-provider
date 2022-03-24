import errorHandler from "errorhandler";
import { SolidNodeClient } from "solid-node-client";

import generateToken from "./util/generate-token";
import { readFileSync } from "node:fs";
import app from "./app";

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
  app.use(errorHandler());
}
// generateToken().then(async () => {
// 	const credentials = JSON.parse(
//     readFileSync("./sink-credentials.json", "utf8")
//   );
//   const client = new SolidNodeClient();
//   const session = await client.login(credentials);
// 	if (!session.isLoggedIn) throw new Error("Could not login as source");
// 	console.log("Logged in as: ", session.webId);
// });
/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

export default server;
