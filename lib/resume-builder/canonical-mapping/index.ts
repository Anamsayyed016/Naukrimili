export {
  runCanonicalBuilderMapping,
  ingestCanonicalNodes,
  validateCanonicalNodes,
  mapCanonicalNodesToBuilder,
  recoverBuilderFromNodes,
  extendBuilderSchema,
} from './pipeline';

export type {
  CanonicalNodeType,
  CanonicalFieldNode,
  CanonicalMappingResult,
  CanonicalMappingReport,
  ExtendedBuilderSections,
  BuilderFieldSpec,
} from './types';

export { CANONICAL_MAPPING_VERSION, emptyExtendedBuilderSections } from './types';
export { BUILDER_FIELD_SPECS, inferNodeTypeFromKey, DYNAMIC_SECTION_ROUTING } from './dictionary';
