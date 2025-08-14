# Authentication sample — Managed Identities + Azure AD login

This sample adds Azure AD sign-in to the managed identities approach. Users must authenticate before the map loads and before the token proxy can be used.

## Quick start

1) Configure Azure AD in `appsettings.json` (Instance, Domain, TenantId, ClientId, CallbackPath) or via environment variables.

2) Provide Azure Maps Client ID securely:

```bash
cd source/Authentication
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"
# Optional: if using a user-assigned managed identity
odotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"
```

3) Run the app and sign in:

```bash
cd source/Authentication
dotnet run
```

## How it works
- Global auth: `Program.cs` configures OpenID Connect + Microsoft Identity Web and requires authenticated users by default
- Token API: `[Authorize]`, `[ApiController]`, `[Route("api")]`, uses `DefaultAzureCredential` with optional UAMI
- View/JS: uses `data-azure-maps-clientid`, `site.js` initializes Azure Maps and fetches `/api/GetAzureMapsToken`

## Troubleshooting
- Confirm app registration values and redirect URI
- Ensure the Web App’s managed identity has Azure Maps Data Reader RBAC
- Check browser console/network if the map does not render after login

## Learn more
- Microsoft Identity Web: https://learn.microsoft.com/aspnet/core/security/authentication/identity
- Azure Maps authentication: https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication
