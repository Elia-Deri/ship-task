using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Data;
using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Suppliers;

public class SupplierService(PriceHuntDbContext db, TimeProvider timeProvider)
{
    private sealed record SupplierSeed(string Name, SupplierBehavior Behavior = SupplierBehavior.Normal);

    private static readonly SupplierSeed[] _defaultSuppliers = [
        new("UPN"),
        new("Cheetah"),
        new("Wolt Global"),
        new("Amazon Home"),
        new("Alibaba Shipments"),
        new("Israel Post", SupplierBehavior.Flaky),
        new("Eliya Services INC.", SupplierBehavior.Unresponsive),
    ];

    public async Task ValidateSupplierListAsync(CancellationToken ct)
    {
        var behaviors = await db.Suppliers.Select(s => s.Behavior).ToListAsync(ct);

        var isValid = behaviors.Count == _defaultSuppliers.Length
            && behaviors.Count(b => b == SupplierBehavior.Flaky) == 1
            && behaviors.Count(b => b == SupplierBehavior.Unresponsive) == 1;
        if (isValid) return;

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Reseeding changes supplier ids, so existing history would point at the wrong suppliers.
        // Responses go first: the supplier foreign key is Restrict.
        await db.SupplierResponses.ExecuteDeleteAsync(ct);
        await db.Searches.ExecuteDeleteAsync(ct);
        await db.Suppliers.ExecuteDeleteAsync(ct);

        db.Suppliers.AddRange(_defaultSuppliers.Select(d => new Supplier { Name = d.Name, Behavior = d.Behavior }));
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    public Task<List<SupplierDto>> GetAllAsync(CancellationToken ct)
    {
        return db.Suppliers.AsNoTracking().OrderBy(s => s.Id).Select(s => new SupplierDto(s.Id, s.Name)).ToListAsync(ct);
    }

    public async Task<List<ISupplier>> GetByIdsAsync(int[] ids, CancellationToken ct)
    {
        var rows = await db.Suppliers.AsNoTracking().Where(s => ids.Contains(s.Id)).ToListAsync(ct);
        return [.. rows.Select(row => new SimulatedSupplier(row, timeProvider))];
    }
}
