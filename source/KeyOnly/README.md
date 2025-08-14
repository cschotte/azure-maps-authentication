# KeyOnly Sample - Development with Subscription Key

> ⚠️ **Development Only**: This sample uses subscription keys for simplicity. For production applications, use the [Anonymous](../Anonymous/README.md) or [Authentication](../Authentication/README.md) samples instead.

## Overview

This sample demonstrates the simplest way to integrate Azure Maps using a subscription key. Perfect for learning Azure Maps basics and local development.

![Azure Maps using a subscription key](images/azure_maps_key.png)

## Prerequisites

- Azure Maps account (see [main README](../../README.md#step-1-set-up-azure-infrastructure))
- .NET 9.0 SDK

## Quick Setup

### 1. Get Your Azure Maps Key

```bash
# List your Azure Maps account keys
az maps account keys list --name map-azuremaps --resource-group rg-azuremaps
```

### 2. Configure the Application

**Option A: User Secrets (Recommended)**
```bash
cd source/KeyOnly
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:SubscriptionKey" "<your-primary-key>"
```

**Option B: Environment Variable**
```bash
export AzureMaps__SubscriptionKey="<your-primary-key>"
```

### 3. Run the Application

```bash
cd source/KeyOnly
dotnet run
```

Visit `https://localhost:5001` to see your map!

## How It Works

### Authentication Flow
```
Browser Request → ASP.NET Core App → Azure Maps (with subscription key) → Map Renders
```

### Key Components

1. **Configuration**: `AzureMapsOptions` class binds subscription key from configuration
2. **Controller**: Passes the key to the view through ViewData
3. **Frontend**: JavaScript initializes Azure Maps with subscription key authentication
4. **Security**: Key is stored securely using user secrets (not in source code)

### Important Files
- `Models/AzureMapsOptions.cs` - Configuration binding
- `Controllers/HomeController.cs` - Passes key to view
- `Views/Home/Index.cshtml` - Map container
- `wwwroot/js/site.js` - Map initialization

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check browser console for errors |
| Warning message appears | Verify subscription key is set correctly |
| Authentication errors | Ensure key hasn't expired or been regenerated |

## Security Notes

- ⚠️ Never commit subscription keys to source control
- ⚠️ Keys provide full access to your Azure Maps account
- ✅ Use user secrets for local development
- ✅ Consider rotating keys regularly

## Next Steps

Ready for production? Upgrade to:
- **[Anonymous Sample](../Anonymous/README.md)** - Uses Managed Identity (more secure)
- **[Authentication Sample](../Authentication/README.md)** - Adds user login requirements

## Learn More

- [Azure Maps Authentication Guide](https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication)
- [ASP.NET Core User Secrets](https://docs.microsoft.com/aspnet/core/security/app-secrets)
