import "server-only";

/**
 * Витягує GEMINI_API_KEY з env. Кидає помилку з людським текстом, який
 * action-обгортки конвертують у структурований результат для UI.
 *
 * Кидаємо, а не повертаємо null, бо AI-action без ключа не має шансу
 * виконатись — це не graceful degradation, а конфігураційна помилка.
 */
export function requireGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY не налаштовано. Додайте ключ у .env (локально) або змінні середовища Vercel.",
    );
  }
  return key;
}
