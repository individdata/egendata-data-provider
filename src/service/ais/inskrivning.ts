import axios, { AxiosResponse } from 'axios';
import { Guid } from 'guid-typescript';
import { aisBaseUrl, aisClientId, aisClientSecret, aisEnvironment } from '../../config';


enum AISEnvironment {
  U1 = 'U1',
  I1 = 'I1',
  T1 = 'T1',
  T2 = 'T2',
  PROD = 'PROD',
}

interface InskrivningResponse {
  'ar_inskriven': Boolean,
  'inskrivningsdatum': String,
  'kontorskod': String,
  'visas_enbart_for_ansvarig_handl': Boolean,
  'ar_avaktualiserad': Boolean,
  'ar_lagrad': Boolean,
  'personnummer': String,
  'ar_inskriven_via_webb': Boolean,
  'tillatet_personnummer': Boolean,
  'pagande_personnummerbyte': Boolean
}

export default async (personummer: String): Promise<InskrivningResponse | String> => {
  const config = {
    headers: {
      'AF-TrackingId': Guid.create().toString(),
      'AF-SystemId': 'egen-data-provider',
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
      return error.message;
    } else {
      console.log('unexpected error: ', error);
      return 'An unexpected error occurred';
    }
  }
};