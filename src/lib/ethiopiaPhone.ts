/**
 * Ethiopia-specific auth helpers. For profile / shared contact rules use `@/lib/phone`.
 */
export {
  buildLoginIdentifier,
  isValidEthiopiaMobile,
  normalizeForChapa,
  toLocalPartForPhoneInput,
} from "@/lib/phone/countries/ethiopia";
