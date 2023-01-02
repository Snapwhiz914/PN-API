proxies = []
markers = []
clusters = new Map()
currentFilters = {
  countries: [],
  city: "",
  region: "",
  protocs: [],
  anons: [],
  speed: 5000,
  lc: 720
}

protocsCode = {
  [-1]: "UNKNOWN",
  0: "HTTP",
  1: "HTTPS",
  2: "SOCKS4",
  3: "SOCKS5"
}

anonCode = {
  [-1]: "UNKNOWN",
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High"
}

const statsP = document.getElementById("stats")
const statusP = document.getElementById("fetch-status")
const countryDropdownContainer = document.getElementById("country-items")
const refreshCB = document.getElementById("refresh-cb")
var currentTimeUntilRefetch = 55
var currentRFCountdownId = 0
var shownMarkers = 0
const regionNamesInEnglish = new Intl.DisplayNames(['en'], { type: 'region' });

function updateStatus(message, color) {
  statusP.style.color = color
  statusP.innerHTML = message
}

function startReFetch() {
  currentTimeUntilRefetch = 55
  setTimeout(() => {
    currentRFCountdownId = setInterval(() => {
      updateStatus("Next Fetch: " + currentTimeUntilRefetch.toString(), "white")
      if (currentTimeUntilRefetch == 0) {
        clearInterval(currentRFCountdownId)
        updateProxies()
      }
      if (!refreshCB.checked) currentTimeUntilRefetch--
    }, 1000)
  }, 5000)
}

function updateProxies() {
  updateStatus("Fetching Proxies...", "white")
  fetch(`/proxy/?limit=10000`, {
    method: "GET",
    cache: 'no-cache',
  }).then((response) => {
    console.log("Got response")
    if (response.status != 200) {
      console.log("proxy fetch: status error")
      updateStatus("Fetch Error (" + response.status.toString() + " - " + response.statusText + ")", "red")
      startReFetch()
      return
    }
    response.json().then(proxArr => {
      console.log(proxArr)
      proxArr.forEach(function(part, index, theArray) {
        theArray[index].speed = Math.round(part.speed*1000)
        theArray[index].lc = new Date(Date.now()-Date.parse(part.lc)).getMinutes()
      })
      proxies = proxArr
      updateMarkers()
      updateCountryDropdown()
      updateStatus("Fetch Success!", "green")
      startReFetch()
    })
  })
  .catch(error => {
    console.log("proxy fetch: network error")
    updateStatus("Fetch Error - Network Failure", "red")
    startReFetch()
  })
}

function generatePopupString(proxy) {
  var protocs = ""
  for (var p of proxy.protocs) {
    protocs += protocsCode[p] + " "
  }
  var hrs = Math.floor(proxy.lc/60).toString().padStart(2, '0')
  var mins = (proxy.lc%60).toString().padStart(2, '0')
  return proxy.ip + ":" + proxy.port.toString() + "<br>"
    + proxy.city + ", " + proxy.region + ", " + proxy.country + "<br>"
    + "Protocols: " + protocs + "<br>"
    + "Anon: " + anonCode[proxy.anon] + "<br>"
    + "Speed: " + proxy.speed.toString() + "ms<br>"
    + `Last Checked: (${hrs}h ${mins}m)`
}

function updateMarkers() {
  for (var prox of proxies) {
    let alreadyHasMarker = false
    for (var m of markers) {
      if (m.options.title == prox.ip) alreadyHasMarker = true
    }
    if (alreadyHasMarker) continue
    var icon = undefined
    switch(true) {
      case (prox.speed <= 1000):
        icon = redIcon
        break;
      case (prox.speed <= 2000):
        icon = violetIcon
        break;
      case (prox.speed <= 3000):
        icon = orangeIcon
        break;
      case (prox.speed <= 4000):
        icon = goldIcon
        break;
      case (prox.speed <= 5000):
        icon = yellowIcon
        break;
      case (prox.speed <= 6000):
        icon = greenIcon
        break;
      case (prox.speed <= 7000):
        icon = blueIcon
        break;
      case (prox.speed <= 8500):
        icon = greyIcon
        break;
      case (prox.speed <= 10000):
        icon = blackIcon
        break;
      default:
        icon = blackIcon
    }
    var newMarker = L.marker([prox.lat, prox.lon], {
      title: prox.ip,
      icon: icon
    })
    newMarker.bindPopup(generatePopupString(prox))
    
    otherMarkerAtSamePos = undefined
    for (var marker of markers) {
      if (marker.getLatLng().lat == newMarker.getLatLng().lat && marker.getLatLng().lng == newMarker.getLatLng().lng) {
        otherMarkerAtSamePos = marker
      }
    }
    
    if (otherMarkerAtSamePos != undefined) { //meaning that there is another marker at the same position (and we cant have that)
      console.log("There is another marker at " + prox.ip)
      if (clusters.get(newMarker.getLatLng().lat) == undefined) { // if there isnt a cluster yet
        console.log("There is NOT a cluster at " + prox.ip + "'s position yet")
        var markerCluster = L.markerClusterGroup({
	      showCoverageOnHover: true,
	      zoomToBoundsOnClick: false,
          iconCreateFunction: function(cluster) {
            var markers = cluster.getAllChildMarkers()
            var num = cluster.getChildCount()
            for (var m of markers) {
              if (m.options.opacity == 0.1) num--
            }
            var className = "rounded-cluster-icon"
            if (num == 0) className = "rounded-cluster-icon rci-transparent"
	        return L.divIcon({ html: '<b> ' + num + ' </b>', className: className});
	      }
        })
        clusters.set(newMarker.getLatLng().lat, markerCluster)
        map.removeLayer(otherMarkerAtSamePos)
        markerCluster.addLayer(otherMarkerAtSamePos)
        markerCluster.addLayer(newMarker)
        map.addLayer(markerCluster)
      } else { //there is a cluster, meaning that we need to add it to the existing one
        console.log("There IS a cluster at " + prox.ip + "'s position, adding it")
        var markerCluster = clusters.get(newMarker.getLatLng().lat)
        markerCluster.addLayer(newMarker)
        markerCluster.refreshClusters()
      }
    } else {
      newMarker.addTo(map)
    }
    markers.push(newMarker)
  }
  updateMap()
}

