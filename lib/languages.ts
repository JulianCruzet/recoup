// Languages staff can explain results in. Toronto's most common home languages besides English.
export const EXPLAIN_LANGUAGES = ["English", "French", "Punjabi", "Tamil", "Arabic", "Simplified Chinese", "Tagalog", "Urdu", "Spanish"] as const;
export type ExplainLanguage = (typeof EXPLAIN_LANGUAGES)[number];
