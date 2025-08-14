# Authentication Sample - Enterprise with Microsoft Entra ID + Managed Identity

> 🔒 **Enterprise Ready**: This sample combines user authentication (Microsoft Entra ID) with Managed Identity for maximum security. Perfect for enterprise applications requiring user login.

## Overview

This sample builds upon the Anonymous sample by adding Microsoft Entra ID user authentication. Users must sign in before accessing the application, and the app uses Managed Identity to securely obtain Azure Maps tokens.

![Azure Maps using Microsoft Entra ID user authentication](../../images/azure_active_directory.png)

## Prerequisites

- Azure Maps account with Managed Identity permissions
- Microsoft Entra ID app registration 
- Azure App Service (for production deployment)
- .NET 9.0 SDK

## Infrastructure Setup

### 1. Set Up App Service and Managed Identity

Follow steps 1-3 from the [Anonymous sample](../Anonymous/README.md#infrastructure-setup) to create:
- Azure App Service
- System-assigned managed identity
- Azure Maps Data Reader role assignment

### 2. Register Microsoft Entra ID Application

```bash
# Register the application
az ad app create \
  --display-name "Azure Maps Demo App" \
  --web-redirect-uris https://web-azuremaps.azurewebsites.net/signin-oidc \
  --enable-access-token-issuance true \
  --enable-id-token-issuance true \
  --sign-in-audience AzureADMyOrg

# Get your tenant ID
az account show --query tenantId --output tsv
```

**⚠️ IMPORTANT: Note the following values from the app registration:**
- **App Registration Client ID** (for `AzureAd:ClientId` setting)
- **Directory (tenant) ID** (for `AzureAd:TenantId` setting)
- Your Microsoft Entra ID domain

**🔑 Critical Distinction**: The App Registration Client ID is DIFFERENT from your Azure Maps Client ID!

## Application Setup

### 1. Configure Application Settings

```bash
cd source/Authentication

# Initialize user secrets
dotnet user-secrets init

# Set Azure Maps configuration - GET THIS FROM YOUR AZURE MAPS ACCOUNT (NOT App Registration!)
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"

# Get your Azure Maps Client ID with this command:
# az maps account show --name map-azuremaps --resource-group rg-azuremaps --query "properties.uniqueId" --output tsv

# Optional: For user-assigned managed identity
dotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"

# Set Microsoft Entra ID configuration - GET THIS FROM YOUR APP REGISTRATION (NOT Azure Maps!)
dotnet user-secrets set "AzureAd:TenantId" "<your-tenant-id>"
dotnet user-secrets set "AzureAd:ClientId" "<your-app-registration-client-id>"
```

**⚠️ CRITICAL**: Don't mix up the two different Client IDs:
- `AzureMaps:ClientId` = Your Azure Maps account Client ID
- `AzureAd:ClientId` = Your App Registration Client ID

### 2. Update Configuration (appsettings.json)

The sample includes a template `appsettings.json`. For production deployment, you can set these values directly:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "[YOUR_DOMAIN].onmicrosoft.com",
    "TenantId": "[YOUR_TENANT_ID]",
    "ClientId": "[YOUR_APP_REGISTRATION_CLIENT_ID]",
    "CallbackPath": "/signin-oidc"
  },
  "AzureMaps": {
    "ClientId": "[YOUR_AZURE_MAPS_CLIENT_ID]",
    "ManagedIdentityClientId": ""
  }
}
```

**⚠️ Remember**: These are TWO different Client IDs from different Azure services!

### 3. Run Locally

```bash
cd source/Authentication
dotnet run
```

Visit `https://localhost:5001` - you'll be redirected to Microsoft Entra ID for authentication.

## How It Works

### Authentication Flow
```
User → Microsoft Entra ID Login → App Service (Authenticated) → Managed Identity → Azure Maps Token → Map Renders
```

![Azure Maps using Microsoft Entra ID user authentication](../../images/login_permissions.png)

### Key Components

1. **Global Authentication**: All pages require Microsoft Entra ID authentication
2. **Token Proxy**: Protected `/api/GetAzureMapsToken` endpoint
3. **Managed Identity**: Secure token acquisition for Azure Maps
4. **User Context**: Access to authenticated user information

### Important Files
- `Program.cs` - Authentication middleware configuration
- `Controllers/ApiController.cs` - Protected token proxy endpoint
- `Views/Shared/_Layout.cshtml` - Login/logout UI
- `wwwroot/js/site.js` - Map initialization with authentication

