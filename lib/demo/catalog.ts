import type { Cents } from "@/types";

/** Loop Audio's eight products. Prices and costs in cents. Person 3 may tune these. */
export interface CatalogItem {
  key: string;
  sku: string;
  name: string;
  description: string;
  priceCents: Cents;
  costCents: Cents;
  /** Relative chance the item appears in a simulated order. */
  weight: number;
}

export const DEMO_CATALOG: readonly CatalogItem[] = [
  { key: "one", sku: "LA-ONE", name: "Loop One wireless headphones", description: "Over-ear, 40-hour battery, folds flat.", priceCents: 14900, costCents: 6400, weight: 12 },
  { key: "studio", sku: "LA-STUDIO", name: "Loop Studio monitor headphones", description: "Closed-back, flat response, detachable cable.", priceCents: 18900, costCents: 8300, weight: 6 },
  { key: "buds-pro", sku: "LA-BUDS-PRO", name: "Loop Buds Pro", description: "Noise-cancelling earbuds with a pocket case.", priceCents: 11900, costCents: 4900, weight: 12 },
  { key: "buds", sku: "LA-BUDS", name: "Loop Buds", description: "Everyday earbuds, 8 hours per charge.", priceCents: 5900, costCents: 2300, weight: 20 },
  { key: "kids", sku: "LA-KIDS", name: "Loop Kids volume-safe headphones", description: "Capped at 85 dB, with a bendable headband.", priceCents: 4500, costCents: 1700, weight: 12 },
  { key: "cushions", sku: "LA-CUSH", name: "Replacement ear cushions", description: "Memory foam. Fits Loop One and Loop Studio.", priceCents: 2700, costCents: 800, weight: 14 },
  { key: "cable", sku: "LA-CABLE", name: "Braided audio cable, 1.5 m", description: "3.5 mm both ends, with a 6.35 mm adapter.", priceCents: 1800, costCents: 500, weight: 14 },
  { key: "case", sku: "LA-CASE", name: "Hard travel case", description: "Fits every Loop over-ear model.", priceCents: 2900, costCents: 900, weight: 10 },
];

export const DEMO_CUSTOMER_NAMES: readonly string[] = [
  "Maya Okafor", "Liam Chen", "Sofia Martins", "Noah Adeyemi", "Ava Lindqvist", "Ethan Brooks",
  "Isla Moreno", "Lucas Weber", "Mia Tanaka", "Oliver Grant", "Zara Haddad", "Mateo Rossi",
  "Chloe Dubois", "Arjun Mehta", "Grace Kim", "Henry Walsh", "Leila Farouk", "Jack Morrison",
  "Nora Petrov", "Samuel Osei", "Ruby Clarke", "Daniel Novak", "Hana Sato", "Felix Wagner",
  "Amara Nwosu", "Theo Laurent", "Priya Raman", "Caleb Ford", "Elena Ruiz", "Omar Siddiqui",
  "Ivy Thompson", "Ben Carter", "Lina Haas", "Marcus Bell", "Yuki Mori", "Fatima Zahra",
  "Leo Fischer", "Anna Kowalski", "David Mensah", "Rosa Jimenez",
];
