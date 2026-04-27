FROM freeradius/freeradius-server:3.2.8

# Install required packages
RUN apt-get update && \
    apt-get install -y freeradius-utils freeradius-postgresql && \
    rm -rf /var/lib/apt/lists/*

# Create required directories
RUN mkdir -p /etc/freeradius && \
    mkdir -p /var/log/freeradius && \
    mkdir -p /var/run/radiusd && \
    chown -R freerad:freerad /etc/freeradius /var/log/freeradius /var/run/radiusd && \
    chmod -R 750 /var/log/freeradius /var/run/radiusd

# Copy configuration files
COPY etc/freeradius/ /etc/freeradius/
COPY scripts/ /scripts/

# Set permissions
RUN chmod -R 640 /etc/freeradius/ && \
    chown -R freerad:freerad /etc/freeradius/ && \
    if [ -d "/scripts" ]; then chmod +x /scripts/*; fi

# Switch to freerad user
USER freerad

# Start FreeRADIUS
CMD ["radiusd", "-f"]