# Azure Maps Authentication Examples

This repository demonstrates three progressive Azure Maps authentication patterns for ASP.NET Core applications, from simple development setup to enterprise-grade security.

## Architecture Overview

The codebase contains **three independent ASP.NET Core projects** that demonstrate different authentication approaches:

- **`source/KeyOnly/`** - Basic subscription key authentication (development only)
- **`source/Anonymous/`** - Managed Identity authentication (production-ready)
- **`source/Authentication/`** - Azure AD + Managed Identity (enterprise)

Each project is a complete, runnable example that builds upon the previous pattern's security model.

## Key Patterns & Conventions

### Configuration Structure
All projects follow a consistent `AzureMapsOptions` pattern:
```csharp
// Models/AzureMapsOptions.cs - Common across all projects
public class AzureMapsOptions
{
    public string? ClientId { get; set; }             // Azure Maps client ID
    public string? ManagedIdentityClientId { get; set; } // Optional user-assigned MI
    public string? SubscriptionKey { get; set; }     // KeyOnly project only
}
```

Configuration binding happens in `Program.cs`:
```csharp
builder.Services.Configure<ProjectName.Models.AzureMapsOptions>(builder.Configuration.GetSection("AzureMaps"));
```

### Token Provider Pattern (Anonymous/Authentication)
Both production samples use `DefaultAzureCredential` with scope `"https://atlas.microsoft.com/.default"`:
```csharp
// Controllers/ApiController.cs
private readonly DefaultAzureCredential _TokenProvider;
private readonly string[] _Scopes = { "https://atlas.microsoft.com/.default" };

// Token acquisition endpoint at /api/GetAzureMapsToken
AccessToken accessToken = await _TokenProvider.GetTokenAsync(new TokenRequestContext(_Scopes));
```

### Authentication Progression
- **KeyOnly**: Direct subscription key in ViewData for client-side JavaScript
- **Anonymous**: Server-side token proxy endpoint (`/api/GetAzureMapsToken`)
- **Authentication**: Same token proxy + Azure AD user authentication with `[Authorize]` filters

## Development Workflows

### Project Setup
```bash
# Navigate to any project directory
cd source/{KeyOnly|Anonymous|Authentication}

# Configure secrets (example for Anonymous)
dotnet user-secrets set "AzureMaps:ClientId" "<your-maps-client-id>"

# Run locally
dotnet run
```

### Build All Projects
```bash
# From repository root
dotnet build Examples.sln
```

### Azure Infrastructure Commands
The README.md contains complete Azure CLI setup scripts. Key pattern:
```bash
# Create Azure Maps account
az maps account create --name map-azuremaps --resource-group rg-azuremaps --sku S2

# For production samples: Enable managed identity + RBAC
az webapp identity assign --name web-azuremaps --resource-group rg-azuremaps
az role assignment create --assignee "[PRINCIPAL_ID]" --role "Azure Maps Data Reader" --scope "[MAPS_RESOURCE_ID]"
```

## Critical Dependencies

### Package References
- **KeyOnly**: No additional packages (uses built-in HttpClient)
- **Anonymous**: `Azure.Identity` for `DefaultAzureCredential`
- **Authentication**: `Azure.Identity` + `Microsoft.Identity.Web` + `Microsoft.Identity.Web.UI`

### Client-Side Integration
All projects serve Azure Maps Web SDK from client-side JavaScript. The authentication token source varies:
- **KeyOnly**: Subscription key embedded in page
- **Anonymous/Authentication**: Token fetched from `/api/GetAzureMapsToken` endpoint

## Configuration Requirements

### Local Development Secrets
```bash
# KeyOnly
dotnet user-secrets set "AzureMaps:SubscriptionKey" "<key>"

# Anonymous/Authentication  
dotnet user-secrets set "AzureMaps:ClientId" "<maps-client-id>"

# Authentication additionally requires
dotnet user-secrets set "AzureAd:TenantId" "<tenant-id>"
dotnet user-secrets set "AzureAd:ClientId" "<app-registration-id>"
```

### Production appsettings.json Structure
```json
{
  "AzureMaps": {
    "ClientId": "[MAPS_CLIENT_ID]",
    "ManagedIdentityClientId": "[OPTIONAL_USER_ASSIGNED_MI_ID]"
  },
  "AzureAd": {  // Authentication project only
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "[AAD_TENANT_ID]",
    "ClientId": "[APP_REGISTRATION_ID]",
    "CallbackPath": "/signin-oidc"
  }
}
```

## Security Considerations

- **Never** commit subscription keys - use user secrets or environment variables
- **Production deployments** should disable subscription key authentication: `az maps account update --disable-local-auth true`
- **Managed Identity** is preferred over service principals for Azure resource authentication
- **Token caching** is handled automatically by `DefaultAzureCredential` - consider distributed caching for scale

## Common Issues & Debugging

- **Map loading failures**: Check browser console for authentication errors
- **Token acquisition errors**: Verify managed identity has "Azure Maps Data Reader" role
- **Local development**: Ensure Azure CLI is logged in (`az login`) for `DefaultAzureCredential` fallback
- **Cross-project confusion**: Each sample is independent - don't mix configuration patterns
