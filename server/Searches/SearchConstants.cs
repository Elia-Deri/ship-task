using System.Text.Json.Serialization;

namespace ShipTask.Api.Searches;

public enum SupplierResultStatus
{
    Succeeded,
    Failed,
    TimedOut,
    Cancelled,
}

[JsonConverter(typeof(JsonStringEnumConverter<SearchStatus>))]
public enum SearchStatus
{
    [JsonStringEnumMemberName("completed")]
    Completed,

    [JsonStringEnumMemberName("timedOut")]
    TimedOut,

    [JsonStringEnumMemberName("cancelled")]
    Cancelled,
}


public record SearchStarted(int SearchId, int SupplierCount) : SearchEvent;
public record SupplierResult(
    int SupplierId,
    string SupplierName,
    SupplierResultStatus Status,
    int ResponseTimeMs,
    DateTime RespondedAtUtc,
    long? Price
    );

public record SupplierQuote(int SupplierId, string SupplierName, long Price);
public record SupplierQuoted(SupplierQuote Quote) : SearchEvent;
public record SupplierFailed(int SupplierId, string SupplierName) : SearchEvent;
public record SearchEnded(SearchStatus Status) : SearchEvent;
