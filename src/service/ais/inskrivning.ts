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

export interface InskrivningStatus {
  'ar_inskriven': boolean,
  'inskrivningsdatum': string,
  'kontorskod': string,
  'visas_enbart_for_ansvarig_handl': boolean,
  'ar_avaktualiserad': boolean,
  'ar_lagrad': boolean,
  'personnummer': string,
  'ar_inskriven_via_webb': boolean,
  'tillatet_personnummer': boolean,
  'pagande_personnummerbyte': boolean
}

export async function fetchInskrivningStatus(personummer: string): Promise<InskrivningStatus> {
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
  };
  const url = `${aisBaseUrl}/${personummer}/status-inskrivning`;
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

const delay = (retryCount: number) => new Promise(resolve => setTimeout(resolve, 2 ** retryCount));
export const fetchInskrivningStatusWithRetry = (personnummer: string, retryCount = 0): Promise<InskrivningStatus> => fetchInskrivningStatus(personnummer).catch(() => delay(retryCount).then(() => fetchInskrivningStatusWithRetry(personnummer, retryCount + 1)));

