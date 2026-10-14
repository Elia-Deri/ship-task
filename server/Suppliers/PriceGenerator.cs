using System.Text;
using System.Buffers.Binary;
using System.Security.Cryptography;

namespace ShipTask.Api.Suppliers;

public static class PriceGenerator
{
    private const long MinBasePrice = 50_00;
    private const long MaxBasePrice = 500_00;
    private const long PriceStep = 1_00;

    public static long GetBasePrice(string source, string destination, long startDate, long endDate)
    {
        var routeKey = string.Join('|', source.Trim().ToLowerInvariant(), destination.Trim().ToLowerInvariant(), startDate, endDate);
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(routeKey));
        var range = (ulong)(MaxBasePrice - MinBasePrice + 1);

        return MinBasePrice + (long)(BinaryPrimitives.ReadUInt64LittleEndian(hash) % range);
    }

    public static long GetOfferPrice(long basePrice)
    {
        var maxChange = basePrice * 5 / 100;
        var newPrice = basePrice + Random.Shared.NextInt64(-maxChange, maxChange + 1);

        return (newPrice + PriceStep / 2) / PriceStep * PriceStep;
    }
}
