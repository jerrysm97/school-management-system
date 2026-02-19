import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("FATAL: ENCRYPTION_KEY is missing or invalid length (must be 32 chars).");
}

// Type assertion after validation
const KEY = ENCRYPTION_KEY as string;

/**
 * Encrypts a string using AES-256-GCM.
 * The output format is: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY.substring(0, 32)), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with the above encrypt function.
 *
 * SECURITY: This function intentionally has NO try/catch and NO fallback return value.
 * All errors propagate as thrown exceptions. Callers MUST wrap this in try/catch and
 * handle decryption failure (e.g., return 500 or skip the field) rather than allowing
 * error-message literals to be stored in the database or sent to clients.
 *
 * Errors that will be thrown:
 *   - ERR_CRYPTO_MALFORMED  — input is not in the expected iv:authTag:ciphertext format
 *   - ERR_OSSL_*            — bad auth tag (data tampered), wrong key, or malformed hex
 */
export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    const [ivHex, authTagHex, ciphertextHex] = parts;

    // Validate format BEFORE attempting to use any part of the input.
    if (!ivHex || !authTagHex || !ciphertextHex) {
        throw new Error("ERR_CRYPTO_MALFORMED: Invalid encrypted text format (expected iv:authTag:ciphertext)");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(KEY.substring(0, 32)), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
