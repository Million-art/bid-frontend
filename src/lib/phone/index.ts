export { digitsOnly } from "./digits";
export {
  DEFAULT_PROFILE_COUNTRY,
  getCountryPhoneDefinition,
  isProfileCountryIso2,
  listRegisteredProfileCountries,
  findCountryByPhone,
} from "./registry";
export {
  hasContactPhone,
  MIN_CONTACT_PHONE_DIGITS,
  parseProfilePhoneFromLocal,
} from "./profile";
export type {
  ProfilePhoneParseFailure,
  ProfilePhoneParseResult,
  ProfilePhoneParseSuccess,
} from "./profile";
export type { CountryPhoneDefinition, ProfileCountryIso2 } from "./countries/types";

// Ethiopia concrete implementation  used by legacy `@/lib/ethiopiaPhone` re-exports
export {
  buildLoginIdentifier,
  ethiopiaPhoneDefinition,
  ETHIOPIA_ISO,
  isValidEthiopiaMobile,
  normalizeForChapa,
  toLocalPartForPhoneInput,
} from "./countries/ethiopia";
