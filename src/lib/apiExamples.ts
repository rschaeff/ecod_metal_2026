// Documentation-only payloads surfaced on /downloads. The example responses
// here are *truncated* representative shapes — long arrays show the first
// element followed by "/* … */" so the docs read at a glance. Each payload
// is hand-kept in sync with the live route in src/app/api/.

export interface ApiQueryParam {
  name: string;
  description: string;
  default?: string;
  example?: string;
}

export interface ApiEndpoint {
  method: 'GET';
  path: string;            // human-readable path with `{param}` placeholders
  shortDescription: string;
  longDescription?: string;
  queryParams?: ApiQueryParam[];
  exampleRequest: string;  // concrete URL the user can click
  exampleResponse: string; // JSON-stringified body
  errorCodes?: string[];
}

const J = (obj: unknown): string => JSON.stringify(obj, null, 2);

const ENVELOPE_DESCRIPTION =
  'All responses use the same envelope: ' +
  '`{ success: boolean, data?: <route-specific>, error?: { code, message } }`. ' +
  'A successful response never carries an error field, and vice versa, so a single ' +
  'truthy check on `success` is enough to branch.';

export const API_COMMON_ERROR_CODES: { code: string; status: number; description: string }[] = [
  { code: 'INVALID_ID',    status: 400, description: 'Path identifier missing or not in the expected shape.' },
  { code: 'INVALID_QUERY', status: 400, description: 'Query string missing or below the minimum length (search: 2 chars).' },
  { code: 'NOT_FOUND',     status: 404, description: 'The requested resource (domain / family / H-group) does not exist or has no classified F70 representative.' },
  { code: 'RATE_LIMITED',  status: 429, description: 'IP exceeded the rate-limit window. Retry after the seconds in the Retry-After header.' },
  { code: 'DOMAIN_ERROR',  status: 500, description: 'Domain detail query failed (DB unreachable or schema drift).' },
  { code: 'FAMILY_ERROR',  status: 500, description: 'Family detail query failed.' },
  { code: 'HGROUP_ERROR',  status: 500, description: 'H-group detail query failed.' },
  { code: 'SEARCH_ERROR',  status: 500, description: 'Search query failed unexpectedly.' },
  { code: 'SUMMARY_ERROR', status: 500, description: 'Dashboard summary query failed.' },
];

