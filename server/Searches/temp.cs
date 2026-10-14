namespace ShipTask.Api.Searches;

public class SearchIdGenerator
{
    private int _lastId;

    public int Next()
    {
        return Interlocked.Increment(ref _lastId);
    }
}
