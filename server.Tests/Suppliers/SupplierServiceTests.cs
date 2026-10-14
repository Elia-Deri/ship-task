using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Data;
using ShipTask.Api.Searches;
using ShipTask.Api.Suppliers;
using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Tests.Suppliers;

public sealed class SupplierServiceTests : IDisposable
{
    private readonly SqliteTestDatabase _database = new();

    public void Dispose() => _database.Dispose();

    [Fact]
    public async Task ValidateSupplierListAsync_EmptyDatabase_SeedsDefaultSuppliers()
    {
        await ValidateSupplierListAsync();

        var behaviors = await LoadBehaviorsAsync();
        Assert.Equal(7, behaviors.Count);
        Assert.Single(behaviors, behavior => behavior == SupplierBehavior.Flaky);
        Assert.Single(behaviors, behavior => behavior == SupplierBehavior.Unresponsive);
    }

    [Fact]
    public async Task ValidateSupplierListAsync_ValidSuppliers_KeepsExistingRows()
    {
        await ValidateSupplierListAsync();
        var idsBefore = await LoadIdsAsync();

        await ValidateSupplierListAsync();

        Assert.Equal(idsBefore, await LoadIdsAsync());
    }

    [Fact]
    public async Task ValidateSupplierListAsync_MissingSupplier_ReseedsAllSuppliers()
    {
        await ValidateSupplierListAsync();
        var idsBefore = await LoadIdsAsync();
        await using (var db = CreateContext())
        {
            await db.Suppliers.Where(s => s.Id == idsBefore[0]).ExecuteDeleteAsync();
        }

        await ValidateSupplierListAsync();

        var idsAfter = await LoadIdsAsync();
        Assert.Equal(7, idsAfter.Count);
        Assert.Empty(idsAfter.Intersect(idsBefore));
    }

    [Fact]
    public async Task ValidateSupplierListAsync_SecondFlakySupplier_ReseedsAllSuppliers()
    {
        await ValidateSupplierListAsync();
        await using (var db = CreateContext())
        {
            var normalId = await db.Suppliers
                .Where(s => s.Behavior == SupplierBehavior.Normal)
                .Select(s => s.Id)
                .FirstAsync();
            await db.Suppliers
                .Where(s => s.Id == normalId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.Behavior, SupplierBehavior.Flaky));
        }

        await ValidateSupplierListAsync();

        var behaviors = await LoadBehaviorsAsync();
        Assert.Equal(7, behaviors.Count);
        Assert.Single(behaviors, behavior => behavior == SupplierBehavior.Flaky);
    }

    [Fact]
    public async Task ValidateSupplierListAsync_InvalidListWithHistory_DeletesHistoryAndReseeds()
    {
        await ValidateSupplierListAsync();
        var idsBefore = await LoadIdsAsync();
        await using (var db = CreateContext())
        {
            db.Searches.Add(new Search
            {
                Source = "Haifa",
                Destination = "Rotterdam",
                StartDate = new DateOnly(2026, 10, 14),
                EndDate = new DateOnly(2026, 10, 20),
                Status = SearchStatus.Completed,
                Responses = [new SupplierResponse { SupplierId = idsBefore[0], Status = SupplierResultStatus.Succeeded, Price = 100_00 }],
            });
            await db.SaveChangesAsync();
            await db.Suppliers.Where(s => s.Id == idsBefore[1]).ExecuteDeleteAsync();
        }

        await ValidateSupplierListAsync();

        await using var verifyDb = CreateContext();
        Assert.Equal(7, await verifyDb.Suppliers.CountAsync());
        Assert.Empty(await verifyDb.Searches.ToListAsync());
        Assert.Empty(await verifyDb.SupplierResponses.ToListAsync());
    }

    private PriceHuntDbContext CreateContext() => _database.CreateContext();

    private async Task ValidateSupplierListAsync()
    {
        await using var db = CreateContext();
        await new SupplierService(db, TimeProvider.System).ValidateSupplierListAsync(CancellationToken.None);
    }

    private async Task<List<int>> LoadIdsAsync()
    {
        await using var db = CreateContext();
        return await db.Suppliers.OrderBy(s => s.Id).Select(s => s.Id).ToListAsync();
    }

    private async Task<List<SupplierBehavior>> LoadBehaviorsAsync()
    {
        await using var db = CreateContext();
        return await db.Suppliers.Select(s => s.Behavior).ToListAsync();
    }
}
