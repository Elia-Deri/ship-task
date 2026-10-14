using Microsoft.AspNetCore.Mvc;
using ShipTask.Api.Searches;
using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Controllers;

[ApiController]
[Route("api/searches")]
public class SearchesController(SupplierService supplierService, SearchService searchService) : ControllerBase
{
    [HttpPost]
    public async Task<IResult> StartAsync(SearchRequest request, CancellationToken cancellationToken)
    {
        var suppliers = await supplierService.GetByIdsAsync(request.SupplierIds, cancellationToken);
        if (suppliers.Count != request.SupplierIds.Length)
        {
            var unknownIds = request.SupplierIds.Except(suppliers.Select(s => s.Id));
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(SearchRequest.SupplierIds)] = [$"Unknown supplier ids: {string.Join(", ", unknownIds)}."],
            });

        }

        return TypedResults.ServerSentEvents(searchService.RunAsync(request, suppliers, cancellationToken));
    }
}
