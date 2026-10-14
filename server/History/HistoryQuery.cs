using System.ComponentModel.DataAnnotations;

using ShipTask.Api.Common;

namespace ShipTask.Api.History;

public record HistoryQuery : IValidatableObject
{
    public long? StartDate { get; init; }
    public long? EndDate { get; init; }
    public int[] SupplierIds { get; init; } = [];
    public HistoryRoute[] Routes { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartDate is { } startDate && !UnixDate.IsUtcMidnight(startDate))
            yield return new ValidationResult("Start date must be a UTC midnight timestamp in milliseconds.", [nameof(StartDate)]);

        if (EndDate is { } endDate && !UnixDate.IsUtcMidnight(endDate))
            yield return new ValidationResult("End date must be a UTC midnight timestamp in milliseconds.", [nameof(EndDate)]);

        if (StartDate > EndDate)
            yield return new ValidationResult("Start date must be on or before end date.", [nameof(StartDate), nameof(EndDate)]);
    }
}
