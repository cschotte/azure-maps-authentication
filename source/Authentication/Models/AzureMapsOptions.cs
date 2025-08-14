namespace Authentication.Models;

public class AzureMapsOptions
{
    public string? ClientId { get; set; }
    // Optional: user-assigned managed identity client ID
    public string? ManagedIdentityClientId { get; set; }
}
