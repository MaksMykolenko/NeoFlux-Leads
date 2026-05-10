import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import ScraperForm from "@/src/components/ScraperForm";
import AuditButton from "@/src/components/AuditButton";

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
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          NeoFlux Lead Engine
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Автоматичний збір лідів з Google Maps
        </p>

        <div className="mt-8">
          <ScraperForm />
        </div>

        <div className="mt-10">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">
                Останні ліди
              </h2>
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
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                          >
                            {lead.companyName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {lead.category}
                          {lead.city && (
                            <span className="text-gray-400"> · {lead.city}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                              Немає
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {lead.website ? (
                            <AuditButton
                              leadId={lead.id}
                              hasAudit={!!lead.audit}
                              issuesCount={lead.audit?.issues.length}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
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
