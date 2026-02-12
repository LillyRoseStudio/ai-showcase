namespace NzPayeCalc.ApiService.Models;

/// <summary>
/// Response model for PAYE calculation containing annual and monthly breakdowns
/// </summary>
public class PayeCalculationResponse
{
    /// <summary>
    /// Annual gross salary input
    /// </summary>
    public decimal AnnualSalary { get; set; }

    /// <summary>
    /// KiwiSaver employee contribution rate used in calculation
    /// </summary>
    public decimal KiwiSaverRate { get; set; }

    /// <summary>
    /// Indicates whether student loan repayment was calculated
    /// </summary>
    public bool HasStudentLoan { get; set; }

    /// <summary>
    /// Annual breakdown of all deductions and take-home pay
    /// </summary>
    public required AnnualBreakdown Annual { get; set; }

    /// <summary>
    /// Monthly breakdown of all deductions and take-home pay
    /// </summary>
    public required MonthlyBreakdown Monthly { get; set; }
}

/// <summary>
/// Annual breakdown of salary and deductions
/// </summary>
public class AnnualBreakdown
{
    /// <summary>
    /// Annual gross salary
    /// </summary>
    public decimal GrossSalary { get; set; }

    /// <summary>
    /// Annual PAYE tax (progressive tax brackets)
    /// </summary>
    public decimal PayeTax { get; set; }

    /// <summary>
    /// Annual KiwiSaver employee contribution (variable rate of gross)
    /// </summary>
    public decimal KiwiSaver { get; set; }

    /// <summary>
    /// Annual ACC Earners' Levy (1.53% of gross, capped at $139,384)
    /// </summary>
    public decimal AccLevy { get; set; }

    /// <summary>
    /// Annual student loan repayment (12% above threshold, if applicable)
    /// </summary>
    public decimal StudentLoan { get; set; }

    /// <summary>
    /// Annual take-home pay after all deductions
    /// </summary>
    public decimal TakeHomePay { get; set; }
}

/// <summary>
/// Monthly breakdown of salary and deductions
/// </summary>
public class MonthlyBreakdown
{
    /// <summary>
    /// Monthly gross salary (annual / 12)
    /// </summary>
    public decimal GrossSalary { get; set; }

    /// <summary>
    /// Monthly PAYE tax (annual / 12)
    /// </summary>
    public decimal PayeTax { get; set; }

    /// <summary>
    /// Monthly KiwiSaver employee contribution (annual / 12)
    /// </summary>
    public decimal KiwiSaver { get; set; }

    /// <summary>
    /// Monthly ACC Earners' Levy (annual / 12)
    /// </summary>
    public decimal AccLevy { get; set; }

    /// <summary>
    /// Monthly student loan repayment (annual / 12)
    /// </summary>
    public decimal StudentLoan { get; set; }

    /// <summary>
    /// Monthly take-home pay after all deductions (annual / 12)
    /// </summary>
    public decimal TakeHomePay { get; set; }
}
