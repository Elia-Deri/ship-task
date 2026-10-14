using ShipTask.Api.Suppliers;

namespace ShipTask.Api.Tests.Suppliers;

public class PriceGeneratorTests
{
    private static readonly long StartDate = new DateTimeOffset(2026, 10, 14, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
    private static readonly long EndDate = new DateTimeOffset(2026, 10, 20, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();

    [Fact]
    public void GetBasePrice_SameRouteDifferentCasingAndSpacing_ReturnsSamePrice()
    {
        var price = PriceGenerator.GetBasePrice("Haifa", "Rotterdam", StartDate, EndDate);
        var normalizedPrice = PriceGenerator.GetBasePrice("  haifa ", "ROTTERDAM", StartDate, EndDate);

        Assert.Equal(price, normalizedPrice);
    }

    [Theory]
    [InlineData("Rotterdam")]
    [InlineData("Shanghai")]
    [InlineData("New York")]
    public void GetBasePrice_AnyRoute_StaysInRange(string destination)
    {
        var price = PriceGenerator.GetBasePrice("Haifa", destination, StartDate, EndDate);

        Assert.InRange(price, 50_00, 500_00);
    }

    [Fact]
    public void GetOfferPrice_ManyCalls_StaysWithinFivePercentOnWholeUnits()
    {
        for (var i = 0; i < 1_000; i++)
        {
            var price = PriceGenerator.GetOfferPrice(200_00);

            Assert.InRange(price, 190_00, 210_00);
            Assert.Equal(0, price % 1_00);
        }
    }
}
