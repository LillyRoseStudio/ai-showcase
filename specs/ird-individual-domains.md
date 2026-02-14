# IRD Individual Tax Domain Breakdown

## Core Workpaper Groups

- Income Capture
- Withholding Tax Reconciliation
- Expense / Deduction Capture
- Tax Credits
- Adjustments
- Final Calculation
- Filing

This maps very cleanly to a DDD bounded context model, for example:

```text
TaxReturn
 ├── IncomeAggregate
 ├── DeductionAggregate
 ├── CreditAggregate
 ├── PaymentAggregate
 ├── CalculationEngine
 └── FilingAggregate
```