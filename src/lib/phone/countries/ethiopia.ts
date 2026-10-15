import { z } from "zod";
import { digitsOnly } from "@/lib/phone/digits";
import type { CountryPhoneDefinition, ProfileCountryIso2 } from "./types";

/**
 * Ethiopian mobile format for SMS / winner contact (mirrors client-backend phoneutil.NormalizeForChapa).
 * Returns ten-digit domestic form (0 followed by nine digits starting with 7 or 9), or null.
 */
export function normalizeForChapa(s: string): string | null {
  let d = digitsOnly(s);
  if (d.length === 0) return null;
  if (d.startsWith("0251")) d = d.slice(1);
  if (d.startsWith("251")) {
    let rest = d.slice(3);
    if (rest.length > 9) rest = rest.slice(0, 9);
    if (rest.length === 9 && (rest[0] === "9" || rest[0] === "7")) return "0" + rest;
    return null;
  }
  if (d.length === 10 && d[0] === "0" && (d[1] === "9" || d[1] === "7")) return d;
  if (d.length === 9 && (d[0] === "9" || d[0] === "7")) return "0" + d;
  if (d.length > 10) {
    for (let i = 0; i <= d.length - 10; i++) {
      const seg = d.slice(i, i + 10);
      if (seg[0] === "0" && (seg[1] === "9" || seg[1] === "7")) return seg;
    }
  }
  return null;
}

/** @deprecated Prefer `profilePhoneDefinition.safeParseStoredContact(...)` via registry. */
export function isValidEthiopiaMobile(s: string): boolean {
  return normalizeForChapa(s) !== null;
}

function e164FromLocal10(localStartingWithZero: string): string {
  return "+251" + localStartingWithZero.slice(1);
}

export const ETHIOPIA_LOCAL_MOBILE_LENGTH = 9;

const ethiopiaLocalPartSchema = z
  .string()
  .transform((raw) => digitsOnly(raw.trim()))
  .pipe(
    z
      .string()
      .length(ETHIOPIA_LOCAL_MOBILE_LENGTH, `Enter ${ETHIOPIA_LOCAL_MOBILE_LENGTH} digits`)
      .regex(/^[79]\d{8}$/, "Mobile number must start with 9 or 7"),
  );

const ethiopiaStoredContactSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    if (normalizeForChapa(val) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid Ethiopian mobile number.",
      });
    }
  })
  .transform((val) => {
    const local10 = normalizeForChapa(val)!;
    return e164FromLocal10(local10);
  });

/** Local nine digits after +251 for PhonePrefixInput, from stored profile or pasted value. */
export function toLocalPartForPhoneInput(stored: string): string {
  const d = digitsOnly(stored.trim());
  if (d.startsWith("251") && d.length >= 12) return d.slice(3, 12);
  if (d.length === 10 && d[0] === "0" && (d[1] === "9" || d[1] === "7")) return d.slice(1);
  if (d.length === 9 && (d[0] === "9" || d[0] === "7")) return d;
  return "";
}

/**
 * Normalize phone for login / OTP (local field defaults to Ethiopia +251).
 * Emails pass through unchanged.
 */
export function buildLoginIdentifier(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (s.includes("@")) return s;
  if (s.startsWith("+")) return s;
  const d = digitsOnly(s);
  if (d.length === 0) return "";
  if (d.startsWith("251")) return `+${d}`;
  if (d.startsWith("0")) return `+251${d.slice(1)}`;
  return `+251${d}`;
}

function e164FromLocalDigits(localNine: string): string {
  return `+251${localNine}`;
}

export const ETHIOPIA_ISO: ProfileCountryIso2 = "ET";

export const ethiopiaPhoneDefinition: CountryPhoneDefinition = {
  iso2: ETHIOPIA_ISO,
  e164CallingCode: "251",
  localMobileDigitLength: ETHIOPIA_LOCAL_MOBILE_LENGTH,
  profileHelpText:
    "Ethiopian mobile: nine digits after +251, starting with 9 or 7 (SMS and winner contact).",
  zodLocalPart: ethiopiaLocalPartSchema,
  zodStoredContact: ethiopiaStoredContactSchema,
  toLocalDigitsForPrefixInput: toLocalPartForPhoneInput,
  e164FromLocalDigits,
  loginIdentifierFromLocalInput: buildLoginIdentifier,
};
