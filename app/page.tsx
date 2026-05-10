import { prisma } from "@/src/lib/prisma";
import ScraperForm from "@/src/components/ScraperForm";
import BrandMark from "@/src/components/BrandMark";
import LeadTableRow from "@/src/components/LeadTableRow";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { audit: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              NeoFlux Lead Engine
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Автоматичний збір лідів з Google Maps
            </p>
          </div>
        </div>

        <div className="mt-8">
          <ScraperForm />
        </div>

        <div className="mt-10">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">
                Останні ліди
              </h2>
              {leads.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {leads.length}
                </span>
              )}
            </div>

            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg
                  className="h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Лідів ще немає
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Використайте форму вище, щоб почати пошук
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Компанія
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Категорія / Локація
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сайт
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Аудит
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <LeadTableRow
                        key={lead.id}
                        lead={{
                          id: lead.id,
                          companyName: lead.companyName,
                          category: lead.category,
                          city: lead.city,
                          website: lead.website,
                          status: lead.status,
                          audit: lead.audit
                            ? { issues: lead.audit.issues }
                            : null,
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
