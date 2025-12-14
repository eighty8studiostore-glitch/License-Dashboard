import { prisma } from '@/lib/prisma';

// Force dynamic so we always see new keys
export const dynamic = 'force-dynamic';

async function getLicenses() {
  return await prisma.license.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

async function createLicense(formData) {
  'use server';
  const name = formData.get('clientName');
  const type = formData.get('type'); // "TRIAL" or "LIFETIME"
  
  // Generate Random Key
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const key = `EIGHTY8-${type}-${randomPart}`;
  
  // Set expiry (Trial = 14 days, Lifetime = null)
  let expiresAt = null;
  if (type === 'TRIAL') {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    expiresAt = d;
  }

  await prisma.license.create({
    data: {
      key,
      clientName: name,
      expiresAt,
      status: 'ACTIVE'
    }
  });
}

export default async function Dashboard() {
  const licenses = await getLicenses();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">License Manager</h1>

        {/* Generator Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate New License</h2>
          <form action={createLicense} className="flex gap-4">
            <input 
              name="clientName" 
              placeholder="Client Name" 
              className="border p-2 rounded flex-1"
              required 
            />
            <select name="type" className="border p-2 rounded">
              <option value="TRIAL">Trial (14 Days)</option>
              <option value="LIFETIME">Lifetime</option>
            </select>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Generate
            </button>
          </form>
        </div>

        {/* License List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Key</th>
                <th className="p-4">Status</th>
                <th className="p-4">HWID Lock</th>
                <th className="p-4">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {licenses.map((lic) => (
                <tr key={lic.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{lic.clientName}</td>
                  <td className="p-4 font-mono text-sm text-blue-600">{lic.key}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${lic.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {lic.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-500">
                    {lic.lockedHwid ? lic.lockedHwid.substring(0, 15) + '...' : 'UNLOCKED'}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {lic.expiresAt ? lic.expiresAt.toLocaleDateString() : 'Lifetime'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}