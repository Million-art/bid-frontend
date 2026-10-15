import type { ZodTypeAny } from "zod";

/** Extend this union when adding a country module + registry entry. */
export type ProfileCountryIso2 = "ET" | "KE" | "UG" | "US" | "GB" | "OTHER";

/**
 * Everything the UI / forms need for one country’s mobile contact rules.
 * Add a module implementing this, register it in `registry.ts`.
 */
export type CountryPhoneDefinition = {
  iso2: ProfileCountryIso2;
  /** E.164 country calling code digits without "+" (Ethiopia: "251"). */
  e164CallingCode: string;
  /** National mobile number length (excluding +CC), e.g. Ethiopian 9 digits after +251. */
  localMobileDigitLength: number;
  /** Short copy for account / forms. */
  profileHelpText: string;
  /** Zod: local input (prefix field only) → validated national digit string (no +). */
  zodLocalPart: ZodTypeAny;
  /** Zod: any reasonable stored / pasted value → canonical E.164 (`+…`). */
  zodStoredContact: ZodTypeAny;
  toLocalDigitsForPrefixInput: (storedOrRaw: string) => string;
  e164FromLocalDigits: (localDigits: string) => string;
  /** Auth flows: local field only → `+…` (email identifiers stay in caller). */
  loginIdentifierFromLocalInput: (localInput: string) => string;
};
