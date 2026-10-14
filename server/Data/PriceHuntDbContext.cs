using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Suppliers;
using ShipTask.Api.Data.Entities;

namespace ShipTask.Api.Data;

public class PriceHuntDbContext(DbContextOptions<PriceHuntDbContext> options) : DbContext(options)
{
    public DbSet<Supplier> Suppliers => Set<Supplier>();

    public DbSet<Search> Searches => Set<Search>();

    public DbSet<SupplierResponse> SupplierResponses => Set<SupplierResponse>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Supplier>(supplier =>
        {
            supplier.Property(s => s.Behavior).HasConversion<string>().HasDefaultValue(SupplierBehavior.Normal);
            supplier.ToTable(table => table.HasCheckConstraint("CK_Suppliers_Name_MinLength", "length(Name) >= 3"));
        });

        modelBuilder.Entity<Search>(search =>
        {
            search.Property(s => s.Status).HasConversion<string>();
            search.HasIndex(s => new { s.StartDate, s.EndDate });
            search.HasMany(s => s.Responses).WithOne(r => r.Search).HasForeignKey(r => r.SearchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupplierResponse>(response =>
        {
            response.Property(r => r.Status).HasConversion<string>();
            response.HasIndex(r => new { r.SearchId, r.SupplierId }).IsUnique();
            response.HasOne(r => r.Supplier).WithMany().HasForeignKey(r => r.SupplierId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
