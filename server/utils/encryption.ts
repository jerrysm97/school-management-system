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
 * SECURITY: This function intentionally has NO fallback return value (e.g. null).
 * All errors propagate as thrown exceptions with descriptive messages. 
 * Callers MUST wrap this in try/catch and handle decryption failure 
 * (e.g., return null or skip the field) rather than allowing 
 * error-message literals to be stored in the database or sent to clients.
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error("ERR_CRYPTO_INVALID_INPUT: Input must be a non-empty string.");
    }

    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
        throw new Error(`ERR_CRYPTO_MALFORMED: Expected 3 parts (iv:authTag:ciphertext), got ${parts.length}. Envelope: "${encryptedText.substring(0, 20)}..."`);
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;

    try {
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");

        if (iv.length !== IV_LENGTH) {
            throw new Error(`ERR_CRYPTO_INVALID_IV: Expected ${IV_LENGTH} bytes, got ${iv.length}.`);
        }

        const decipher = createDecipheriv(ALGORITHM, Buffer.from(KEY.substring(0, 32)), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (err: any) {
        // If it's a known crypto error (authentication failure), provide a clearer message.
        if (err.message.includes("bad decrypt") || err.message.includes("Unsupported state") || err.code === "ERR_OSSL_EVP_BAD_DECRYPT") {
            throw new Error(`ERR_CRYPTO_AUTH_FAILED: Decryption failed. This usually means the ENCRYPTION_KEY has changed or the data is tampered. Original error: ${err.message}`);
        }
        throw new Error(`ERR_CRYPTO_FAILURE: ${err.message}`);
    }
}
