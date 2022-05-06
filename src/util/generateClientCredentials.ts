// import fetch from "node-fetch";
// import { fetch } from "@inrupt/solid-client-authn-node";
import axios from 'axios';
import {
  createDpopHeader,
  generateDpopKeyPair,
  KeyPair,
} from '@inrupt/solid-client-authn-core';

import * as constants from '../constants/index';

export default async function generateClientCredentials() {
  const dpopKey = await generateDpopKeyPair();
  const clientId = 'arbetsformedlingen';
  const clientSecret = '2Ghr8gca88LW9zf2';

  const authString = `${encodeURIComponent(clientId)}:${encodeURIComponent(
    clientSecret,
  )}`;

  const tokenUrl = `${constants.identityProviderBaseUrl}/.oidc/token`;
  const response = await axios.post(
    tokenUrl,
    'grant_type=client_credentials&scope=webid',
    {
      headers: {
        authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
        dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
      },
    },
  );
  const { access_token: accessToken } = (await response.data) as {
    access_token: string;
  };
  return { accessToken, dpopKey };
}

export async function setupPod(accessToken: string, dpopKey: KeyPair) {
  const urls = [
    `${constants.podProviderBaseUrl}/arbetsformedlingen/oak/inbox/`,
  ];
  const promises = urls.map(async (url) =>
    axios.put(url, '', {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(url, 'GET', dpopKey),
      },
    }),
  );
  return Promise.all(promises);
}

export async function subscribeInbox(accessToken: string, dpopKey: KeyPair) {
  const subcriptionUrl = `${constants.podProviderBaseUrl}/subscription`;
  const data = {
    '@context': ['https://www.w3.org/ns/solid/notification/v1'],
    type: 'WebHookSubscription2021',
    topic: `${constants.podProviderBaseUrl}/arbetsformedlingen/oak/inbox/`,
    target: `${constants.baseUrl}/webhook`,
  };
  const response = await axios.post(
    subcriptionUrl,
    JSON.stringify(data),
    {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(subcriptionUrl, 'POST', dpopKey),
      },
    },
  );
  return response;
}
