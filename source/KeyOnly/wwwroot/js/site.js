// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

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
