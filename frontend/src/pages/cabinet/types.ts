/** Kabinet: backend javoblari tiplari (Q-01 da PersonalCabinet.tsx dan ajratildi). */
export interface DidoxParty {
  name?: string;
  tin?: string;
  address?: string;
  [key: string]: unknown;
}
export interface DidoxDocumentJson {
  url?: string;
  buyer?: DidoxParty;
  seller?: DidoxParty;
  document?: { documentno?: string; documentdate?: string; documentname?: string; [key: string]: unknown };
  contractdoc?: { contractno?: string; contractdate?: string; [key: string]: unknown };
}

// contracts/ API javobi (ContractSerializer)
export interface Contract {
  id: number;
  contract_number: string;
  status: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  notes: string | null;
  contract_url: string | null;
  didox_contract_data: {
    _id?: string;
    pending_document?: { document_json?: DidoxDocumentJson };
    [key: string]: unknown;
  } | null;
}

// Order type for orders list
export interface BookOrder {
  id: number;
  total_amount: string;
  status: string;
  order_type: string;
  payment_url: string;
  postal_status?: string; // New field for delivery status
  postal_tracking_number?: string; // New field for tracking number
  items: {
    id: number;
    book: {
      id: number;
      name: string;
      price: number;
      image_url: string;
      description: string;
      year: number;
    };
    quantity: number;
    price_snapshot: number;
    subtotal: number;
  }[];
}

export interface ServiceOrder {
  id: number;
  service: number;
  provider: string;
  payment_url: string;
}

// Package item type for user's services
export interface PackageService {
  id: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  slug: string;
}

export interface PackageItem {
  id: number;
  package: number;
  package_service: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  limit: number;
}

export interface UserPackageService {
  package_service: PackageService;
  items: PackageItem[];
}

export interface FormData {
  stir: string;
  companyName: string;
  directorName: string;
  address: string;
  phoneNumber: string;
}