### Security Features
- ✅ User authentication required for all pages
- ✅ Protected API endpoints with `[Authorize]` attribute
- ✅ Secure token acquisition via Managed Identity
- ✅ Automatic Microsoft Entra ID integration
- ✅ Role-based access control ready

## Deployment

### 1. Build and Package

```bash
cd source/Authentication
dotnet publish --configuration Release

# Create deployment package
zip -r ../auth-app.zip bin/Release/net9.0/publish/*
```

### 2. Deploy to Azure

```bash
az webapp deployment source config-zip \
  --resource-group rg-azuremaps \
  --name web-azuremaps \
  --src auth-app.zip
```

### 3. Configure Production Settings

```bash
# Set Microsoft Entra ID configuration
az webapp config appsettings set \
  --resource-group rg-azuremaps \
  --name web-azuremaps \
  --settings \
    AzureAd__Domain="<your-domain>.onmicrosoft.com" \
    AzureAd__TenantId="<your-tenant-id>" \
    AzureAd__ClientId="<your-app-client-id>" \
    AzureMaps__ClientId="<your-azure-maps-client-id>"
```

### 4. Update App Registration

Update your Microsoft Entra ID app registration with the production redirect URI:

```bash
az ad app update \
  --id "<your-app-client-id>" \
  --web-redirect-uris https://web-azuremaps.azurewebsites.net/signin-oidc
```

## User Management

### Adding Users
Users must be added to your Microsoft Entra ID tenant to access the application. You can:

1. **Invite Guest Users**:
   ```bash
   az ad user invite --invited-user-email-address user@example.com --invite-redirect-url https://web-azuremaps.azurewebsites.net
   ```

2. **Create Internal Users** through the Azure Portal or PowerShell

3. **Configure Group-Based Access** for easier user management

## Troubleshooting

### ⚠️ Critical: Two Different Client IDs
**This is the #1 source of 401 authentication errors**

| Client ID Type | Purpose | Where to Find | Configuration Setting |
|----------------|---------|---------------|----------------------|
| **Azure Maps Client ID** | Identifies your Maps account | Azure Portal → Your Maps Account → Authentication<br/>CLI: `az maps account show --query "properties.uniqueId"` | `AzureMaps:ClientId` |
| **App Registration Client ID** | Identifies your Microsoft Entra ID app | Azure Portal → Microsoft Entra ID → App Registrations | `AzureAd:ClientId` |

**⚠️ Common Mistake**: Using the App Registration Client ID in the `AzureMaps:ClientId` setting will cause 401 authentication errors.

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | ⚠️ **Check Client IDs**: Ensure you're using the correct Client ID for each setting |
| Login redirect fails | Verify app registration redirect URIs |
| Token fetch fails | Ensure managed identity has correct permissions |
| Users can't access | Check user exists in Microsoft Entra ID tenant |
| Local dev login issues | Verify user secrets are configured correctly |

### Debug Commands

```bash
# Verify app registration
az ad app show --id "<your-app-client-id>"

# Check managed identity and role assignments
az webapp identity show --name web-azuremaps --resource-group rg-azuremaps
az role assignment list --assignee "<principal-id>" --output table

# Test endpoints
curl https://web-azuremaps.azurewebsites.net/api/GetAzureMapsToken
```

## Advanced Configuration

### Custom Claims and Roles
Extend the authentication to include custom claims or Microsoft Entra ID groups for fine-grained access control.

### Multi-Tenant Support
Modify the configuration to support users from multiple Microsoft Entra ID tenants.

### Conditional Access
Configure Microsoft Entra Conditional Access policies for enhanced security.

## Security Hardening

### Production Recommendations

```bash
# Disable subscription key authentication
az maps account update \
  --name map-azuremaps \
  --resource-group rg-azuremaps \
  --disable-local-auth true

# Enable HTTPS only
az webapp config set \
  --resource-group rg-azuremaps \
  --name web-azuremaps \
  --https-only true
```

## Next Steps

Your application now has enterprise-grade security! Consider:

- Implementing role-based access control for different user types
- Adding Azure Application Insights for monitoring and analytics
- Setting up Azure Front Door for global distribution
- Implementing custom map features based on user roles

## Learn More

- [Microsoft Identity Web Documentation](https://docs.microsoft.com/aspnet/core/security/authentication/identity)
- [Microsoft Entra ID B2B Collaboration](https://docs.microsoft.com/entra/external-id/b2b-overview)
- [Microsoft Entra Conditional Access Policies](https://docs.microsoft.com/entra/identity/conditional-access/)
