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
import { fetchRegistrationStatusSubject } from '../service/registrationStatus';
import { fetchRelevanceStatusSubject } from '../service/relevanceStatus';
import { fetchInskrivningStatus } from '../service/ais/inskrivning';
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

    try {
      if (type[0] !== 'Create' && type[0] !== 'https://www.w3.org/ns/activitystreams#Create') {
        console.log('Ignoring webhook message, because it\'s not of type \'https://www.w3.org/ns/activitystreams#Create\'...');
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

    console.log('Parsed link resource data:', linkData);
    
    const { data: outboundDataRequestData } = await axios.get(linkData.outboundDataRequest, {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(linkData.outboundDataRequest, 'GET', dpopKey),
      },
    });

    const outboundDataRequest = parseConsentResourceData(outboundDataRequestData);
    console.log('Extracted outboundDataRequest:', outboundDataRequest);

    if (!(outboundDataRequest.documentType === 'http://egendata.se/schema/core/v1#JobSeekerRegistrationStatus' ||
    outboundDataRequest.documentType === 'http://egendata.se/schema/core/v1#InternshipQualificationStatus')) {
      const error = `Document type ${outboundDataRequest.documentType} can not be handeled.`;
      console.log(error);
      response.status(404).send(error);
      return;
    }

    const personnummer = outboundDataRequest.dataSubjectIdentifier;

    const credentialSubject = (outboundDataRequest.documentType === 'http://egendata.se/schema/core/v1#JobSeekerRegistrationStatus') ?
      await fetchRegistrationStatusSubject(personnummer, fetchInskrivningStatus) : await fetchRelevanceStatusSubject(personnummer, fetchInskrivningStatus);

    console.log('credentialSubject:', credentialSubject);


    // Create a Verifiable credential
    const doc = await vc.issueVerifiableCredential(this.key, credentialSubject);
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
