import type { ProgramId, ReferralProgramId } from "@/lib/types";

export type ProgramInfo = {
  name: string;
  shortName: string;
  description: string; // ONE plain-language sentence, max 20 words, no dollar amounts, no promises
  howToApply: string;
  officialUrl: string;
  level: 1 | 2; // 1 = we prepare an application, 2 = unlocked by filing taxes
};

export type ReferralInfo = {
  name: string;
  description: string; // ONE plain-language sentence, max 20 words, no dollar amounts, no promises
  whoToContact: string;
  officialUrl: string;
};

export const PROGRAMS: Record<ProgramId, ProgramInfo> = {
  dtc: {
    name: "Disability Tax Credit",
    shortName: "DTC",
    description: "A yearly tax credit for people whose disability makes everyday activities much harder.",
    howToApply: "Form T2201: the client fills Part A, a medical practitioner certifies Part B",
    officialUrl: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit.html",
    level: 1,
  },
  child_disability_benefit: {
    name: "Child Disability Benefit",
    shortName: "Child Disability Benefit",
    description: "A monthly payment for families raising a child whose disability needs extra care.",
    howToApply: "Paid automatically with the Canada Child Benefit once the child's DTC is approved",
    officialUrl: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/child-disability-benefit.html",
    level: 1,
  },
  canada_disability_benefit: {
    name: "Canada Disability Benefit",
    shortName: "CDB",
    description: "A monthly payment for adults with a disability who have an approved Disability Tax Credit.",
    howToApply: "Apply online or by phone with Service Canada after the DTC is approved",
    officialUrl: "https://www.canada.ca/en/services/benefits/disability/canada-disability-benefit.html",
    level: 1,
  },
  ccb: {
    name: "Canada Child Benefit",
    shortName: "CCB",
    description: "A monthly payment to help families with the cost of raising children under 18.",
    howToApply: "Form RC66, or through CRA My Account",
    officialUrl: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit.html",
    level: 1,
  },
  oas: {
    name: "Old Age Security",
    shortName: "OAS",
    description: "A monthly pension for seniors aged 65 and older.",
    howToApply: "Form ISP-3550 (applies for OAS and GIS together)",
    officialUrl: "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security.html",
    level: 1,
  },
  gis: {
    name: "Guaranteed Income Supplement",
    shortName: "GIS",
    description: "An extra monthly payment for low-income seniors who receive Old Age Security.",
    howToApply: "Form ISP-3025 if already receiving OAS; otherwise ISP-3550",
    officialUrl: "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html",
    level: 1,
  },
  cdcp: {
    name: "Canadian Dental Care Plan",
    shortName: "Dental Care Plan",
    description: "Dental care coverage for eligible people in Canada with lower household incomes.",
    howToApply: "Apply online or by phone after filing last year's tax return",
    officialUrl: "https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html",
    level: 1,
  },
  cgeb: {
    name: "Canada Groceries and Essentials Benefit",
    shortName: "Groceries Benefit",
    description: "A payment to help households with the rising cost of groceries and essentials.",
    howToApply: "Paid automatically after filing a tax return",
    officialUrl: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit.html",
    level: 2,
  },
  cwb: {
    name: "Canada Workers Benefit",
    shortName: "CWB",
    description: "A refundable tax credit for working people with lower incomes.",
    howToApply: "Claimed on the tax return",
    officialUrl: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45300-canada-workers-benefit-cwb/how-much-you-can-get.html",
    level: 2,
  },
  ontario_gains: {
    name: "Ontario Guaranteed Annual Income System",
    shortName: "GAINS",
    description: "A monthly Ontario top-up for low-income seniors who already receive OAS and GIS.",
    howToApply: "Paid automatically to Ontario seniors receiving OAS and GIS",
    officialUrl: "https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors",
    level: 2,
  },
  ontario_trillium: {
    name: "Ontario Trillium Benefit",
    shortName: "Trillium Benefit",
    description: "A yearly Ontario tax benefit combining energy, property and sales tax credits for lower-income residents.",
    howToApply: "Claimed on the tax return (form ON-BEN)",
    officialUrl: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-ontario.html",
    level: 2,
  },
  ontario_child_benefit: {
    name: "Ontario Child Benefit",
    shortName: "Ontario Child Benefit",
    description: "A monthly Ontario payment for families raising children, added to the Canada Child Benefit.",
    howToApply: "Paid automatically with the Canada Child Benefit",
    officialUrl: "https://www.ontario.ca/page/ontario-child-benefit",
    level: 2,
  },
};

export const REFERRALS: Record<ReferralProgramId, ReferralInfo> = {
  odsp: {
    name: "Ontario Disability Support Program",
    description: "Ontario income support for people with disabilities who have low incomes.",
    whoToContact: "Local ODSP office or apply online",
    officialUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
  },
  ontario_works: {
    name: "Ontario Works",
    description: "Ontario's income and employment support program for people in financial need.",
    whoToContact: "Local Ontario Works office or apply online",
    officialUrl: "https://www.ontario.ca/page/ontario-works",
  },
  cpp_disability: {
    name: "Canada Pension Plan disability benefits",
    description: "A monthly pension for people with a severe and prolonged disability who have paid into CPP.",
    whoToContact: "Service Canada",
    officialUrl: "https://www.canada.ca/en/services/benefits/publicpensions/cpp-disability-benefit.html",
  },
  rdsp: {
    name: "Registered Disability Savings Plan",
    description: "A long-term savings plan for people with a disability, with government grants available.",
    whoToContact: "A bank or credit union that offers RDSPs",
    officialUrl: "https://www.canada.ca/en/employment-social-development/programs/disability/savings.html",
  },
  canada_learning_bond: {
    name: "Canada Learning Bond",
    description: "A savings bonus for children from lower-income families to help pay for future education.",
    whoToContact: "A bank or credit union that offers RESPs",
    officialUrl: "https://www.canada.ca/en/services/benefits/education/education-savings/canada-learning-bond.html",
  },
  oas_allowance: {
    name: "Allowance and Allowance for the Survivor (ages 60–64)",
    description: "A monthly benefit for low-income people aged 60 to 64 whose spouse gets the Guaranteed Income Supplement, or who are widowed.",
    whoToContact: "Service Canada",
    officialUrl: "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance.html",
  },
  oesp: {
    name: "Ontario Electricity Support Program",
    description: "A monthly credit on electricity bills for households with lower incomes.",
    whoToContact: "Apply online with the electricity bill",
    officialUrl: "https://ontarioelectricitysupport.ca/",
  },
  healthy_smiles_ontario: {
    name: "Healthy Smiles Ontario",
    description: "Free dental care for children 17 and under from low-income families in Ontario.",
    whoToContact: "Local public health unit",
    officialUrl: "https://www.ontario.ca/page/get-dental-care",
  },
  ontario_seniors_dental: {
    name: "Ontario Seniors Dental Care Program",
    description: "Dental care for eligible low-income seniors in Ontario, provided through public health units.",
    whoToContact: "Local public health unit",
    officialUrl: "https://www.ontario.ca/page/dental-care-low-income-seniors",
  },
};
