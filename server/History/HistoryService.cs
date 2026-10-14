using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Data;
using ShipTask.Api.Common;
using ShipTask.Api.Searches;

namespace ShipTask.Api.History;

public class HistoryService(PriceHuntDbContext db)
{
    // A separator typed text can't contain, so "a|b" + "c" never matches "a" + "b|c".
    private const string RouteSeparator = "\u001F";

    public async Task<List<HistoryRow>> GetRowsAsync(HistoryQuery query, CancellationToken ct)
    {
        // Pending rows belong to running or interrupted searches; cancelled rows mean the client left, not that a supplier answered.
        var responses = db.SupplierResponses.AsNoTracking()
            .Where(r => r.Status != null && r.Status != SupplierResultStatus.Cancelled);

        if (query.StartDate is { } startDate)
        {
            var fromDate = UnixDate.ToDateOnly(startDate);
            responses = responses.Where(r => r.Search.EndDate >= fromDate);
        }

        if (query.EndDate is { } endDate)
        {
            var toDate = UnixDate.ToDateOnly(endDate);
            responses = responses.Where(r => r.Search.StartDate <= toDate);
        }

        if (query.SupplierIds.Length > 0)
            responses = responses.Where(r => query.SupplierIds.Contains(r.SupplierId));

        if (query.Routes.Length > 0)
        {
            var routeKeys = query.Routes.Select(route => route.Source + RouteSeparator + route.Destination).ToArray();
            responses = responses.Where(r => routeKeys.Contains(r.Search.Source + RouteSeparator + r.Search.Destination));
        }

        var rows = await responses
            .Select(r => new
            {
                r.Id,
                r.SearchId,
                r.RespondedAtUtc,
                r.Search.Source,
                r.Search.Destination,
                SupplierName = r.Supplier.Name,
                r.Price,
                r.ResponseTimeMs,
            })
            .ToListAsync(ct);

        return [.. rows.Select(row => row switch
        {
            { RespondedAtUtc: { } respondedAt, ResponseTimeMs: { } responseTimeMs } => new HistoryRow(
                row.Id,
                row.SearchId,
                new DateTimeOffset(respondedAt).ToUnixTimeMilliseconds(),
                row.Source,
                row.Destination,
                row.SupplierName,
                row.Price,
                responseTimeMs),
            _ => throw new InvalidOperationException($"Supplier response {row.Id} is finished but has no outcome."),
        })];
    }

    public async Task<List<HistoryRoute>> GetRoutesAsync(CancellationToken ct)
    {
        var routes = await db.Searches.AsNoTracking()
            .Select(s => new { s.Source, s.Destination })
            .Distinct()
            .OrderBy(route => route.Source)
            .ThenBy(route => route.Destination)
            .ToListAsync(ct);

        return [.. routes.Select(route => new HistoryRoute(route.Source, route.Destination))];
    }
}
