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
interface InskrivningStatus {
  'arbetssokande_status': string,
  'inskrivningsdatum': string,
  'sokandekategori_kod': string
}

export type FetchInskrivningStatusFn = (personnummer: string) => Promise<InskrivningStatus>;

export async function fetchInskrivningStatus(personummer: string): Promise<InskrivningStatus> {
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