#Generated (as a base) w/ chatgpt
FROM python:3.10

# Set the working directory in the container
VOLUME /app
WORKDIR /app

# Copy the application code into the container
COPY . .

# make the save.json file (wont run without it)
RUN echo '{"last_scan_times": {}, "saves": []}' > persistent/save.json
RUN echo '{"startup_min_lastcheck_to_rescan": 30,"nominatim_domain": "nominatim.openstreetmap.org","live_check_freq": 10,"dead_check_freq": 60}' > persistent/config.json

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port that Uvicorn will listen on
EXPOSE 7769

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7769"]
