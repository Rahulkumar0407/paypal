import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

/**
 * AG Grid Community, set up once, in our design: banknote-paper sheet, ink text, brand green for focus and sorting,
 * fine ruled rows like a ledger. Imported only by the dynamically loaded grids, so it never reaches a phone.
 */
ModuleRegistry.registerModules([AllCommunityModule]);

export const gridTheme = themeQuartz.withParams({
  browserColorScheme: "light",
  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
  fontSize: 14,
  headerFontSize: 13,
  headerFontWeight: 600,
  foregroundColor: "#14201b",
  textColor: "#14201b",
  backgroundColor: "#f8f9f5",
  chromeBackgroundColor: "#e6ebe3",
  headerBackgroundColor: "#e6ebe3",
  headerTextColor: "#14201b",
  accentColor: "#0e3b2c",
  borderColor: "rgb(20 32 27 / 0.12)",
  rowBorder: { color: "rgb(20 32 27 / 0.09)" },
  columnBorder: false,
  oddRowBackgroundColor: "#f1f4ee",
  rowHoverColor: "rgb(14 59 44 / 0.06)",
  selectedRowBackgroundColor: "rgb(14 59 44 / 0.1)",
  wrapperBorderRadius: 12,
  borderRadius: 8,
  rowHeight: 52,
  headerHeight: 44,
  spacing: 7,
  cellHorizontalPadding: 16,
  iconSize: 14,
});
