using Microsoft.Extensions.Time.Testing;

using ShipTask.Api.Suppliers;
using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Tests.Suppliers;

public class SimulatedSupplierTests
{
    private const long BasePrice = 200_00;

    private readonly FakeTimeProvider _time = new();

    [Fact]
    public async Task GetOfferAsync_NormalSupplier_RespondsBetweenHalfAndFiveSeconds()
    {
        var offerTask = CreateSupplier(SupplierBehavior.Normal).GetOfferAsync(BasePrice, CancellationToken.None);

        _time.Advance(TimeSpan.FromMilliseconds(499));
        Assert.False(offerTask.IsCompleted);

        _time.Advance(TimeSpan.FromMilliseconds(4_501));
        Assert.InRange(await offerTask, 190_00, 210_00);
    }

    [Fact]
    public async Task GetOfferAsync_CancelledDuringDelay_ThrowsOperationCanceled()
    {
        using var cts = new CancellationTokenSource();
        var offerTask = CreateSupplier(SupplierBehavior.Normal).GetOfferAsync(BasePrice, cts.Token);

        await cts.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => offerTask);
    }

    [Fact]
    public async Task GetOfferAsync_UnresponsiveSupplier_WaitsUntilCancelled()
    {
        using var cts = new CancellationTokenSource();
        var offerTask = CreateSupplier(SupplierBehavior.Unresponsive).GetOfferAsync(BasePrice, cts.Token);

        _time.Advance(TimeSpan.FromHours(1));
        Assert.False(offerTask.IsCompleted);

        await cts.CancelAsync();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => offerTask);
    }

    [Fact]
    public async Task GetOfferAsync_FlakySupplier_FailsAboutThirtyPercentOfTheTime()
    {
        var supplier = CreateSupplier(SupplierBehavior.Flaky);
        var failureCount = 0;

        for (var i = 0; i < 1_000; i++)
        {
            var offerTask = supplier.GetOfferAsync(BasePrice, CancellationToken.None);
            _time.Advance(TimeSpan.FromSeconds(5));

            if (await Record.ExceptionAsync(() => offerTask) is SupplierFailedException) failureCount++;
        }

        Assert.InRange(failureCount, 200, 400);
    }

    [Fact]
    public async Task GetOfferAsync_NormalSupplier_NeverFails()
    {
        var supplier = CreateSupplier(SupplierBehavior.Normal);

        for (var i = 0; i < 1_000; i++)
        {
            var offerTask = supplier.GetOfferAsync(BasePrice, CancellationToken.None);
            _time.Advance(TimeSpan.FromSeconds(5));

            Assert.Null(await Record.ExceptionAsync(() => offerTask));
        }
    }

    private SimulatedSupplier CreateSupplier(SupplierBehavior behavior)
    {
        return new SimulatedSupplier(new Supplier { Id = 1, Name = "Test Supplier", Behavior = behavior }, _time);
    }
}
