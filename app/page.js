import { prisma } from '@/lib/prisma';
import { createLicense } from '@/lib/subscription'; // Ensure you created this in the previous step
import { logout } from '@/app/actions';
import { revalidatePath } from 'next/cache';

// Force dynamic so we always see new keys
export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'ACTIVE').length,
    expired: licenses.filter(l => l.status === 'EXPIRED').length,
  };

  return { licenses, stats };
}

// Wrapper action to handle form submission
async function handleCreateLicense(formData) {
  'use server';

  const clientName = formData.get('clientName');
  const planType = formData.get('planType');
  const notes = formData.get('notes');

  await createLicense({
    clientName,
    planType,
    notes
  });

  revalidatePath('/');
}

export default async function Dashboard() {
  const { licenses, stats } = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">License<span className="text-blue-600">Admin</span></span>
            </div>
            <div className="flex items-center">
              <form action={logout}>
                <button className="text-sm font-medium text-gray-500 hover:text-red-600 transition">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Licenses" value={stats.total} />
          <StatCard label="Active Licenses" value={stats.active} color="text-green-600" />
          <StatCard label="Expired / Inactive" value={stats.expired} color="text-red-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Create License Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create License</h2>
              <form action={handleCreateLicense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Client Name</label>
                  <input name="clientName" required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Validity Plan</label>
                  <select name="planType" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="MONTHLY">1 Month</option>
                    <option value="BIANNUAL">6 Months</option>
                    <option value="YEARLY">1 Year</option>
                    <option value="LIFETIME">Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes (Optional)</label>
                  <textarea name="notes" rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Internal reference..."></textarea>
                </div>

                <button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition shadow-sm">
                  Generate Key
                </button>
              </form>
            </div>
          </div>

          {/* Licenses Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Recent Licenses</h3>
                <span className="text-xs text-gray-500">Sorted by newest</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-medium">Client</th>
                      <th className="px-6 py-3 font-medium">License Key</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {licenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {lic.clientName || 'Unknown'}
                          <div className="text-xs text-gray-400 font-normal">{lic.notes}</div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono select-all">
                            {lic.key}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lic.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {lic.expiresAt
                            ? new Date(lic.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                            : <span className="text-purple-600 font-medium">Lifetime</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {licenses.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No licenses found. Create one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// --- UI Components ---

function StatCard({ label, value, color = "text-gray-900" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    EXPIRED: "bg-red-100 text-red-700 border-red-200",
    SUSPENDED: "bg-orange-100 text-orange-700 border-orange-200",
  };

  const className = styles[status] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {status}
    </span>
  );
}