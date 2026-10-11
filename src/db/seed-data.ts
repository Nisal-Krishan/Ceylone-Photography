import type { Category } from "@/lib/billing";

export type SeedItem = {
  name: string;
  category: Category;
  /** Default rental rate per day (LKR). */
  rate: number;
  description?: string;
};

/**
 * Initial rental catalogue for CEYLON CAMERA CENTER.
 * Rates are per day. Edit, add or remove items any time from the Items page.
 */
export const SEED_ITEMS: SeedItem[] = [
  // ---- Cameras ----
  { name: "SONY A7 II + BATTERY", category: "Cameras", rate: 3500, description: "Camera body with battery" },
  { name: "SONY A7 III + BATTERY", category: "Cameras", rate: 4500, description: "Camera body with battery" },
  { name: "NIKON D850 + BATTERY", category: "Cameras", rate: 4000, description: "Camera body with battery" },
  { name: "NIKON D750 + BATTERY", category: "Cameras", rate: 3500, description: "Camera body with battery" },
  { name: "CANON 6D MARK II + BATTERY", category: "Cameras", rate: 3500, description: "Camera body with battery" },
  { name: "CANON 5D MARK IV + BATTERY", category: "Cameras", rate: 4000, description: "Camera body with battery" },

  // ---- Lenses ----
  { name: "CANON EF 16-35MM F/4L IS USM LENS", category: "Lenses", rate: 3500 },
  { name: "CANON EF 70-200MM LENS", category: "Lenses", rate: 4500 },
  { name: "SIGMA 35MM F/1.4 ART LENS FOR NIKON F", category: "Lenses", rate: 4000 },
  { name: "SIGMA 85MM F/1.4 ART FOR NIKON F", category: "Lenses", rate: 3500 },
  { name: "SIGMA 50MM F/1.4 ART LENS FOR NIKON F", category: "Lenses", rate: 4000 },
  { name: "SIGMA 50MM F1.4 DG DN ART FOR SONY", category: "Lenses", rate: 3500 },
  { name: "SIGMA 35MM F1.4 DG DN ART FOR SONY", category: "Lenses", rate: 4000 },
  { name: "SIGMA 85MM F1.4 DG DN ART FOR SONY", category: "Lenses", rate: 4000 },
  { name: "SIGMA 85MM F/1.4 ART FOR CANON EF", category: "Lenses", rate: 3500 },
  { name: "SIGMA 50MM F/1.4 ART FOR CANON EF", category: "Lenses", rate: 3500 },
  { name: "SIGMA 35MM F1.4 ART FOR CANON EF", category: "Lenses", rate: 4000 },

  // ---- Batteries & Chargers ----
  { name: "CANON LP-E6NH LITHIUM-ION BATTERY", category: "Batteries & Chargers", rate: 500 },
  { name: "CANON LC-E6 CHARGER FOR LP-E6", category: "Batteries & Chargers", rate: 500 },
  { name: "SONY NP-FZ100 LITHIUM ION BATTERY", category: "Batteries & Chargers", rate: 500 },
  { name: "AXG NP-FZ100 DUAL BATTERY CHARGER", category: "Batteries & Chargers", rate: 500 },
  { name: "SONY NP-FW50 BATTERY", category: "Batteries & Chargers", rate: 500 },
  { name: "NIKON MH-25A BATTERY CHARGER FOR NIKON", category: "Batteries & Chargers", rate: 500 },
  { name: "NIKON EN-EL15c LITHIUM ION BATTERY", category: "Batteries & Chargers", rate: 500 },
  { name: "PANASONIC ENELOOP BQ-CC55 FAST SMART CHARGER", category: "Batteries & Chargers", rate: 500 },
  { name: "PANASONIC ENELOOP PRO AA BATTERY 4 PCS", category: "Batteries & Chargers", rate: 1000 },

  // ---- Accessories (adapters, filters, storage, tripods, flashes, triggers) ----
  { name: "SIGMA MC-11 LENS ADAPTER EF-SONY E", category: "Accessories", rate: 2500 },
  { name: "K&F CONCEPT 67MM VARIABLE ND FILTER ND2-400", category: "Accessories", rate: 2500 },
  { name: "TRANSCEND USB 3.1 CARD READER", category: "Accessories", rate: 500 },
  { name: "YUNTENG VCT-680RM ALUMINUM TRIPOD", category: "Accessories", rate: 1500 },
  { name: "K&F CONCEPT CAMERA MONOPOD", category: "Accessories", rate: 1000 },
  { name: "GODOX X1C TTL WIRELESS FLASH TRIGGER CANON", category: "Accessories", rate: 1000 },
  { name: "GODOX X2 TTL WIRELESS FLASH TRIGGER CANON", category: "Accessories", rate: 1000 },
  { name: "GODOX TT685 C II FLASH FOR CANON", category: "Accessories", rate: 1500 },

  // ---- Other (studio, lighting, IT & office equipment) ----
  { name: "NICEFOTO LS-260AT ALUMINUM AIR CUSHION LIGHT STAND", category: "Other", rate: 1000 },
  { name: "GODOX LED RGB LIGHT STICK LC500R", category: "Other", rate: 1500 },
  { name: "EPSON PROJECTOR WITH SCREEN (6 FEET)", category: "Other", rate: 10000 },
  { name: "HP 2000 LAPTOP INTEL I5 2ND GEN", category: "Other", rate: 3500 },
  { name: "PROLINK PRO 1201 SFC 2KVA SUPER FAST CHARGING UPS WITH AVR", category: "Other", rate: 2500 },
  { name: "EPSON ECOTANK L8050 PHOTO PRINTER", category: "Other", rate: 6000 },
];
