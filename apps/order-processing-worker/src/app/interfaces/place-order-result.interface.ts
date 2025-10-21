import { OrderStatus } from '@rosreestr-extracts/constants';

export interface PlaceOrderResult {
  status?: OrderStatus;
  orderNum?: string;
  isComplete?: boolean;
}

export interface CadastralSearchResponse {
  elements: Array<{
    objectType: string;
    cadastralNumber: string;
    address: string;
    cadPrice?: number;
    cadPriceDate?: number;
    regDate?: number;
    mainCharacters?: Array<{
      code: string;
      description: string;
      value: number;
      unitCode: string;
      unitDescription: string;
    }>;
  }>;
  count: number;
}

export interface UploadResponse {
  superPackageGuid: string;
  packageGuid: string;
  statementGuid: string;
  draftGuid: string;
  contentToSign: string | null;
  oneRequestForAllObjects: string | null;
}

export interface BalanceItem {
  ordinal: number;
  mnemo: string;
  name: string;
  count: number;
  totalCount: number;
}

export type BalanceResponse = BalanceItem[];

export interface ApplicationResponse {
  content?: Array<{
    id: number;
    requestNumber: string;
    statusCode: string;
    requestStatus: string;
  }>;
}
