import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, readSessionEmail } from "./auth";

const TEST_SECRET = "test-auth-secret-at-least-16";

describe("session tokens", () => {
  const originalEnv = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_EMAIL: process.env.AUTH_EMAIL,
    AUTH_PASSWORD: process.env.AUTH_PASSWORD,
  };

  beforeEach(() => {
    process.env.AUTH_SECRET = TEST_SECRET;
    process.env.AUTH_PASSWORD = "unused-for-session-tests";
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("round-trips a dotted email such as info@bitbirr.nl", async () => {
    process.env.AUTH_EMAIL = "info@bitbirr.nl";
    const token = await createSessionToken("info@bitbirr.nl");
    await expect(readSessionEmail(token)).resolves.toBe("info@bitbirr.nl");
  });

  it("round-trips a non-dotted email", async () => {
    process.env.AUTH_EMAIL = "admin@localhost";
    const token = await createSessionToken("admin@localhost");
    await expect(readSessionEmail(token)).resolves.toBe("admin@localhost");
  });

  it("rejects an expired token", async () => {
    process.env.AUTH_EMAIL = "info@bitbirr.nl";
    const thirteenHoursAgo = Date.now() - 13 * 60 * 60 * 1000;
    const token = await createSessionToken("info@bitbirr.nl", thirteenHoursAgo);
    await expect(readSessionEmail(token)).resolves.toBeNull();
  });

  it("rejects a tampered signature", async () => {
    process.env.AUTH_EMAIL = "info@bitbirr.nl";
    const token = await createSessionToken("info@bitbirr.nl");
    const lastDot = token.lastIndexOf(".");
    const mac = token.slice(lastDot + 1);
    const flipped = (mac[0] === "A" ? "B" : "A") + mac.slice(1);
    const tampered = `${token.slice(0, lastDot)}.${flipped}`;
    await expect(readSessionEmail(tampered)).resolves.toBeNull();
  });
});
