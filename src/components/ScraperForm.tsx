"use client";

import { useState } from "react";
import { searchAndSaveLeads } from "@/src/actions/leadActions";
import { useRouter } from "next/navigation";

export default function ScraperForm() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: "" });
  const router = useRouter();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || !city) return;

    setLoading(true);
    setStatus({ type: null, msg: "Запуск сканера... (це може зайняти 15-30 секунд)" });

    try {
      // Ключовий момент: викликаємо серверну дію напряму, без fetch-запитів до API
      const result = await searchAndSaveLeads(query, city);
      
      if (result.success) {
        setStatus({ type: 'success', msg: `Успіх! Знайдено та додано лідів: ${result.count}` });
        setQuery("");
        router.refresh(); // Оновлюємо сторінку, щоб дані з'явилися в таблиці
      } else {
        setStatus({ type: 'error', msg: `Помилка скрапера: ${result.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: "Помилка виклику Server Action." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Пошук нових лідів</h2>
      
      <form onSubmit={handleScrape} className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Ніша (напр. Стоматологія)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60"
        />
        <input
          type="text"
          placeholder="Локація (напр. Черкаси)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={loading}
          className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition-colors disabled:bg-blue-400 flex items-center justify-center min-w-[140px]"
        >
          {loading ? "Сканування..." : "Пошук"}
        </button>
      </form>

      {status.msg && (
        <div className={`mt-4 p-3 text-sm rounded-lg ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {status.msg}
        </div>
      )}
    </div>
  );
}