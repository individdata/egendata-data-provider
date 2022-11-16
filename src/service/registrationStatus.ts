import type { FetchInskrivningStatusFn } from './ais/inskrivning';

type RegistrationStatus = {
  isRegistered: boolean,
  registrationDate: string,
};

export type RegistrationStatusSubject = {
  type: 'JobSeekerRegistrationStatus',
  subject: string,
  isRegistered: boolean,
  registrationDate: string,
};

async function fetchRegistrationStatus(personummer: string, fetchFn: FetchInskrivningStatusFn): Promise<RegistrationStatus> {
  const inskrivning = await fetchFn(personummer);
  const isRegistered = (inskrivning.arbetssokande_status === 'Aktuell' || inskrivning.arbetssokande_status === 'Registrerad');
  const registrationDate = inskrivning.inskrivningsdatum;
  return {
    isRegistered,
    registrationDate,
  };
}

export async function fetchRegistrationStatusSubject(personummer: string, fetchFn: FetchInskrivningStatusFn): Promise<RegistrationStatusSubject> {
  const { isRegistered, registrationDate } = await fetchRegistrationStatus(personummer, fetchFn);
  return {
    type: 'JobSeekerRegistrationStatus',
    subject: personummer,
    isRegistered,
    registrationDate,
  };
}


