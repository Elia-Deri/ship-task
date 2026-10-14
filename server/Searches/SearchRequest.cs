using System.ComponentModel.DataAnnotations;

using ShipTask.Api.Common;
using ShipTask.Api.Locations;

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
        if (!LocationCatalog.IsKnown(Source))
            yield return new ValidationResult("Source must be one of the known locations.", [nameof(Source)]);

        if (!LocationCatalog.IsKnown(Destination))
            yield return new ValidationResult("Destination must be one of the known locations.", [nameof(Destination)]);

        if (!UnixDate.IsUtcMidnight(StartDate))
            yield return new ValidationResult("Start date must be a UTC midnight timestamp in milliseconds.", [nameof(StartDate)]);

        if (!UnixDate.IsUtcMidnight(EndDate))
            yield return new ValidationResult("End date must be a UTC midnight timestamp in milliseconds.", [nameof(EndDate)]);

        if (StartDate > EndDate)
            yield return new ValidationResult("Start date must be on or before end date.", [nameof(StartDate), nameof(EndDate)]);

        if (SupplierIds.Distinct().Count() != SupplierIds.Length)
            yield return new ValidationResult("Supplier ids must be unique.", [nameof(SupplierIds)]);
    }
}
