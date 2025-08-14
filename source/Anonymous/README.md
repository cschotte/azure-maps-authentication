# Anonymous Sample - Production with Managed Identity

> ✅ **Production Ready**: This sample uses Azure Managed Identity for secure, keyless authentication. Recommended for production applications without user login requirements.

## Overview

This sample eliminates subscription keys by using Azure Managed Identity to obtain short-lived Microsoft Entra ID tokens for Azure Maps. The application acts as a token proxy, providing secure access without exposing credentials.

![Azure Maps using Managed Identity](../../images/managed_identity.png)

## Prerequisites

- Azure Maps account with Managed Identity permissions configured
- Azure App Service (for production deployment)
- .NET 9.0 SDK

## Infrastructure Setup

### 1. Create Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --resource-group rg-azuremaps \
  --name plan-azuremaps \
  --location westeurope \
  --sku B1

# Create Web App
az webapp create \
  --resource-group rg-azuremaps \
  --plan plan-azuremaps \
  --name web-azuremaps \
  --runtime "DOTNET|9.0"
```

### 2. Configure Managed Identity

```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name web-azuremaps \
  --resource-group rg-azuremaps

# Note the returned principalId for the next step
```

### 3. Grant Azure Maps Permissions

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Assign Azure Maps Data Reader role
az role assignment create \
  --assignee "<PRINCIPAL_ID_FROM_STEP_2>" \
  --role "Azure Maps Data Reader" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-azuremaps/providers/Microsoft.Maps/accounts/map-azuremaps"
```

## Application Setup

### 1. Configure Azure Maps Client ID

```bash
cd source/Anonymous

# Initialize user secrets
dotnet user-secrets init

# Set the Azure Maps client ID (from your Maps account - NOT an App Registration!)
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"

# Get your Azure Maps Client ID with this command:
az maps account show --name map-azuremaps --resource-group rg-azuremaps --query "properties.uniqueId" --output tsv

# Optional: For user-assigned managed identity
dotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"
```

**⚠️ Important**: The Azure Maps Client ID is found in your Azure Maps account, not in Microsoft Entra ID App Registrations.

### 2. Run Locally

```bash
cd source/Anonymous
dotnet run
```

Visit `https://localhost:5001` to test the application.

## How It Works

### Authentication Flow
```
Browser → App Service → Managed Identity → Microsoft Entra ID → Azure Maps Token → Map Renders
```

### Key Components

1. **Token Proxy**: `/api/GetAzureMapsToken` endpoint securely obtains tokens
2. **Managed Identity**: `DefaultAzureCredential` handles authentication automatically
3. **Frontend**: JavaScript fetches tokens from proxy and initializes map
4. **Security**: No credentials stored in application code

### Important Files
- `Controllers/ApiController.cs` - Token proxy endpoint
- `Models/AzureMapsOptions.cs` - Configuration binding
- `wwwroot/js/site.js` - Map initialization with token fetching

## Deployment

### 1. Build and Package

```bash
cd source/Anonymous
dotnet publish --configuration Release

# Create deployment package
zip -r ../anonymous-app.zip bin/Release/net9.0/publish/*
```

### 2. Deploy to Azure

```bash
az webapp deployment source config-zip \
  --resource-group rg-azuremaps \
  --name web-azuremaps \
  --src anonymous-app.zip
```

### 3. Configure Production Settings

Set the Azure Maps Client ID in Azure App Service:

```bash
az webapp config appsettings set \
  --resource-group rg-azuremaps \
  --name web-azuremaps \
  --settings AzureMaps__ClientId="<your-azure-maps-client-id>"
```

## Troubleshooting

### ⚠️ Important: Azure Maps Client ID
**Common mistake**: The `AzureMaps:ClientId` setting requires your Azure Maps account Client ID, not an App Registration Client ID.

```bash
# Get the correct Azure Maps Client ID:
az maps account show --name map-azuremaps --resource-group rg-azuremaps --query "properties.uniqueId" --output tsv
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify you're using the Azure Maps Client ID (not App Registration ID) |
| Token fetch fails | Ensure managed identity has "Azure Maps Data Reader" role |
| Map not loading | Check browser console for authentication errors |
| Local dev issues | Ensure user secrets are set and Azure CLI is authenticated |

### Debug Commands

```bash
# Verify managed identity
az webapp identity show --name web-azuremaps --resource-group rg-azuremaps

# Check role assignments
az role assignment list --assignee "<PRINCIPAL_ID>" --output table

# Test token endpoint
curl https://web-azuremaps.azurewebsites.net/api/GetAzureMapsToken
```

## Security Benefits

- ✅ No shared secrets or subscription keys
- ✅ Automatic token rotation
- ✅ Azure RBAC integration
- ✅ Audit trail through Azure Activity Log
- ✅ Principle of least privilege

## Next Steps

Need user authentication? Upgrade to:
- **[Authentication Sample](../Authentication/README.md)** - Adds Microsoft Entra ID user login

## Learn More

- [Azure Managed Identity Documentation](https://docs.microsoft.com/entra/identity/managed-identities-azure-resources/overview)
- [Azure Maps Authentication Best Practices](https://docs.microsoft.com/azure/azure-maps/authentication-best-practices)
