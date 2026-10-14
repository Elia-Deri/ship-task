using System.ComponentModel.DataAnnotations;

namespace ShipTask.Api.Searches;

public record SearchRequest : IValidatableObject
{
    [Required]
    public required string Source { get; init; }

    [Required]
    public required string Destination { get; init; }

    public required long StartDate { get; init; }
    public required long EndDate { get; init; }

    [Required, MinLength(1)]
    public required int[] SupplierIds { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!IsUtcMidnight(StartDate))
            yield return new ValidationResult("Start date must be a UTC midnight timestamp in milliseconds.", [nameof(StartDate)]);

        if (!IsUtcMidnight(EndDate))
            yield return new ValidationResult("End date must be a UTC midnight timestamp in milliseconds.", [nameof(EndDate)]);

        if (StartDate > EndDate)
            yield return new ValidationResult("Start date must be on or before end date.", [nameof(StartDate), nameof(EndDate)]);

        if (string.Equals(Source.Trim(), Destination.Trim(), StringComparison.OrdinalIgnoreCase))
            yield return new ValidationResult("Source and destination must differ.", [nameof(Destination)]);

        if (SupplierIds.Distinct().Count() != SupplierIds.Length)
            yield return new ValidationResult("Supplier ids must be unique.", [nameof(SupplierIds)]);
    }

    private static bool IsUtcMidnight(long unixMs)
    {
        return unixMs >= 0
            && unixMs <= DateTimeOffset.MaxValue.ToUnixTimeMilliseconds()
            && unixMs % (24 * 60 * 60 * 1000) == 0;
    }
}