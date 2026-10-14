using System.Text.Json;
using System.Text.Json.Nodes;

using ShipTask.Api.Searches;

namespace ShipTask.Api.Tests.Searches;

// Mirrors client/src/app/models/search.ts. A failure here means the client misreads the stream.
public class SearchEventContractTests
{
    private static readonly JsonSerializerOptions HttpJsonOptions = new Microsoft.AspNetCore.Http.Json.JsonOptions().SerializerOptions;

    public static TheoryData<SearchEvent, string> Events => new()
    {
        { new SearchStarted(1, 3), """{"type":"started","searchId":1,"supplierCount":3}""" },
        { new SupplierQuoted(new SupplierQuote(1, "UPN", 123_00)), """{"type":"quote","quote":{"supplierId":1,"supplierName":"UPN","price":12300}}""" },
        { new SupplierFailed(6, "Israel Post"), """{"type":"failed","supplierId":6,"supplierName":"Israel Post"}""" },
        { new SearchEnded(SearchStatus.Completed), """{"type":"ended","status":"completed"}""" },
        { new SearchEnded(SearchStatus.TimedOut), """{"type":"ended","status":"timedOut"}""" },
    };

    [Theory]
    [MemberData(nameof(Events))]
    public void Serialize_SearchEvent_MatchesClientContract(SearchEvent searchEvent, string expectedJson)
    {
        var json = JsonSerializer.Serialize(searchEvent, HttpJsonOptions);

        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(expectedJson), JsonNode.Parse(json)), $"Actual JSON: {json}");
    }
}
