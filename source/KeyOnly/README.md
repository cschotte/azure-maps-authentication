# KeyOnly sample — Azure Maps with subscription key

This sample shows the simplest way to load Azure Maps using a subscription key. Great for learning and local demos. For production, prefer managed identities (see Anonymous).

## Quick start

1) Provide your Azure Maps key (keep it out of source):

- User-secrets (recommended):

```bash
cd source/KeyOnly
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:SubscriptionKey" "<your-azure-maps-key>"
```

- Or environment variable (zsh/macOS):

```bash
export AzureMaps__SubscriptionKey="<your-azure-maps-key>"
```

2) Run the app:

```bash
cd source/KeyOnly
dotnet run
```

Open the home page. If the key isn’t set, you’ll see a warning.

## How it works
- Options binding: `AzureMaps:SubscriptionKey` → `Models/AzureMapsOptions`
- Controller passes the key to the view via `ViewData["AzureMapsKey"]`
- View exposes `data-azure-maps-key`
- `wwwroot/js/site.js` initializes Azure Maps Web SDK v3 with `authType: 'subscriptionKey'`

## Troubleshooting
- Ensure the v3 SDK script is loaded (see Scripts section of the view)
- If the map doesn’t appear, check the browser console for warnings/errors

## Learn more
- Azure Maps keys and authentication: https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication
