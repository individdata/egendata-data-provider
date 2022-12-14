import dotenv from 'dotenv';

dotenv.config();

if (!process.env.AIS_CLIENT_SECRET) throw new Error('AIS_CLIENT_SECRET must be defined');
if (!process.env.AIS_CLIENT_ID) throw new Error('AIS_CLIENT_ID must be defined');

export const identityProviderBaseUrl = process.env.IDENTITY_PROVIDER_BASE_URL || 'https://idp-test.egendata.se';
export const podProviderBaseUrl = process.env.POD_PROVIDER_BASE_URL || 'https://pod-test.egendata.se';
export const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
export const port = process.env.PORT || 3002;
export const podName = process.env.POD_NAME || 'arbetsformedlingen';
export const webid = process.env.WEBID || `https://idp-test.egendata.se/${podName}/profile/card#me`;
export const keyPath = process.env.KEY_PATH || 'source-key.pem';
export const clientId = process.env.CLIENT_ID || 'arbetsformedlingen';
export const clientSecret = process.env.CLIENT_SECRET || '2Ghr8gca88LW9zf2';
export const aisEnvironment = process.env.AIS_ENVIRONMENT || 'T1';
export const aisSystemId = process.env.AIS_SYSTEM_ID || 'egendata-provider';
export const aisBaseUrl = process.env.AIS_BASE_URL || 'https://ipf-test.arbetsformedlingen.se/inskrivning/v1/arbetssokande';
export const aisClientId = process.env.AIS_CLIENT_ID || '';
export const aisClientSecret = process.env.AIS_CLIENT_SECRET || '';
