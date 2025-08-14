# Azure Maps Web Application Authentication

One of the requirements when building a business application, which may give access to private business data, is that only authenticated employees or agents be able to see that data. So how can you use [Azure Maps](https://azuremaps.com/) in combination with authentication and authorization to ensure only the people that should be allowed have access?

Our [Azure Maps docs](https://docs.azuremaps.com/) describe in detail [many different authentication scenarios](https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication) but the complexity can make it seem difficult to implement. This blog post will focus on our most requested authentication scenario for Azure Maps. Use the following step by step guidance to have a .NET web application embedded Azure Maps web control where only authenticated users can see the website and use the map.

## Prerequisites

In this article, we use the following resources:

* .NET 9.0 and the C# programming language. You can download, and install the latest version of .NET from https://dot.net/
* To make it easier to edit source code, we also recommend installing Visual Studio Code Edition, which is a lightweight but powerful source code editor from Microsoft https://code.visualstudio.com/
* Before you can use Azure Maps, you will need to sign up for a free Azure subscription, at https://azure.microsoft.com/free
* And finally, install the Azure Command-Line Interface (CLI) tools. Read here [How to install the Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli).

## Step 1. Basic Web Application with Azure Maps

Start with a basic .NET web application that uses an Azure Maps subscription key. This “key-only” approach is fine for local demos but should not be used in production. In Step 2 we’ll replace the key with managed identities.

This repository already includes a ready-to-run sample at `source/KeyOnly` that follows secure config practices (no keys in source). If you’re starting from scratch, mirror the same wiring shown here.

### What we’ll do
- Add a strongly-typed options class for the key
- Bind options in `Program.cs`
- Inject options in `HomeController` and pass the key to the view
- Use Azure Maps Web SDK v3 and initialize the map in `wwwroot/js/site.js`
- Keep the key in user-secrets or env vars (not committed)

### Code changes (already present in KeyOnly)

1) Options class

```csharp
// File: source/KeyOnly/Models/AzureMapsOptions.cs
namespace KeyOnly.Models;

public class AzureMapsOptions
{
    public string? SubscriptionKey { get; set; }
}
```

2) Bind options in startup

```csharp
// File: source/KeyOnly/Program.cs
var builder = WebApplication.CreateBuilder(args);

// Bind options from configuration
builder.Services.Configure<KeyOnly.Models.AzureMapsOptions>(builder.Configuration.GetSection("AzureMaps"));

// Add services to the container.
builder.Services.AddControllersWithViews();
// ...existing code...
```

3) Inject options and pass key to the view

```csharp
// File: source/KeyOnly/Controllers/HomeController.cs
using Microsoft.Extensions.Options;
using KeyOnly.Models;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IOptions<AzureMapsOptions> _mapsOptions;

    public HomeController(ILogger<HomeController> logger, IOptions<AzureMapsOptions> mapsOptions)
    {
        _logger = logger;
        _mapsOptions = mapsOptions;
    }

    public IActionResult Index()
    {
        ViewData["AzureMapsKey"] = _mapsOptions.Value.SubscriptionKey ?? string.Empty;
        return View();
    }
}
```

4) View: include SDK v3 and pass key via data-attribute

```aspnetcorerazor
// File: source/KeyOnly/Views/Home/Index.cshtml
@{
    ViewData["Title"] = "Home Page";
    var azureMapsKey = (ViewData["AzureMapsKey"]?.ToString() ?? "");
}

<div class="text-center">
    <h1 class="display-4">Azure Maps</h1>
    <p>Learn about <a href="https://docs.microsoft.com/azure/azure-maps/">building Azure Maps apps with ASP.NET Core</a>.</p>
    </div>

@if (string.IsNullOrWhiteSpace(azureMapsKey))
{
    <div class="alert alert-warning" role="alert">
        Azure Maps key is not configured. Set <code>AzureMaps:SubscriptionKey</code> via user-secrets or environment variables.
    </div>
}

<div id="myMap" data-azure-maps-key="@azureMapsKey" style="width:100%;min-width:290px;height:600px;"></div>

@section Scripts
{
    <link rel="stylesheet" href="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css" />
    <script src="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js"></script>

    @* Map initialization is handled in wwwroot/js/site.js *@
}
```

