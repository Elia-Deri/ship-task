using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Suppliers;

public class SimulatedSupplier(Supplier supplier, TimeProvider timeProvider) : ISupplier
{
    public int Id => supplier.Id;
    public string Name => supplier.Name;

    public async Task<long> GetOfferAsync(long basePrice, CancellationToken ct)
    {
        if (supplier.Behavior == SupplierBehavior.Unresponsive)
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, timeProvider, ct);
        }

        var delay = TimeSpan.FromMilliseconds(Random.Shared.Next(1, 11) * 500);
        await Task.Delay(delay, timeProvider, ct);

        if (supplier.Behavior == SupplierBehavior.Flaky && Random.Shared.Next(100) < 30)
        {
            throw new SupplierFailedException(Name);
        }

        return PriceGenerator.GetOfferPrice(basePrice);
    }

}
