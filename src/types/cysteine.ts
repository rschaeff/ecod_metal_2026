// ---- Dashboard ----

export interface DashboardSummary {
  totalDomains: number;
  totalCysteines: number;
  nDisulfide: number;
  nMetalBinding: number;
  nUnclassified: number;
  pdbDomains: number;
  predictedDomains: number;
}

export interface XGroupBreakdown {
  xGroupId: string;
  xGroupName: string;
  nDisulfide: number;
  nMetal: number;
  nUnclassified: number;
  total: number;
  metalFraction: number;
}

// ---- Family ----

export interface FamilyInfo {
  fGroupId: string;
  fGroupName: string;
  tGroupId: string;
  tGroupName: string;
  hGroupId: string;
  hGroupName: string;
  xGroupId: string;
  xGroupName: string;
  domainCount: number;
  totalCys: number;
  nDisulfide: number;
  nMetalBinding: number;
  nUnclassified: number;
}

export interface FamilyDomain {
  domainId: string;
  domainDbId: number;
  sourceType: string;
  pdbId: string | null;
  totalCys: number;
  nDisulfide: number;
  nMetalBinding: number;
  nUnclassified: number;
}

// ---- Domain Detail ----

export interface DomainInfo {
  id: number;
  domainId: string;
  rangeDefinition: string;
  sourceType: string;
  pdbId: string | null;
  chainId: string | null;
  xGroupId: string;
  hGroupId: string;
  tGroupId: string;
  fGroupId: string;
  sequence: string;
}

export interface CysteineRecord {
  id: number;
  domainId: number;
  cysPosition: number;
  classification: 'DISULFIDE' | 'METAL_BINDING' | 'UNCLASSIFIED';
  confidence: number;
  evidence: string;
}

export interface Esm2Prediction {
  domainId: number;
  cysPosition: number;
  negProb: number;
  disProb: number;
  metProb: number;
}

export interface GeometricDisulfide {
  id: number;
  domainId: number;
  chain1: string;
  resnum1: number;
  chain2: string;
  resnum2: number;
  sgSgDistance: number;
}

export interface PdbSsbond {
  id: number;
  domainId: number;
  pdbId: string;
  chain1: string;
  resnum1: number;
  chain2: string;
  resnum2: number;
  bothInDomain: boolean;
}

export interface PdbMetalLink {
  id: number;
  domainId: number;
  pdbId: string;
  metal: string;
  metalChain: string;
  metalResnum: number;
  coordResname: string;
  coordChain: string;
  coordResnum: number;
  coordAtom: string;
  cofactor: string | null;
}

export interface DomainEvidence {
  esm2Predictions: Esm2Prediction[];
  geometricDisulfides: GeometricDisulfide[];
  pdbSsbonds: PdbSsbond[];
  pdbMetalLinks: PdbMetalLink[];
}

// ---- Search ----

export interface SearchResult {
  type: 'domain' | 'family' | 'hgroup' | 'xgroup' | 'pdb';
  id: string;
  label: string;
  description: string;
}

// ---- API ----

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ---- Pagination ----

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
