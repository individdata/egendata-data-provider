import N3 from 'n3';
import axios from 'axios';
import { createDpopHeader, KeyPair, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { v4 as uuid } from 'uuid';
import { webid } from '../config';
import { baseUrl, identityProviderBaseUrl, podProviderBaseUrl } from '../config';

const egendataPrefix = 'https://oak-pod-provider-oak-develop.test.services.jtech.se/schema/core/v1#';

export const parseLinkResourceData = (data: string) => {
  const N3Parser = new N3.Parser();
  const store = new N3.Store(N3Parser.parse(data));
  const outboundDataRequest = store.getObjects('', `${egendataPrefix}OutboundDataRequest`, '')[0].value;
  return { outboundDataRequest };
};

export const parseConsentResourceData = (data: string) => {
  const N3Parser = new N3.Parser();
  const store = new N3.Store(N3Parser.parse(data));
  const id = store.getObjects('', `${egendataPrefix}id`, '')[0].value;
  const documentType = store.getObjects('', `${egendataPrefix}documentType`, '')[0].value;
  const dataSubjectIdentifier = store.getObjects('', `${egendataPrefix}dataSubjectIdentifier`, '')[0].value;
  const dataLocation = store.getObjects('', `${egendataPrefix}dataLocation`, '')[0].value;
  const notificationInbox = store.getObjects('', `${egendataPrefix}notificationInbox`, '')[0].value;
  return { id, documentType, dataSubjectIdentifier, dataLocation, notificationInbox };
};

export const saveVCToDataLocation = async (accessToken: string, dpopKey: KeyPair, requestId: string, dataLocation: string, doc: any) => {
  const document = Buffer.from(JSON.stringify(doc), 'utf-8').toString('base64');
  const vcData = `
@prefix egendata: <${egendataPrefix}> .
<> a egendata:InboundDataResponse ;
  egendata:requestId "${requestId}" ;
  egendata:providerWebId "${webid}" ;
  egendata:document "${document}" .
  `;

  const response = await axios.put(dataLocation, vcData, {
    headers: {
      'Content-Type': 'text/turtle',
      Authorization: `DPoP ${accessToken}`,
      dpop: await createDpopHeader(dataLocation, 'PUT', dpopKey),
    },
  });
  
  return response;
};

export const saveLinkToInbox = async (accessToken: string, dpopKey: KeyPair, notificationInbox: string, dataLocation: string) => {
  const linkData = `
@prefix egendata: <${egendataPrefix}> .
<> egendata:InboundDataResponse <${dataLocation}>.
  `;

  const url = `${notificationInbox}response-link-${uuid().toString()}`;
  const response = await axios.put(url, linkData, {
    headers: {
      'Content-Type': 'text/turtle',
      Authorization: `DPoP ${accessToken}`,
      dpop: await createDpopHeader(url, 'PUT', dpopKey),
    },
  });
  
  return response;
};

export const fetchAccessTokenAndDpopKey = async (clientId: string, clientSecret: string) => {
  const dpopKey = await generateDpopKeyPair();
  const authString = `${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`;
  const tokenUrl = `${identityProviderBaseUrl}/.oidc/token`;
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
  const data: { access_token: string } = await response.data;
  const { access_token: accessToken } = data;
  return { accessToken, dpopKey };
};

export const setupPod = async (accessToken: string, dpopKey: KeyPair) => {
  const urls = [
    `${podProviderBaseUrl}/arbetsformedlingen/egendata/inbox/`,
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
};

export const subscribeToInbox = async (accessToken: string, dpopKey: KeyPair) => {
  const url = `${podProviderBaseUrl}/subscription`;
  const data = {
    '@context': ['https://www.w3.org/ns/solid/notification/v1'],
    type: 'WebHookSubscription2021',
    topic: `${podProviderBaseUrl}/arbetsformedlingen/egendata/inbox/`,
    target: `${baseUrl}/webhook`,
  };
  return axios.post(
    url,
    JSON.stringify(data),
    {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(url, 'POST', dpopKey),
      },
    },
  );
};
