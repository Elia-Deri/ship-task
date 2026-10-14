namespace ShipTask.Api.Common;

public static class UnixDate
{
    private const long DayMs = 24 * 60 * 60 * 1000;

    public static bool IsUtcMidnight(long unixMs)
    {
        return unixMs >= 0 && unixMs <= DateTimeOffset.MaxValue.ToUnixTimeMilliseconds() && unixMs % DayMs == 0;
    }

    public static DateOnly ToDateOnly(long utcMidnightMs)
    {
        return DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeMilliseconds(utcMidnightMs).UtcDateTime);
    }
}
