import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from './AdminDashboard';
import { getRequests } from '@/lib/supabase';
import { Request } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

// Mock requests for demo mode (when Supabase is not configured)
const mockRequests: Request[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@techstartup.io',
    business_type: 'SaaS / Software',
    selected_agent: 'sales-lead-agent',
    message: 'We need to automate our outbound prospecting for our B2B SaaS.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    name: 'Maria Chen',
    email: 'maria@growfast.com',
    business_type: 'E-Commerce / Retail',
    selected_agent: 'shopify-ai-agent',
    message: 'Running a 500-product Shopify store. Need help with abandoned carts and inventory.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '3',
    name: 'James Williams',
    email: 'james@localbiz.net',
    business_type: 'Local Service Business',
    selected_agent: 'local-business-agent',
    message: 'We have a plumbing company and want to improve our local search ranking.',
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '4',
    name: 'Fatima Al-Hassan',
    email: 'fatima@contentco.agency',
    business_type: 'Agency / Consulting',
    selected_agent: 'content-creator-agent',
    message: 'Managing content for 12 clients. Need to scale output by 5x.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '5',
    name: 'Robert Park',
    email: 'rpark@fintech.co',
    business_type: 'Finance / Accounting',
    selected_agent: 'finance-assistant-agent',
    message: 'Small fintech company needing better cash flow visibility.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export default async function AdminPage() {
  // ── Simple password protection ──────────────────────────────
  // NOTE: This is a lightweight MVP guard. For production, use NextAuth or Supabase Auth.
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'rootx_admin_2024';

  // If not authenticated, redirect to login
  if (adminToken !== adminPassword) {
    redirect('/admin/login');
  }

  // ── Fetch requests ──────────────────────────────────────────
  let requests: Request[] = [];
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (isDemo) {
    requests = mockRequests;
  } else {
    const data = await getRequests();
    requests = data as Request[];
  }

  return <AdminDashboard requests={requests} isDemo={isDemo} />;
}
