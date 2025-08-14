namespace Anonymous.Models;

public class AzureMapsOptions
{
    // Azure Maps client ID used by the web SDK when using anonymous auth.
    public string? ClientId { get; set; }

    // Optional: user-assigned managed identity client ID to target when resolving tokens server-side.
    public string? ManagedIdentityClientId { get; set; }
}