5) Map initialization in `site.js`

```javascript
// File: source/KeyOnly/wwwroot/js/site.js
document.addEventListener('DOMContentLoaded', function () {
    const el = document.getElementById('myMap');
    if (!el) return;

    const key = el.getAttribute('data-azure-maps-key');
    if (!key) {
        console.warn('Azure Maps key missing. Map will not initialize.');
        return;
    }

    if (typeof atlas === 'undefined' || !atlas || !atlas.Map) {
        console.error('Azure Maps Web SDK not loaded.');
        return;
    }

    const map = new atlas.Map('myMap', {
        center: [-122.33, 47.6],
        zoom: 12,
        style: 'satellite_road_labels',
        view: 'Auto',
        authOptions: {
            authType: 'subscriptionKey',
            subscriptionKey: key
        }
    });

    map.events.add('ready', function () {
        // Add your post map load code here.
    });
});
```

6) Configuration (leave empty in source)

```json
// File: source/KeyOnly/appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "AzureMaps": {
    "SubscriptionKey": ""
  }
}
```

### Provide the key securely

Use user-secrets locally so the key isn’t committed. From the `source/KeyOnly` folder:

```bash
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:SubscriptionKey" "<your-azure-maps-key>"
```

Alternatively (zsh/macOS), set an environment variable:

```bash
export AzureMaps__SubscriptionKey="<your-azure-maps-key>"
```

### Create an Azure Maps account and get the key

If you don’t have an Azure Maps account yet, create one and retrieve the primary key:

1.1 Sign in to Azure and note your subscription Id.

```bash
az login
```

1.2 (Optional) Select the subscription where you’ll create the Azure Maps account.

```bash
az account set --subscription "<your subscription>"
```

1.3 Create a resource group (adjust name/region as needed).

```bash
az group create --location westeurope --name rg-azuremaps
```

1.4 Create the Azure Maps account (save the uniqueId for later if needed).

```bash
az maps account create --name map-azuremaps --resource-group rg-azuremaps --sku S2
```

1.5 List the keys and copy the primary key.

```bash
az maps account keys list --name map-azuremaps --resource-group rg-azuremaps
```

1.6 Set the key using user-secrets or the environment variable as shown above.

1.7 Run the app (from `source/KeyOnly`).

```bash
dotnet run
```

![Azure Maps Key](images/azure_maps_key.png)

## Step 2. Managed identities for Azure Maps

In this step, we remove the shared key authentication and switch to managed identities for Azure Maps using the Anonymous sample (`source/Anonymous`).

> Managed identities for Azure resources provide Azure services with an automatically managed application-based security principal that can authenticate with Azure AD. With Azure role-based access control (Azure RBAC), the managed identity security principal can be authorized to access Azure Maps services.

The web app will request a short‑lived Azure AD token for Azure Maps using its managed identity and return it to the browser through a minimal token proxy endpoint.

### 2.1 Create the Azure resources

Create an App Service Plan and Web App (adjust names/regions):

```bash
az appservice plan create --resource-group rg-azuremaps --name plan-azuremaps --location westeurope --sku B1
az webapp create --resource-group rg-azuremaps --plan plan-azuremaps --name web-azuremaps --runtime "DOTNET|9.0"
```

Enable a system‑assigned identity on the Web App and note the returned `principalId`:

```bash
az webapp identity assign --name web-azuremaps --resource-group rg-azuremaps
```

Grant the identity the Azure Maps Data Reader role on your Maps account (replace placeholders):

```bash
az role assignment create --assignee "[PRINCIPAL_ID]" --role "Azure Maps Data Reader" --scope "/subscriptions/[YOUR_AZURE_SUBSCRIPTION_ID]/resourceGroups/rg-azuremaps/providers/Microsoft.Maps/accounts/map-azuremaps"
```

Hint: get your subscription Id

