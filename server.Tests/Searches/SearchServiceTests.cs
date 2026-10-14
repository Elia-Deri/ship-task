using Microsoft.Extensions.Time.Testing;
using Microsoft.Extensions.Logging.Abstractions;

using ShipTask.Api.Searches;
using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Tests.Searches;

public class SearchServiceTests
{
    private static readonly SearchRequest Request = new()
    {
        Source = "Haifa",
        Destination = "Rotterdam",
        StartDate = new DateTimeOffset(2026, 10, 14, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds(),
        EndDate = new DateTimeOffset(2026, 10, 20, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds(),
        SupplierIds = [1, 2, 3],
    };

    private readonly FakeTimeProvider _time = new();

    [Fact]
    public async Task RunAsync_AllSuppliersRespond_StreamsQuotesInCompletionOrderThenCompleted()
    {
        await using var events = StartSearch([
            RespondsAfter(1, TimeSpan.FromSeconds(2), 120_00),
            RespondsAfter(2, TimeSpan.FromSeconds(1), 110_00),
        ]);

        var started = Assert.IsType<SearchStarted>(await NextAsync(events));
        Assert.Equal(2, started.SupplierCount);

        var firstQuote = Assert.IsType<SupplierQuoted>(await NextAfterAsync(events, TimeSpan.FromSeconds(1)));
        Assert.Equal(new SupplierQuote(2, "Supplier 2", 110_00), firstQuote.Quote);

        var secondQuote = Assert.IsType<SupplierQuoted>(await NextAfterAsync(events, TimeSpan.FromSeconds(1)));
        Assert.Equal(new SupplierQuote(1, "Supplier 1", 120_00), secondQuote.Quote);

        Assert.Equal(new SearchEnded(SearchStatus.Completed), await NextAsync(events));
        Assert.False(await events.MoveNextAsync());
    }

    [Fact]
    public async Task RunAsync_SuppliersThrow_StreamsFailedWithoutAffectingOthers()
    {
        await using var events = StartSearch([
            ThrowsAfter(1, TimeSpan.FromSeconds(1), new SupplierFailedException("Supplier 1")),
            ThrowsAfter(2, TimeSpan.FromSeconds(2), new InvalidOperationException("Unexpected bug")),
            RespondsAfter(3, TimeSpan.FromSeconds(3), 100_00),
        ]);
        await NextAsync(events);

        Assert.Equal(new SupplierFailed(1, "Supplier 1"), await NextAfterAsync(events, TimeSpan.FromSeconds(1)));
        Assert.Equal(new SupplierFailed(2, "Supplier 2"), await NextAfterAsync(events, TimeSpan.FromSeconds(1)));
        Assert.IsType<SupplierQuoted>(await NextAfterAsync(events, TimeSpan.FromSeconds(1)));
        Assert.Equal(new SearchEnded(SearchStatus.Completed), await NextAsync(events));
    }

    [Fact]
    public async Task RunAsync_SupplierNeverResponds_EndsTimedOutAtSixSecondsWithoutEventForIt()
    {
        var silentSupplier = NeverResponds(2);
        await using var events = StartSearch([RespondsAfter(1, TimeSpan.FromSeconds(1), 100_00), silentSupplier]);
        await NextAsync(events);
        Assert.IsType<SupplierQuoted>(await NextAfterAsync(events, TimeSpan.FromSeconds(1)));

        var moveNext = events.MoveNextAsync();
        _time.Advance(TimeSpan.FromMilliseconds(4_999));
        Assert.False(moveNext.IsCompleted);

        _time.Advance(TimeSpan.FromMilliseconds(1));
        Assert.True(await moveNext);
        Assert.Equal(new SearchEnded(SearchStatus.TimedOut), events.Current);
        Assert.True(silentSupplier.ReceivedToken.IsCancellationRequested);
        Assert.False(await events.MoveNextAsync());
    }

    [Fact]
    public async Task RunAsync_RequestCancelledMidSearch_CancelsPendingSuppliersAndEndsCancelled()
    {
        using var requestCts = new CancellationTokenSource();
        var pendingSupplier = RespondsAfter(2, TimeSpan.FromSeconds(5), 100_00);
        await using var events = StartSearch([RespondsAfter(1, TimeSpan.FromSeconds(1), 100_00), pendingSupplier], requestCts.Token);
        await NextAsync(events);
        Assert.IsType<SupplierQuoted>(await NextAfterAsync(events, TimeSpan.FromSeconds(1)));

        await requestCts.CancelAsync();

        Assert.Equal(new SearchEnded(SearchStatus.Cancelled), await NextAsync(events));
        Assert.True(pendingSupplier.ReceivedToken.IsCancellationRequested);
    }

    [Fact]
    public async Task RunAsync_ClientDisconnectsMidStream_DisposeFinishesWithoutWaitingForSuppliers()
    {
        using var requestCts = new CancellationTokenSource();
        var silentSupplier = NeverResponds(2);
        var events = StartSearch([RespondsAfter(1, TimeSpan.FromSeconds(1), 100_00), silentSupplier], requestCts.Token);
        await NextAsync(events);
        await NextAfterAsync(events, TimeSpan.FromSeconds(1));

        await requestCts.CancelAsync();

        // Real-time guard: a finally block that waits on an uncancelled supplier would hang here instead of failing.
        await events.DisposeAsync().AsTask().WaitAsync(TimeSpan.FromSeconds(5));
        Assert.True(silentSupplier.ReceivedToken.IsCancellationRequested);
    }

    private IAsyncEnumerator<SearchEvent> StartSearch(IReadOnlyList<ISupplier> suppliers, CancellationToken ct = default)
    {
        var service = new SearchService(new SearchIdGenerator(), _time, NullLogger<SearchService>.Instance);

        return service.RunAsync(Request, suppliers, ct).GetAsyncEnumerator();
    }

    private static async Task<SearchEvent> NextAsync(IAsyncEnumerator<SearchEvent> events)
    {
        Assert.True(await events.MoveNextAsync());

        return events.Current;
    }

    private async Task<SearchEvent> NextAfterAsync(IAsyncEnumerator<SearchEvent> events, TimeSpan elapsed)
    {
        var moveNext = events.MoveNextAsync();
        _time.Advance(elapsed);
        Assert.True(await moveNext);

        return events.Current;
    }

    private FakeSupplier RespondsAfter(int id, TimeSpan delay, long price)
    {
        return new FakeSupplier(id, async ct =>
        {
            await Task.Delay(delay, _time, ct);
            return price;
        });
    }

    private FakeSupplier ThrowsAfter(int id, TimeSpan delay, Exception exception)
    {
        return new FakeSupplier(id, async ct =>
        {
            await Task.Delay(delay, _time, ct);
            throw exception;
        });
    }

    private FakeSupplier NeverResponds(int id)
    {
        return new FakeSupplier(id, async ct =>
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, _time, ct);
            return 0;
        });
    }

    private sealed class FakeSupplier(int id, Func<CancellationToken, Task<long>> getOffer) : ISupplier
    {
        public int Id => id;

        public string Name => $"Supplier {id}";

        public CancellationToken ReceivedToken { get; private set; }

        public Task<long> GetOfferAsync(long basePrice, CancellationToken ct)
        {
            ReceivedToken = ct;

            return getOffer(ct);
        }
    }
}
