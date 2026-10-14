using ShipTask.Api.Searches;

namespace ShipTask.Api.Data.Entities;

public class SupplierResponse
{
    public int Id { get; set; }

    public int SearchId { get; set; }

    public Search Search { get; set; } = null!;

    public int SupplierId { get; set; }

    public Supplier Supplier { get; set; } = null!;

    public SupplierResultStatus? Status { get; set; }

    public long? Price { get; set; }

    public int? ResponseTimeMs { get; set; }

    public DateTime? RespondedAtUtc { get; set; }
}