```bash
az account show --query id --output tsv
```

### 2.2 Wire up the Anonymous sample

The Anonymous project is already set up with options binding, a token proxy controller, and client‑side map initialization. Review the key pieces below.

1) Options class and configuration binding

```csharp
// File: source/Anonymous/Models/AzureMapsOptions.cs
namespace Anonymous.Models;

public class AzureMapsOptions
{
    public string? ClientId { get; set; }
    // Optional: set if using a user‑assigned managed identity
    public string? ManagedIdentityClientId { get; set; }
}
```

```csharp
// File: source/Anonymous/Program.cs
var builder = WebApplication.CreateBuilder(args);

// Bind options from configuration
builder.Services.Configure<Anonymous.Models.AzureMapsOptions>(builder.Configuration.GetSection("AzureMaps"));

builder.Services.AddControllersWithViews();
// ...existing code...
```

2) Token proxy API using DefaultAzureCredential

```csharp
// File: source/Anonymous/Controllers/ApiController.cs
using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Anonymous.Models;

namespace Anonymous.Controllers;

[ApiController]
[Route("api")]
public class ApiController : Controller
{
    private readonly DefaultAzureCredential _TokenProvider;
    private readonly string[] _Scopes = { "https://atlas.microsoft.com/.default" };

    public ApiController(IOptions<AzureMapsOptions> options)
    {
        var opts = new DefaultAzureCredentialOptions();
        var uamiClientId = options.Value.ManagedIdentityClientId;
        if (!string.IsNullOrWhiteSpace(uamiClientId))
        {
            // Prefer a user‑assigned managed identity when provided
            opts.ManagedIdentityClientId = uamiClientId;
        }
        _TokenProvider = new DefaultAzureCredential(opts);
    }

    [HttpGet("GetAzureMapsToken")]
    public async Task<IActionResult> GetAzureMapsToken()
    {
        try
        {
            AccessToken at = await _TokenProvider.GetTokenAsync(new TokenRequestContext(_Scopes));
            return Ok(at.Token);
        }
        catch (Exception ex)
        {
            return Problem(title: "Failed to acquire Azure Maps token", statusCode: 500, detail: ex.Message);
        }
    }
}
```

3) Controller passes Client ID to the view

```csharp
// File: source/Anonymous/Controllers/HomeController.cs
using Microsoft.Extensions.Options;
using Anonymous.Models;

public class HomeController : Controller
{
    private readonly IOptions<AzureMapsOptions> _mapsOptions;
    public HomeController(ILogger<HomeController> logger, IOptions<AzureMapsOptions> mapsOptions)
    {
        // ...existing code...
        _mapsOptions = mapsOptions;
    }
    public IActionResult Index()
    {
        ViewData["AzureMapsClientId"] = _mapsOptions.Value.ClientId ?? string.Empty;
        return View();
    }
}
```

4) View uses a data‑attribute and defers init to site.js

```aspnetcorerazor
// File: source/Anonymous/Views/Home/Index.cshtml
@{
    var clientId = (ViewData["AzureMapsClientId"]?.ToString() ?? "");
}

@if (string.IsNullOrWhiteSpace(clientId))
{
    <div class="alert alert-warning" role="alert">
        Azure Maps Client ID is not configured. Set <code>AzureMaps:ClientId</code> via user-secrets or environment variables.
    </div>
}

<div id="myMap" data-azure-maps-clientid="@clientId" style="width:100%;min-width:290px;height:600px;"></div>

@section Scripts
{
    <link rel="stylesheet" href="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css" />
    <script src="https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js"></script>
    @* Map initialization is handled in wwwroot/js/site.js *@
}
```

5) Map initialization with anonymous auth

