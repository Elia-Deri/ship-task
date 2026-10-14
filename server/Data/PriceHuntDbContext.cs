using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Suppliers;
using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Data;

public class PriceHuntDbContext(DbContextOptions<PriceHuntDbContext> options) : DbContext(options)
{
    public DbSet<Supplier> Suppliers => Set<Supplier>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Supplier>(supplier =>
        {
            supplier.Property(s => s.Behavior).HasConversion<string>().HasDefaultValue(SupplierBehavior.Normal);
            supplier.ToTable(table => table.HasCheckConstraint("CK_Suppliers_Name_MinLength", "length(Name) >= 3"));
        });
    }
}
