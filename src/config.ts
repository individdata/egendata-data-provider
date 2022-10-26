import dotenv from 'dotenv';

dotenv.config();

export const identityProviderBaseUrl = process.env.IDENTITY_PROVIDER_BASE_URL || 'https://idp-test.egendata.se';
export const podProviderBaseUrl = process.env.POD_PROVIDER_BASE_URL || 'https://pod-test.egendata.se';
export const baseUrl = process.env.BASE_URL || 'http://localhost:3002';
export const port = process.env.PORT || 3002;
export const podName = process.env.POD_NAME || 'arbetsformedlingen';
export const webid = process.env.WEBID || `https://idp-test.egendata.se/${podName}/profile/card#me`;
export const keyPath = process.env.KEY_PATH || 'source-key.pem';
export const clientId = process.env.CLIENT_ID || 'arbetsformedlingen';
export const clientSecret = process.env.CLIENT_SECRET || '2Ghr8gca88LW9zf2';
