import type { Request, Response } from "express";
import N3 from "n3";

import axios from "axios";
import generateClientCredentials from "../util/generateClientCredentials.js";
import { createDpopHeader, KeyPair } from "@inrupt/solid-client-authn-core";
import * as vc from "../util/vc.js";
import { v4 as uuid } from "uuid";
import { webid } from "../constants/index.js";

const context = {
  id: "@id",
  type: "@type",
  status: "schema:status",
  subject: "http://purl.org/dc/terms/subject",
  name: "schema:name",
  familyName: "schema:familyName",
  givenName: "schema:givenName",
  identifier: "schema:idenifier",
  statusChangedDate: "schema:statusChangedDate",
  issued: "schema:issued",
  issuer: "schema:creator",
  Person: "schema:Person",
  GovernmentOrganization: "schema:GovernmentOrganization",
  UnemploymentStatus: "schema:DigitalDocument",
  schema: "http://schema.org/"
};

async function createVc(key: any) {
  // Sign and upload document
  const credential = vc.createCredential([context], {
      type: "UnemploymentStatus",
      status: "unemployed",
      subject: "12341212-1212",
      statusChangedDate: "2021-09-17",
      issuer: {
        type: "GovernmentOrganization",
        identifier: "202100-2114",
        name: "Arbetsförmedlingen"
      }
    }
  );

  return vc.issue(key, credential);

  //console.log("len signed: ", signed.length);

  //const deflatedVc = zlib.deflateSync(signed).toString('base64');
  //console.log("len deflatedVc: ", deflatedVc.length);

  /* const jsonld: any = {
      "@context": [
          {
              "schema": "http://schema.org/"
          }
      ],
      "@type": "schema:Document"
  };

  jsonld["@id"] = responseUrl;
  jsonld["urn:id"] = id;
  jsonld["schema:text"] = signed;

  return jsonld; */
}


const N3Parser = new N3.Parser();

const parseLinkResourceData = (data: string) => {
  const store = new N3.Store(N3Parser.parse(data));
  const outboundDataRequest = store.getObjects("", "egendata:OutboundDataRequest", "")[0].value;
  return { outboundDataRequest };
};

const parseConsentResourceData = (data: string) => {
  const store = new N3.Store(N3Parser.parse(data));
  const id = store.getObjects("", "egendata:id", "")[0].value;
  const documentType = store.getObjects("", "egendata:documentType", "")[0].value;
  const dataSubjectIdentifier = store.getObjects("", "egendata:dataSubjectIdentifier", "")[0].value;
  const dataLocation = store.getObjects("", "egendata:dataLocation", "")[0].value;
  const notificationInbox = store.getObjects("", "egendata:notificationInbox", "")[0].value;
  return { id, documentType, dataSubjectIdentifier, dataLocation, notificationInbox };
};

const saveVCToDataLocation = async (accessToken: string, dpopKey: KeyPair, requestId: string, dataLocation: string, doc: any) => {
  const document = Buffer.from(JSON.stringify(doc), "utf-8").toString("base64");
  const vcData = `
@prefix egendata: <https://oak-pod-provider-oak-develop.test.services.jtech.se/schema/core/v1#> .
<> a egendata:InboundDataResponse ;
  egendata:requestId "${requestId}" ;
  egendata:providerWebId "${webid}" ;
  egendata:document "${document}" .
  `;

  const response = await axios.put(dataLocation, vcData, {
    headers: {
      "Content-Type": "text/turtle",
      Authorization: `DPoP ${accessToken}`,
      dpop: await createDpopHeader(dataLocation, "PUT", dpopKey),
    },
  });
  
  return response;
};

const saveLinkToInbox = async (accessToken: string, dpopKey: KeyPair, notificationInbox: string, dataLocation: string) => {
  const linkData = `
@prefix egendata: <https://oak-pod-provider-oak-develop.test.services.jtech.se/schema/core/v1#> .
<> <egendata:InboundDataResponse> <${dataLocation}>.
  `;

  const url = `${notificationInbox}response-link-${uuid().toString()}`;
  const response = await axios.put(url, linkData, {
    headers: {
      "Content-Type": "text/turtle",
      Authorization: `DPoP ${accessToken}`,
      dpop: await createDpopHeader(url, "PUT", dpopKey),
    },
  });
  
  return response;
};

export class WebhookController {
  private readonly key: any;

  constructor(key: any) {
    this.key = key;
  }

  async handle(request: Request, response: Response) {
    const payload = request.body;
    console.log("Received webhook body:", payload);
    const { object, type } = payload;
    const { id: resourceUri } = object;
    
    try {
      if (type[0] !== "Create") {
        console.log("Ignoring webhook message, because it's not of type 'Create'...");
        response.status(200).send("OK");
        return;
      }
    } catch (err) {
      // NOP
    }

    console.log("Extracted resourceUri:", resourceUri);

    const { accessToken, dpopKey } = await generateClientCredentials();

    const { data: notificationData } = await axios.get(resourceUri, {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(resourceUri, "GET", dpopKey),
      },
    });

    console.log("Fetched data from notification:", notificationData);
    // Mock data
    // const mockData = `@prefix egendata: <https://oak-pod-provider-oak-develop.test.services.jtech.se/schema/core/v1#> .
    // <> <egendata:OutboundDataRequest> <http://localhost:3000/198907225331/oak/consents/request-539816f0-6b27-4e91-9322-030f34e661ba>.`;

    const linkData = parseLinkResourceData(notificationData);
    
    const { data: outboundDataRequestData } = await axios.get(linkData.outboundDataRequest, {
      headers: {
        Authorization: `DPoP ${accessToken}`,
        dpop: await createDpopHeader(linkData.outboundDataRequest, "GET", dpopKey),
      },
    });

    const outboundDataRequest = parseConsentResourceData(outboundDataRequestData);

    console.log("Extracted outboundDataRequest:", outboundDataRequest);

    // Create a Verifiable credential
    const doc = await createVc(this.key);
    console.log("doc:", doc);

    // Put VC into user pod (dataLocation)

    const saveVCToDataLocationResponse = await saveVCToDataLocation(accessToken, dpopKey, outboundDataRequest.id, outboundDataRequest.dataLocation, doc);

    console.log("saveVCToDataLocationResponse:", saveVCToDataLocationResponse);
    
    console.log("saveVCResponseData:", saveVCToDataLocationResponse.data);

    try {
      const { data: saveLinkResponseData } = await saveLinkToInbox(accessToken, dpopKey, outboundDataRequest.notificationInbox, outboundDataRequest.dataLocation);

      console.log("saveLinkResponseData:", saveLinkResponseData);
    } catch (err) {
      console.log("Failed to save link to inbox, error:", err);
    }

    console.log("Successfully handled webhook");
    response.status(200).send("OK");
  }
}
