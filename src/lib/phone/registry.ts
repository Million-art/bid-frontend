import type { CountryPhoneDefinition, ProfileCountryIso2 } from "@/lib/phone/countries/types";
import { ethiopiaPhoneDefinition } from "@/lib/phone/countries/ethiopia";
import { otherPhoneDefinition } from "@/lib/phone/countries/other";

/** Default profile / checkout contact country until per-user preference exists. */
export const DEFAULT_PROFILE_COUNTRY: ProfileCountryIso2 = "ET";

const phoneCountryRegistry = {
  ET: ethiopiaPhoneDefinition,
  OTHER: otherPhoneDefinition,
  KE: { ...otherPhoneDefinition, iso2: "KE", e164CallingCode: "254", profileHelpText: "Kenya mobile: digits after +254." },
  UG: { ...otherPhoneDefinition, iso2: "UG", e164CallingCode: "256", profileHelpText: "Uganda mobile: digits after +256." },
  US: { ...otherPhoneDefinition, iso2: "US", e164CallingCode: "1", profileHelpText: "USA mobile: digits after +1." },
  GB: { ...otherPhoneDefinition, iso2: "GB", e164CallingCode: "44", profileHelpText: "UK mobile: digits after +44." },
} as const satisfies Record<ProfileCountryIso2, CountryPhoneDefinition>;

export function getCountryPhoneDefinition(iso: ProfileCountryIso2): CountryPhoneDefinition {
  return phoneCountryRegistry[iso];
}

export function isProfileCountryIso2(value: string): value is ProfileCountryIso2 {
  return value in phoneCountryRegistry;
}

/** ISO codes that appear in {@link phoneCountryRegistry} (expand when adding regions). */
export function listRegisteredProfileCountries(): ProfileCountryIso2[] {
  return Object.keys(phoneCountryRegistry) as ProfileCountryIso2[];
}

export function findCountryByPhone(phone: string | undefined | null): ProfileCountryIso2 {
  if (!phone || !phone.startsWith("+")) return DEFAULT_PROFILE_COUNTRY;
  const countries = listRegisteredProfileCountries();
  // Sort by calling code length descending to match longest prefix first (+1 vs +123)
  const sorted = [...countries]
    .filter(c => c !== "OTHER")
    .map(iso => phoneCountryRegistry[iso])
    .sort((a, b) => b.e164CallingCode.length - a.e164CallingCode.length);

  for (const def of sorted) {
    if (phone.startsWith(`+${def.e164CallingCode}`)) {
      return def.iso2;
    }
  }
  return "OTHER";
}
