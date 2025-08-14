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

In this paragraph, we are removing the ‘shared Key authentication’ (the Azure Maps subscription key) and replacing this with a more secure and production ready managed identities for Azure Maps.

> Managed identities for Azure resources provide Azure services with an automatically managed application-based security principal that can authenticate with Azure AD. With Azure role-based access control (Azure RBAC), the managed identity security principal can be authorized to access Azure Maps services.

This means that the web application can request a short-lived token to get access to Azure Maps from Azure Active Directory (AAD). Because this is managed, we do not need to know any passwords or create users. However, to get this token back to the client (the Azure Maps Web Controls runs in the users’ browser), we need to create a simple token proxy API in our web application to forward this token.

We start by creating an Azure Web App where our web application will be hosted and running. This Azure Web App then needs to have rights to get a token for Azure Maps, which we will forward using the token proxy API we create in the below steps.

2.1 Create an app service plan and web app, and change the unique name and the location for your needs.

```cmd
az appservice plan create --resource-group rg-azuremaps --name plan-azuremaps --location westeurope --sku B1

az webapp create --resource-group rg-azuremaps --plan plan-azuremaps --name web-azuremaps --runtime "DOTNET|9.0"
```

2.2 Next, we create a system-assigned identity for this web app. When finished, we are presented with the `principalId`, we need this in the next step. To make it simple, you can see the system-assigned identity as an account Azure manages.

```cmd
az webapp identity assign --name web-azuremaps --resource-group rg-azuremaps
```

