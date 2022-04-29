/**
 * A collection of utilities to read and write from a pod
 */

import * as path from "path";

// The digitalbazaar packages are only available as a CommonJS module, so we need to use require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const vc = require("@digitalbazaar/vc");
const {Ed25519VerificationKey2018} = require("@digitalbazaar/ed25519-verification-key-2018");
const {Ed25519Signature2018} = require("@digitalbazaar/ed25519-signature-2018");

/**
 * Put a file in a pod.  Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to write
 * @param {string} body The contents of the file
 * @param {string} contentType The content-type of the file
 */
 export async function putFile(session, file, body, contentType = "text/plain") {
    //console.log("file: ", file);
    let writeResponse = await session.fetch(file, {
        method: "PUT",
        body: body,
        headers: { "Content-type": contentType }
    });
    if(!(writeResponse.status >= 200 && writeResponse.status <= 299)) {
        console.log(writeResponse.url, writeResponse.status, writeResponse.statusText);
        throw new Error("Failed to write the file: " + writeResponse.statusText);
    } else {
        console.log("PUT " + writeResponse.url);
    }
}

/**
 * Patch a file in a pod.  Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to write
 * @param {string} body The contents of the file
 * @param {string} contentType The content-type of the file
 */
 export async function patchFile(session, file, body, contentType = "text/plain") {
    console.log("file: ", file);
    let writeResponse = await session.fetch(file, {
        method: "PATCH",
        body: body,
        headers: { "Content-type": contentType }
    });
    if(!(writeResponse.status >= 200 && writeResponse.status <= 299)) {
        throw new Error("Failed to write the file: " + writeResponse.statusText);
        console.log(writeResponse.url, writeResponse.status, writeResponse.statusText);
    }
}

/**
 * Post data to a resource URL.  Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} url The path to the resource
 * @param {string} data The data for the resource
 * @param {string} contentType The content-type of the data
 */
 export async function postFile(session, url, data, contentType = "text/plain") {
    //console.log("url: ", url);
    let writeResponse = await session.fetch(url, {
        method: "POST",
        body: data,
        headers: { "Content-type": contentType }
    });
    if(!(writeResponse.status >= 200 && writeResponse.status <= 299)) {
        console.log(writeResponse.url, writeResponse.status, writeResponse.statusText);
        throw new Error("Failed to POST: " + writeResponse.statusText);    
    } else {
        console.log("POST: " + writeResponse.url);
    }
    const body = await writeResponse.text();
    return {data: body, contentType: writeResponse.headers.get("Content-Type")};
}

/**
 * Delete a file from a pod.  Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to delete
 */
 export async function deleteFile(session, file) {
    const ok = new Set([202, 204, 205, 404]);
    let deleteResponse = await session.fetch(file, {
        method: "DELETE"});
    if(!ok.has(deleteResponse.status))
        throw new Error("Failed to delete the file: " + deleteResponse.statusText);

    console.log("DELETE: " + deleteResponse.url);
}

/**
 * Put a json document in a pod
 * @param {Session} session The logged-in session
 * @param {string} file The path to the json file to write
 * @param {Object} jsonData 
 */
 export async function putJson(session, file, jsonData) {
    await putFile(session, file, JSON.stringify(jsonData, null, 2), "application/json");
}

/**
 * Put a json-ld document in a pod
 * @param {Session} session The logged-in session
 * @param {string} file The path to the json-ld file to write
 * @param {Object} jsonData 
 */
 export async function putJsonld(session, file, jsonData) {
    await putFile(session, file, JSON.stringify(jsonData, null, 2), "application/ld+json");
}

/**
 * Put a acl record for a file in a pod. Make the file publically readable.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to add an acl record to.
 */
export async function putPublicReadAcl(session, file) {
    const filename = path.basename(file);
    await putFile(session, `${file}.acl`,
         `@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<#public>
    a acl:Authorization;
    acl:accessTo <./${filename}>;
    acl:agentClass foaf:Agent;
    acl:mode acl:Read.

<#owner>
    a acl:Authorization;
    acl:accessTo <./${filename}>;
    acl:agent <${session.webId}>;
    acl:mode acl:Read, acl:Write, acl:Control.`, "text/turtle");
}

/**
 * Put a json document to a pod and make it public.
 */
 export async function putPublicJson(session, file, jsonData) {
    return Promise.all([putJson(session, file, jsonData),
        putPublicReadAcl(session, file)]);
}

/**
 * Put a json-ld document to a pod and make it public.
 */
 export async function putPublicJsonld(session, file, jsonData) {
    return Promise.all([putJsonld(session, file, jsonData),
        putPublicReadAcl(session, file)]);
}

/**
 * Get a document from a pod and return it as an object. Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to read
 * @param {string} contentType MIME to accept
 * @returns The data and contentType
 */
 export async function getFile(session, file, contentType = "application/ld+json") {
    const response = await session.fetch(file, {
        headers: { "Accept": contentType }
    });
    if (response.status !== 200)
        throw new Error("Failed to read the file: " + file);
    const body = await response.text();
    return {data: body, contentType: response.headers.get("Content-Type")};
}

/**
 * Get a json document from a pod and return it as an object. Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to write
 * @returns The Json data
 */
 export async function getJson(session, file) {
    const response = await session.fetch(file);
    if (response.status !== 200) throw new Error("Failed to read the file: " + file);
    return JSON.parse(await response.text());
}

/**
 * Get a jsonld document from a pod and return it as an object. Throws on error.
 * @param {Session} session The logged-in session
 * @param {string} file The path to the file to write
 * @returns The Jsonld data
 */
 export async function getJsonld(session, file) {
    const {data} = await getFile(session, file, "application/ld+json");
    //console.log("data: ", data);
    return JSON.parse(data);
}

export async function publishKey(session, key, base) {
    const keyId = `${base}/key.json`;
    const controllerId = `${base}/creator.json`;
    console.log({keyId, controllerId});
    console.log(publicKey(key, keyId, controllerId));
    await putJson(session, keyId, publicKey(key, keyId, controllerId));
    await putJson(session, controllerId, controller(keyId, controllerId));
    await putPublicReadAcl(session, keyId);
    await putPublicReadAcl(session, controllerId);
    return await new Ed25519VerificationKey2018({...key, id: keyId, controller: controllerId});
}

export async function retry(fn, retryFor = 30, retryIn = 1000) {
    let error;
    while (retryFor-- > 0) {
        try {
            return await fn();
        } catch (e) {
            console.log(`${e.message}: Will retry in ${retryIn / 1000} sec, ${retryFor} retries left`);
            error = e;
            // exponential backoff
            retryIn = retryIn * 2;
            await new Promise(resolve => setTimeout(resolve, retryIn));
        }
    }
    throw error || new Error("Something went wrong");
}
