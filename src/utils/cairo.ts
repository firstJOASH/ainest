import { shortString } from "starknet";

/**
 * Decode Cairo's core::byte_array::ByteArray to UTF-8 string.
 * Works for starknet.js call results where ByteArray is represented as:
 * { data: bytes31[], pending_word: felt252, pending_word_len: felt252 }
 */

export function decodeByteArray(byteArray: any): string {
  if (!byteArray) return "";

  // Handle plain strings (already decoded by starknet.js sometimes)
  if (typeof byteArray === "string") {
    try {
      return shortString.decodeShortString(byteArray);
    } catch {
      return byteArray; // fallback: just return as-is
    }
  }

  // Handle the Cairo ByteArray struct { data, pending_word, pending_word_len }
  if (typeof byteArray === "object" && "pending_word" in byteArray) {
    try {
      const hex = byteArray.pending_word;
      return Buffer.from(hex.replace(/^0x/, ""), "hex")
        .toString("utf8")
        .slice(0, Number(byteArray.pending_word_len));
    } catch {
      return "";
    }
  }

  // Handle raw array of felts
  if (Array.isArray(byteArray)) {
    try {
      return byteArray
        .map((felt) => {
          try {
            return String.fromCharCode(Number(felt));
          } catch {
            return "";
          }
        })
        .join("")
        .trim();
    } catch {
      return "";
    }
  }

  return "";
}

export type ByteArrayStruct = {
  data: string[]; // hex felts (each up to 31 bytes)
  pending_word: string; // hex felt
  pending_word_len: string; // decimal string
};

/**
 * Convert a JS string into a Cairo v2 ByteArray struct.
 * - Splits into 31-byte chunks for `data`.
 * - Remaining bytes go into `pending_word` + `pending_word_len`.
 */
export function stringToByteArrayStruct(str: string) {
  const bytes = Array.from(new TextEncoder().encode(str));
  const data: string[] = [];
  let pending_word = "0x0";
  let pending_word_len = 0;

  for (let i = 0; i < bytes.length; i += 31) {
    const chunk = bytes.slice(i, i + 31);
    let felt = 0n;
    for (const b of chunk) {
      felt = (felt << 8n) + BigInt(b);
    }
    const hex = "0x" + felt.toString(16);

    if (chunk.length === 31) {
      data.push(hex);
    } else {
      pending_word = hex;
      pending_word_len = chunk.length;
    }
  }

  return {
    data,
    pending_word,
    pending_word_len: pending_word_len.toString(),
  };
}

/**
 * Encode a UTF-8 string to Cairo's core::byte_array::ByteArray format.
 * Returns an array: [data_len, ...data_words, pending_word, pending_word_len]
 */
export function encodeByteArray(str: string): string[] {
  if (!str) return ["0", "0", "0"];

  const bytes = Array.from(new TextEncoder().encode(str));
  const words: string[] = [];
  let pendingWord = "0";
  let pendingWordLen = 0;

  // Pack bytes into 31-byte words (felts)
  for (let i = 0; i < bytes.length; i += 31) {
    const chunk = bytes.slice(i, i + 31);
    if (chunk.length === 31) {
      // Full 31-byte word - pack in big-endian order
      let felt = 0n;
      for (let j = 0; j < chunk.length; j++) {
        felt = (felt << 8n) + BigInt(chunk[j]);
      }
      words.push("0x" + felt.toString(16));
    } else {
      // Partial word (pending_word) - pack in big-endian order
      pendingWordLen = chunk.length;
      let felt = 0n;
      for (let j = 0; j < chunk.length; j++) {
        felt = (felt << 8n) + BigInt(chunk[j]);
      }
      pendingWord = "0x" + felt.toString(16);
    }
  }

  return [
    words.length.toString(),
    ...words,
    pendingWord,
    pendingWordLen.toString(),
  ];
}

/**
 * Convert IPFS hash (string) to felt252 for storage
 */
export function ipfsHashToFelt252(ipfsHash: string): string {
  // Remove 'Qm' prefix if present and convert to bytes
  const cleanHash = ipfsHash.startsWith("Qm") ? ipfsHash.slice(2) : ipfsHash;

  // Convert the hash to bytes and then to felt252
  const encoder = new TextEncoder();
  const bytes = encoder.encode(cleanHash);

  let felt = 0n;
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    felt = (felt << 8n) + BigInt(bytes[i]);
  }

  return "0x" + felt.toString(16);
}

/**
 * Convert felt252 back to IPFS hash string
 */
export function felt252ToIpfsHash(felt: string | bigint): string {
  const feltBig = typeof felt === "string" ? BigInt(felt) : felt;

  if (feltBig === 0n) return "";

  // Convert back to bytes
  const bytes: number[] = [];
  let temp = feltBig;

  while (temp > 0n) {
    bytes.unshift(Number(temp & 0xffn));
    temp = temp >> 8n;
  }

  // Convert bytes back to string and add 'Qm' prefix
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const hashString = decoder.decode(new Uint8Array(bytes));

  return "Qm" + hashString;
}

export function parseUint256FromIntegerString(amountStr: string) {
  const [intPart, fracPart = ""] = amountStr.split(".");
  const fracPadded = (fracPart + "0".repeat(18)).slice(0, 18);
  const weiStr = intPart + fracPadded;
  const wei = BigInt(weiStr.replace(/^0+/, "") || "0");
  const low = wei & ((1n << 128n) - 1n);
  const high = wei >> 128n;
  return { low: low.toString(), high: high.toString() };
}

export const toU256 = (n: number | bigint) => ({
  low: BigInt(n) & ((1n << 128n) - 1n),
  high: BigInt(n) >> 128n,
});
export const fromU256 = (u: any): bigint => {
  if (!u) return 0n;
  if (typeof u === "bigint") return u;
  if (typeof u === "string") return BigInt(u);
  if (Array.isArray(u) && u.length >= 2) {
    return (BigInt(u[1]) << 128n) + BigInt(u[0]);
  }
  if ("low" in u && "high" in u) {
    return (BigInt(u.high) << 128n) + BigInt(u.low);
  }
  return 0n;
};
