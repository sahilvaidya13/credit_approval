const { z } = require("zod");

const LoanDataValidator = z.object({
  customerID: z.number().int(),
  loanID: z.number().int(),
  loan_amount: z.number().positive(),
  tenure: z.number().positive(),
  interest_rate: z.number().positive(),
  monthly_payment: z.number().positive(),
  emi_paid_ontime: z.number(),
  date_of_approval: z.string(),
  end_date: z.string(),
});

const CustomerDataValidator = z.object({
  customerID: z.number().int().optional(),
  first_name: z.string(),
  last_name: z.string(),
  age: z.number(),
  phone: z.number(),
  monthly_salary: z.number().positive(),
  current_debt: z.number().positive(),
});

module.exports = {
  CustomerDataValidator: CustomerDataValidator,
  LoanDataValidator: LoanDataValidator,
};
