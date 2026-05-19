(() => {
  'use strict'

  const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileLayerOptions = {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  };

  const createMap = (element, lat, lng, zoom = 12) => {
    if (element._leafletMap) {
      element._leafletMap.remove();
    }

    const map = L.map(element).setView([lat, lng], zoom);
    L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(map);
    element._leafletMap = map;
    return map;
  };

  const listingMapElement = document.getElementById('listing-map');

  if (listingMapElement && typeof L !== 'undefined') {
    const lng = Number(listingMapElement.dataset.lng);
    const lat = Number(listingMapElement.dataset.lat);
    const title = listingMapElement.dataset.title;
    const location = listingMapElement.dataset.location;

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      const map = createMap(listingMapElement, lat, lng);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${title}</strong><br>${location}`);
    }
  }

  const locationCheckButton = document.querySelector('.location-check-btn');

  if (locationCheckButton && typeof L !== 'undefined') {
    const mapTargetId = locationCheckButton.dataset.mapTarget;
    const locationInput = document.getElementById(locationCheckButton.dataset.locationInput);
    const countryInput = document.getElementById(locationCheckButton.dataset.countryInput);
    const mapElement = document.getElementById(mapTargetId);
    const mapStatus = document.getElementById(`${mapTargetId}-status`);

    const renderPreview = (lat, lng, label) => {
      mapElement.classList.remove('d-none');
      const map = createMap(mapElement, lat, lng, 13);
      L.marker([lat, lng]).addTo(map).bindPopup(label).openPopup();
      mapStatus.textContent = label;
    };

    const initialLng = Number(locationCheckButton.dataset.initialLng);
    const initialLat = Number(locationCheckButton.dataset.initialLat);
    const initialLabel = locationCheckButton.dataset.initialLabel;

    if (Number.isFinite(initialLng) && Number.isFinite(initialLat) && initialLabel) {
      renderPreview(initialLat, initialLng, initialLabel);
    }

    locationCheckButton.addEventListener('click', async () => {
      const location = locationInput?.value.trim();
      const country = countryInput?.value.trim();
      const query = [location, country].filter(Boolean).join(', ');

      if (!query) {
        mapStatus.textContent = 'Enter a location and country first.';
        return;
      }

      mapStatus.textContent = 'Checking location...';

      try {
        const searchParams = new URLSearchParams({
          q: query,
          format: 'jsonv2',
          limit: '1',
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Location lookup failed');
        }

        const results = await response.json();
        const match = results[0];

        if (!match) {
          mapElement.classList.add('d-none');
          mapStatus.textContent = 'No matching place found. Try a more specific location.';
          return;
        }

        renderPreview(Number(match.lat), Number(match.lon), match.display_name);
      } catch (error) {
        mapElement.classList.add('d-none');
        mapStatus.textContent = 'Unable to check this location right now.';
      }
    });
  }

  const editImageInput = document.getElementById('editImageInput');
  const editImagePreview = document.getElementById('editImagePreview');

  if (editImageInput && editImagePreview) {
    editImageInput.addEventListener('change', () => {
      const [file] = editImageInput.files;

      if (!file) {
        return;
      }

      editImagePreview.src = URL.createObjectURL(file);
    });
  }

  const taxToggle = document.getElementById('tax-toggle');
  const listingPrices = document.querySelectorAll('.listing-price');

  if (taxToggle && listingPrices.length > 0) {
    const formatPrice = value =>
      `\u20b9${Number(value).toLocaleString('en-IN')}`;

    const applyTaxDisplay = () => {
      listingPrices.forEach(priceElement => {
        const basePrice = Number(priceElement.dataset.basePrice);
        const taxPrice = Number(priceElement.dataset.taxPrice);

        priceElement.textContent = taxToggle.checked
          ? formatPrice(taxPrice)
          : formatPrice(basePrice);
      });
    };

    taxToggle.addEventListener('change', applyTaxDisplay);
    applyTaxDisplay();
  }

  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    const trimRequiredTextFields = () => {
      const requiredFields = form.querySelectorAll(
        'input[required][type="text"], input[required]:not([type]), textarea[required]'
      );

      requiredFields.forEach(field => {
        if (field.value.trim() === '') {
          field.value = '';
          field.setCustomValidity('This field is required');
        } else {
          field.value = field.value.trim();
          field.setCustomValidity('');
        }
      });
    };

    form.addEventListener('submit', event => {
      trimRequiredTextFields();

      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false);

    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('input', () => {
        if (field.value.trim() === '') {
          field.setCustomValidity('This field is required');
        } else {
          field.setCustomValidity('');
        }
      });
    });
  });
})();
