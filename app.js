//console.log("app.js loaded");
//document.getElementById('result').textContent= 'JS connected';


const form = document.getElementById('search-form');
const input = document.getElementById('query');
const result = document.getElementById('result');
const submitBtn = form.querySelector('button');


form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();

    if (!q.length < 2) {
        renderError('Please enter at least 2 characters.');
        return;
    }

    setLoading(true); //disables button and shows loading message
    try {
        console.log('[submit]', q);

        const place = await geocode(q);
        console.log('[geocode ok]', place);

        const wx  = await getWeather(place);
        console.log('[weather ok]', wx.current_weather, wx.daily);

        renderCard(place, wx);
        console.log('[render ok]');
    } catch (err) {
        console.error('[error]', err);
        renderError(err.message || 'Something went wrong.');    
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute('aria-busy', String(isLoading));
    result.innerHTML = isLoading ? `<p class="meta">Loading...<p>` : '';
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
function renderCard(place, wx) {
    const temp = Math.round(wx.current_weather?.temperature ?? NaN);
    const code = wx.current_weather?.weathercode ?? NaN;
    const icon = getIcon(code);
    const wind = Math.round(wx.current_weather?.windspeed ?? NaN);
    const maxT = Math.round(wx.daily?.temperature_2m_max?.[0] ?? NaN);
    const minT = Math.round(wx.daily?.temperature_2m_min?.[0] ?? NaN);   
   
    result.innerHTML = `
    <div class= "card">
        <h2>${place.name}, ${place.country}</h2>
        <img src="${icon.src} alt="${icon.alt}" class="icon">
        <p class="meta">Timezone: ${wx.timezone}</p>
        <div class="temp" data-c="${temp}">${temp}°C</div>
        <div class ="grid">
            <div class= "item"><strong>High</strong><br /><span data-c="${maxT}">${maxT}°C</span></div>
            
            <div class= "item"><strong>Low</strong><br /><span data-c="${minT}">${minT}°C</span></div>
            
            <div class= "item"><strong>Wind</strong><br /><span>${wind} km/h</span></div>
        </div>
        <div style ="margin-top:10px">
        <button id="toggle">Show °F</button>
        </div>   
    </div>
    `;
    const btn = document.getElementById('toggle');
    btn.addEventListener('click', () => toggleUnits(btn));
    }
    function ctoF(c) { return Math.round((c * 9) /5 + 32); }

    function getIcon(code) {
      const icons = {
        0: { src: "icons/clear.png", alt: "Clear sky" },
        1: { src: "icons/mostly-clear.png", alt: "Mostly clear" },
        2: { src: "icons/partly-cloudy.png", alt: "Partly cloudy" },
        3: { src: "icons/cloudy.png", alt: "Cloudy" },
        45: { src: "icons/fog.png", alt: "Fog" },
        48: { src: "icons/fog.png", alt: "Depositing rime fog" },
        51: { src: "icons/drizzle.png", alt: "Light drizzle" },
        61: { src: "icons/rain.png", alt: "Rain" },
        71: { src: "icons/snow.png", alt: "Snow" },
        80: { src: "icons/showers.png", alt: "Rain showers" },
        95: { src: "icons/thunder.png", alt: "Thunderstorm" },
    };
    return icons[code] || { src: "icons/unknown.png", alt: "Unknown weather" };    
        }

    function toggleUnits(btn) {
        const tempEl = result.querySelector('.temp');
        const numEls = result.querySelectorAll('[data-c]'); 

        const showingF = btn.textContent.includes('°C'); ////if button says "show C", we're currently on F   

        if (showingF) {
            // switch to C
            tempEl.textContent = `${tempEl.dataset.c}°C`;
            numEls.forEach(el => { el.textContent = `${el.dataset.c}°C`});     
            btn.textContent = 'Show °F';
        }   else {
            // switch to F (convert from stored Celsius)    
            const tc = Number(tempEl.dataset.c);
            tempEl.textContent = `${ctoF(tc)}°F`;
            numEls.forEach(el => {
                const c = Number(el.dataset.c);
                el.textContent = `${ctoF(c)}°F`;
            });
            btn.textContent = 'Show °C';
        }
    }   











    
    
    
    
