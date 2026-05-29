/**
 * External job provider facade — re-exports registry for stable import paths.
 */
export type { NormalizedJob } from './types';
export {
  fetchFromAdzuna,
  fetchFromJSearch,
  fetchFromGoogleJobs,
  fetchFromJooble,
  fetchFromIndeed,
  fetchFromZipRecruiter,
  fetchFromCoresignal,
  fetchFromSerpApi,
  fetchFromUSAJobs,
  fetchJobsForRegion,
  checkCoresignalHealth,
  checkJobProvidersHealth,
  fetchAllExternalJobs,
} from './provider-registry';
