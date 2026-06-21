// ============================================================
// RootX — Type Definitions
// ============================================================

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // emoji or icon identifier
  category: string;
  price: number;
  priceLabel: string;
  features: string[];
  useCases: string[];
  badge?: string; // e.g. "Popular", "New"
  gradient: string; // Tailwind gradient classes
}

export interface Request {
  id: string;
  name: string;
  email: string;
  business_type: string;
  selected_agent: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export type RequestStatus = 'pending' | 'in_progress' | 'completed';
