import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from "node:crypto";

/**
 * AES-256-GCM шифрування для секретів юзера в БД (SMTP пароль тощо).
 *
 * Формат збереженого ciphertext (base64-кодований конкатенат):
 *   [12 bytes IV] [N bytes ciphertext] [16 bytes auth tag]
 *
 * Потребує змінну середовища ENCRYPTION_KEY — 32 байти у hex (64 символи):
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * GCM authenticated encryption гарантує, що мовчазне підмінювання ciphertext
 * у БД відкине помилку при decrypt, замість того щоб віддати сміття у nodemailer.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM рекомендує 96 біт
const TAG_BYTES = 16;
const KEY_BYTES = 32;

const MARKER = "enc:v1:";

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY не задано. Згенеруй: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" і додай у .env",
    );
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY має бути ${KEY_BYTES}-байтовим hex (${KEY_BYTES * 2} символи), отримано ${key.length} байт`,
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv) as CipherGCM;
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return MARKER + Buffer.concat([iv, enc, tag]).toString("base64");
}

export function decrypt(payload: string): string {
  if (!isEncrypted(payload)) {
    // Сумісність зі старими записами, які зберігались у відкритому вигляді
    // до впровадження шифрування. Після першого збереження вони автоматично
    // перейдуть у зашифрований формат.
    return payload;
  }
  const buf = Buffer.from(payload.slice(MARKER.length), "base64");
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error("encrypted payload too short");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(buf.length - TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);

  const key = loadKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv) as DecipherGCM;
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return dec.toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(MARKER);
}
