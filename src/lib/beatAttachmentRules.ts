/**
 * Обмеження для аудіо-вкладення в листах режиму «Біти» та тестовій відправці
 * з налаштувань SMTP. 15MB у next.config.ts; тут нижчий поріг — запас під FormData.
 */
export const BEAT_EMAIL_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const BEAT_EMAIL_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
]);

export type BeatEmailAudioReject =
  | "NO_FILE"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE";

export function validateBeatEmailAudioFile(
  file: unknown,
):
  | { ok: true; file: File }
  | { ok: false; reason: BeatEmailAudioReject; error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, reason: "NO_FILE", error: "Не передано аудіо-файл" };
  }
  if (file.size > BEAT_EMAIL_MAX_ATTACHMENT_BYTES) {
    const mb = (BEAT_EMAIL_MAX_ATTACHMENT_BYTES / 1024 / 1024).toFixed(0);
    return {
      ok: false,
      reason: "FILE_TOO_LARGE",
      error: `Файл завеликий — максимум ${mb}MB.`,
    };
  }
  const mime = file.type?.toLowerCase() ?? "";
  if (mime && !BEAT_EMAIL_AUDIO_MIME_TYPES.has(mime)) {
    return {
      ok: false,
      reason: "INVALID_FILE_TYPE",
      error: `Тип файлу не підтримується (${mime}). Очікую MP3/WAV/M4A/FLAC/OGG.`,
    };
  }
  return { ok: true, file };
}
