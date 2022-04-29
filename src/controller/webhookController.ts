import type { Request, Response } from "express";
import N3 from "n3";

import axios from "axios";
import generateClientCredentials from "../util/generateClientCredentials.js";
import { createDpopHeader } from "@inrupt/solid-client-authn-core";

const N3Parser = new N3.Parser();

export async function WebhookController(request: Request, response: Response) {
  const payload = request.body;
  // console.log(payload);
  const { object } = payload;
  const { id: resourceUri } = object;

  const { accessToken, dpopKey } = await generateClientCredentials();

  const resource = await axios.get(resourceUri, {
    headers: {
      Authorization: `DPoP ${accessToken}`,
      dpop: await createDpopHeader(resourceUri, "GET", dpopKey),
    },
  });

  // const {data} = resource;
  const data = `@prefix egendata: <https://oak-pod-provider-oak-develop.test.services.jtech.se/schema/core/v1#> .
    <> <egendata:OutboundDataRequest> <https://oak-pod-provider-oak-develop.test.services.jtech.se/198002087842/oak/consents/consent-1281f60a-5fae-4c23-a9a0-296f6439bab5>.`;

// const data = `@prefix egendata: <http://localhost:3000/schema/core/v1#> .
// <> <egendata:OutboundDataRequest> <http://localhost:3000/198002087842/oak/consents/consent-1281f60a-5fae-4c23-a9a0-296f6439bab5>.`;
  N3Parser.parse(data, (error, quad, prefixes) => {
    if (quad) {
      console.log(quad.object);
      const url = quad.toJSON();
    //   const N3Store = new N3.Store();
    //   N3Store.addQuad(quad);
    //   const values = N3Store.getObjects("", "egendata:OutboundDataRequest", "").map((quadObject) => quadObject.value);
    //   console.log({ values });

    //   const promises = values.map(async (value) => {
    //     await axios.get(value, {
    //       headers: {
    //         Authorization: `DPoP ${accessToken}`,
    //         dpop: await createDpopHeader(value, "GET", dpopKey),
    //       },
    //     });
    //   });
    //   const responses = Promise.all(promises);
      
    } else console.log("# That's all, folks!", prefixes);
  });

  console.log("recieved and handled webhook");
  response.status(200).send("OK");
}