2.3 Now that we have the `principalId` (use this in the below command) for this system-assigned identity, we can assign the role (what can this system-assigned identity do and access). In this step, we assign the role of [Azure Maps Data Reader](https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication#picking-a-role-definition) to this system-assigned identity, which means that this system-assigned identity can only read and not modify or delete data from your Azure Maps account. You already see this is way more secure than the plain Azure Maps key, which has all the rights to do everything. We also need the `[YOUR_AZURE_SUBSCRIPTION_ID]` from the first step.

```cmd
az role assignment create --assignee "[PRINCIPAL_ID]" --role "Azure Maps Data Reader" --scope "/subscriptions/[YOUR_AZURE_SUBSCRIPTION_ID]/resourceGroups/rg-azuremaps/providers/Microsoft.Maps/accounts/map-azuremaps"
```

> **Hint** to get your Azure subscription Id use the following command: `az account show --query id --output tsv`

2.4 To get the access token from Azure Active Directory (AAD) back to the client (the web browser), we will create a simple proxy API forwarding this access token. We start by creating an API controller in our web application and adding the `GetAzureMapsToken()` method.

2.5 First, we must add the **Azure Identity** NuGet package to our web application.

```cmd
dotnet add package Azure.Identity
```

2.6 Next, we create a new `ApiController.cs` file under the folder **Controllers**. This new `ApiController.cs` file will have a method `GetAzureMapsToken()` that is acting like a proxy for our access token. Read [here](https://docs.microsoft.com/aspnet/core/tutorials/first-mvc-app/adding-controller) more about Controllers in a MVC web application.

```csharp
using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AzureMapsDemo.Controllers;

public class ApiController : Controller
{
    private readonly DefaultAzureCredential _TokenProvider = new();

    private readonly string[] _Scopes =
    {
            "https://atlas.microsoft.com/.default"
    };

    public async Task<IActionResult> GetAzureMapsToken()
    {
        AccessToken accessToken = await _TokenProvider.GetTokenAsync(new TokenRequestContext(_Scopes));

        return new OkObjectResult(accessToken.Token);
    }
}
```

2.7 Now that we have our token API proxy, we only need to change the authentication options for the Azure Maps Web Control. Replace in the file `Views/Home/index.cshtml` the authOptions with the following:

```js
// Add authentication details for connecting to Azure Maps.
authOptions: {
    // Use Azure Active Directory authentication.
    authType: 'anonymous',
    // Your Azure Maps client id for accessing your Azure Maps account.
    clientId: '[YOUR_AZUREMAPS_CLIENT_ID]',
    getToken: function (resolve, reject, map) {
        // URL to your authentication service that retrieves an Azure Active Directory Token
        fetch('/api/GetAzureMapsToken')
            .then(function (response) {
                return response.text();
            })
            .then(function (token) {
                resolve(token);
            })
            .catch(function (error) {
                reject(new Error(`Failed to fetch Azure Maps token: ${error.message}`));
            });
    }
}
```

2.8 We also need to update the `clientId` we saved when we created the Azure Maps account. (Optional) To get the Azure Maps Client Id again, use the value of `uniqueId` from:

```cmd
az maps account show --name map-azuremaps --resource-group rg-azuremaps
```

![Managed Identity](images/managed_identity.png)

2.9 Now we can build and deploy our web application that uses managed identities for Azure Maps. We first build and create a release package.

```cmd
dotnet publish --configuration Release
# For Windows PowerShell
Compress-Archive -Path bin/Release/net9.0/publish/* -DestinationPath release1.zip
# For macOS/Linux (alternative)
# zip -r release1.zip bin/Release/net9.0/publish/*
```

2.10 Then we publish our release package to the Azure Web App.

```cmd
az webapp deployment source config-zip --resource-group rg-azuremaps --name web-azuremaps --src release1.zip
```

2.11 Open a web browser and navigate to the https://web-azuremaps.azurewebsites.net/ where the **web-azuremaps** subdomain is your unique name when creating the Azure Web App. The application looks like this:

![Azure Maps Demo website](images/demo.png)

2.12.	(Optional) We can also navigate to the token proxy API https://web-azuremaps.azurewebsites.net/api/GetAzureMapsToken, copy the token, and past this in the https://jwt.ms/ tool to decode and inspect the token.

## Step 3. Protecting the web application and the Azure Maps token proxy API

The web application we built in the last paragraph uses managed identities, and the Azure Maps Web Control uses the access token. Unfortunately, the web application and token proxy API are still accessible to everybody. Therefore, in this paragraph, we are adding the Azure Active Directory (AAD) Authentication to the web application and the token proxy API, so that only authenticated users can view the web application and use the Azure Maps Web Control in a secure way. 

3.1 We start by registering an application in the Azure Active Directory, and we need this application registration later to give access to the web application and token proxy API.

```cmd
az ad app create --display-name "Azure Maps Demo App" --web-redirect-uris https://web-azuremaps.azurewebsites.net/signin-oidc --enable-access-token-issuance true --enable-id-token-issuance true --sign-in-audience AzureADMyOrg
```

3.2 We need to add four Identity and Authentication NuGet packages to our web application.

```cmd
dotnet add package Microsoft.Identity.Web
dotnet add package Microsoft.Identity.Web.UI
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
```

3.3 Next, we need to add the `[Authorize]` attribute to every controller in our web application. Below is our token API proxy controller as an example. Do not forget to do this also for the Home controller! 

```csharp
using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AzureMapsDemo.Controllers;

[Authorize]
public class ApiController : Controller
{
    ...
```

3.4 In the program startup file `Program.cs` we need to add the Authentication and Authentication logic. Replace all the default code in the `Program.cs` file with the following:

```csharp
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.UI;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;
});

builder.Services.AddControllersWithViews(options =>
{
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.Filters.Add(new AuthorizeFilter(policy));
});
builder.Services.AddRazorPages()
    .AddMicrosoftIdentityUI();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
app.MapRazorPages();
app.MapControllers();

app.Run();
```

3.5 The last step before redeploying our secure web application is to add the details from our registered application in the Azure Active Directory into the configuration file. Open the `appsettings.json` file and replace this with:

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
  "AllowedHosts": "*"
}
```

3.6 Replace the `[PUBLISHER_DOMAIN]` and `[APP_ID]` with the values we saved in step 1 when we registered the application. Your Azure Active Directory Tenant ID `[AAD_TENANT_ID]`, you can get with the following command:

```cmd
az account show --query tenantId --output tsv
```

![Azure Active Directory](images/azure_active_directory.png)

3.7 Now we can build and deploy our web application that uses Azure Active Directory to login. We first build and create a release package.

```cmd
dotnet publish --configuration Release
# For Windows PowerShell
Compress-Archive -Path bin/Release/net9.0/publish/* -DestinationPath release2.zip
# For macOS/Linux (alternative)
# zip -r release2.zip bin/Release/net9.0/publish/*
```

3.8 Then we publish our release package to the Azure Web App.

```cmd
az webapp deployment source config-zip --resource-group rg-azuremaps --name web-azuremaps --src release2.zip
```

3.9 Open a web browser and navigate to the https://web-azuremaps.azurewebsites.net/ where the **web-azuremaps** subdomain is your unique name when creating the Azure Web App. You are now prompted to log in with your work or school account (AAD) and give permissions.

![Login Permissions](images/login_permissions.png)

3.10 A recommended last step is to disable the use of the Azure Maps Key authentication.

```cmd
az maps account update --name map-azuremaps --resource-group rg-azuremaps --disable-local-auth true --sku S2
```

## Conclusion

When we have done all the steps in this step-by-step article, you have a protected web application in combination with Azure Maps that uses of Azure Active Directory, Azure role-based access control ([Azure RBAC](https://docs.microsoft.com/azure/role-based-access-control/overview)), and [Azure Maps tokens](https://docs.microsoft.com/azure/azure-maps/azure-maps-authentication). I recommend that you read our [Authentication best practices](https://docs.microsoft.com/azure/azure-maps/authentication-best-practices) and Azure Maps documentation. Also the [Azure Maps Samples](https://samples.azuremaps.com/) website offers so great ideas, with source code on Github, and uses most of the steps described in this article. Happy coding!
