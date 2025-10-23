//console.log("app.js loaded");
//document.getElementById('result').textContent= 'JS connected';


const form = document.getElementById('search-form');
const input = document.getElementById('query');
const result = document.getElementById('result');
const submitBtn = form.querySelector('button');

const weatherCodeMap = {
  0:  { desc: "Clear sky",            icon: "sunny.svg" },
  1:  { desc: "Mainly clear",         icon: "mostly-clear.svg" },
  2:  { desc: "Partly cloudy",        icon: "partly-cloudy.svg" },
  3:  { desc: "Overcast",             icon: "overcast.svg" },
  45: { desc: "Fog",                  icon: "fog.svg" },
  48: { desc: "Depositing rime fog",  icon: "fog.svg" },
  51: { desc: "Light drizzle",        icon: "drizzle.svg" },
  53: { desc: "Moderate drizzle",     icon: "drizzle.svg" },
  55: { desc: "Dense drizzle",        icon: "drizzle.svg" },
  56: { desc: "Light freezing drizzle", icon: "freezing-drizzle.svg" },
  57: { desc: "Dense freezing drizzle", icon: "freezing-drizzle.svg" },
  61: { desc: "Slight rain",          icon: "rain.svg" },
  63: { desc: "Moderate rain",        icon: "rain.svg" },
  65: { desc: "Heavy rain",           icon: "rain.svg" },
  66: { desc: "Light freezing rain",  icon: "freezing-rain.svg" },
  67: { desc: "Heavy freezing rain",  icon: "freezing-rain.svg" },
  71: { desc: "Slight snow fall",     icon: "snow.svg" },
  73: { desc: "Moderate snow fall",   icon: "snow.svg" },
  75: { desc: "Heavy snow fall",      icon: "snow.svg" },
  77: { desc: "Snow grains",          icon: "snow.svg" },
  80: { desc: "Slight rain showers",  icon: "shower.svg" },
  81: { desc: "Moderate rain showers",icon: "shower.svg" },
  82: { desc: "Violent rain showers", icon: "storm.svg" },
  85: { desc: "Slight snow showers",  icon: "snow.svg" },
  86: { desc: "Heavy snow showers",   icon: "snow.svg" },
  95: { desc: "Thunderstorm",         icon: "thunder.svg" },
  96: { desc: "Thunderstorm with hail", icon: "thunder-hail.svg" },
  99: { desc: "Thunderstorm with heavy hail", icon: "thunder-hail.svg" }
};

function getIcon(code) {
    const entry = weatherCodeMap[code] || { desc: "Unknown", icon: "unknown.svg" };
    return { src: `icons/${entry.icon}`, alt: entry.desc };
}

//UX Helpers

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute('aria-busy', String(isLoading));
    result.innerHTML = isLoading ? `<p class="meta">Loading...</p>` : '';
}

function renderError(msg) {
    result.innerHTML = `<p class="error">${msg}</p>`;
}

//API Helpers
async function geocode(city) {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', city);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');

const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed.');
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
        throw new Error(`No results for "${city}". Try another city.`);
    }
    const { name, country, latitude, longitude, timezone } = data.results[0];
    return { name, country, latitude, longitude, timezone };
}

async function getWeather(place) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', place.latitude);       
    url.searchParams.set('longitude', place.longitude);
    url.searchParams.set('current_weather', 'true'); 
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
    url.searchParams.set('timezone', place.timezone || 'auto');

    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather request failed.');
    return res.json();
}

//Units Helpers
function ctoF(c) { return Math.round((Number(c) * 9) / 5 + 32); }
function mmToIn(mm) { return (Number(mm) / 25.4).toFixed(2); }  
function kmhToMph(k) { return Math.round(Number(k) * 0.621371); }

//Render
function renderCard(place, wx) {
    const tempC = Math.round(wx.current_weather?.temperature ?? NaN);
    const code = wx.current_weather?.weathercode ?? null;
    const windK = Math.round(wx.current_weather?.windspeed ?? NaN);
    const maxC = Math.round(wx.daily?.temperature_2m_max?.[0] ?? NaN);
    const minC = Math.round(wx.daily?.temperature_2m_min?.[0] ?? NaN);   
    const precip = Math.round(wx.daily?.precipitation_sum?.[0] ?? 0);
    const precipIn = mmToIn(precip);

    const icon = getIcon(code);

    result.innerHTML = `
    <div class= "card">
        <h2>${place.name}, ${place.country}</h2>
        <img src="${icon.src}" alt="${icon.alt}" class="icon">
        <p class="meta">${icon.alt}  Timezone: ${wx.timezone}</p>

        <div class="temp" data-c="${tempC}">${tempC}°C</div>

        <div class ="grid">
            <div class= "item"><strong>High</strong><br /><span data-c="${maxC}">${maxC}°C</span></div>
            <div class= "item"><strong>Low</strong><br /><span data-c="${minC}">${minC}°C</span></div>
            <div class= "item"><strong>Precipitation</strong><br /><span>${precipIn} in</span></div>          
            <div class= "item"><strong>Wind</strong><br /><span>${windK}">${windK} km/h</span></div>
        </div>

        <div style ="margin-top:10px">
        <button id="toggle" type="button" aria-pressed="false" aria-label="Toggle units to Fahrenheit">Show °F</button>
        </div>   
    </div>
    `;

    const btn= document.getElementById('toggle');
    btn.addEventListener('click', (e) => toggleUnits(e.currentTarget));

}

//Toggle °C/°F and km/h ↔ mph
function toggleUnits(btn) {
        const tempEl = result.querySelector('.temp');
        const numEls = result.querySelectorAll('[data-c]'); 
        const windEl = result.querySelector('.wind');
        if (!tempEl) return;

        const showingF = btn.textContent.includes('°C'); ////if button says "show C", we're currently on F   

        if (showingF) {
            // switch to C
            tempEl.textContent = `${tempEl.dataset.c}°C`;
            numEls.forEach(el =>  el.textContent = `${el.dataset.c}°C`);     
            if (windEl?.dataset.kmh) windEl.textContent = `${windEl.dataset.kmh} km/h`;

            btn.textContent = 'Show °F';
            btn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('aria-label', 'Toggle units to Fahrenheit');
        }   else {
            // switch to F (convert from stored Celsius)    
            tempEl.textContent = `${ctoF(tempEl.dataset.c)}°F`;
            if (windEl?.dataset.kmh) windEl.textContent = `${kmhToMph(windEl.dataset.kmh)} mph`;

            btn.textContent = 'Show °C';
            btn.setAttribute('aria-pressed', 'true');
            btn.setAttribute('aria-label', 'Toggle units to Celsius');  
        }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const q = input.value.trim();

        if (q.length < 2) {
            renderError('Please enter at least 2 characters.');
            return;
        }

        setLoading(true); //disables button and shows loading message
        try {
            //console.log('[submit]', q);

            const place = await geocode(q);
            //console.log('[geocode ok]', place);

            const wx  = await getWeather(place);
            //console.log('[weather ok]', wx.current_weather, wx.daily);

            renderCard(place, wx);
            //console.log('[render ok]');
        }   catch (err) {
            console.error(err);
            renderError(err.message || 'Something went wrong.');    
        } finally {
            setLoading(false);
        }
    }


    )}