```javascript
// File: source/Anonymous/wwwroot/js/site.js
document.addEventListener('DOMContentLoaded', function () {
  const el = document.getElementById('myMap');
  if (!el) return;

  const clientId = el.getAttribute('data-azure-maps-clientid');
  if (!clientId) {
    console.warn('Azure Maps client ID missing. Map will not initialize.');
    return;
  }

  const map = new atlas.Map('myMap', {
    center: [-122.33, 47.6],
    zoom: 12,
    style: 'satellite_road_labels',
    view: 'Auto',
    authOptions: {
      authType: 'anonymous',
      clientId: clientId,
      getToken: function (resolve, reject) {
        fetch('/api/GetAzureMapsToken')
          .then(r => { if (!r.ok) throw new Error('Token fetch failed: ' + r.status); return r.text(); })
          .then(token => resolve(token))
          .catch(err => reject(new Error('Failed to fetch Azure Maps token: ' + err.message)));
      }
    }
  });

  map.events.add('ready', function () { /* post-load code */ });
});
```

6) Configuration

```json
// File: source/Anonymous/appsettings.json
{
  "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
  "AllowedHosts": "*",
  "AzureMaps": {
    "ClientId": "",
    "ManagedIdentityClientId": ""
  }
}
```

Provide the Client ID securely for local runs:

```bash
cd source/Anonymous
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"
# Optional: if using a user‑assigned managed identity (UAMI) in Azure
dotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"
```

Notes
- System‑assigned identity: leave `ManagedIdentityClientId` empty.
- User‑assigned identity: set `AzureMaps:ManagedIdentityClientId` to the UAMI’s Client ID.
- Ensure the managed identity has Azure Maps Data Reader (or appropriate) RBAC on the Maps account.

2.3 Build and deploy

```bash
dotnet publish --configuration Release
# For Windows PowerShell
Compress-Archive -Path bin/Release/net9.0/publish/* -DestinationPath release1.zip
# For macOS/Linux (alternative)
# zip -r release1.zip bin/Release/net9.0/publish/*
```

Deploy the ZIP to the Web App:

```bash
az webapp deployment source config-zip --resource-group rg-azuremaps --name web-azuremaps --src release1.zip
```

Browse to https://web-azuremaps.azurewebsites.net/ and, optionally, check the token proxy at https://web-azuremaps.azurewebsites.net/api/GetAzureMapsToken.

## Step 3. Protecting the web application and the Azure Maps token proxy API

Now that the app uses managed identities to fetch Azure Maps tokens, we’ll require users to sign in with Microsoft Entra ID (Azure AD) and protect both the site and the token proxy. Use the Authentication sample at `source/Authentication`, which already includes the improvements from Step 2 plus authentication.

### 3.1 Register an app in Microsoft Entra ID (Azure AD)

Register a web app and record the values for domain, tenant, and app (client) ID. Set the redirect URI to your app’s sign-in URL.

```bash
az ad app create \
    --display-name "Azure Maps Demo App" \
    --web-redirect-uris https://web-azuremaps.azurewebsites.net/signin-oidc \
    --enable-access-token-issuance true \
    --enable-id-token-issuance true \
    --sign-in-audience AzureADMyOrg
```

Get your tenant ID if needed:

```bash
az account show --query tenantId --output tsv
```

### 3.2 Authentication sample structure (already wired)

Packages are already referenced in `source/Authentication/Authentication.csproj`:
- Microsoft.Identity.Web, Microsoft.Identity.Web.UI
- Microsoft.AspNetCore.Authentication.OpenIdConnect, JwtBearer
- Azure.Identity

Global auth is configured in `Program.cs` and we also bind Azure Maps options:

```csharp
// File: source/Authentication/Program.cs (excerpt)
var builder = WebApplication.CreateBuilder(args);

// Bind Azure Maps options
builder.Services.Configure<Authentication.Models.AzureMapsOptions>(builder.Configuration.GetSection("AzureMaps"));

builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
        .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization(options =>
{
        options.FallbackPolicy = options.DefaultPolicy; // require auth by default
});

builder.Services.AddControllersWithViews(options =>
{
        var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        options.Filters.Add(new AuthorizeFilter(policy));
});
builder.Services.AddRazorPages().AddMicrosoftIdentityUI();
```

Controllers are protected and the token API uses the same pattern as Step 2 with better routing and optional UAMI:

