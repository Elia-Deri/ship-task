using System.Runtime.CompilerServices;

using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Searches;

public class SearchService(SearchIdGenerator searchIdGenerator, TimeProvider timeProvider, ILogger<SearchService> logger)
{
    private static readonly TimeSpan _searchTimeout = TimeSpan.FromSeconds(6);


    public async IAsyncEnumerable<SearchEvent> RunAsync(
        SearchRequest request,
        IReadOnlyList<ISupplier> suppliers,
        [EnumeratorCancellation] CancellationToken ct
        )
    {
        using var timeoutCts = new CancellationTokenSource(_searchTimeout, timeProvider);
        using var searchCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        // TODO: insert the search row and use its id instead of the generator.
        yield return new SearchStarted(searchIdGenerator.Next(), suppliers.Count);

        var basePrice = PriceGenerator.GetBasePrice(request.Source, request.Destination, request.StartDate, request.EndDate);
        var offers = suppliers.Select(supplier => GetSupplierResultAsync(supplier, basePrice, searchCts.Token, ct)).ToArray();

        try
        {
            await foreach (var offer in Task.WhenEach(offers))
            {
                var result = await offer;

                switch (result)
                {
                    case { Status: SupplierResultStatus.Succeeded, Price: { } price }:
                        yield return new SupplierQuoted(new SupplierQuote(result.SupplierId, result.SupplierName, price));
                        break;
                    case { Status: SupplierResultStatus.Failed }:
                        yield return new SupplierFailed(result.SupplierId, result.SupplierName);
                        break;
                }
            }

            yield return new SearchEnded(GetSearchStatus(await Task.WhenAll(offers)));
        }
        finally
        {
            var results = await Task.WhenAll(offers);
            var finalStatus = GetSearchStatus(results);
            // TODO: save finalStatus and results with CancellationToken.None, since ct is already cancelled on disconnect.
        }
    }

    private async Task<SupplierResult> GetSupplierResultAsync(
        ISupplier supplier,
        long basePrice,
        CancellationToken searchCT,
        CancellationToken requestCT
        )
    {
        var startTimestamp = timeProvider.GetTimestamp();
        long? offerPrice = null;
        SupplierResultStatus status;

        try
        {
            offerPrice = await supplier.GetOfferAsync(basePrice, searchCT);
            status = SupplierResultStatus.Succeeded;
        }
        catch (OperationCanceledException) when (searchCT.IsCancellationRequested)
        {
            status = requestCT.IsCancellationRequested ? SupplierResultStatus.Cancelled : SupplierResultStatus.TimedOut;
        }
        catch (SupplierFailedException exception)
        {
            logger.LogWarning(exception, "Supplier {SupplierId} failed.", supplier.Id);
            status = SupplierResultStatus.Failed;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Supplier {SupplierId} threw unexpectedly.", supplier.Id);
            status = SupplierResultStatus.Failed;
        }

        var responseTimeMs = (int)timeProvider.GetElapsedTime(startTimestamp).TotalMilliseconds;
        return new SupplierResult(supplier.Id, supplier.Name, status, responseTimeMs, timeProvider.GetUtcNow().UtcDateTime, offerPrice);
    }

    private static SearchStatus GetSearchStatus(SupplierResult[] results)
    {
        if (results.Any(result => result.Status == SupplierResultStatus.Cancelled)) return SearchStatus.Cancelled;
        return results.Any(result => result.Status == SupplierResultStatus.TimedOut) ? SearchStatus.TimedOut : SearchStatus.Completed;
    }
}