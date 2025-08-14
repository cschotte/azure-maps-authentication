// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

document.addEventListener('DOMContentLoaded', function () {
	const el = document.getElementById('myMap');
	if (!el) return;

	const clientId = el.getAttribute('data-azure-maps-clientid');
	if (!clientId) {
		console.warn('Azure Maps client ID missing. Map will not initialize.');
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
			authType: 'anonymous',
			clientId: clientId,
			getToken: function (resolve, reject) {
				fetch('/api/GetAzureMapsToken')
					.then(function (response) {
						if (!response.ok) throw new Error('Token fetch failed: ' + response.status);
						return response.text();
					})
					.then(function (token) {
						resolve(token);
					})
					.catch(function (error) {
						reject(new Error('Failed to fetch Azure Maps token: ' + error.message));
					});
			}
		}
	});

	map.events.add('ready', function () {
		// Add your post map load code here.
	});
});
