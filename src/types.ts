export interface User {
  id: number;
  name: string;
  email: string;
  role: 'basic' | 'premium' | 'support' | 'admin' | 'user';
  balance: number;
  total_earned: number;
  total_deposited: number;
  total_withdrawn: number;
  completed_tasks: number;
  reputation: number;
  level: number;
  referral_code: string;
  status: 'active' | 'banned';
  two_factor_enabled: boolean;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  reward: number;
  total_slots: number;
  completed_slots: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Proof {
  id: number;
  job_id: number;
  user_id: number;
  proof_text: string;
  proof_image?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  user_name?: string;
  job_title?: string;
  reward?: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'reward' | 'referral';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  method?: string;
  sender_number?: string;
  transaction_id?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}
