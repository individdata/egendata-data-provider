import errorHandler from 'errorhandler';
import express, { Application } from 'express';
import compression from 'compression';
import { setupPod, subscribeToInbox, fetchAccessTokenAndDpopKey } from './util/solid';
import { WebhookController } from './controller/webhookController';
import { port, keyPath, podProviderBaseUrl, clientId, clientSecret } from './config';
import { loadKey } from './util/vc';

const app: Application = express();
app.set('port', port);
app.use(express.json());
app.use(express.urlencoded());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

app.get('/', (req: any, res: any) =>
  res.send('Welcome to AF Data Provider App'),
);

(async () => {
  console.log('Loading key from:', keyPath);
  const sourceUrl = `${podProviderBaseUrl}/arbetsformedlingen/`;
  const key = await loadKey(keyPath, { id: `${sourceUrl}key`, controller: `${sourceUrl}controller` });
  const webHookController = new WebhookController(key);

  app.post('/webhook', (req, res) => webHookController.handle(req, res));

  const { accessToken, dpopKey } = await fetchAccessTokenAndDpopKey(clientId, clientSecret);
  console.log('accessToken:', accessToken);
  console.log('dpopKey:', dpopKey);
  const setupPodResult = await setupPod(accessToken, dpopKey);
  console.log('setupPodResult:', setupPodResult);
  const subscriptionResponse = await subscribeToInbox(accessToken, dpopKey);
  console.log('Subscription response:', subscriptionResponse);
})();

export default app;
