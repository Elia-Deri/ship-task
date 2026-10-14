using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Data;
using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Tests.Suppliers;

public sealed class SupplierServiceTests : IDisposable
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly DbContextOptions<PriceHuntDbContext> _options;

    public SupplierServiceTests()
    {
        // An in-memory SQLite database lives only while its connection stays open.
        _connection.Open();
        _options = new DbContextOptionsBuilder<PriceHuntDbContext>().UseSqlite(_connection).Options;

        using var db = CreateContext();
        db.Database.Migrate();
    }

    public void Dispose() => _connection.Dispose();

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

    private PriceHuntDbContext CreateContext() => new(_options);

    private async Task ValidateSupplierListAsync()
    {
        await using var db = CreateContext();
        await new SupplierService(db).ValidateSupplierListAsync(CancellationToken.None);
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
