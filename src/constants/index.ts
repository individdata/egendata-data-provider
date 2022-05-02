import dotenv from "dotenv";

dotenv.config();

export const identityProviderBaseUrl = process.env.IDENTITY_PROVIDER_BASE_URL || "https://oak-identity-provider-oak-develop.test.services.jtech.se";
export const podProviderBaseUrl = process.env.POD_PROVIDER_BASE_URL || "https://oak-pod-provider-oak-develop.test.services.jtech.se";
export const baseUrl = process.env.BASE_URL;
export const port = process.env.PORT || 3002;
export const webid = process.env.WEBID || "http://localhost:3001/arbetsformedlingen/profile/card#me";
export const keyPath = process.env.KEY_PATH || "source-key.pem";
