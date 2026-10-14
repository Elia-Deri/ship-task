using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Data.Entities;

public class Supplier
{
    public int Id { get; set; }

    public required string Name { get; set; }

    public SupplierBehavior Behavior { get; set; }
}
