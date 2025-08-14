# Authentication Sample - Enterprise with Azure AD + Managed Identity

> 🔒 **Enterprise Ready**: This sample combines user authentication (Azure AD) with Managed Identity for maximum security. Perfect for enterprise applications requiring user login.

## Overview

This sample builds upon the Anonymous sample by adding Azure AD user authentication. Users must sign in before accessing the application, and the app uses Managed Identity to securely obtain Azure Maps tokens.

![Azure Maps using Azure AD user authentication](../../images/azure_active_directory.png)

## Prerequisites

- Azure Maps account with Managed Identity permissions
- Azure AD app registration 
- Azure App Service (for production deployment)
- .NET 9.0 SDK

## Infrastructure Setup

### 1. Set Up App Service and Managed Identity

Follow steps 1-3 from the [Anonymous sample](../Anonymous/README.md#infrastructure-setup) to create:
- Azure App Service
- System-assigned managed identity
- Azure Maps Data Reader role assignment

### 2. Register Azure AD Application

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

**Note the following values from the app registration:**
- Application (client) ID
- Directory (tenant) ID
- Your Azure AD domain

## Application Setup

### 1. Configure Application Settings

```bash
cd source/Authentication

# Initialize user secrets
dotnet user-secrets init

# Set Azure Maps configuration
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"

# Optional: For user-assigned managed identity
dotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"

# Set Azure AD configuration
dotnet user-secrets set "AzureAd:Domain" "<your-domain>.onmicrosoft.com"
dotnet user-secrets set "AzureAd:TenantId" "<your-tenant-id>"
dotnet user-secrets set "AzureAd:ClientId" "<your-app-client-id>"
```

### 2. Update Configuration (appsettings.json)

The sample includes a template `appsettings.json`. For production deployment, you can set these values directly:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "[YOUR_DOMAIN].onmicrosoft.com",
    "TenantId": "[YOUR_TENANT_ID]",
    "ClientId": "[YOUR_APP_CLIENT_ID]",
    "CallbackPath": "/signin-oidc"
  },
  "AzureMaps": {
    "ClientId": "[YOUR_AZURE_MAPS_CLIENT_ID]",
    "ManagedIdentityClientId": ""
  }
}
```

### 3. Run Locally

```bash
cd source/Authentication
dotnet run
```

Visit `https://localhost:5001` - you'll be redirected to Azure AD for authentication.

## How It Works

### Authentication Flow
```
User → Azure AD Login → App Service (Authenticated) → Managed Identity → Azure Maps Token → Map Renders
```

![Azure Maps using Azure AD user authentication](../../images/login_permissions.png)

### Key Components

1. **Global Authentication**: All pages require Azure AD authentication
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
- ✅ Automatic Azure AD integration
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
# Set Azure AD configuration
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

Update your Azure AD app registration with the production redirect URI:

```bash
az ad app update \
  --id "<your-app-client-id>" \
  --web-redirect-uris https://web-azuremaps.azurewebsites.net/signin-oidc
```

## User Management

### Adding Users
Users must be added to your Azure AD tenant to access the application. You can:

1. **Invite Guest Users**:
   ```bash
   az ad user invite --invited-user-email-address user@example.com --invite-redirect-url https://web-azuremaps.azurewebsites.net
   ```

2. **Create Internal Users** through the Azure Portal or PowerShell

3. **Configure Group-Based Access** for easier user management

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Login redirect fails | Verify app registration redirect URIs |
| Token fetch fails | Ensure managed identity has correct permissions |
| Users can't access | Check user exists in Azure AD tenant |
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
Extend the authentication to include custom claims or Azure AD groups for fine-grained access control.

### Multi-Tenant Support
Modify the configuration to support users from multiple Azure AD tenants.

### Conditional Access
Configure Azure AD Conditional Access policies for enhanced security.

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
- [Azure AD B2B Collaboration](https://docs.microsoft.com/azure/active-directory/b2b/)
- [Conditional Access Policies](https://docs.microsoft.com/azure/active-directory/conditional-access/)
