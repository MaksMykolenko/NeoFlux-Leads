import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyUnsafeIp,
  validateExternalUrl,
} from "../src/lib/security/urlSafety";

test("URL safety blocks localhost and private IPv4 ranges", async () => {
  assert.equal((await validateExternalUrl("http://127.0.0.1")).ok, false);
  assert.equal((await validateExternalUrl("http://10.0.0.1")).ok, false);
  assert.equal((await validateExternalUrl("http://172.16.0.1")).ok, false);
  assert.equal((await validateExternalUrl("http://192.168.1.1")).ok, false);
  assert.equal((await validateExternalUrl("http://169.254.169.254")).ok, false);
});

test("URL safety blocks unsafe schemes", async () => {
  assert.deepEqual(await validateExternalUrl("file:///etc/passwd"), {
    ok: false,
    reason: "DISALLOWED_SCHEME",
    message: "Дозволено лише http(s). Отримано: file:",
  });
  assert.equal((await validateExternalUrl("ftp://example.com")).ok, false);
});

test("IP classifier blocks private IPv6 ranges but allows public IPs", () => {
  assert.equal(classifyUnsafeIp("::1"), "LOOPBACK");
  assert.equal(classifyUnsafeIp("fc00::1"), "PRIVATE_IP");
  assert.equal(classifyUnsafeIp("fe80::1"), "LINK_LOCAL");
  assert.equal(classifyUnsafeIp("8.8.8.8"), null);
});
