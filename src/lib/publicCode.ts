import { randomInt } from "crypto";

// No 0/O/1/I — avoids ambiguity when read aloud or typed from a WA link.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generatePublicCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
