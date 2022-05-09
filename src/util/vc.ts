import { createPrivateKey, KeyObject } from 'crypto';
import * as fs from 'fs';
import bs58 from 'bs58';
import { issue } from '@digitalbazaar/vc';
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
  issuer: string,
  issuanceDate: string,
  credentialSubject: ICredentialSubject,
}

const cryptoKeyToEd25519VerificationKey2018 = (cryptoKey: KeyObject, options: any) => {
  // To convert the key, export it as a jwk, decode the base64, and reencode it with base58
  const jwk = cryptoKey.export({
    format: 'jwk',
  });
  
  // In jwk, d is private key and x is public key.
  // In Ed25519VerificationKey2018, the private key includes the public key
  const publicKey = Buffer.from(jwk.x!, 'base64');
  const privateKey = Buffer.concat([Buffer.from(jwk.d!, 'base64'), publicKey]);
  console.log('Ed25519VerificationKey2018:', Ed25519VerificationKey2018);
  return new Ed25519VerificationKey2018({
    ...options,
    privateKeyBase58: bs58.encode(privateKey),
    publicKeyBase58: bs58.encode(publicKey),
  });
};

export const loadKey = async (path: string, options: any) => {
  return cryptoKeyToEd25519VerificationKey2018(
    createPrivateKey(fs.readFileSync(path).toString()),
    options,
  );
};

export const publicKeyDoc = (key: any) => {
  return Object.assign(key.export({ publicKey: true }), {
    '@context': 'https://w3id.org/security/v2',
    id: key.id,
    controller: key.controller,
  });
};

export const controllerDoc = (key: any) => {
  return {
    '@context': 'https://w3id.org/security/v2',
    id: key.controller,
    assertionMethod: [key.id],
  };
};

export const issueVerifiableCredential = async (key: any) => {
  const credential: ICredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      {
        id: '@id',
        type: '@type',
        status: 'schema:status',
        subject: 'http://purl.org/dc/terms/subject',
        name: 'schema:name',
        familyName: 'schema:familyName',
        givenName: 'schema:givenName',
        identifier: 'schema:idenifier',
        statusChangedDate: 'schema:statusChangedDate',
        issued: 'schema:issued',
        issuer: 'schema:creator',
        Person: 'schema:Person',
        GovernmentOrganization: 'schema:GovernmentOrganization',
        UnemploymentStatus: 'schema:DigitalDocument',
        schema: 'http://schema.org/',
      },
    ],
    type: 'VerifiableCredential',
    issuer: key.controller,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      type: 'UnemploymentStatus',
      status: 'unemployed',
      subject: '12341212-1212',
      statusChangedDate: '2021-09-17',
      issuer: {
        type: 'GovernmentOrganization',
        identifier: '202100-2114',
        name: 'Arbetsförmedlingen',
      },
    },
  };
  return issue({ credential, suite: new Ed25519Signature2018({ key }) });
};
