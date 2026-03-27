import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Desk } from "../types/desk";

// Default desk layout (el que estaba hardcodeado)
const DEFAULT_DESKS: Desk[] = [
  // LEFT SIDE - Column 1 (leftmost)
  { id: "D-073", x: 35, y: 120, width: 28, height: 18 },
  { id: "D-072", x: 35, y: 140, width: 28, height: 18 },
  { id: "D-071", x: 35, y: 160, width: 28, height: 18 },
  { id: "D-070", x: 35, y: 180, width: 28, height: 18 },
  { id: "D-069", x: 35, y: 200, width: 28, height: 18 },
  { id: "D-068", x: 35, y: 220, width: 28, height: 18 },
  { id: "D-067", x: 35, y: 240, width: 28, height: 18 },

  // LEFT SIDE - Column 2
  { id: "D-066", x: 66, y: 120, width: 28, height: 18 },
  { id: "D-065", x: 66, y: 140, width: 28, height: 18 },
  { id: "D-064", x: 66, y: 160, width: 28, height: 18 },
  { id: "D-063", x: 66, y: 180, width: 28, height: 18 },
  { id: "D-062", x: 66, y: 200, width: 28, height: 18 },
  { id: "D-061", x: 66, y: 220, width: 28, height: 18 },
  { id: "D-060", x: 66, y: 240, width: 28, height: 18 },

  // LEFT SIDE - Column 3
  { id: "D-059", x: 122, y: 120, width: 28, height: 18 },
  { id: "D-058", x: 122, y: 140, width: 28, height: 18 },
  { id: "D-057", x: 122, y: 160, width: 28, height: 18 },
  { id: "D-056", x: 122, y: 180, width: 28, height: 18 },
  { id: "D-055", x: 122, y: 200, width: 28, height: 18 },
  { id: "D-054", x: 122, y: 220, width: 28, height: 18 },

  // LEFT SIDE - Column 4
  { id: "D-053", x: 153, y: 120, width: 28, height: 18 },
  { id: "D-052", x: 153, y: 140, width: 28, height: 18 },
  { id: "D-051", x: 153, y: 160, width: 28, height: 18 },
  { id: "D-050", x: 153, y: 180, width: 28, height: 18 },
  { id: "D-049", x: 153, y: 200, width: 28, height: 18 },
  { id: "D-048", x: 153, y: 220, width: 28, height: 18 },
  { id: "D-047", x: 153, y: 240, width: 28, height: 18 },
  { id: "D-046", x: 153, y: 260, width: 28, height: 18 },

  // LEFT SIDE - Column 5
  { id: "D-045", x: 209, y: 120, width: 28, height: 18 },
  { id: "D-044", x: 209, y: 140, width: 28, height: 18 },
  { id: "D-043", x: 209, y: 160, width: 28, height: 18 },
  { id: "D-042", x: 209, y: 180, width: 28, height: 18 },
  { id: "D-041", x: 209, y: 200, width: 28, height: 18 },
  { id: "D-040", x: 209, y: 220, width: 28, height: 18 },
  { id: "D-039", x: 209, y: 240, width: 28, height: 18 },
  { id: "D-038", x: 209, y: 260, width: 28, height: 18 },

  // LEFT SIDE - Column 6
  { id: "D-037", x: 240, y: 120, width: 28, height: 18 },
  { id: "D-036", x: 240, y: 140, width: 28, height: 18 },
  { id: "D-035", x: 240, y: 160, width: 28, height: 18 },
  { id: "D-034", x: 240, y: 180, width: 28, height: 18 },
  { id: "D-033", x: 240, y: 200, width: 28, height: 18 },
  { id: "D-032", x: 240, y: 220, width: 28, height: 18 },
  { id: "D-031", x: 240, y: 240, width: 28, height: 18 },
  { id: "D-030", x: 240, y: 260, width: 28, height: 18 },

  // LEFT SIDE - Column 7
  { id: "D-029", x: 296, y: 120, width: 28, height: 18 },
  { id: "D-028", x: 296, y: 140, width: 28, height: 18 },
  { id: "D-027", x: 296, y: 160, width: 28, height: 18 },
  { id: "D-026", x: 296, y: 180, width: 28, height: 18 },
  { id: "D-025", x: 296, y: 200, width: 28, height: 18 },
  { id: "D-024", x: 296, y: 220, width: 28, height: 18 },
  { id: "D-023", x: 296, y: 240, width: 28, height: 18 },
  { id: "D-022", x: 296, y: 260, width: 28, height: 18 },

  // LEFT SIDE - Column 8
  { id: "D-021", x: 327, y: 120, width: 28, height: 18 },
  { id: "D-020", x: 327, y: 140, width: 28, height: 18 },
  { id: "D-019", x: 327, y: 160, width: 28, height: 18 },
  { id: "D-018", x: 327, y: 180, width: 28, height: 18 },
  { id: "D-017", x: 327, y: 200, width: 28, height: 18 },
  { id: "D-016", x: 327, y: 220, width: 28, height: 18 },

  // LEFT SIDE - Column 9
  { id: "D-015", x: 383, y: 120, width: 28, height: 18 },
  { id: "D-014", x: 383, y: 140, width: 28, height: 18 },
  { id: "D-013", x: 383, y: 160, width: 28, height: 18 },
  { id: "D-012", x: 383, y: 180, width: 28, height: 18 },
  { id: "D-011", x: 383, y: 200, width: 28, height: 18 },
  { id: "D-010", x: 383, y: 220, width: 28, height: 18 },

  // LEFT SIDE - Column 10
  { id: "D-009", x: 414, y: 120, width: 28, height: 18 },
  { id: "D-008", x: 414, y: 140, width: 28, height: 18 },
  { id: "D-007", x: 414, y: 160, width: 28, height: 18 },
  { id: "D-006", x: 414, y: 180, width: 28, height: 18 },
  { id: "D-005", x: 414, y: 200, width: 28, height: 18 },
  { id: "D-004", x: 414, y: 220, width: 28, height: 18 },
  { id: "D-003", x: 414, y: 240, width: 28, height: 18 },
  { id: "D-002", x: 414, y: 260, width: 28, height: 18 },
  { id: "D-001", x: 414, y: 280, width: 28, height: 18 },

  // RIGHT SIDE - Top section (near STORE)
  // Row 1
  { id: "R-001", x: 730, y: 120, width: 28, height: 18 },
  { id: "R-002", x: 761, y: 120, width: 28, height: 18 },
  { id: "R-003", x: 792, y: 120, width: 28, height: 18 },
  { id: "R-004", x: 823, y: 120, width: 28, height: 18 },
  { id: "R-005", x: 854, y: 120, width: 28, height: 18 },
  { id: "R-006", x: 885, y: 120, width: 28, height: 18 },
  { id: "R-007", x: 916, y: 120, width: 28, height: 18 },

  // Row 2
  { id: "R-008", x: 730, y: 141, width: 28, height: 18 },
  { id: "R-009", x: 761, y: 141, width: 28, height: 18 },
  { id: "R-010", x: 792, y: 141, width: 28, height: 18 },
  { id: "R-011", x: 823, y: 141, width: 28, height: 18 },
  { id: "R-012", x: 854, y: 141, width: 28, height: 18 },
  { id: "R-013", x: 885, y: 141, width: 28, height: 18 },
  { id: "R-014", x: 916, y: 141, width: 28, height: 18 },

  // Row 3
  { id: "R-015", x: 730, y: 162, width: 28, height: 18 },
  { id: "R-016", x: 761, y: 162, width: 28, height: 18 },
  { id: "R-017", x: 792, y: 162, width: 28, height: 18 },
  { id: "R-018", x: 823, y: 162, width: 28, height: 18 },
  { id: "R-019", x: 854, y: 162, width: 28, height: 18 },
  { id: "R-020", x: 885, y: 162, width: 28, height: 18 },

  // RIGHT SIDE - Section 2
  // Row 4
  { id: "R-021", x: 730, y: 238, width: 28, height: 18 },
  { id: "R-022", x: 761, y: 238, width: 28, height: 18 },
  { id: "R-023", x: 792, y: 238, width: 28, height: 18 },
  { id: "R-024", x: 823, y: 238, width: 28, height: 18 },
  { id: "R-025", x: 854, y: 238, width: 28, height: 18 },
  { id: "R-026", x: 885, y: 238, width: 28, height: 18 },
  { id: "R-027", x: 916, y: 238, width: 28, height: 18 },

  // Row 5
  { id: "R-028", x: 730, y: 259, width: 28, height: 18 },
  { id: "R-029", x: 761, y: 259, width: 28, height: 18 },
  { id: "R-030", x: 792, y: 259, width: 28, height: 18 },
  { id: "R-031", x: 823, y: 259, width: 28, height: 18 },
  { id: "R-032", x: 854, y: 259, width: 28, height: 18 },
  { id: "R-033", x: 885, y: 259, width: 28, height: 18 },
  { id: "R-034", x: 916, y: 259, width: 28, height: 18 },

  // RIGHT SIDE - Section 3
  // Row 6
  { id: "R-035", x: 730, y: 310, width: 28, height: 18 },
  { id: "R-036", x: 761, y: 310, width: 28, height: 18 },
  { id: "R-037", x: 792, y: 310, width: 28, height: 18 },
  { id: "R-038", x: 823, y: 310, width: 28, height: 18 },
  { id: "R-039", x: 854, y: 310, width: 28, height: 18 },
  { id: "R-040", x: 885, y: 310, width: 28, height: 18 },

  // RIGHT SIDE - Section 4
  // Row 7
  { id: "R-041", x: 730, y: 380, width: 28, height: 18 },
  { id: "R-042", x: 761, y: 380, width: 28, height: 18 },
  { id: "R-043", x: 792, y: 380, width: 28, height: 18 },
  { id: "R-044", x: 823, y: 380, width: 28, height: 18 },
  { id: "R-045", x: 854, y: 380, width: 28, height: 18 },
  { id: "R-046", x: 885, y: 380, width: 28, height: 18 },
  { id: "R-047", x: 916, y: 380, width: 28, height: 18 },

  // RIGHT SIDE - Section 5
  // Row 8
  { id: "R-048", x: 730, y: 430, width: 28, height: 18 },
  { id: "R-049", x: 761, y: 430, width: 28, height: 18 },
  { id: "R-050", x: 792, y: 430, width: 28, height: 18 },
  { id: "R-051", x: 823, y: 430, width: 28, height: 18 },
  { id: "R-052", x: 854, y: 430, width: 28, height: 18 },
  { id: "R-053", x: 885, y: 430, width: 28, height: 18 },
  { id: "R-054", x: 916, y: 430, width: 28, height: 18 },

  // RIGHT SIDE - Section 6
  // Row 9
  { id: "R-055", x: 730, y: 480, width: 28, height: 18 },
  { id: "R-056", x: 761, y: 480, width: 28, height: 18 },
  { id: "R-057", x: 792, y: 480, width: 28, height: 18 },
  { id: "R-058", x: 823, y: 480, width: 28, height: 18 },
  { id: "R-059", x: 854, y: 480, width: 28, height: 18 },
  { id: "R-060", x: 885, y: 480, width: 28, height: 18 },
  { id: "R-061", x: 916, y: 480, width: 28, height: 18 },

  // RIGHT SIDE - Section 7
  // Row 10
  { id: "R-062", x: 730, y: 540, width: 28, height: 18 },
  { id: "R-063", x: 761, y: 540, width: 28, height: 18 },
  { id: "R-064", x: 792, y: 540, width: 28, height: 18 },
  { id: "R-065", x: 823, y: 540, width: 28, height: 18 },
  { id: "R-066", x: 854, y: 540, width: 28, height: 18 },
  { id: "R-067", x: 885, y: 540, width: 28, height: 18 },
  { id: "R-068", x: 916, y: 540, width: 28, height: 18 },

  // RIGHT SIDE - Section 8
  // Row 11
  { id: "R-069", x: 730, y: 590, width: 28, height: 18 },
  { id: "R-070", x: 761, y: 590, width: 28, height: 18 },
  { id: "R-071", x: 792, y: 590, width: 28, height: 18 },
  { id: "R-072", x: 823, y: 590, width: 28, height: 18 },
  { id: "R-073", x: 854, y: 590, width: 28, height: 18 },
  { id: "R-074", x: 885, y: 590, width: 28, height: 18 },
  { id: "R-075", x: 916, y: 590, width: 28, height: 18 },

  // BOTTOM SECTION (near entrance - blue area)
  // Row 12
  { id: "E-001", x: 730, y: 690, width: 28, height: 18 },
  { id: "E-002", x: 761, y: 690, width: 28, height: 18 },
  { id: "E-003", x: 792, y: 690, width: 28, height: 18 },
  { id: "E-004", x: 823, y: 690, width: 28, height: 18 },
  { id: "E-005", x: 854, y: 690, width: 28, height: 18 },
  { id: "E-006", x: 885, y: 690, width: 28, height: 18 },
  { id: "E-007", x: 916, y: 690, width: 28, height: 18 },
];

