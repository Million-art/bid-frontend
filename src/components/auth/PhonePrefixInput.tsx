"use client";

import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
// We add some custom CSS overrides for PhoneInput via global styles or inline style classes below

type PhonePrefixInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  "aria-invalid"?: boolean;
  // Deprecated props, keeping them optional so it doesn't break before we refactor consumers
  country?: string;
  onCountryChange?: (country: string) => void;
  callingCodeDigits?: string;
};


/**
 * International phone number input using react-phone-number-input.
 * Provides a country flag dropdown and returns a strict E.164 formatted string.
 */
export function PhonePrefixInput({
  id,
  name = "phone",
  value,
  onChange,
  placeholder = "Enter phone number",
  required,
  disabled,
  autoComplete = "tel",
  "aria-invalid": ariaInvalid,
}: PhonePrefixInputProps) {
  return (
    <div
      className={`flex rounded-lg border bg-white transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-blue/25 ${ariaInvalid ? "border-red-400 ring-red-500/20" : "border-slate-300 focus-within:border-brand-blue"
        }`}
    >
      <PhoneInput
        id={id}
        name={name}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        value={value}
        onChange={(val) => onChange(val || "")}
        defaultCountry="ET"
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm text-slate-900 focus:outline-none"
        style={{
          '--PhoneInput-color--focus': 'var(--brand-blue)',
          '--PhoneInputCountryFlag-height': '1.2em',
          '--PhoneInputCountryFlag-borderColor': 'transparent',
          '--PhoneInputCountrySelectArrow-color': '#94a3b8',
        } as React.CSSProperties}
      />
    </div>
  );
}

