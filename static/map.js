proxies = []
markers = []
currentFilters = {
  countries: [],
  city: "",
  region: "",
  protocs: [],
  anons: [],
  speed: 20000,
  lc: 1440
}

statsP = document.getElementById("stats")
shownMarkers = 0

function updateProxies() {
  fetch(`/proxy/?limit=10000`, {
    method: "GET",
    cache: 'no-cache',
  }).then((response) =>{
    console.log("Got response")
    response.json().then(proxArr => {
      console.log(proxArr)
      proxies = proxArr
      updateMarkers()
    })
  })
}

function updateMarkers() {
  for (var prox of proxies) {
    let alreadyHasMarker = false
    for (var m of markers) {
      if (m.title == prox.ip) alreadyHasMarker = true
    }
    if (alreadyHasMarker) continue
    var newMarker = L.marker([prox.lat, prox.lon], {
      title: prox.ip
    })
    newMarker.bindPopup(prox.ip)
    newMarker.addTo(map)
    markers.push(newMarker)
  }
  updateMap()
}

function updateMap() {
  console.log("running um..")
  var shown = 0
  for (var prox of proxies) {
    var shouldShow = true
    if (currentFilters.countries.length != 0 && !(prox.country in currentFilters.countries)) shouldShow = false
    if (currentFilters.city != "" && prox.city.indexOf(currentFilters.city) == -1) shouldShow = false
    if (currentFilters.region != "" && prox.region.indexOf(currentFilters.region) == -1) shouldShow = false
    if (currentFilters.protocs.length != 0 && !(prox.protocs.some(e => currentFilters.protocs.includes(e)))) shouldShow = false
    if (currentFilters.anons.length != 0 && !(prox.anon in currentFilters.anons)) shouldShow = false
    if (currentFilters.lc >= prox.lc) shouldShow = false
    if (prox.speed <= currentFilters.speed) shouldShow = false
    var markerForP = undefined
    for (var m of markers) {
      if (m.options.title == prox.ip) markerForP = m
    }
    if (shouldShow) {
      console.log("SHowing " + prox.ip)
      markerForP.setOpacity(1.0)
      shown++
    } else {
      console.log("Unshowing " + prox.ip)
      markerForP.setOpacity(0.0)
    }
  }
  shownMarkers = shown
  updateStats()
}

function updateStats() {
  statsP.innerHTML = "Current proxies: " + proxies.length.toString() + ", shown: " + shownMarkers.toString()
}

window.onload = function() {
  updateProxies()
  console.log("ONLOAD complete")
}