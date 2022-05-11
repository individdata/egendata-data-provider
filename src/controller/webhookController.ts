import axios from 'axios';
import { fetchAccessTokenAndDpopKey } from '../util/solid';
import { createDpopHeader } from '@inrupt/solid-client-authn-core';
import * as vc from '../util/vc';
import { clientId, clientSecret } from '../config';
import {
  parseLinkResourceData,
  parseConsentResourceData,
  saveVCToDataLocation,
  saveLinkToInbox,
} from '../util/solid';

export class WebhookController {
  private readonly key: any;

  constructor(key: any) {
    this.key = key;
  }

  async handle(request: any, response: any) {
    const payload = request.body;
    console.log('Received webhook body:', payload);
    const { object, type } = payload;
    const { id: resourceUri } = object;
    
    await new Promise((resolve) => setTimeout(() => resolve(true), 1500));

    try {
      if (type[0] !== 'Create') {
        console.log('Ignoring webhook message, because it\'s not of type \'Create\'...');
        response.status(200).send('OK');
        return;
      }
    } catch (err) {
      // NOP
    }

    console.log('Extracted resourceUri:', resourceUri);

    const { accessToken, dpopKey } = await fetchAccessTokenAndDpopKey(clientId, clientSecret);

    console.log('Obtained new access token:', accessToken);

    const { data: notificationData } = await axios.get(resourceUri, {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(resourceUri, 'GET', dpopKey),
      },
    });

    console.log('Fetched data from notification:', notificationData);

    const linkData = parseLinkResourceData(notificationData);
    
    const { data: outboundDataRequestData } = await axios.get(linkData.outboundDataRequest, {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(linkData.outboundDataRequest, 'GET', dpopKey),
      },
    });

    const outboundDataRequest = parseConsentResourceData(outboundDataRequestData);
    console.log('Extracted outboundDataRequest:', outboundDataRequest);

    // Create a Verifiable credential
    const doc = await vc.issueVerifiableCredential(this.key);
    console.log('Created Verifiable Credential:', doc);

    try {
      const saveVCToDataLocationResponse = await saveVCToDataLocation(accessToken, dpopKey, outboundDataRequest.id, outboundDataRequest.dataLocation, doc);
      const { status, data } = saveVCToDataLocationResponse;
      console.log(`saveVCToDataLocationResponse[status: ${status}]:`, data);
    } catch (err) {
      console.log('Failed to save vc to data location, error:', err);
    }

    try {
      const saveLinkResponse = await saveLinkToInbox(accessToken, dpopKey, outboundDataRequest.notificationInbox, outboundDataRequest.dataLocation);
      const { status, data } = saveLinkResponse;
      console.log(`saveLinkResponse[status: ${status}]:`, data);
    } catch (err) {
      console.log('Failed to save link to inbox, error:', err);
    }

    console.log('Successfully handled webhook');
    response.status(200).send('OK');
  }
}
