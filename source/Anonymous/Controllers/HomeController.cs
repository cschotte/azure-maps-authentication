using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Anonymous.Models;
using Microsoft.Extensions.Options;

namespace Anonymous.Controllers;

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
        ViewData["AzureMapsClientId"] = _mapsOptions.Value.ClientId ?? string.Empty;
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
