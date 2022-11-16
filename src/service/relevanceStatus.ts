import type { FetchInskrivningStatusFn } from './ais/inskrivning';

type RelevanceStatus = {
  isRegistered: boolean,
  registrationDate: string,
  isRelevant: boolean,
};

export type RelevanceStatusSubject = {
  type: 'InternshipRelevanceStatus',
  subject: string,
  isRegistered: boolean,
  registrationDate: string,
  isRelevant: boolean,
};

async function fetchRelevanceStatus(personummer: string, fetchFn: FetchInskrivningStatusFn): Promise<RelevanceStatus> {
  const inskrivning = await fetchFn(personummer);
  const isRegistered = (inskrivning.arbetssokande_status === 'Aktuell' || inskrivning.arbetssokande_status === 'Registrerad');
  const registrationDate = inskrivning.inskrivningsdatum;
  const isRelevant = (inskrivning.sokandekategori_kod === '11' ||
    inskrivning.sokandekategori_kod === '68' ||
    inskrivning.sokandekategori_kod === '69' ||
    inskrivning.sokandekategori_kod === '70' ||
    inskrivning.sokandekategori_kod === '22');
  return {
    isRegistered,
    registrationDate,
    isRelevant,
  };
}



export async function fetchRelevanceStatusSubject(personummer: string, fetchFn: FetchInskrivningStatusFn): Promise<RelevanceStatusSubject> {
  const { isRegistered, registrationDate, isRelevant } = await fetchRelevanceStatus(personummer, fetchFn);
  return {
    type: 'InternshipRelevanceStatus',
    subject: personummer,
    isRegistered,
    registrationDate,
    isRelevant,
  };
}