using ShipTask.Api.Data;
using ShipTask.Api.Common;
using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Searches;

public class SearchStore(PriceHuntDbContext db, TimeProvider timeProvider)
{
    public async Task<Search> CreateAsync(SearchRequest request, int[] supplierIds, CancellationToken ct)
    {
        var search = new Search
        {
            Source = request.Source.Trim(),
            Destination = request.Destination.Trim(),
            StartDate = UnixDate.ToDateOnly(request.StartDate),
            EndDate = UnixDate.ToDateOnly(request.EndDate),
            CreatedAtUtc = timeProvider.GetUtcNow().UtcDateTime,
            Responses = [.. supplierIds.Select(supplierId => new SupplierResponse { SupplierId = supplierId })],
        };
        db.Searches.Add(search);
        await db.SaveChangesAsync(ct);

        return search;
    }

    public async Task CompleteAsync(Search search, SupplierResult[] results, SearchStatus status)
    {
        foreach (var result in results)
        {
            var response = search.Responses.Single(r => r.SupplierId == result.SupplierId);
            response.Status = result.Status;
            response.Price = result.Price;
            response.ResponseTimeMs = result.ResponseTimeMs;
            response.RespondedAtUtc = result.RespondedAtUtc;
        }

        search.Status = status;

        // Runs after a client disconnect too, when the request token is already cancelled.
        await db.SaveChangesAsync(CancellationToken.None);
    }
}
