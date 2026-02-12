namespace NzPayeCalc.Web.Models;

/// <summary>
/// Request model for PAYE calculation
/// </summary>
public class PayeCalculationRequest
{
    public decimal AnnualSalary { get; set; }
    public decimal KiwiSaverRate { get; set; } = 0.03m;
    public bool HasStudentLoan { get; set; } = false;
}

/// <summary>
/// Response model for PAYE calculation
/// </summary>
public class PayeCalculationResponse
{
    public decimal AnnualSalary { get; set; }
    public decimal KiwiSaverRate { get; set; }
    public bool HasStudentLoan { get; set; }
    public required AnnualBreakdown Annual { get; set; }
    public required MonthlyBreakdown Monthly { get; set; }
}

public class AnnualBreakdown
{
    public decimal GrossSalary { get; set; }
    public decimal PayeTax { get; set; }
    public decimal KiwiSaver { get; set; }
    public decimal AccLevy { get; set; }
    public decimal StudentLoan { get; set; }
    public decimal TakeHomePay { get; set; }
}

public class MonthlyBreakdown
{
    public decimal GrossSalary { get; set; }
    public decimal PayeTax { get; set; }
    public decimal KiwiSaver { get; set; }
    public decimal AccLevy { get; set; }
    public decimal StudentLoan { get; set; }
    public decimal TakeHomePay { get; set; }
}