function updateMap() {
  console.log("running um..")
  var shown = 0
  for (var prox of proxies) {
    var shouldShow = true
    if (currentFilters.countries.length != 0 && currentFilters.countries.indexOf(prox.country) == -1) shouldShow = false
    if (currentFilters.city != "" && prox.city.indexOf(currentFilters.city) == -1) shouldShow = false
    if (currentFilters.region != "" && prox.region.indexOf(currentFilters.region) == -1) shouldShow = false
    if (currentFilters.protocs.length != 0 && !(prox.protocs.some(e => currentFilters.protocs.includes(e)))) shouldShow = false
    if (currentFilters.anons.length != 0 && !(prox.anon in currentFilters.anons)) shouldShow = false
    if (currentFilters.lc <= prox.lc) shouldShow = false
    if (prox.speed >= currentFilters.speed) shouldShow = false
    var markerForP = undefined
    for (var m of markers) {
      if (m.options.title == prox.ip) markerForP = m
    }
    if (markerForP == undefined) {
      console.log("For some reason, markerForP is undefined for " + prox.ip + ". This is definetly a code problem.")
    }
    if (shouldShow) {
      markerForP.setOpacity(1.0)
      shown++
    } else {
      markerForP.setOpacity(0.1)
    }
  }
  for (var c of clusters.values()) {
    c.refreshClusters()
  }
  shownMarkers = shown
  updateStats()
}

function updateStats() {
  statsP.innerHTML = "Current proxies: " + proxies.length.toString() + ", shown: " + shownMarkers.toString()
}

function cUncheckAll() {
  var listedCountries = countryDropdownContainer.getElementsByClassName("country-li")
  for (var e of listedCountries) {
    if (e.children[0].checked) document.getElementById("countries-all").checked = false
    var eCC = e.innerHTML.split(">")[1].split(" ")[0]
    if (!e.children[0].checked && currentFilters.countries.indexOf(eCC) != -1) currentFilters.countries.splice(currentFilters.countries.indexOf(eCC), 1)
    if (e.children[0].checked && currentFilters.countries.indexOf(eCC) == -1) currentFilters.countries.push(eCC)
  }
  updateMap()
}

function updateCountryDropdown() {
  var currentCountriesCodes = []
  for (var proxy of proxies) {
    if (currentCountriesCodes.indexOf(proxy.country) == -1) currentCountriesCodes.push(proxy.country)
  }
  
  var listedCountries = Array.from(countryDropdownContainer.getElementsByClassName("country-li"))
  var currentlyListedCCs = []
  for (var e of listedCountries) {
    currentlyListedCCs.push(e.innerHTML.split(">")[1].split(" ")[0])
  }
  
  for (var countryCode of currentCountriesCodes) {
    if (currentlyListedCCs.indexOf(countryCode) == -1) { //If it isn't shown and should be
      var newLi = document.createElement("li")
      newLi.className = "country-li"
      var newCB = document.createElement("input")
      newCB.type = "checkbox"
      newLi.appendChild(newCB)
      newLi.innerHTML = newLi.innerHTML.concat(countryCode + " (" + regionNamesInEnglish.of(countryCode) + ")")
      countryDropdownContainer.appendChild(newLi)
    }
  }
  listedCountries = Array.from(countryDropdownContainer.getElementsByClassName("country-li"))
  for (var child of listedCountries) {
    child.children[0].onchange = cUncheckAll
  }
  for (var listedCode of currentlyListedCCs) {
    if (currentCountriesCodes.indexOf(listedCode) == -1) {// If it is shown and shouldnt be
      var eToDelete = listedCountries.find(element => element.innerHTML.split(">")[1].split(" ")[0] == listedCode)
      eToDelete.remove()
    }
  }
}

function generateProxyURLFromShown() {
  var countriesString = ""
  if (currentFilters.countries.length > 0) {
    currentFilters.countries.forEach((c) => {
      countriesString = countriesString.concat("countries=" + c + "&")
    })
  }
  
  var protocsString = ""
  if (currentFilters.protocs.length > 0) {
    currentFilters.protocs.forEach((p) => {
      protocsString = protocsString.concat("protocs=" + p + "&")
    })
  }
  
  return location.origin + `/pac/?speed=${currentFilters.speed}&lc=${currentFilters.lc}&limit=${shownMarkers}&${countriesString}${protocsString}`
}

window.onload = function() {
  updateProxies()
}