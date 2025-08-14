# Azure Maps Authentication Guide

Learn how to securely integrate Azure Maps into your ASP.NET Core applications with proper authentication and authorization. This guide provides three progressive examples that demonstrate different authentication approaches, from basic subscription keys to enterprise-grade Azure AD integration.

## 🎯 What You'll Learn

- How to set up Azure Maps with different authentication methods
- Best practices for securing map applications in production
- Progressive security implementation from development to enterprise deployment
- Azure CLI commands to provision required infrastructure

## 📋 Prerequisites

- [.NET 9.0 SDK](https://dotnet.microsoft.com/download)
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- An Azure subscription
- Basic knowledge of ASP.NET Core MVC

## 🏗️ Architecture Overview

This repository contains three progressive samples that build upon each other:

| Sample | Authentication Method | Use Case | Security Level |
|--------|----------------------|----------|----------------|
| **KeyOnly** | Subscription Key | Development & Learning | ⚠️ Basic |
| **Anonymous** | Managed Identity | Production Apps | ✅ Secure |
| **Authentication** | Azure AD + Managed Identity | Enterprise Apps | 🔒 Highly Secure |

## 🚀 Quick Start

### Step 1: Set Up Azure Infrastructure

First, create the required Azure resources using Azure CLI:

```bash
# Sign in to Azure
az login

# Create a resource group
az group create --location westeurope --name rg-azuremaps

# Create Azure Maps account
az maps account create --name map-azuremaps --resource-group rg-azuremaps --sku S2

# Get your Maps account details
az maps account show --name map-azuremaps --resource-group rg-azuremaps
```

### Step 2: Choose Your Authentication Path

#### 🟡 Option A: Start with Subscription Key (Development)
Perfect for learning and local development. **Not recommended for production.**

```bash
# Get your subscription key
az maps account keys list --name map-azuremaps --resource-group rg-azuremaps

# Run the KeyOnly sample
cd source/KeyOnly
dotnet user-secrets set "AzureMaps:SubscriptionKey" "<your-key>"
dotnet run
```

📖 **[See detailed KeyOnly setup →](source/KeyOnly/README.md)**

#### 🟢 Option B: Use Managed Identity (Recommended for Production)
Eliminates shared secrets and provides automatic token rotation.

```bash
# Create App Service for deployment
az appservice plan create --resource-group rg-azuremaps --name plan-azuremaps --location westeurope --sku B1
az webapp create --resource-group rg-azuremaps --plan plan-azuremaps --name web-azuremaps --runtime "DOTNET|9.0"

# Enable managed identity and assign permissions
az webapp identity assign --name web-azuremaps --resource-group rg-azuremaps
az role assignment create --assignee "[PRINCIPAL_ID]" --role "Azure Maps Data Reader" --scope "/subscriptions/[SUBSCRIPTION_ID]/resourceGroups/rg-azuremaps/providers/Microsoft.Maps/accounts/map-azuremaps"

# Run the Anonymous sample
cd source/Anonymous
dotnet user-secrets set "AzureMaps:ClientId" "<your-maps-client-id>"
dotnet run
```

📖 **[See detailed Anonymous setup →](source/Anonymous/README.md)**

#### 🔵 Option C: Add User Authentication (Enterprise)
Requires users to sign in with Azure AD before accessing the application.

```bash
# Register application in Azure AD
az ad app create --display-name "Azure Maps Demo App" \
  --web-redirect-uris https://web-azuremaps.azurewebsites.net/signin-oidc \
  --enable-access-token-issuance true \
  --enable-id-token-issuance true

# Run the Authentication sample
cd source/Authentication
dotnet user-secrets set "AzureMaps:ClientId" "<your-maps-client-id>"
dotnet run
```

📖 **[See detailed Authentication setup →](source/Authentication/README.md)**

## 🔐 Security Best Practices

### Development vs Production
- **Development**: Use subscription keys with user secrets
- **Production**: Always use Managed Identity + Azure RBAC
- **Enterprise**: Add user authentication with Azure AD

### Key Security Considerations
```bash
# Disable subscription key authentication in production
az maps account update --name map-azuremaps --resource-group rg-azuremaps --disable-local-auth true
```

### Authentication Flow Overview
```
User Request → Azure AD Authentication → App Service (Managed Identity) → Azure Maps Token → Map Rendering
```

## 🛠️ Common Setup Commands

Get your Azure subscription and tenant information:
```bash
# Get subscription ID
az account show --query id --output tsv

# Get tenant ID  
az account show --query tenantId --output tsv

# List your Azure Maps accounts
az maps account list --output table
```

## 📚 Learning Path

1. **Start Here**: Run the `KeyOnly` sample to understand basic Azure Maps integration
2. **Security Upgrade**: Move to `Anonymous` sample to implement Managed Identity
3. **Enterprise Ready**: Implement the `Authentication` sample for user login requirements
4. **Deploy**: Use the provided Azure CLI commands to deploy to Azure App Service

## 🔧 Troubleshooting

### Common Issues
- **Map not loading**: Check browser console for authentication errors
- **Token errors**: Verify managed identity has correct RBAC permissions
- **Local development**: Ensure user secrets are properly configured

### Debug Commands
```bash
# Check managed identity status
az webapp identity show --name web-azuremaps --resource-group rg-azuremaps

# Verify role assignments
az role assignment list --assignee "[PRINCIPAL_ID]" --output table

# Test your deployed app
curl https://web-azuremaps.azurewebsites.net/api/GetAzureMapsToken
```

## 📖 Additional Resources

- [Azure Maps Authentication Documentation](https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication)
- [Azure Maps Samples](https://samples.azuremaps.com/)
- [Managed Identity Best Practices](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure RBAC Documentation](https://docs.microsoft.com/azure/role-based-access-control/overview)

---

## 🎯 Next Steps

After completing this guide, you'll have a solid foundation for implementing secure Azure Maps authentication in your applications. Consider exploring:

- Advanced Azure Maps features like custom styling and data visualization
- Integration with other Azure services like Azure SQL Database or Cosmos DB
- Implementing custom map controls and user interactions
- Setting up CI/CD pipelines for automated deployment

Happy mapping! 🗺️
