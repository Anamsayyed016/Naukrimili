/**
 * External job provider facade.
 * HTTP integrations removed; re-exports noop registry for stable import paths.
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
  checkCoresignalHealth,
  checkJobProvidersHealth,
  fetchAllExternalJobs,
} from './provider-registry';
