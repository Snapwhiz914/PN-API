#Generated (as a base) w/ chatgpt
FROM python:3.10

# Set the working directory in the container
WORKDIR /app

# make the save.json file (wont run without it)
RUN echo "{}" > save.json

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose the port that Uvicorn will listen on
EXPOSE 7769

CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "7769"]