export const API_ENVELOPE_DESCRIPTION = ENVELOPE_DESCRIPTION;

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/domain/{domainId}',
    shortDescription: 'Per-cysteine predictions and structural evidence for one domain.',
    longDescription:
      'Path parameter accepts the ECOD domain identifier (`e3h35A1`) or the numeric ' +
      'database id. Returns the domain header, every classified cysteine with its ' +
      'three-state call, and structural-evidence streams (geometric SS bonds, ' +
      'PDB SSBOND records, PDB metal LINK records, ESM2 per-class probabilities).',
    exampleRequest: '/api/domain/e3h35A1',
    exampleResponse: J({
      success: true,
      data: {
        domain: {
          domainId: 'e3h35A1',
          rangeDefinition: 'A:5-150',
          sourceType: 'pdb',
          pdbId: '3h35',
          chainId: 'A',
          uniprotAcc: 'P12345',
          xGroupId: '131.1',
          hGroupId: '131.1.1',
          tGroupId: '131.1.1.1',
          fGroupId: '131.1.1.1.0',
        },
        classifications: [
          { cysPosition: 23, classification: 'DISULFIDE',     confidence: 0.984, evidence: 'SSBOND' },
          { cysPosition: 67, classification: 'METAL_BINDING', confidence: 0.992, evidence: 'METAL_LINK:ZN' },
          /* … */
        ],
        evidence: {
          esm2Predictions: [
            { cysPosition: 23, negProb: 0.012, disProb: 0.984, metProb: 0.004 },
            /* … */
          ],
          geometricDisulfides: [{ chain1: 'A', resnum1: 27, chain2: 'A', resnum2: 134, sgSgDistance: 2.04 }],
          pdbSsbonds:        [{ pdbId: '3h35', chain1: 'A', resnum1: 27, chain2: 'A', resnum2: 134, bothInDomain: true }],
          pdbMetalLinks:     [{ pdbId: '3h35', metal: 'ZN', metalChain: 'A', metalResnum: 401, coordResname: 'CYS', coordChain: 'A', coordResnum: 67, coordAtom: 'SG', cofactor: null }],
        },
      },
    }),
    errorCodes: ['INVALID_ID', 'NOT_FOUND', 'RATE_LIMITED', 'DOMAIN_ERROR'],
  },
  {
    method: 'GET',
    path: '/api/family/{fGroupId}',
    shortDescription: 'Aggregate stats and paginated domain list for one F-group.',
    longDescription:
      'Path parameter is the dotted F-group identifier (`131.1.1.0`). Returns a ' +
      'family header, classification totals, and a slice of the F70 representative ' +
      'domain list governed by the `page`, `limit`, `sortBy`, and `sortDir` query ' +
      'parameters.',
    queryParams: [
      { name: 'page',    description: '1-indexed page number.',           default: '1',         example: '2' },
      { name: 'limit',   description: 'Page size (max 100).',             default: '50',        example: '20' },
      { name: 'sortBy',  description: 'One of domain_id, source_type, total_cys, n_disulfide, n_metal_binding, n_unclassified.', default: 'domain_id', example: 'n_metal_binding' },
      { name: 'sortDir', description: 'asc | desc.',                      default: 'asc',       example: 'desc' },
    ],
    exampleRequest: '/api/family/131.1.1.0?page=1&limit=2&sortBy=n_metal_binding&sortDir=desc',
    exampleResponse: J({
      success: true,
      data: {
        family: {
          fGroupId: '131.1.1.0',
          fGroupName: 'Example F-group',
          xGroupId: '131',
          xGroupName: 'Example X-group',
          hGroupId: '131.1',
          tGroupId: '131.1.1',
          domainCount: 47,
          totalCys: 312,
          nDisulfide: 88,
          nMetalBinding: 42,
          nUnclassified: 182,
        },
        domains: [
          { domainId: 'e3h35A1', sourceType: 'pdb', pdbId: '3h35',
            totalCys: 9, nDisulfide: 2, nMetalBinding: 4, nUnclassified: 3 },
          /* … */
        ],
        pagination: { total: 47, page: 1, limit: 2, totalPages: 24 },
      },
    }),
    errorCodes: ['INVALID_ID', 'NOT_FOUND', 'RATE_LIMITED', 'FAMILY_ERROR'],
  },
  {
    method: 'GET',
    path: '/api/hgroup/{hGroupId}',
    shortDescription: 'Per-H-group aggregate plus the F70 representative list.',
    longDescription:
      'Path parameter is the dotted H-group identifier (`3380.1`). Returns aggregate ' +
      'PDB-source vs AFDB-source classification fractions and the full representative ' +
      'list with per-domain classification counts. Backs the /h-group/[id] detail page.',
    exampleRequest: '/api/hgroup/3380.1',
    exampleResponse: J({
      success: true,
      data: {
        hGroupId: '3380.1',
        hGroupName: 'Candidate-novel metal-binding H-group',
        xGroupId: '3380',
        xGroupName: 'Parent X-group',
        nPdbReps: 12,
        nAfdbReps: 318,
        pdbTotalCys: 84,
        afdbTotalCys: 2204,
        pdbDisulfidePct: 0.0,
        pdbMetalPct: 0.0,
        afdbDisulfidePct: 1.4,
        afdbMetalPct: 96.7,
        representatives: [
          { domainId: 'e1abcA1', sourceType: 'pdb', pdbId: '1abc', uniprotAcc: null,
            chainId: 'A', rangeDefinition: 'A:5-110',
            fGroupId: '3380.1.1.1.0', fGroupName: 'Example',
            totalCys: 7, nDisulfide: 0, nMetalBinding: 6, nUnclassified: 1 },
          /* … */
        ],
      },
    }),
    errorCodes: ['INVALID_ID', 'NOT_FOUND', 'RATE_LIMITED', 'HGROUP_ERROR'],
  },
  {
    method: 'GET',
    path: '/api/search',
    shortDescription: 'Search domain ID, PDB ID, UniProt accession, or X/H/F-group dotted notation.',
    longDescription:
      'Same matcher as the header search bar. The query string must be at least 2 ' +
      'characters. A single dotted query (`3380.1`) may resolve to several ECOD levels ' +
      'simultaneously — the response includes one entry per matching level so the ' +
      'caller can pick the right surface.',
    queryParams: [
      { name: 'q', description: 'Search string. Minimum 2 chars.', example: 'e3h35A1' },
    ],
    exampleRequest: '/api/search?q=3380.1',
    exampleResponse: J({
      success: true,
      data: [
        { type: 'family', id: '3380.1.1.1.0', label: 'F-group 3380.1.1.1.0', description: 'Example F-group' },
        { type: 'hgroup', id: '3380.1',       label: 'H-group 3380.1',       description: 'Candidate-novel metal-binding H-group' },
        { type: 'xgroup', id: '3380',         label: 'X-group 3380',         description: 'Parent X-group' },
      ],
    }),
    errorCodes: ['INVALID_QUERY', 'RATE_LIMITED', 'SEARCH_ERROR'],
  },
  {
    method: 'GET',
    path: '/api/summary',
    shortDescription: 'Top-level dashboard counts.',
    longDescription:
      'Snapshot of the totals shown on the dashboard stat strip: total domains, ' +
      'total cysteines, the three classification counts, plus a top-X-group breakdown ' +
      'kept for legacy callers (it predates the dedicated /x-group surface).',
    exampleRequest: '/api/summary',
    exampleResponse: J({
      success: true,
      data: {
        summary: {
          totalDomains: 691_078,
          totalCysteines: 2_706_778,
          nDisulfide: 456_109,
          nMetalBinding: 166_445,
          nUnclassified: 2_084_224,
          pdbDomains: 157_480,
          predictedDomains: 533_598,
        },
        xGroups: [
          { xGroupId: '131', xGroupName: 'Example', nDisulfide: 1234, nMetal: 567,
            nUnclassified: 4321, total: 6122, metalFraction: 0.092 },
          /* … */
        ],
      },
    }),
    errorCodes: ['RATE_LIMITED', 'SUMMARY_ERROR'],
  },
];
