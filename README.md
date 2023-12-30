# PN-API
## Overview

An API made to find proxies and filter them to be used in a .PAC file or a proxychain software.
 - Collects proxies from almost 100 sources
 - Checks each proxy and determines its speed, approximate location, and anonymity
 - Serves a website that displays all found proxies on a map using an IP location API
 - Serves a dynamic, configurable PAC file for use in browser or operating system proxy settings
 - Saves proxies in between launches (automatically saves every 5 minutes)

## Installation

### Before usage, consider:

At this point, the project's website is a minimal leaflet map with markers displaying the proxies. There is no authentication, so it should be installed behind a firewall or secure LAN.

### Quick install: Get up and running

Using a python 3.9 or higher environment:

```
git clone https://github.com/Snapwhiz914/PN-API
cd PN-API
pip3 install -r requirements.txt
python3 main.py
```

### Using docker

If necessary, I will host a docker image on DockerHub. For now, you can build the image yourself from the Dockerfile.

## Usage

After starting the application (or container), navigate to the Web UI on port 7769 of whatever machine it is running it on. You'll be greeted with a map, a bar menu on the top to filter proxies, and statistic information on the bottom bar.
 - Use the top bar to filter by country, city, speed, etc.
 - Use the bottom bar to generate a .pac file with the current filters, read scanning statistics or force save the current proxies

## API Endpoints

In case you want to access the data in a programatic format, here are the API endpoints (the same one that the website uses):
 - GET /proxy: Access the scanned proxies, the default limit returned is 20. Paging is not implemented, since the following query arguments can fine tune your search:
   - limit (int): The limit of proxies to return
   - city (string): Filter by city name
   - countries (string list): Filter by multiple country names
   - speed (int): The minimum speed (in ms) of a proxy
   - protocs (int list): Filter by protocol. http: 0, https: 1, socks4: 2, socks5: 3
   - last_check (int): The maximum last updated check (in minutes) of a proxy
 - GET /pac: Returns a .js file in the PAC format, using the ```pac_template.js``` file as a template. Query arguments to filter the proxy selection are the same as above.
 - POST /constraints: Constrain the scanner to look for proxies matching only the filters given. Note that this only affects the HideMy.net and PubProxy scans (which don't return much anyway), so it generally won't have any use.
 - GET /constraints: Read the current constraints.
 - GET /scan_stats: Returns information about the scanner in a JSON format.
   - scan_q_len (int): The number of proxies waiting to be scanned.
   - check_back_len (int): The number of addresses to be re-checked.
   - current_proxies_len (int): The number of proxies that were up in the last 15 minutes
 - POST /force_save: Write out the current proxies to the save.json file immediately. Does not change the timing of the auto save thread.
