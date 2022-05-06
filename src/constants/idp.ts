import { identityProviderBaseUrl } from '../constants/index';

interface IIdpData {
  idp: string;
  idpPath: string;
  ident: string;
  user: string;
  password: string;
}
export default function getIdpData(testCase: number): IIdpData {
  if (testCase === 0)
    return {
      idp: identityProviderBaseUrl,
      idpPath: '/idp/',
      ident: 'email',
      user: 'sink@example.com',
      password: 'sink',
    };
  else if (testCase === 1)
    return {
      idp: 'https://css-ipo-dev.test.services.jtech.se',
      idpPath: '/idp/',
      ident: 'email',
      user: 'sink@example.com',
      password: 'sink',
    };
  else
    return {
      idp: 'https://css2-ipo-dev.test.services.jtech.se',
      idpPath: '/idp/',
      ident: 'email',
      user: 'sink@example.com',
      password: 'sink',
    };
}
