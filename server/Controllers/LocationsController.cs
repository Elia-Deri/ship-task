using Microsoft.AspNetCore.Mvc;

using ShipTask.Api.Locations;

namespace ShipTask.Api.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    [HttpGet]
    public IReadOnlyList<string> Search([FromQuery] string? query)
    {
        return LocationCatalog.Search(query ?? "");
    }
}
