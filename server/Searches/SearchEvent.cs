using System.Text.Json.Serialization;

namespace ShipTask.Api.Searches;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(SearchStarted), "started")]
[JsonDerivedType(typeof(SupplierQuoted), "quote")]
[JsonDerivedType(typeof(SupplierFailed), "failed")]
[JsonDerivedType(typeof(SearchEnded), "ended")]
public abstract record SearchEvent;
