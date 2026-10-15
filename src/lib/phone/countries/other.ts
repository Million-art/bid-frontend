import { z } from "zod";
import { digitsOnly } from "@/lib/phone/digits";
import type { CountryPhoneDefinition } from "./types";

const otherLocalPartSchema = z
  .string()
  .transform((raw) => digitsOnly(raw.trim()))
  .pipe(
    z
      .string()
      .min(7, "Enter at least 7 digits")
      .max(15, "Enter at most 15 digits"),
  );

const otherStoredContactSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    const d = digitsOnly(val);
    if (d.length < 7 || d.length > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number (7-15 digits).",
      });
    }
  })
  .transform((val) => {
    const d = digitsOnly(val);
    return val.startsWith("+") ? val : `+${d}`;
  });

export function toLocalPartGeneric(stored: string): string {
  const d = digitsOnly(stored.trim());
  return d;
}

export const otherPhoneDefinition: CountryPhoneDefinition = {
  iso2: "OTHER",
  e164CallingCode: "",
  localMobileDigitLength: 10,
  profileHelpText: "Enter your full phone number including country code if not +251.",
  zodLocalPart: otherLocalPartSchema,
  zodStoredContact: otherStoredContactSchema,
  toLocalDigitsForPrefixInput: (s) => digitsOnly(s),
  e164FromLocalDigits: (d) => (d.startsWith("+") ? d : `+${d}`),
  loginIdentifierFromLocalInput: (s) => (s.startsWith("+") ? s : `+${digitsOnly(s)}`),
};
