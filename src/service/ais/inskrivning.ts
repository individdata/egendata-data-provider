import https from 'https';
import axios, { AxiosResponse } from 'axios';
import { Guid } from 'guid-typescript';
import { aisBaseUrl, aisClientId, aisClientSecret, aisEnvironment, aisSystemId } from '../../config';


enum AISEnvironment {
  U1 = 'U1',
  I1 = 'I1',
  T1 = 'T1',
  T2 = 'T2',
  PROD = 'PROD',
}

export interface RegistrationStatus {
  isRegistered: boolean,
  registrationDate: string,
}

export interface QualificationStatus {
  isRegistered: boolean,
  registrationDate: string,
  isQualified: boolean,
}

interface InskrivningStatus {
  'arbetssokande_status': string,
  'inskrivningsdatum': string,
  'sokandekategori_kod': string
}

export interface RegistrationStatusSubject {
  type: 'JobSeekerRegistrationStatus',
  subject: string,
  isRegistered: boolean,
  registrationDate: string,
}

export interface QualificationStatusSubject {
  type: 'InternshipQualificationStatus',
  subject: string,
  isRegistered: boolean,
  registrationDate: string,
  isQualified: boolean,
}

async function fetchInskrivningStatus(personummer: string): Promise<InskrivningStatus> {
  const agent = new https.Agent({  
    rejectUnauthorized: false,
  });
  const config = {
    headers: {
      'AF-TrackingId': Guid.create().toString(),
      'AF-SystemId': aisSystemId,
      'AF-Environment': AISEnvironment[aisEnvironment as AISEnvironment],
    },
    params: {
      client_id: aisClientId,
      client_secret: aisClientSecret,
    },
    agent,
  };
  const url = `${aisBaseUrl}/${personummer}`;
  try {
    const res: AxiosResponse = await axios.get(url, config);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message: ', error.message);
    } else {
      console.log('unexpected error: ', error);
    }
    throw error;
  }
}

async function fetchRegistrationStatus(personummer: string): Promise<RegistrationStatus> {
  const inskrivning = await fetchInskrivningStatus(personummer);
  const isRegistered = (inskrivning.arbetssokande_status === 'Aktuell' || inskrivning.arbetssokande_status === 'Registrerad');
  const registrationDate = inskrivning.inskrivningsdatum;
  return {
    isRegistered,
    registrationDate,
  };
}

async function fetchQualificationStatus(personummer: string): Promise<QualificationStatus> {
  const inskrivning = await fetchInskrivningStatus(personummer);
  const isRegistered = (inskrivning.arbetssokande_status === 'Aktuell' || inskrivning.arbetssokande_status === 'Registrerad');
  const registrationDate = inskrivning.inskrivningsdatum;
  const isQualified = (inskrivning.sokandekategori_kod === '11' ||
    inskrivning.sokandekategori_kod === '68' ||
    inskrivning.sokandekategori_kod === '69' ||
    inskrivning.sokandekategori_kod === '70' ||
    inskrivning.sokandekategori_kod === '22');
  return {
    isRegistered,
    registrationDate,
    isQualified,
  };
}

export async function fetchRegistrationStatusSubject(personummer: string): Promise<RegistrationStatusSubject> {
  const { isRegistered, registrationDate } = await fetchRegistrationStatus(personummer);
  return {
    type: 'JobSeekerRegistrationStatus',
    subject: personummer,
    isRegistered,
    registrationDate,
  };
}

export async function fetchQualificationStatusSubject(personummer: string): Promise<QualificationStatusSubject> {
  const { isRegistered, registrationDate, isQualified } = await fetchQualificationStatus(personummer);
  return {
    type: 'InternshipQualificationStatus',
    subject: personummer,
    isRegistered,
    registrationDate,
    isQualified,
  };
}


const delay = (retryCount: number) => new Promise(resolve => setTimeout(resolve, 2 ** retryCount));
export const fetchInskrivningStatusWithRetry = (personnummer: string, retryCount = 0): Promise<InskrivningStatus> => fetchInskrivningStatus(personnummer).catch(() => delay(retryCount).then(() => fetchInskrivningStatusWithRetry(personnummer, retryCount + 1)));

