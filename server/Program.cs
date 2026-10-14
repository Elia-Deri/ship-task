using Microsoft.EntityFrameworkCore;

using ShipTask.Api.Data;
using ShipTask.Api.Searches;
using ShipTask.Api.Suppliers;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("PriceHunt")
    ?? throw new InvalidOperationException("Connection string 'PriceHunt' is missing.");

var clientOrigin = builder.Configuration["ClientOrigin"]
    ?? throw new InvalidOperationException("ClientOrigin is missing.");
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(clientOrigin).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<PriceHuntDbContext>(options => options.UseSqlite(connectionString));
//TODO: remove after search history is saved to db.
builder.Services.AddSingleton<SearchIdGenerator>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<SearchService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PriceHuntDbContext>();
    var supplierService = scope.ServiceProvider.GetRequiredService<SupplierService>();

    await db.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
    await supplierService.ValidateSupplierListAsync(app.Lifetime.ApplicationStopping);
}

app.UseCors();
app.UseAuthorization();

app.MapControllers();
if (app.Environment.IsDevelopment()) app.MapOpenApi();

app.Run();
