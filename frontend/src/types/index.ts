export type OrderStatus = 'pending' | 'in_progress' | 'done' | 'cancelled' | 'overdue';

export interface DiscountProgram {
  id: number;
  name: string;
  min_completed_orders: number;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
}

export interface DiscountProgramCreate {
  name: string;
  min_completed_orders: number;
  discount_percent: number;
  is_active?: boolean;
}

export interface DiscountProgramUpdate {
  name?: string;
  min_completed_orders?: number;
  discount_percent?: number;
  is_active?: boolean;
}
export type ServiceType = 'web_design' | 'graphic_design' | 'social_media_campaign' | 'video_production' | 'copywriting';
export type ScopeType = 'small' | 'medium' | 'large';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  order_count: number;
}

export interface ClientDetail extends Client {
  orders: Order[];
}

export interface ClientSummary {
  id: number;
  name: string;
  email: string;
  company: string | null;
}

export interface Order {
  id: number;
  client_id: number;
  created_by_id: number | null;
  title: string;
  description: string | null;
  service_type: ServiceType;
  scope: ScopeType;
  status: OrderStatus;
  base_price: number;
  scope_multiplier: number;
  discount_percent: number;
  discount_program_id: number | null;
  discount_name: string | null;
  final_price: number;
  deadline: string | null;
  created_at: string;
  updated_at: string | null;
  client: ClientSummary;
  attachment_filename: string | null;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  active_orders: number;
  pending_orders: number;
  overdue_orders: number;
  total_clients: number;
  orders_by_service: { service_type: string; count: number; revenue: number; overdue: number }[];
  orders_last_30_days: { date: string; count: number; revenue: number }[];
  recent_orders: {
    id: number;
    title: string;
    client_name: string;
    status: OrderStatus;
    final_price: number;
    created_at: string;
  }[];
}

export interface MonitoringData {
  summary: {
    total_orders: number;
    active_orders: number;
    pending_orders: number;
    overdue_orders: number;
    total_revenue: number;
    new_orders_in_period: number;
  };
  orders_by_day: { date: string; count: number; revenue: number }[];
  orders_by_service: { service_type: string; count: number; revenue: number; overdue: number }[];
}

export interface OrderCreate {
  client_id: number;
  title: string;
  description?: string;
  service_type: ServiceType;
  scope: ScopeType;
  deadline?: string;
}

export interface OrderUpdate {
  title?: string;
  description?: string;
  service_type?: ServiceType;
  scope?: ScopeType;
  status?: OrderStatus;
  deadline?: string;
}

// ── Campaign Analytics ──────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ChannelType = 'social_media' | 'search' | 'display' | 'video' | 'email' | 'outdoor';
export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface MediaChannel {
  id: number;
  name: string;
  channel_type: ChannelType;
  description: string | null;
  created_at: string;
}

export interface Campaign {
  id: number;
  order_id: number;
  name: string;
  description: string | null;
  status: CampaignStatus;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string | null;
  media_channels: MediaChannel[];
}

export interface CampaignMetric {
  id: number;
  campaign_id: number;
  channel_id: number | null;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  created_at: string;
}

export interface CampaignReport {
  id: number;
  campaign_id: number;
  period: ReportPeriod;
  period_start: string;
  period_end: string;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  total_conversions: number;
  total_spend: number;
  generated_at: string;
}

// ── Ad Placement & Scheduling ───────────────────────────────────────────────

export type PlacementStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type ContentType = 'image' | 'video' | 'text' | 'carousel' | 'story';
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface AdPlacement {
  id: number;
  campaign_id: number;
  channel_id: number;
  scheduled_at: string;
  duration_seconds: number | null;
  position: string | null;
  cost_per_slot: number;
  status: PlacementStatus;
  notes: string | null;
  created_at: string;
}

export interface ContentCalendarEntry {
  id: number;
  campaign_id: number;
  title: string;
  content_type: ContentType;
  scheduled_date: string;
  status: ContentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// ── Target Audience ─────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'all';
export type IncomeLevel = 'low' | 'medium' | 'high' | 'ultra_high';

export interface AudienceSegment {
  id: number;
  name: string;
  age_min: number | null;
  age_max: number | null;
  gender: Gender;
  interests: string | null;
  geography: string | null;
  income_level: IncomeLevel | null;
  created_at: string;
  updated_at: string | null;
}

// ── A/B Testing ─────────────────────────────────────────────────────────────

export interface CampaignVariant {
  id: number;
  campaign_id: number;
  name: string;
  description: string | null;
  material_url: string | null;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  is_winner: boolean;
  created_at: string;
  updated_at: string | null;
}

// ── Payment System ──────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'crypto';
export type RefundStatus = 'requested' | 'approved' | 'rejected' | 'processed';
export type PlanStatus = 'pending' | 'paid' | 'overdue';

export interface PaymentPlan {
  id: number;
  invoice_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: PlanStatus;
  payment_id: number | null;
  created_at: string;
}

export interface Refund {
  id: number;
  payment_id: number;
  amount: number;
  reason: string;
  status: RefundStatus;
  refund_date: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  method: PaymentMethod;
  currency: string;
  status: PaymentStatus;
  transaction_ref: string | null;
  created_at: string;
  refunds: Refund[];
}

export interface Invoice {
  id: number;
  order_id: number;
  issue_date: string;
  due_date: string;
  amount: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  payments: Payment[];
  payment_plans: PaymentPlan[];
}

// ── CRM / Operations ────────────────────────────────────────────────────────

export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'expired' | 'terminated';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'social' | 'cold_call' | 'event' | 'other';

export interface Contract {
  id: number;
  client_id: number;
  order_id: number | null;
  title: string;
  content: string | null;
  status: ContractStatus;
  signed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TimeLog {
  id: number;
  task_id: number;
  user_id: number;
  hours: number;
  logged_at: string;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  order_id: number | null;
  assigned_to_id: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  time_logs: TimeLog[];
}

export interface ClientContact {
  id: number;
  client_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Vendor {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  assigned_to_id: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface ClientCreate {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}
