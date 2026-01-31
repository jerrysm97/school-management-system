import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "fallback_secret_for_dev_only_32_chars_";

/**
 * Encrypts a string using AES-256-GCM.
 * The output format is: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with the above encrypt function.
 */
export function decrypt(encryptedText: string): string {
    try {
        const [ivHex, authTagHex, ciphertextHex] = encryptedText.split(":");

        if (!ivHex || !authTagHex || !ciphertextHex) {
            throw new Error("Invalid encrypted text format");
        }

        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error: any) {
        console.error("Decryption failed:", error.message);
        return "[DECRYPTION_FAILED]";
    }
}
