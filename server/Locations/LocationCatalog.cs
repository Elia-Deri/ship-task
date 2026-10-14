namespace ShipTask.Api.Locations;

public static class LocationCatalog
{
    private const int MaxResults = 10;

    public static IReadOnlyList<string> Search(string query)
    {
        var trimmedQuery = query.Trim();

        return _locations
            .Where(location => location.Contains(trimmedQuery, StringComparison.OrdinalIgnoreCase))
            .Take(MaxResults)
            .ToList();
    }

    public static bool IsKnown(string location)
    {
        return _locations.Contains(location, StringComparer.Ordinal);
    }

    private static readonly IReadOnlyList<string> _locations =
    [
        "Amsterdam, Netherlands",
        "Athens, Greece",
        "Bangkok, Thailand",
        "Beijing, China",
        "Berlin, Germany",
        "Buenos Aires, Argentina",
        "Cairo, Egypt",
        "Chicago, USA",
        "Delhi, India",
        "Dubai, UAE",
        "Istanbul, Türkiye",
        "Jerusalem, Israel",
        "Johannesburg, South Africa",
        "London, UK",
        "Los Angeles, USA",
        "Madrid, Spain",
        "Mexico City, Mexico",
        "Mumbai, India",
        "Nairobi, Kenya",
        "New York, USA",
        "Paris, France",
        "Rome, Italy",
        "São Paulo, Brazil",
        "Seoul, South Korea",
        "Sydney, Australia",
        "Tel Aviv, Israel",
        "Tokyo, Japan",
        "Toronto, Canada",
        "Zurich, Switzerland",
        "Port Klang, Malaysia",
        "Port of Antwerp-Bruges, Belgium",
        "Port of Ashdod, Israel",
        "Port of Busan, South Korea",
        "Port of Felixstowe, UK",
        "Port of Haifa, Israel",
        "Port of Hamburg, Germany",
        "Port of Hong Kong, China",
        "Port of Jebel Ali, UAE",
        "Port of Long Beach, USA",
        "Port of Los Angeles, USA",
        "Port of New York and New Jersey, USA",
        "Port of Ningbo-Zhoushan, China",
        "Port of Piraeus, Greece",
        "Port of Rotterdam, Netherlands",
        "Port of Santos, Brazil",
        "Port of Shanghai, China",
        "Port of Shenzhen, China",
        "Port of Singapore, Singapore",
        "Port of Valencia, Spain",
        "Port of Vancouver, Canada",
    ];
}
