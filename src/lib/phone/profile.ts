import type { ZodIssue } from "zod";

import type { ProfileCountryIso2 } from "@/lib/phone/countries/types";
import {
  DEFAULT_PROFILE_COUNTRY,
  getCountryPhoneDefinition,
} from "@/lib/phone/registry";

export type ProfilePhoneParseSuccess = { ok: true; e164: string };
export type ProfilePhoneParseFailure = {
  ok: false;
  issues: ZodIssue[];
  /** First English message suited for toast / inline error. */
  firstMessage: string;
};

export type ProfilePhoneParseResult = ProfilePhoneParseSuccess | ProfilePhoneParseFailure;

export const MIN_CONTACT_PHONE_DIGITS = getCountryPhoneDefinition(
  DEFAULT_PROFILE_COUNTRY,
).localMobileDigitLength;

/** True when stored profile / participant phone validates for the default contact country. */
export function hasContactPhone(phone: string | undefined | null): boolean {
  if (phone == null || phone === "") return false;
  const def = getCountryPhoneDefinition(DEFAULT_PROFILE_COUNTRY);
  return def.zodStoredContact.safeParse(phone).success;
}

/** Validate prefix-field input and return canonical E.164 (`+251…`). */
export function parseProfilePhoneFromLocal(
  localInput: string,
  country: ProfileCountryIso2 = DEFAULT_PROFILE_COUNTRY,
): ProfilePhoneParseResult {
  const def = getCountryPhoneDefinition(country);
  const parsed = def.zodLocalPart.safeParse(localInput);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const firstMessage = first?.message ?? "Enter a valid mobile number.";
    return {
      ok: false,
      issues: parsed.error.issues,
      firstMessage,
    };
  }
  return { ok: true, e164: def.e164FromLocalDigits(parsed.data) };
}
