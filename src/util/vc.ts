/**
 * An simple interface to digital bazaars verified credentials library.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import bs58 from 'bs58';
// import * as solid from './solid.js';
// import jsonld from 'jsonld';

// The digitalbazaar packages are only available as a CommonJS module, so we need to use require
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
import * as vc from '@digitalbazaar/vc';
import { Ed25519VerificationKey2018 } from '@digitalbazaar/ed25519-verification-key-2018';
import { Ed25519Signature2018 } from '@digitalbazaar/ed25519-signature-2018';

export interface ICredentialSubject {
  type: string,
  status: string,
  subject: string,
  statusChangedDate: string,
  issuer: {
    type: string,
    identifier: string,
    name: string,
  }
}

export interface ICredential {
  '@context': any[],
  type: string,
  issuanceDate: string,
  credentialSubject: ICredentialSubject,
}

function loadPem(path: string) {
  return crypto.createPrivateKey(fs.readFileSync(path).toString());
}

function cryptoKeyToEd25519VerificationKey2018(cryptoKey: any, options: any) {
  // To convert the key, export it as a jwk, decode the base64, and reencode it widh base58
  const jwk = cryptoKey.export({
    format: 'jwk',
  });
  // In jwk, d is private key and x is public key.
  // In Ed25519VerificationKey2018, the private key includes the public key
  const publicKey = Buffer.from(jwk.x, 'base64');
  const privateKey = Buffer.concat([Buffer.from(jwk.d, 'base64'), publicKey]);
  return new Ed25519VerificationKey2018({
    ...options,
    privateKeyBase58: bs58.encode(privateKey),
    publicKeyBase58: bs58.encode(publicKey),
  });
}

/**
 * Load a pem file as a crypto ld key.
 * @param {string} options.controller - Controller url.
 * @param {string} options.id - The key url
 */
export async function loadKey(path: string, options: any) {
  const cryptoKey = loadPem(path);
  return cryptoKeyToEd25519VerificationKey2018(cryptoKey, options);
}

/**
 * A json-ld document containing the public key.
 * @param {LDKeyPair} key The key
 */
export function publicKeyDoc(key: any) {
  return Object.assign(key.export({ publicKey: true }), {
    '@context': 'https://w3id.org/security/v2',
    id: key.id,
    controller: key.controller,
  });
}

/**
 * A json-ld document containing the issuer of a key.
 * @param {LDKeyPair} key The key
 */
export function controllerDoc(key: any) {
  return {
    '@context': 'https://w3id.org/security/v2',
    id: key.controller,
    assertionMethod: [key.id],
  };
}

/**
 * Sign a json document
 * @param {LDKeyPair} key The key
 * @param {*} doc The json document
 */
export async function issue(key: any, doc: any) {
  doc.issuer = key.controller;
  return vc.issue({ credential: doc, suite: new Ed25519Signature2018({ key }) });
}

// A very naive document loader. Needs error handling and preloaded contexts
export async function naiveDocumentLoader(documentUrl: any) {
  const response = await fetch(documentUrl);
  const document = JSON.parse(await response.text());
  return {
    document,
    documentUrl,
  };
}

/**
 * A document loader generator for solid pods
 * @param {Object} session a logged on solid client
 */
/* export function documentLoaderGenerator(session) {
  return async function (documentUrl) {
    try {
      const { data, contentType } = await solid.getFile(session, documentUrl, "application/ld+json");

      var document = JSON.parse(data);
      if (contentType == "application/ld+json") {
        // when the key and controller were stored in the source pod the context were lost and has to be restored
        const context = ["https://w3id.org/security/v2"];
        document = await jsonld.compact(document, context);
      }
      return {
        document,
        documentUrl
      };
    } catch (e) {
      //the document is probabely not in a solid pod but on an ordinary HTTP server
      try {
        const response = await fetch(documentUrl, {
          headers: { "Accept": "application/ld+json" }
        });
        const document = await response.json();
        return {
          document,
          documentUrl
        };
      } catch (e) {
        throw e;
      }
    }
  }
} */


/**
 * Verify a json credential document
 * @param {LDKeyPair} key The key
 * @param {*} doc The credential document in JSON-format
 */
/* export async function verify(credential, documentLoader = naiveDocumentLoader) {
  return await vc.verifyCredential({
    credential,
    suite: [new Ed25519Signature2018()],
    documentLoader
  });
} */

export function createCredential(extraContext: any[], credentialSubject: ICredentialSubject): ICredential {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1', ...extraContext],
    type: 'VerifiableCredential',
    issuanceDate: (new Date()).toISOString(),
    credentialSubject,
  };
}
