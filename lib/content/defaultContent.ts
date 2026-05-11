import { plainTextToTiptap, CURRENT_SCHEMA_VERSION } from "./tiptapJson";

type Seed = {
  page: string;
  slot: string;
  text: string;
};

export const HOME_DEFAULTS: Seed[] = [
  { page: "home", slot: "hero.eyebrow", text: "PRODUCT MANAGER · BUILDER · 2018 — NOW" },
  { page: "home", slot: "hero.headlineTop", text: "I build products" },
  { page: "home", slot: "hero.headlineBottom", text: "people actually use." },
  {
    page: "home",
    slot: "hero.subtext",
    text:
      "PM at the intersection of AI, health, and consumer. Twelve products shipped, three from zero. Currently building healthcoach-ai. This site is the working file.",
  },
  { page: "home", slot: "hero.ctaPrimary", text: "View AI projects →" },
  { page: "home", slot: "hero.ctaSecondary", text: "Book a call" },
  { page: "home", slot: "hero.statusPill", text: "Open to PM roles" },
];

export const DEFAULT_CONTENT_PAYLOAD = HOME_DEFAULTS.map((s) => ({
  page: s.page,
  slot: s.slot,
  valueJson: JSON.stringify(plainTextToTiptap(s.text)),
  schemaVersion: CURRENT_SCHEMA_VERSION,
}));
