namespace NzPayeCalc.ApiService.Services;

/// <summary>
/// Service for calculating NZ PAYE tax, KiwiSaver, ACC levy, student loan repayment, and take-home pay
/// </summary>
public interface IPayeCalculationService
{
    /// <summary>
    /// Calculate PAYE and deductions for a given annual salary
    /// </summary>
    /// <param name="annualSalary">Annual gross salary in NZD</param>
    /// <param name="kiwiSaverRate">KiwiSaver employee contribution rate (e.g., 0.03 for 3%)</param>
    /// <param name="hasStudentLoan">Whether the person has a student loan requiring repayment</param>
    /// <returns>Calculation result with annual and monthly breakdowns</returns>
    PayeCalculationResult Calculate(decimal annualSalary, decimal kiwiSaverRate, bool hasStudentLoan);
}

/// <summary>
/// Result of PAYE calculation
/// </summary>
public class PayeCalculationResult
{
    public decimal AnnualSalary { get; init; }
    public decimal KiwiSaverRate { get; init; }
    public bool HasStudentLoan { get; init; }
    public decimal AnnualPayeTax { get; init; }
    public decimal AnnualKiwiSaver { get; init; }
    public decimal AnnualAccLevy { get; init; }
    public decimal AnnualStudentLoan { get; init; }
    public decimal AnnualTakeHome => AnnualSalary - AnnualPayeTax - AnnualKiwiSaver - AnnualAccLevy - AnnualStudentLoan;

    public decimal MonthlyGrossSalary => RoundCurrency(AnnualSalary / 12);
    public decimal MonthlyPayeTax => RoundCurrency(AnnualPayeTax / 12);
    public decimal MonthlyKiwiSaver => RoundCurrency(AnnualKiwiSaver / 12);
    public decimal MonthlyAccLevy => RoundCurrency(AnnualAccLevy / 12);
    public decimal MonthlyStudentLoan => RoundCurrency(AnnualStudentLoan / 12);
    public decimal MonthlyTakeHome => RoundCurrency(AnnualTakeHome / 12);

    private static decimal RoundCurrency(decimal value) => 
        Math.Round(value, 2, MidpointRounding.ToEven);
}