```csharp
// File: source/Authentication/Controllers/ApiController.cs (excerpt)
[Authorize]
[ApiController]
[Route("api")]
public class ApiController : Controller
{
        private readonly DefaultAzureCredential _TokenProvider;
        private readonly string[] _Scopes = { "https://atlas.microsoft.com/.default" };

        public ApiController(IOptions<AzureMapsOptions> options)
        {
                var opts = new DefaultAzureCredentialOptions();
                if (!string.IsNullOrWhiteSpace(options.Value.ManagedIdentityClientId))
                        opts.ManagedIdentityClientId = options.Value.ManagedIdentityClientId;
                _TokenProvider = new DefaultAzureCredential(opts);
        }

        [HttpGet("GetAzureMapsToken")]
        public async Task<IActionResult> GetAzureMapsToken()
        {
                try
                {
                        var at = await _TokenProvider.GetTokenAsync(new TokenRequestContext(_Scopes));
                        return Ok(at.Token);
                }
                catch (Exception ex)
                {
                        return Problem(title: "Failed to acquire Azure Maps token", statusCode: 500, detail: ex.Message);
                }
        }
}
```

The `HomeController` passes the Client ID to the view and the view uses a data-attribute while `wwwroot/js/site.js` initializes the map (identical to Step 2 but under `source/Authentication`).

### 3.3 Configure Azure AD and Azure Maps settings

In `source/Authentication/appsettings.json`, fill in your Azure AD values and Client ID for Azure Maps. Leave `ManagedIdentityClientId` empty for system-assigned identity; set it for UAMI.

```json
{
    "AzureAd": {
        "Instance": "https://login.microsoftonline.com/",
        "Domain": "[PUBLISHER_DOMAIN]",
        "TenantId": "[AAD_TENANT_ID]",
        "ClientId": "[APP_ID]",
        "CallbackPath": "/signin-oidc"
    },
    "Logging": {
        "LogLevel": {
            "Default": "Information",
            "Microsoft.AspNetCore": "Warning"
        }
    },
    "AllowedHosts": "*",
    "AzureMaps": {
        "ClientId": "",
        "ManagedIdentityClientId": ""
    }
}
```

For local development, use user-secrets:

```bash
cd source/Authentication
dotnet user-secrets init
dotnet user-secrets set "AzureMaps:ClientId" "<your-azure-maps-client-id>"
# Optional for UAMI
dotnet user-secrets set "AzureMaps:ManagedIdentityClientId" "<uami-client-id>"
```

### 3.4 Build and deploy

```bash
dotnet publish --configuration Release
# For Windows PowerShell
Compress-Archive -Path bin/Release/net9.0/publish/* -DestinationPath release2.zip
# For macOS/Linux (alternative)
# zip -r release2.zip bin/Release/net9.0/publish/*
```

Deploy the ZIP to the Web App:

```bash
az webapp deployment source config-zip --resource-group rg-azuremaps --name web-azuremaps --src release2.zip
```

Browse to https://web-azuremaps.azurewebsites.net/. You should be prompted to sign in. After sign-in, the map loads using managed identities. You can also verify the token proxy at https://web-azuremaps.azurewebsites.net/api/GetAzureMapsToken.

### 3.5 Hardening tip

Disable local (key) auth on your Azure Maps account once you fully rely on tokens:

```bash
az maps account update --name map-azuremaps --resource-group rg-azuremaps --disable-local-auth true --sku S2
```

## Conclusion

When we have done all the steps in this step-by-step article, you have a protected web application in combination with Azure Maps that uses of Azure Active Directory, Azure role-based access control ([Azure RBAC](https://docs.microsoft.com/azure/role-based-access-control/overview)), and [Azure Maps tokens](https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication). I recommend that you read our [Authentication best practices](https://docs.microsoft.com/azure/azure-maps/authentication-best-practices) and Azure Maps documentation. Also the [Azure Maps Samples](https://samples.azuremaps.com/) website offers so great ideas, with source code on Github, and uses most of the steps described in this article. Happy coding!
