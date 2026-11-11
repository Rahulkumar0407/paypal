import type { Cents } from "@/types";

/** Dunder Mifflin & Co.'s menu: what customers order through PayPal. Prices and costs in cents. SIMULATED. */
export interface CatalogItem {
  key: string;
  sku: string;
  name: string;
  description: string;
  priceCents: Cents;
  costCents: Cents;
  /** Relative chance the item appears in a simulated order. 0 = only ordered in the story. */
  weight: number;
}

export const DEMO_CATALOG: readonly CatalogItem[] = [
  { key: "sourdough", sku: "DM-SOUR", name: "Sourdough loaf", description: "Slow-proved overnight, baked at 6am.", priceCents: 900, costCents: 250, weight: 16 },
  { key: "croissants", sku: "DM-CROI", name: "Croissant box of 6", description: "Butter croissants, baked fresh each morning.", priceCents: 2400, costCents: 800, weight: 18 },
  { key: "buns", sku: "DM-BUNS", name: "Cinnamon buns, 4", description: "Cardamom and cinnamon, glazed.", priceCents: 1600, costCents: 450, weight: 14 },
  { key: "beans", sku: "DM-BEAN", name: "House coffee beans, 250 g", description: "Roasted by Bean There, ground to order.", priceCents: 1600, costCents: 700, weight: 12 },
  { key: "brownies", sku: "DM-BROW", name: "Brownie tray", description: "Twelve squares, for the office or a party.", priceCents: 3200, costCents: 1000, weight: 10 },
  { key: "bagels", sku: "DM-BAGL", name: "Bagel dozen", description: "Plain, sesame and everything.", priceCents: 2200, costCents: 600, weight: 10 },
  { key: "cake", sku: "DM-CAKE", name: "Celebration cake", description: "Serves 12. Order two days ahead.", priceCents: 5400, costCents: 1800, weight: 6 },
  { key: "tiered", sku: "DM-TIER", name: "Three-tier wedding cake", description: "Serves 80. Made to order.", priceCents: 24000, costCents: 9000, weight: 0 },
];

export const DEMO_CUSTOMER_NAMES: readonly string[] = [
  "Ivory & Vow", "Liam Chen", "Sofia Martins", "Noah Adeyemi", "Ava Lindqvist", "Ethan Brooks",
  "Isla Moreno", "Lucas Weber", "Mia Tanaka", "Oliver Grant", "Zara Haddad", "Mateo Rossi",
  "Chloe Dubois", "Arjun Mehta", "Grace Kim", "Henry Walsh", "Leila Farouk", "Jack Morrison",
  "Nora Petrov", "Samuel Osei", "Ruby Clarke", "Daniel Novak", "Hana Sato", "Felix Wagner",
  "Amara Nwosu", "Theo Laurent", "Priya Raman", "Caleb Ford", "Elena Ruiz", "Omar Siddiqui",
  "Ivy Thompson", "Ben Carter", "Lina Haas", "Marcus Bell", "Yuki Mori", "Fatima Zahra",
  "Leo Fischer", "Anna Kowalski", "David Mensah", "Rosa Jimenez",
];
