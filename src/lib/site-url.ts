/** Public participant site origin (no trailing slash). */
export function getParticipantSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PARTICIPANT_APP_URL?.trim().replace(
    /\/$/,
    ""
  );
  if (fromEnv) return fromEnv;
  return "https://carramarket.com";
}
