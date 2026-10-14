namespace ShipTask.Api.Suppliers;

public interface ISupplier
{
    int Id { get; }

    string Name { get; }

    Task<long> GetOfferAsync(long basePrice, CancellationToken ct);
}


public class SupplierFailedException(string supplierName) : Exception($"{supplierName} failed to return an offer.");
