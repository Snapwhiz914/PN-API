# PN-API
## Overview

An API made to find proxies and filter them to be used in a .PAC file or a proxychain software.
 - Collects proxies from almost 100 sources
 - Checks each proxy and determines its speed, approximate location, and anonymity
 - Serves a site that displays all of the proxies on a map and generates a PAC file to use

## Installation

### Before usage, consider:

At this point, the project's website is a minimal leaflet map with markers displaying the 

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

After starting the application (or container), navigate to the Web UI on port 7769 of whatever machine it is running it on. You'll be greeted with a map 