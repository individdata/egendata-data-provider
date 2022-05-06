import express, { Application } from 'express';
import compression from 'compression';

import generateClientCredentials, { setupPod, subscribeInbox } from './util/generateClientCredentials';
import { WebhookController } from './controller/webhookController';
import { port, keyPath, podProviderBaseUrl } from './constants/index';

import { loadKey } from './util/vc';

// Express configuration
const app: Application = express();
app.set('port', port);

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(compression());

(async () => {
  console.log('Loading key from:', keyPath);
  const sourceUrl = `${podProviderBaseUrl}/arbetsformedlingen/`;
  const key = await loadKey(keyPath, { id: `${sourceUrl}key`, controller: `${sourceUrl}controller` });
  const webHookController = new WebhookController(key);

  app.post('/webhook', (req, res) => webHookController.handle(req, res));

  const { accessToken, dpopKey } = await generateClientCredentials();
  console.log('accessToken:', accessToken);
  console.log('dpopKey:', dpopKey);
  const setupPodResult = await setupPod(accessToken, dpopKey);
  console.log('setupPodResult:', setupPodResult);
  const subscriptionResponse = await subscribeInbox(accessToken, dpopKey);
  console.log('Subscription response:', subscriptionResponse);
})();

app.get('/', (req: any, res: any) =>
  res.send('Welcome to AF Data Provider App'),
);

export default app;
