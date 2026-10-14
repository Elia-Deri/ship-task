using Microsoft.AspNetCore.Mvc;

using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController(SupplierService supplierService) : ControllerBase
{
    [HttpGet]
    public Task<List<SupplierDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        return supplierService.GetAllAsync(cancellationToken);
    }
}
