using ShipTask.Api.Locations;

namespace ShipTask.Api.Tests.Locations;

public class LocationCatalogTests
{
    [Fact]
    public void Search_PartialTextInAnyCase_ReturnsMatchingLocations()
    {
        var locations = LocationCatalog.Search("  hAIFa ");

        Assert.Equal(["Port of Haifa, Israel"], locations);
    }

    [Fact]
    public void Search_CountryName_ReturnsEveryMatchInCatalogOrder()
    {
        var locations = LocationCatalog.Search("israel");

        Assert.Equal(["Jerusalem, Israel", "Tel Aviv, Israel", "Port of Ashdod, Israel", "Port of Haifa, Israel"], locations);
    }

    [Fact]
    public void Search_EmptyQuery_ReturnsTenLocations()
    {
        var locations = LocationCatalog.Search("");

        Assert.Equal(10, locations.Count);
    }

    [Fact]
    public void Search_BroadQuery_CapsResultsAtTen()
    {
        var locations = LocationCatalog.Search("port of");

        Assert.Equal(10, locations.Count);
        Assert.All(locations, location => Assert.StartsWith("Port of", location));
    }

    [Fact]
    public void Search_UnknownText_ReturnsNothing()
    {
        var locations = LocationCatalog.Search("Atlantis");

        Assert.Empty(locations);
    }
}
