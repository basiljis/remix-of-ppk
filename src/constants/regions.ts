export const REGIONS = [
  { value: "moscow", label: "Москва" },
  { value: "moscow_region", label: "Московская область" },
  { value: "other", label: "Другой регион" },
] as const;

export type RegionValue = typeof REGIONS[number]["value"];
