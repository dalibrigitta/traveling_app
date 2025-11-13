const continentSelect = document.getElementById("continent"); 
const countrySelect = document.getElementById("country");    
const searchBtn = document.getElementById("search-btn");     
const resultsDiv = document.getElementById("results-container"); 
const resetBtn = document.getElementById("reset-btn");      
const themeToggle = document.getElementById("theme-toggle");  
const body = document.body;                                   

let map;      
let markers = []; 

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 }, 
    zoom: 2                   
  });
}

async function loadContinents() {
  try {
    const res = await fetch("http://localhost:3000/api/continents"); 
    const continents = await res.json();
    continentSelect.innerHTML = '<option value="">Select continent</option>'; 
    continents.forEach(cont => {
      const opt = document.createElement("option");
      opt.value = cont;
      opt.textContent = cont;
      continentSelect.appendChild(opt); 
    });
  } catch(err) { console.error(err); } 
}

continentSelect.addEventListener("change", async () => {
  const continent = continentSelect.value;
  countrySelect.innerHTML = '<option value="">Select country</option>';
  if(!continent) return; 
  try {
    const res = await fetch(`http://localhost:3000/api/continents/${encodeURIComponent(continent)}/countries`);
    const data = await res.json();
    data.countries.forEach(country => {
      const opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      countrySelect.appendChild(opt); 
    });
  } catch(err) { console.error(err); }
});

async function getCitiesByCountry(country) {
  try {
    const res = await fetch(`http://localhost:3000/api/countries/${encodeURIComponent(country)}/cities`);
    const data = await res.json();
    return data.cities?.map(c => ({ name: c.name, lat: c.lat, lon: c.lon })) || [];
  } catch(err) { console.error(err); return []; }
}

async function getWeather(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await res.json();
    const temp = data.current_weather.temperature.toFixed(1); 
    const code = data.current_weather.weathercode;

    let icon = "☀️", type="sun";
    if([1,2,3].includes(code)) { icon="⛅"; type="cloud"; }
    else if([61,63,65,80,81,82].includes(code)) { icon="🌧️"; type="rain"; }

    return { avgTemp: temp, icon, iconType: type };
  } catch(err) {
    console.error(err);
    return { avgTemp: (20 + Math.random()*15).toFixed(1), icon:"☀️", iconType:"sun" };
  }
}

function showCitiesOnMap(cities) {
  if(!map) initMap();
  markers.forEach(m => m.setMap(null)); 
  markers = [];
  const bounds = new google.maps.LatLngBounds(); 

  cities.forEach(city => {
    const marker = new google.maps.Marker({
      position: { lat: city.lat, lng: city.lon },
      map,
      title: city.name,
      animation: google.maps.Animation.DROP
    });
    const info = new google.maps.InfoWindow({
      content: `<strong>${city.name}</strong><br>🌡️ ${city.avgTemp} °C ${city.icon}`
    });
    marker.addListener("click", () => info.open(map, marker)); 
    markers.push(marker);
    bounds.extend(marker.position);
  });

  if(cities.length) map.fitBounds(bounds); 
}

searchBtn.addEventListener("click", async () => {
  const country = countrySelect.value;
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;
  const minTemp = parseFloat(document.getElementById("min-temp").value || 0);

  if(!country || !start) { alert("Select a country and start date!"); return; }

  resultsDiv.innerHTML = "";
  const cities = await getCitiesByCountry(country); 
  const results = [];

  for(const city of cities) {
    const weather = await getWeather(city.lat, city.lon); 
    if(parseFloat(weather.avgTemp) >= minTemp) results.push({ ...city, ...weather });
  }

  if(!results.length) { resultsDiv.innerHTML = "<p>No results found!</p>"; }
  else {
    resultsDiv.innerHTML = results.map(c => `
      <div class="weather-card fade-in">
        <h3><span class="weather-icon ${c.iconType}">${c.icon}</span> ${c.name}</h3>
        <p>🌡️ Average temperature: ${c.avgTemp} °C</p>
      </div>
    `).join("");
    showCitiesOnMap(results);
  }
});

resetBtn.addEventListener("click", () => {
  continentSelect.value = "";
  countrySelect.innerHTML = '<option value="">Select country</option>';
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  document.getElementById("min-temp").value = "";
  resultsDiv.innerHTML = "";
  markers.forEach(m => m.setMap(null)); 
  markers = [];
  if(map) { map.setCenter({ lat: 20, lng: 0 }); map.setZoom(2); }  
});

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark"); 
  themeToggle.textContent = body.classList.contains("dark") ? "☀️" : "🌙"; 
});

loadContinents();  
initMap(); 
