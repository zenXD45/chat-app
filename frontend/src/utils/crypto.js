/**
 * Utility functions for End-to-End Encryption (E2EE) using Web Crypto API.
 */

// Generate RSA-OAEP Key Pair (for key exchange)
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
  };
};

// Import Public Key
const importPublicKey = async (base64Key) => {
  const binaryDer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

// Import Private Key
const importPrivateKey = async (base64Key) => {
  const binaryDer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

// Encrypt a message using AES-GCM, and encrypt the AES key with RSA-OAEP
// To keep it simple and handle large messages, we use a hybrid approach.
// However, for a basic chat app, if messages are short, we can just use RSA.
// We'll use RSA directly for simplicity assuming messages < 190 bytes.
// If > 190 bytes, this will throw. For a real app, hybrid encryption is used.
export const encryptMessage = async (message, receiverPublicKeyBase64) => {
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);

  // Generate AES key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Encrypt message with AES
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodedMessage
  );

  // Export AES key
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // Encrypt AES key with RSA Public Key
  const publicKey = await importPublicKey(receiverPublicKeyBase64);
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawAesKey
  );

  // Combine and encode: IV (12 bytes) + Encrypted AES Key (256 bytes for RSA-2048) + Encrypted Message
  const combined = new Uint8Array(iv.length + encryptedAesKey.byteLength + encryptedContent.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedAesKey), iv.length);
  combined.set(new Uint8Array(encryptedContent), iv.length + encryptedAesKey.byteLength);

  return btoa(String.fromCharCode(...combined));
};

export const decryptMessage = async (encryptedBase64, privateKeyBase64) => {
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encryptedAesKey = combined.slice(12, 12 + 256); // 256 bytes for RSA-2048
    const encryptedContent = combined.slice(12 + 256);

    // Decrypt AES Key with RSA Private Key
    const privateKey = await importPrivateKey(privateKeyBase64);
    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAesKey
    );

    // Import decrypted AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM" },
      true,
      ["decrypt"]
    );

    // Decrypt content with AES
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (err) {
    console.error("Decryption failed", err);
    return "[Decryption Failed]";
  }
};
