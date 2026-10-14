using System.Text;
using System.Buffers.Binary;
using System.Security.Cryptography;

public static class PriceGenerator
{
    private const long _minBasePrice = 50_00;
    private const long _maxBasePrice = 500_00;
    private const long _priceStep = 1_00;

    public static long GetBasePrice(string source, string destination, long startDate, long endDate)
    {
        var routeKey = string.Join('|', source.Trim().ToLowerInvariant(), destination.Trim().ToLowerInvariant(), startDate, endDate);
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(routeKey));
        var range = (ulong)(_maxBasePrice - _minBasePrice + 1);

        return _minBasePrice + (long)(BinaryPrimitives.ReadUInt64LittleEndian(hash) % range);
    }

    public static long GetOfferPrice(long basePrice)
    {
        var maxChange = basePrice * 5 / 100;
        var newPrice = basePrice + Random.Shared.NextInt64(-maxChange, maxChange + 1);

        return (newPrice + _priceStep / 2) / _priceStep * _priceStep;
    }

}