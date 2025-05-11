#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script as root (sudo)"
    exit 1
fi

# Update system
print_message "Updating system..."
apt update && apt upgrade -y

# Install Nginx
print_message "Installing Nginx..."
apt install nginx -y

# Create SSL certificates directory
print_message "Creating SSL certificates directory..."
mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificates
print_message "Generating self-signed SSL certificates..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create Nginx configuration
print_message "Creating Nginx configuration..."
cp ./nginx.conf /etc/nginx/nginx.conf

# Verify Nginx configuration
print_message "Verifying Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    # Restart Nginx
    print_message "Restarting Nginx..."
    systemctl restart nginx

    # Enable Nginx to start on boot
    print_message "Enabling Nginx to start on boot..."
    systemctl enable nginx

    # Check Nginx status
    print_message "Checking Nginx status..."
    systemctl is-active nginx

    print_message "Installation completed successfully!"
    print_message "Your Express server is now available at:"
    print_message "HTTP: http://localhost"
    print_message "HTTPS: https://localhost"
    print_warning "Note: Since you're using self-signed certificates, the browser will show a security warning."
else
    print_error "Nginx configuration has errors. Please check the logs."
    exit 1
fi

# Enable firewall
print_message "Enabling firewall..."
ufw allow 'Nginx Full'
ufw enable
sudo ufw status

# Show port information
print_message "Checking used ports..."
netstat -tulpn | grep -E ':80|:443' 

print_message "Nginx installation completed successfully!"