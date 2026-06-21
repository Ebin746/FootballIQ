/**
 * Converts an ISO 3166-1 alpha-2 code to a flag emoji.
 * Uses Unicode Regional Indicator Symbols (U+1F1E6–U+1F1FF).
 */
function iso2ToFlag(iso2) {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  return [...iso2.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/**
 * Map of team name → ISO 3166-1 alpha-2 code.
 * Covers all 48 WC 2026 nations + extras from the model's team pool.
 */
const TEAM_ISO = {
  // ── South America ──────────────────────────────────────────────
  Argentina:                "AR",
  Brazil:                   "BR",
  Colombia:                 "CO",
  Uruguay:                  "UY",
  Ecuador:                  "EC",
  Chile:                    "CL",
  Peru:                     "PE",
  Venezuela:                "VE",
  Paraguay:                 "PY",
  Bolivia:                  "BO",

  // ── North & Central America / Caribbean ────────────────────────
  Mexico:                   "MX",
  "United States":          "US",
  USA:                      "US",
  Canada:                   "CA",
  "Costa Rica":             "CR",
  Honduras:                 "HN",
  Jamaica:                  "JM",
  Panama:                   "PA",
  "El Salvador":            "SV",
  Guatemala:                "GT",
  "Trinidad and Tobago":    "TT",
  "Trinidad & Tobago":      "TT",
  Haiti:                    "HT",
  Cuba:                     "CU",
  Curaçao:                  "CW",
  Curacao:                  "CW",
  "Antigua and Barbuda":    "AG",
  Barbados:                 "BB",
  Guyana:                   "GY",
  Suriname:                 "SR",
  Belize:                   "BZ",
  Nicaragua:                "NI",
  Grenada:                  "GD",

  // ── Europe ─────────────────────────────────────────────────────
  France:                   "FR",
  Germany:                  "DE",
  Spain:                    "ES",
  Italy:                    "IT",
  Portugal:                 "PT",
  Netherlands:              "NL",
  Belgium:                  "BE",
  Croatia:                  "HR",
  Denmark:                  "DK",
  Switzerland:              "CH",
  Austria:                  "AT",
  Poland:                   "PL",
  Sweden:                   "SE",
  Norway:                   "NO",
  Serbia:                   "RS",
  Slovakia:                 "SK",
  Hungary:                  "HU",
  "Czech Republic":         "CZ",
  Czechia:                  "CZ",
  Romania:                  "RO",
  Greece:                   "GR",
  Turkey:                   "TR",
  Ukraine:                  "UA",
  Ireland:                  "IE",
  Russia:                   "RU",
  Slovenia:                 "SI",
  Albania:                  "AL",
  "Bosnia and Herzegovina": "BA",
  Bosnia:                   "BA",
  Montenegro:               "ME",
  "North Macedonia":        "MK",
  Kosovo:                   "XK",
  Finland:                  "FI",
  Iceland:                  "IS",
  Bulgaria:                 "BG",
  Georgia:                  "GE",
  Luxembourg:               "LU",
  Wales:                    "GB",
  Scotland:                 "GB",
  England:                  "GB",
  "Northern Ireland":       "GB",

  // ── Africa ─────────────────────────────────────────────────────
  Morocco:                  "MA",
  Senegal:                  "SN",
  Tunisia:                  "TN",
  Egypt:                    "EG",
  Nigeria:                  "NG",
  Cameroon:                 "CM",
  Ghana:                    "GH",
  "Ivory Coast":            "CI",
  "Cote d'Ivoire":          "CI",
  "Côte d'Ivoire":          "CI",
  Mali:                     "ML",
  "South Africa":           "ZA",
  Algeria:                  "DZ",
  "Burkina Faso":           "BF",
  Guinea:                   "GN",
  "DR Congo":               "CD",
  Congo:                    "CG",
  Tanzania:                 "TZ",
  Zambia:                   "ZM",
  Ethiopia:                 "ET",
  Angola:                   "AO",
  "Cape Verde":             "CV",
  Uganda:                   "UG",
  Kenya:                    "KE",
  Mozambique:               "MZ",
  Rwanda:                   "RW",
  Benin:                    "BJ",
  Gabon:                    "GA",
  Zimbabwe:                 "ZW",
  Malawi:                   "MW",
  "Equatorial Guinea":      "GQ",
  Sudan:                    "SD",
  Madagascar:               "MG",
  Togo:                     "TG",
  Mauritania:               "MR",
  Libya:                    "LY",
  Namibia:                  "NA",
  Comoros:                  "KM",
  "Sierra Leone":           "SL",

  // ── Asia ───────────────────────────────────────────────────────
  Japan:                    "JP",
  "South Korea":            "KR",
  "Korea Republic":         "KR",
  Iran:                     "IR",
  "Saudi Arabia":           "SA",
  Australia:                "AU",
  Qatar:                    "QA",
  "United Arab Emirates":   "AE",
  UAE:                      "AE",
  Iraq:                     "IQ",
  Jordan:                   "JO",
  Uzbekistan:               "UZ",
  China:                    "CN",
  "China PR":               "CN",
  Syria:                    "SY",
  Bahrain:                  "BH",
  Oman:                     "OM",
  Vietnam:                  "VN",
  Thailand:                 "TH",
  India:                    "IN",
  Indonesia:                "ID",
  Philippines:              "PH",
  Myanmar:                  "MM",
  Malaysia:                 "MY",
  Kyrgyzstan:               "KG",
  Palestine:                "PS",
  Lebanon:                  "LB",
  Yemen:                    "YE",
  Kuwait:                   "KW",
  "North Korea":            "KP",
  "Korea DPR":              "KP",
  Tajikistan:               "TJ",
  Afghanistan:              "AF",
  "Hong Kong":              "HK",
  Taiwan:                   "TW",
  Singapore:                "SG",

  // ── Oceania ────────────────────────────────────────────────────
  "New Zealand":            "NZ",
  Fiji:                     "FJ",
  "Papua New Guinea":       "PG",
  "Solomon Islands":        "SB",
  Vanuatu:                  "VU",
  Tahiti:                   "PF",
};

/** Returns the flag emoji for a team name (falls back to 🏳️). */
export function flagEmoji(teamName) {
  const iso = TEAM_ISO[teamName];
  if (!iso) return "🏳️";
  return iso2ToFlag(iso);
}

/** Returns the ISO 3166-1 alpha-2 code for a team name. */
export function isoCode(teamName) {
  return TEAM_ISO[teamName] || null;
}
