import errorHandler from 'errorhandler';
import express, { Application } from 'express';
import compression from 'compression';
// import { setupPod, subscribeToInbox, fetchAccessTokenAndDpopKey } from './util/solid';
// import { WebhookController } from './controller/webhookController';
// import { port, keyPath, podProviderBaseUrl, clientId, clientSecret } from './config';
// import { loadKey } from './util/vc';

const app: Application = express();
app.set('port', 3003);
app.use(express.json({ type: ['application/json', 'application/ld+json'] }));
app.use(express.urlencoded());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

app.get('/', (req: any, res: any) =>
  res.send('Welcome to Egendata Data Provider'),
);
/* 
(async () => {
  console.log('Loading key from:', keyPath);
  const sourceUrl = `${podProviderBaseUrl}/arbetsformedlingen/`;
  const key = await loadKey(keyPath, { id: `${sourceUrl}key`, controller: `${sourceUrl}controller` });
  const webHookController = new WebhookController(key);

  app.post('/webhook', (req, res) => webHookController.handle(req, res));

  const { accessToken, dpopKey } = await fetchAccessTokenAndDpopKey(clientId, clientSecret);
  console.log('accessToken:', accessToken);
  console.log('dpopKey:', dpopKey);
  try {
    try {
      const setupPodResult = await setupPod(accessToken, dpopKey);
      console.log('setupPodResult:', setupPodResult);
    } catch (err) {
      console.log('Pod setup error:', err);
    }
    const subscriptionResponse = await subscribeToInbox(accessToken, dpopKey);
    console.log('Subscription response:', subscriptionResponse);
  } catch (err) {
    console.log('Subscription error:', err);
  }
})();
 */
export default app;
