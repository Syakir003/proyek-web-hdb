// src/types/additions.ts
export type OrderAdditionStatus =
  | 'pending_admin'
  | 'admin_approved'
  | 'admin_rejected'
  | 'pending_customer'
  | 'customer_approved'
  | 'customer_rejected'
  | 'paid'
  | 'cancelled';

export interface MaterialCatalogItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  category: string;
  is_active: boolean;
}

export interface AdditionItemInput {
  item_type: 'material' | 'service';
  ref_id: string;
  quantity: number;
}

export interface OrderAdditionItem {
  id: number;
  item_type: 'material' | 'service';
  ref_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderAddition {
  id: number;
  order_id: string;
  initiated_by: 'teknisi' | 'customer';
  initiated_by_id: number;
  status: OrderAdditionStatus;
  admin_notes: string | null;
  payment_method: 'cash' | 'online' | null;
  payment_status: 'pending' | 'paid' | null;
  customer_token: string | null;
  invoice_number: string | null;
  invoice_sent_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderAdditionItem[];
  total?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  teknisi_name?: string;
}
