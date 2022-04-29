/**
 * An simple interface to digital bazaars verified credentials library.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import forge from "node-forge";
import * as solid from "./solid.js";
import jsonld from "jsonld";

// The digitalbazaar packages are only available as a CommonJS module, so we need to use require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const vc = require("@digitalbazaar/vc");
const {Ed25519VerificationKey2018} = require("@digitalbazaar/ed25519-verification-key-2018");
const {Ed25519Signature2018} = require("@digitalbazaar/ed25519-signature-2018");

function loadPem(path) {
    return crypto.createPrivateKey(fs.readFileSync(path).toString());
}

function cryptoKeyToEd25519VerificationKey2018(cryptoKey, options) {
    // To convert the key, export it as a jwk, decode the base64, and reencode it widh base58
    const jwk = cryptoKey.export({
        format: "jwk"
    });
    // In jwk, d is private key and x is public key.
    // In Ed25519VerificationKey2018, the private key includes the public key
    const publicKey = Buffer.from(jwk.x, "base64");
    const privateKey = Buffer.concat([Buffer.from(jwk.d, "base64"), publicKey]);
    return new Ed25519VerificationKey2018({
        ...options,
        privateKeyBase58: forge.util.binary.base58.encode(privateKey),
        publicKeyBase58: forge.util.binary.base58.encode(publicKey)
    });
}

/**
 * Load a pem file as a crypto ld key.
 * @param {string} options.controller - Controller url.
 * @param {string} options.id - The key url
 */
export async function loadKey(path, options) {
    const cryptoKey = loadPem(path);
    return cryptoKeyToEd25519VerificationKey2018(cryptoKey, options);
}

/**
 * A json-ld document containing the public key.
 * @param {LDKeyPair} key The key
 */
export function publicKeyDoc(key) {
    return Object.assign(key.export({publicKey: true}), {
        "@context": "https://w3id.org/security/v2",
        id: key.id,
        controller: key.controller
    });
}

/**
 * A json-ld document containing the issuer of a key.
 * @param {LDKeyPair} key The key
 */
 export function controllerDoc(key) {
    return {
        "@context": "https://w3id.org/security/v2",
        id: key.controller,
        assertionMethod: [key.id]
    };    
}

/**
 * Sign a json document
 * @param {LDKeyPair} key The key
 * @param {*} doc The json document
 */
export async function issue(key, doc) {
    doc.issuer = key.controller;
    return await vc.issue({credential: doc, suite: new Ed25519Signature2018({key})});
}

// A very naive document loader. Needs error handling and preloaded contexts
export async function naiveDocumentLoader(documentUrl) {
    const response = await fetch(documentUrl);
    const document = JSON.parse(await response.text());
    return {
        document,
        documentUrl
    };
}

/**
 * A document loader generator for solid pods
 * @param {Object} session a logged on solid client
 */
export function documentLoaderGenerator(session) {
    return async function (documentUrl) {
        try {
            const {data, contentType} = await solid.getFile(session, documentUrl, "application/ld+json");
            
            var document =  JSON.parse(data);
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
            } catch(e) {
                throw e;
            }
        }
    };
}


/**
 * Verify a json credential document
 * @param {LDKeyPair} key The key
 * @param {*} doc The credential document in JSON-format
 */
export async function verify(credential, documentLoader = naiveDocumentLoader) {
    return await vc.verifyCredential({
      credential,
      suite: [new Ed25519Signature2018()],
      documentLoader
    });
}

export function createCredential(context, credentialSubject) {
    const credential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: "VerifiableCredential"
    };
    credential["@context"].push(context);
    credential["issuanceDate"] = (new Date()).toISOString();
    credential["credentialSubject"] = credentialSubject;
    return credential;
}
