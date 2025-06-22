FROM python:3.11-slim

WORKDIR /app

# Install poetry
# RUN pip install poetry

# Copy only the requirements file to leverage Docker cache
COPY ./app/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy the rest of the application code
COPY ./app /app
WORKDIR ..
# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 