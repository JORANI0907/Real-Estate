export type Source = 'auction' | 'sale' | 'rent' | 'lease' | 'space';
export type RiskLevel = '상' | '중' | '하' | '분석실패';
export type PropertyStatus = 'active' | 'closed' | 'withdrawn';

export interface Property {
  id: string;
  source: Source;
  sourceId: string;
  externalUrl: string | null;

  title: string | null;
  propertyType: string | null;
  address: string | null;
  addressRoad: string | null;
  latitude: number | null;
  longitude: number | null;
  areaM2: number | null;
  areaPyeong: number | null;
  floor: number | null;
  totalFloors: number | null;
  builtYear: number | null;

  priceMain: number | null;
  priceDeposit: number | null;
  priceMonthly: number | null;
  priceMinBid: number | null;
  minBidRate: number | null;

  caseNumber: string | null;
  court: string | null;
  division: string | null;
  failCount: number;
  bidDate: string | null;
  claimAmount: number | null;
  itemNote: string | null;
  parties: Record<string, string[]>;
  appraisalSummary: string | null;

  status: PropertyStatus;
  crawledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalAnalysis {
  id: string;
  propertyId: string;
  riskLevel: RiskLevel;
  riskSummary: string;
  liquidationReferenceRight: string;
  inheritedRights: string[];
  lesseeRisk: {
    hasLessee: boolean;
    priorityLessee: boolean;
    description: string;
  };
  lienRisk: {
    hasLien: boolean;
    description: string;
  };
  legalGroundRight: {
    exists: boolean;
    description: string;
  };
  estimatedTotalCost: number;
  costBreakdown: {
    bidPriceEstimate: number;
    acquisitionTax: number;
    evictionCost: number;
    other: number;
  };
  investmentMemo: string;
  rawAnalysis: string;
  analyzedAt: string;
}

export interface AuctionListItem {
  id: string;
  sourceId: string;
  caseNumber: string;
  court: string;
  division: string;
  address: string;
  propertyType: string;
  areaPyeong: number | null;
  appraisalAmount: number;
  minBidAmount: number;
  minBidRate: number;
  failCount: number;
  bidDate: string;
  status: PropertyStatus;
  riskLevel: RiskLevel | null;
  riskSummary: string | null;
  estimatedTotalCost: number | null;
  investmentMemo: string | null;
  isFavorite?: boolean;
  hasSolution?: boolean;
}

export interface PropertySolution {
  id: string;
  propertyId: string;
  userId: string;
  summary: string;
  costDetail: {
    bidPriceEstimate: number;
    acquisitionTax: number;
    registrationFee: number;
    judicialScrivener: number;
    stampDuty: number;
    evictionCost: number;
    renovationEstimate: number;
    loanSetupFee: number;
    other: number;
    total: number;
    notes: string;
  };
  rightsSolutions: {
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    solution: string;
    myAction: string;
  }[];
  actionChecklist: {
    beforeBid: string[];
    afterWinning: string[];
    beforeRegistration: string[];
    afterRegistration: string[];
  };
  otherSolutions: string;
  createdAt: string;
}

export interface AuctionListFilters {
  riskLevel?: RiskLevel;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  failCountMin?: number;
  bidDateFrom?: string;
  bidDateTo?: string;
  searchKeyword?: string;
  sortBy?: 'bidDate' | 'minBidAmount' | 'failCount' | 'crawledAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