interface DeskLayoutContextType {
  desks: Desk[];
  setDesks: (desks: Desk[]) => void;
  resetToDefault: () => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
}

const DeskLayoutContext = createContext<
  DeskLayoutContextType | undefined
>(undefined);

const STORAGE_KEY = "office_desk_layout";

export function DeskLayoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [desks, setDesksState] =
    useState<Desk[]>(DEFAULT_DESKS);

  // Cargar desde localStorage al montar
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDesksState(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Error loading desk layout from localStorage:",
        error,
      );
    }
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(desks));
    } catch (error) {
      console.error(
        "Error saving desk layout to localStorage:",
        error,
      );
    }
  };

  const setDesks = (newDesks: Desk[]) => {
    setDesksState(newDesks);
    // Guardar automáticamente en localStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newDesks),
      );
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const resetToDefault = () => {
    setDesksState(DEFAULT_DESKS);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_DESKS),
      );
    } catch (error) {
      console.error("Error resetting to default:", error);
    }
  };

  return (
    <DeskLayoutContext.Provider
      value={{
        desks,
        setDesks,
        resetToDefault,
        loadFromLocalStorage,
        saveToLocalStorage,
      }}
    >
      {children}
    </DeskLayoutContext.Provider>
  );
}

export function useDeskLayout() {
  const context = useContext(DeskLayoutContext);
  if (!context) {
    throw new Error(
      "useDeskLayout must be used within a DeskLayoutProvider",
    );
  }
  return context;
}