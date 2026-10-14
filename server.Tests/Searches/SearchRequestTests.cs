using System.ComponentModel.DataAnnotations;

using ShipTask.Api.Searches;

namespace ShipTask.Api.Tests.Searches;

public class SearchRequestTests
{
    private const long DayMs = 24 * 60 * 60 * 1000;

    private static readonly long October14 = new DateTimeOffset(2026, 10, 14, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();

    private static readonly SearchRequest ValidRequest = new()
    {
        Source = "Port of Haifa, Israel",
        Destination = "Port of Rotterdam, Netherlands",
        StartDate = October14,
        EndDate = October14 + 6 * DayMs,
        SupplierIds = [1, 2, 3],
    };

    public static TheoryData<string, SearchRequest> InvalidRequests => new()
    {
        { nameof(SearchRequest.SupplierIds), ValidRequest with { SupplierIds = [] } },
        { nameof(SearchRequest.SupplierIds), ValidRequest with { SupplierIds = null! } },
        { nameof(SearchRequest.SupplierIds), ValidRequest with { SupplierIds = [1, 1] } },
        { nameof(SearchRequest.Source), ValidRequest with { Source = "   " } },
        { nameof(SearchRequest.Destination), ValidRequest with { Destination = " port of haifa, israel " } },
        { nameof(SearchRequest.Source), ValidRequest with { Source = "Haifa" } },
        { nameof(SearchRequest.Source), ValidRequest with { Source = "port of haifa, israel" } },
        { nameof(SearchRequest.Destination), ValidRequest with { Destination = "Atlantis" } },
        { nameof(SearchRequest.StartDate), ValidRequest with { StartDate = October14 + 1 } },
        // Israel midnight in October (UTC+3), what a client sending date.getTime() would produce.
        { nameof(SearchRequest.StartDate), ValidRequest with { StartDate = October14 - 3 * 60 * 60 * 1000 } },
        { nameof(SearchRequest.StartDate), ValidRequest with { StartDate = -DayMs } },
        { nameof(SearchRequest.StartDate), ValidRequest with { StartDate = October14 + 7 * DayMs } },
    };

    [Fact]
    public void Validate_ValidRequest_HasNoErrors()
    {
        Assert.Empty(Validate(ValidRequest));
    }

    [Fact]
    public void Validate_SameSourceAndDestination_HasNoErrors()
    {
        Assert.Empty(Validate(ValidRequest with { Destination = ValidRequest.Source }));
    }

    [Fact]
    public void Validate_SameDayRange_HasNoErrors()
    {
        Assert.Empty(Validate(ValidRequest with { EndDate = October14 }));
    }

    [Theory]
    [MemberData(nameof(InvalidRequests))]
    public void Validate_InvalidRequest_ReportsErrorOnField(string expectedMember, SearchRequest request)
    {
        Assert.Contains(Validate(request), error => error.MemberNames.Contains(expectedMember));
    }

    private static List<ValidationResult> Validate(SearchRequest request)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);

        return results;
    }
}
