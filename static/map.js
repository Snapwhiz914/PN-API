proxies = []
currentFilters = {
  countries: [],
  citiy: [],
  region: [],
  protocs: [],
  anons: [],
  lc: 20000
}

function updateProxies() {
  fetch(`/proxy/`, {
    method: "GET",
    cache: 'no-cache',
  }).then((response) =>{
    response.json().then(proxArr => {
      proxies = proxArr
    })
  })
}

function updateMap(map) {
  for (var prox of proxies) {
    if (currentFilters.countries != [] && !(prox.country in currentFilters.countries)) continue
    if (currentFilters.city != "" && prox.city.indexOf(currentFilters.city) == -1) continue
    if (currentFilters.region != "" && prox.region.indexOf(currentFilters.region) == -1) continue
    if (currentFilters.protocs != [] && !(prox.protocs.some(e => currentFilters.protocs.includes(e)))) continue
    if (currentFilters.anons != [] && !(prox.anon in currentFilters.anons)) continue
    if (currentFilters.lc >= prox.lc) continue
    L.marker([prox.lat, prox.lon])
      .bindPopup(prox.ip)
      .addTo(map)
  }
}