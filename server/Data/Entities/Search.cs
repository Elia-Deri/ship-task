using ShipTask.Api.Searches;

namespace ShipTask.Api.Data.Entities;

public class Search
{
    public int Id { get; set; }

    public required string Source { get; set; }

    public required string Destination { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public SearchStatus? Status { get; set; }

    public List<SupplierResponse> Responses { get; set; } = [];
}
