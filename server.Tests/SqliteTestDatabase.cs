using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Data;

namespace ShipTask.Api.Tests;

public sealed class SqliteTestDatabase : IDisposable
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly DbContextOptions<PriceHuntDbContext> _options;

    public SqliteTestDatabase()
    {
        // An in-memory SQLite database lives only while its connection stays open.
        _connection.Open();
        _options = new DbContextOptionsBuilder<PriceHuntDbContext>().UseSqlite(_connection).Options;

        using var db = CreateContext();
        db.Database.Migrate();
    }

    public PriceHuntDbContext CreateContext() => new(_options);

    public void Dispose() => _connection.Dispose();
}
