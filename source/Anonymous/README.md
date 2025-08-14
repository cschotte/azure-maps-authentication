# Anonymous sample — Azure Maps with Managed Identities

This sample removes the shared key and uses Managed Identities to request short-lived Azure AD tokens for Azure Maps, returned via a small token proxy API.

## Quick start

1) Set the Azure Maps Client ID (uniqueId of your Maps account):

```bash
cd source/Anonymous
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"
# Optional: if using a user-assigned managed identity (UAMI)
dotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"
```

2) Run the app:

```bash
cd source/Anonymous
dotnet run
```

## How it works
- Options binding: `AzureMaps:ClientId` (+ optional `ManagedIdentityClientId`) → `Models/AzureMapsOptions`
- `ApiController` uses `DefaultAzureCredential` to get a token for scope `https://atlas.microsoft.com/.default`
- `HomeController` passes the clientId via `ViewData`
- View exposes `data-azure-maps-clientid`, and `wwwroot/js/site.js` initializes the map with `authType: 'anonymous'` and fetches `/api/GetAzureMapsToken`

## Troubleshooting
- Ensure your App Service’s managed identity has Azure Maps Data Reader RBAC
- If using UAMI, set `AzureMaps:ManagedIdentityClientId`
- If the JS fails to fetch token, open dev tools and check the network and console

## Learn more
- Managed Identities: https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview
- Azure Maps authentication: https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication
