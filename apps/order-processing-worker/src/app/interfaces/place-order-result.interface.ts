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

export interface ProfileAddress {
  type: string;
  zipCode?: string;
  fiasCode?: string;
  region_value?: string | null;
  district_value?: string | null;
  district_type?: string | null;
  city_value?: string | null;
  city_type?: string | null;
  locality_value?: string | null;
  locality_type?: string | null;
  soviet_village_value?: string | null;
  soviet_village_type?: string | null;
  urban_district_value?: string | null;
  urban_district_type?: string | null;
  street_value?: string | null;
  street_type?: string | null;
  level1_type?: string | null;
  level1_value?: string | null;
  level2_type?: string | null;
  level2_value?: string | null;
  level3_type?: string | null;
  level3_value?: string | null;
  apartment_type?: string | null;
  apartment_value?: string | null;
  note?: string | null;
  okato?: string | null;
  kladr?: string | null;
  oktmo?: string | null;
  full_name?: string | null;
  addressStr?: string;
  countryId?: string;
  region?: string;
  street?: string;
  house?: string;
  flat?: string;
  city?: string;
}

export interface ProfileContact {
  type: string;
  value: string;
  email: boolean;
  cellPhone: boolean;
}

export interface ProfileDocument {
  type: string;
  series?: string;
  number: string;
  issueDate: string;
  issuedBy: string;
}

export interface ProfileInfoResponse {
  id: number;
  snils?: string;
  phone?: string;
  email?: string;
  agreementConfirmed?: boolean;
  addresses?: ProfileAddress[];
  personAddresses?: ProfileAddress[];
  attributesOauth: {
    userId: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    birthDate?: string;
    birthPlace?: string;
    gender?: string;
    citizenship?: string;
    snils?: string;
    inn?: string;
    phone?: string;
    email?: string;
    contacts?: {
      size: number;
      elements: ProfileContact[];
    };
    addresses?: {
      size: number;
      elements: ProfileAddress[];
    };
    documents?: {
      size: number;
      elements: ProfileDocument[];
    };
    globalRole?: string;
  };
  noauthorization: boolean;
  settings?: string[];
}

export interface OrderDeclarant {
  firstname: string;
  surname: string;
  patronymic?: string;
  countryInformation: string;
  snils: string;
  email: string;
  phoneNumber: string;
  addresses: any[];
}

export interface OrderAttachment {
  documentTypeCode: string;
  documentParentCode: string;
  series?: string;
  number: string;
  issueDate: string;
  issuer: string;
  subjectType: string;
}

export interface OrderDeliveryAction {
  delivery: string;
  linkEmail: string;
}

export interface ProfileInfo {
  deliveryAction: OrderDeliveryAction;
  declarants: OrderDeclarant[];
  attachments: OrderAttachment[];
}
