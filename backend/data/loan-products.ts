/**
 * Curated Kenyan bank, SACCO, and government SME loan products.
 * Served via GET /api/credit/trust-preview for web + mobile parity.
 */
export type LoanProductType = "bank" | "sacco" | "government";

export interface LoanProduct {
  id: string;
  institution: string;
  logo: string;
  product: string;
  type: LoanProductType;
  maxAmount: number;
  interestRate: string;
  term: string;
  requirements: string[];
  applyUrl: string;
  tag: string;
  tagColor: string;
  suitedFor: string[];
}

export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: "1",
    institution: "KCB Bank",
    logo: "🏦",
    product: "KCB Biashara Loan",
    type: "bank",
    maxAmount: 1_000_000,
    interestRate: "13% p.a.",
    term: "Up to 36 months",
    requirements: ["Business registration", "6 months bank statements", "KRA PIN"],
    applyUrl: "https://www.kcbgroup.com/business/borrowing/business-loan/",
    tag: "Popular",
    tagColor: "bg-blue-100 text-blue-700",
    suitedFor: ["Retail Store", "Restaurant", "Services", "Manufacturing", "Agrovet", "Agriculture", "Other"],
  },
  {
    id: "2",
    institution: "Equity Bank",
    logo: "🏦",
    product: "Equity Biashara Loan",
    type: "bank",
    maxAmount: 500_000,
    interestRate: "14% p.a.",
    term: "Up to 24 months",
    requirements: ["Equity account (3+ months)", "Business permit", "KRA PIN"],
    applyUrl: "https://equitygroupholdings.com/ke/borrow/sme-loans/",
    tag: "Fast Approval",
    tagColor: "bg-green-100 text-green-700",
    suitedFor: ["Retail Store", "Restaurant", "Services", "Agrovet", "Agriculture", "Other"],
  },
  {
    id: "3",
    institution: "Co-operative Bank",
    logo: "🏦",
    product: "Co-op Biashara Loan",
    type: "bank",
    maxAmount: 3_000_000,
    interestRate: "12.5% p.a.",
    term: "Up to 48 months",
    requirements: ["Co-op account", "1 year business history", "Security/Guarantor"],
    applyUrl: "https://www.co-opbank.co.ke/business-banking/loans/",
    tag: "High Limit",
    tagColor: "bg-purple-100 text-purple-700",
    suitedFor: ["Manufacturing", "Agrovet", "Agriculture", "Services", "Other"],
  },
  {
    id: "4",
    institution: "Stanbic Bank",
    logo: "🏦",
    product: "SME Business Loan",
    type: "bank",
    maxAmount: 5_000_000,
    interestRate: "13.5% p.a.",
    term: "Up to 60 months",
    requirements: ["2 years audited accounts", "Business registration", "Security"],
    applyUrl: "https://www.stanbicbank.co.ke/kenya/business/products-and-services/borrow/sme-loans",
    tag: "Large Loans",
    tagColor: "bg-orange-100 text-orange-700",
    suitedFor: ["Manufacturing", "Agriculture", "Services", "Other"],
  },
  {
    id: "5",
    institution: "Nairobi Business SACCO",
    logo: "🤝",
    product: "Business Development Loan",
    type: "sacco",
    maxAmount: 100_000,
    interestRate: "10% p.a.",
    term: "Up to 12 months",
    requirements: ["SACCO membership", "3+ months savings", "Business permit"],
    applyUrl: "https://www.nairobibusinesssacco.com/",
    tag: "Low Interest",
    tagColor: "bg-teal-100 text-teal-700",
    suitedFor: ["Retail Store", "Restaurant", "Services", "Agrovet", "Agriculture", "Other"],
  },
  {
    id: "6",
    institution: "Kenya Agrovet SACCO",
    logo: "🌾",
    product: "Agri-Business Loan",
    type: "sacco",
    maxAmount: 75_000,
    interestRate: "11% p.a.",
    term: "Up to 12 months",
    requirements: ["Agrovet license", "2+ months savings", "Regular supplier receipts"],
    applyUrl: "https://www.sasra.go.ke/index.php/publications/licensed-saccos",
    tag: "Agrovet Specialist",
    tagColor: "bg-green-100 text-green-700",
    suitedFor: ["Agrovet", "Agriculture"],
  },
  {
    id: "7",
    institution: "Women Enterprise Fund",
    logo: "👩‍💼",
    product: "WEF Business Loan",
    type: "government",
    maxAmount: 500_000,
    interestRate: "8% p.a.",
    term: "Up to 36 months",
    requirements: ["Women-owned business", "Business registration", "Group or individual"],
    applyUrl: "https://www.wef.co.ke/",
    tag: "Government",
    tagColor: "bg-yellow-100 text-yellow-700",
    suitedFor: ["Retail Store", "Restaurant", "Services", "Agrovet", "Agriculture", "Other"],
  },
  {
    id: "8",
    institution: "Youth Enterprise Fund",
    logo: "🚀",
    product: "Youth Business Loan",
    type: "government",
    maxAmount: 300_000,
    interestRate: "8% p.a.",
    term: "Up to 36 months",
    requirements: ["Under 35 years", "Business registration", "Business plan"],
    applyUrl: "https://www.youthfund.go.ke/",
    tag: "Government",
    tagColor: "bg-yellow-100 text-yellow-700",
    suitedFor: ["Retail Store", "Restaurant", "Services", "Agrovet", "Agriculture", "Other"],
  },
];
