// Business details printed on every invoice.
// Defaults only — the real values are stored in the database and edited
// from the Settings page (/settings).

export type BusinessInfo = {
  name: string;
  tagline: string;
  addressLines: string[];
  phones: string[];
  email: string;
  bank: {
    bankName: string;
    branch: string;
    accountName: string;
    accountNumber: string;
  };
  invoiceFooter: string;
};

export const DEFAULT_BUSINESS: BusinessInfo = {
  name: "CEYLON CAMERA CENTER",
  tagline: "RENTAL & EQUIPMENT SOLUTIONS",
  addressLines: [],
  phones: [],
  email: "",
  bank: {
    bankName: "",
    branch: "",
    accountName: "CEYLON CAMERA CENTER",
    accountNumber: "",
  },
  invoiceFooter:
    "Thank you for choosing Ceylon Camera Center. Please return equipment on time and in good condition.",
};
