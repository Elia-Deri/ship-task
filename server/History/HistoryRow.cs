namespace ShipTask.Api.History;

public record HistoryRow(
    int Id,
    int SearchId,
    long RespondedAt,
    string Source,
    string Destination,
    string SupplierName,
    long? Price,
    int ResponseTimeMs);
