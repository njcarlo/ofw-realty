// Admin Portal — Document Review Dashboard
// Lists realtors with pending document submissions for admin review

export default async function AdminDashboard() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  let pendingDocs: any[] = []
  try {
    const res = await fetch(`${apiUrl}/documents/pending`, { cache: 'no-store' })
    if (res.ok) pendingDocs = await res.json()
  } catch {
    // API not available during build
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Pending Document Reviews
          {pendingDocs.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingDocs.length}
            </span>
          )}
        </h2>

        {pendingDocs.length === 0 ? (
          <p className="text-gray-400 text-sm">No pending documents.</p>
        ) : (
          <div className="space-y-3">
            {pendingDocs.map((doc: any) => (
              <div key={doc.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{doc.doc_type} — Doc #{doc.doc_number}</p>
                  <p className="text-xs text-gray-500">Owner: {doc.owner_id} · Submitted: {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/documents/${doc.id}/review?action=approve`}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </a>
                  <a
                    href={`/documents/${doc.id}/review?action=reject`}
                    className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-200"
                  >
                    Reject
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
