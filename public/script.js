let fcmToken = null;

// 1. Maintenance
async function estimate() {
  const age = document.getElementById('age').value;
  const km = document.getElementById('km').value;
  const brand = document.getElementById('brand').value;
  const res = await fetch('/api/estimate-maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ age: +age, km: +km, brand })
  });
  const data = await res.json();
  document.getElementById('estimateResult').innerHTML = `
    <p><strong>${data.tag}</strong></p>
    <p>Estimated Monthly Cost: <strong>$${data.estimatedCost}</strong></p>
    <ul>${data.insights.map(i => `<li>${i}</li>`).join('')}</ul>
  `;
}

// 2. Notifications
async function requestPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    fcmToken = await messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY_HERE' });
    console.log('FCM Token:', fcmToken);
    localStorage.setItem('fcmToken', fcmToken);
  }
}

async function testNotification() {
  if (!fcmToken) return alert('Enable notifications first');
  await fetch('/api/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: fcmToken, title: 'Test', body: 'This is a test notification!' })
  });
}

// 3. Pricing
async function adjustPrice() {
  const basePrice = +document.getElementById('basePrice').value;
  const carType = document.getElementById('carType').value;
  const region = document.getElementById('region').value;
  const season = document.getElementById('season').value;
  const res = await fetch('/api/price-adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ basePrice, carType, region, season })
  });
  const data = await res.json();
  document.getElementById('priceResult').innerHTML = `
    <p><strong>Recommended Price: $${data.recommended}</strong></p>
    <small>Multiplier: ${data.multiplier}x (Seasonal + Regional)</small>
  `;
}

// 4. Search
let debounce;
async function autoSuggest() {
  clearTimeout(debounce);
  debounce = setTimeout(async () => {
    const q = document.getElementById('searchInput').value;
    if (q.length < 2) return;
    const res = await fetch(`/api/search?query=${q}`);
    const cars = await res.json();
    const dl = document.getElementById('suggestions');
    dl.innerHTML = cars.slice(0, 5).map(c => `<option value="${c.model}">`).join('');
  }, 300);
}

async function searchCars() {
  const q = document.getElementById('searchInput').value;
  const fuel = document.getElementById('fuel').value !== 'All' ? document.getElementById('fuel').value : '';
  const mileageMin = document.getElementById('mileageMin').value;
  const yearMin = document.getElementById('yearMin').value;
  const trans = document.getElementById('trans').value !== 'All' ? document.getElementById('trans').value : '';

  let url = `/api/search?query=${q}`;
  if (fuel) url += `&fuelType=${fuel}`;
  if (mileageMin) url += `&mileageMin=${mileageMin}`;
  if (yearMin) url += `&yearMin=${yearMin}`;
  if (trans) url += `&transmission=${trans}`;

  const res = await fetch(url);
  const cars = await res.json();
  document.getElementById('searchResults').innerHTML = cars.map(c => `
    <div><strong>${c.model}</strong> (${c.year}) - ${c.city} - $${c.price} 
    <small>[Score: ${c.score}]</small></div>
  `).join('');
}

// 5. Geo
async function getLocation() {
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    const res = await fetch('/api/geo-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, query: document.getElementById('searchInput').value })
    });
    const data = await res.json();
    document.getElementById('geoResult').innerHTML = `
      <p><strong>Near: ${data.city}</strong></p>
      <p>Found ${data.cars.length} cars nearby</p>
      <ul>${data.cars.map(c => `<li>${c.model} - $${c.price}</li>`).join('')}</ul>
      <p>${data.nearbyServices.join(' | ')}</p>
    `;
    const map = document.getElementById('map');
    map.style.display = 'block';
    map.innerHTML = `<iframe width="100%" height="100%" frameborder="0" 
      src="https://www.google.com/maps/embed/v1/view?key=${'YOUR_GOOGLE_MAPS_KEY'}&center=${lat},${lng}&zoom=12">
      </iframe>`;
  }, () => alert('Location access denied'));
}

// 6. Referral
async function generateReferral() {
  const email = document.getElementById('email').value;
  const refCode = document.getElementById('refCode').value;
  const res = await fetch('/api/refer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, referredByCode: refCode || null })
  });
  const data = await res.json();
  document.getElementById('myCode').innerHTML = `<strong>Your Code: ${data.code}</strong><br>Share: http://localhost:3000?ref=${data.code}`;
  document.getElementById('wallet').innerHTML = `Wallet: ${data.points} points`;
  localStorage.setItem('userEmail', email);
}

async function redeem() {
  const email = localStorage.getItem('userEmail');
  const amount = +document.getElementById('redeemAmt').value;
  const res = await fetch('/api/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount })
  });
  const data = await res.json();
  if (data.success) {
    document.getElementById('wallet').innerHTML = `Redeemed! Remaining: ${data.points} points`;
  } else {
    alert(data.error);
  }
}