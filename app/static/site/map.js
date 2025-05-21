var proxies = []
var markers = []
var clusters = new Map()
var currentFilters = {
  countries: [],
  city: "",
  region: "",
  protocs: [],
  anons: [],
  speed: 5000,
  lc: 720
}

var protocsCode = {
  [-1]: "UNKNOWN",
  0: "HTTP",
  1: "HTTPS",
  2: "SOCKS4",
  3: "SOCKS5"
}

var anonCode = {
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
const statsPopup = document.getElementById("stats-text")
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
        theArray[index].lc = new Date(Date.now()-Date.parse(part.last_check)).getMinutes()
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
  var hrs = Math.floor(proxy.lc/60).toString().padStart(2, '0')
  var mins = (proxy.lc%60).toString().padStart(2, '0')
  return proxy.uri + "<br>"
    + proxy.city + ", " + proxy.region + ", " + proxy.country + "<br>"
    + "Protocols: " + protocsCode[proxy.protoc] + "<br>"
    + "Anon: " + anonCode[proxy.anon] + "<br>"
    + "Speed: " + proxy.speed.toString() + "ms<br>"
    + "Reliability: " + proxy.reliability + "pts<br>"
    + `Last Checked: (${hrs}h ${mins}m)`
}

function updateMarkers() {
  for (var prox of proxies) {
    let alreadyHasMarker = false
    for (var m of markers) {
      if (m.options.title == prox.uri) {
        alreadyHasMarker = true
        m._popup._content = generatePopupString(prox)
      }
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
    if (prox.lat == null || prox.lon == null) continue
    var newMarker = L.marker([prox.lat, prox.lon], {
      title: prox.uri,
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
      // console.log("There is another marker at " + prox.uri)
      if (clusters.get(newMarker.getLatLng().lat) == undefined) { // if there isnt a cluster yet
        // console.log("There is NOT a cluster at " + prox.uri + "'s position yet")
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
        console.log("There IS a cluster at " + prox.uri + "'s position, adding it")
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
    if (currentFilters.anons.length != 0 && !(currentFilters.anons.some(e => prox.anon == e))) shouldShow = false
    if (currentFilters.lc <= prox.lc) shouldShow = false
    if (prox.speed >= currentFilters.speed) shouldShow = false
    var markerForP = undefined
    for (var m of markers) {
      if (m.options.title == prox.uri) markerForP = m
    }
    if (markerForP == undefined) {
      console.log("For some reason, markerForP is undefined for " + prox.uri + ". This is definetly a code problem.")
      continue
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
  p = [0, 0, 0, 0, 0]
  a = [0, 0, 0, 0, 0]
  speedTotal = 0
  for (var proxy of proxies) {
    if (proxy.protoc == -1) p[0] = p[0] + 1
    if (proxy.protoc == 0) p[1] = p[1] + 1
    if (proxy.protoc == 1) p[2] = p[2] + 1
    if (proxy.protoc == 2) p[3] = p[3] + 1
    if (proxy.protoc == 3) p[4] = p[4] + 1
    
    if (proxy.anon == -1) a[0] = a[0] + 1
    if (proxy.anon == 0) a[1] = a[1] + 1
    if (proxy.anon == 1) a[2] = a[2] + 1
    if (proxy.anon == 2) a[3] = a[3] + 1
    if (proxy.anon == 3) a[4] = a[4] + 1
    speedTotal = speedTotal += proxy.speed
  }
  statsPopup.innerHTML = "Protocs: U " + p[0] + ", H " + p[1] + ", HS " + p[2] + ", S4 " + p[3] + ", S5 " + p[4] + "<br>"
  + "Anons: U " + a[0] + ", N " + a[1] + ", L " + a[2] + ", M " + a[3] + ", H " + a[4] + "<br>"
  + "Avg speed: " + Math.round(speedTotal/proxies.length) + "ms"
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
    if (countryCode == "") continue
    if (currentlyListedCCs.indexOf(countryCode) == -1) { //If it isn't shown and should be
      var newLi = document.createElement("li")
      newLi.className = "country-li"
      var newCB = document.createElement("input")
      newCB.type = "checkbox"
      newLi.appendChild(newCB)
      var name = "N/A"
      try {
        regionNamesInEnglish.of(countryCode)
      } catch (error) {
        console.log(error)
      }
      newLi.innerHTML = newLi.innerHTML.concat(countryCode + " (" + name + ")")
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
  
  var anonsString = ""
  if (currentFilters.anons.length > 0) {
    currentFilters.anons.forEach((a) => {
      anonsString = anonsString.concat("anons=" + a + "&")
    })
  }
  
  return location.origin + `/pac/?speed=${currentFilters.speed}&lc=${currentFilters.lc}&limit=${shownMarkers}&${countriesString}${protocsString}${anonsString}`
}

window.onload = function() {
  updateProxies()
}
