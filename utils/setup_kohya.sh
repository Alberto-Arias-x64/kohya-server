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
apt install python3-venv
apt install python3-tk

#install cuda
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb
dpkg -i cuda-keyring_1.1-1_all.deb
apt-get update
apt-get -y install cuda-toolkit-12-9

apt install -y ubuntu-drivers-common
ubuntu-drivers autoinstall

# Install dependencies
print_message "Installing dependencies..."
printf 'y' | ./gui-uv.sh --listen 127.0.0.1 --server_port 7860 &
PID=$!

# Wait for the server to start
print_message "Waiting for the server to start..."
while ! curl -s http://127.0.0.1:7860 > /dev/null; do
    sleep 1
done

# Kill the server
print_message "Killing the server..."
kill $PID

print_message "Installation complete!"