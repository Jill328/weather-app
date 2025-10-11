const form = document.getElementById(('search-form');
const input = document.getElementById('query');
const result = document.getElementById('result');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = uinput.value.trim();
    if (!q) return;

    setLoading(true);
    try {
        const place = await GeolocationCoordinates(q);
        const wx  = await getWeather(place);
        renderCard(place, wx);
    } catch (err) {
        renderError(err.message || 'Something went wrong.');    
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    result.innerHTML = isLoading ? `<pclass="meta">Loading...<p>` : '';
}
function renderError(msg) {
    result.innerHTML = `<p class="error">${msg}</p>`;
}

async function geocode(city) {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', city);
    url.searchParams.set('count', 1);
    url.searchParams.set('language', 'en');

    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed.');
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
        throw new Error(`No results for "${city}'. Try another city.`);
    }
    const { name, country, latitude, longitude, timezone } = data.results[0];
    return { name, country, latitude, longitude, timezone };
}

async function getWeather(place) {
    const url = new URL('https://api.open-meteo.com/vl/forecast');
    url.searchParams.set('latitude', place.latitude);
    url.searchParams.set('longitude', place.longitude);
    url.searchParams.set('current_weather', true); 
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
    url.searchParams.set('timezone', place.timezone || 'auto');
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather request failed.');
    return res.json();
}
function renderCard(place, wx) {
    const temp = Math.round(wx.current_weather.temperature);
    const wind = Math.round(wx.current_weather.windspeed);
    const maxT = Math.round(wx.daily.temperature_2m_max[0]);
    const minT = Math.round(wx.daily.temperature_2m_min[0]);   
   
    result.innerHTML =
    `<div class="card">
        <h2>${place.name}, ${place.country}</h2>
        <p class="meta">Timezone: ${wx.timezone}</p>
        <div class="temp" data-c="${temp}">${temp}°C</div>
        <div class ="grid">
            <div class= "item"><strong>High</stong><br>span data-c="${maxT}">${maxT}°C</span></div>
            <div class= "item"><strong>Low</stong><br>span data-c="${minT}">${minT}°C</span></div>
            <div class= "item"><strong>Wind</stong><br><span>${wind} km/h</span></div>
    </div>
    <div style ="margin-top:10px">
        button id="toggle">Toggle °F</button>
    </div>
    </div>`;   
    
    const btn = document.getElementById('toggle');
    btn.addEventListener('click', () => toggleUnits(btn));

    function ctoF(c) { return Math.round((c * 9) /5 + 32); }

    function toggleUnits(btn) {
        const tempEl = result.querySelector('.temp');
        const numEls = result.querySelectorAll('[data-c]');     

        const showingF = btn.textContent.includes('°C');

        if (showingF) {
            tempEl.textContent = `${tempEl.dataset.c}°C`;
            numEls.forEach(el => el.textContent = `${el.dataset.c}°C`);     
            btn.textContent = 'Show °F';
        }   else {
            const tc = Number(tempEl.dataset.c);
            tempEl.textContent = `${ctoF(tc)}°F`;
            numEls.forEach(el => {
                const c = Number(el.dataset.c);
                el.textContent = `${ctoF(c)}°F`;
            });
            btn.textContent = 'Show °C';
        }
    }   
}










    
    
    
    
    {
    
}