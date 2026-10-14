using Microsoft.AspNetCore.Mvc;

using ShipTask.Api.History;

namespace ShipTask.Api.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController(HistoryService historyService) : ControllerBase
{
    [HttpGet]
    public Task<List<HistoryRow>> GetRowsAsync([FromQuery] HistoryQuery query, CancellationToken cancellationToken)
    {
        return historyService.GetRowsAsync(query, cancellationToken);
    }

    [HttpGet("routes")]
    public Task<List<HistoryRoute>> GetRoutesAsync(CancellationToken cancellationToken)
    {
        return historyService.GetRoutesAsync(cancellationToken);
    }
}
