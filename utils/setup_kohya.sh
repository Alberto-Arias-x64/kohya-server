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

# Clone Kohya
cd /home/flux
print_message "Cloning Kohya..."
git clone --recursive https://github.com/bmaltais/kohya_ss.git

# Activate virtual environment
cd kohya_ss
pyenv shell 3.10.9
sudo apt install python3-venv
sudo apt install python3-tk

# Install dependencies
print_message "Installing dependencies..."
./gui-uv.sh --listen 127.0.0.1 --server_port 7860 &
PID=$!

# Wait for the server to start
# print_message "Waiting for the server to start..."
# while ! curl -s http://127.0.0.1:7860 > /dev/null; do
#     sleep 1
# done

# wait for the server to be ready
print_message "Waiting for the server to be ready..."
sleep 90

# Kill the server
print_message "Killing the server..."
kill $PID

print_message "Installation complete!"