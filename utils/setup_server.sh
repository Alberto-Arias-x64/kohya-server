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

# Install curl
print_message "Installing curl..."
apt install -y curl

# Download and install pyenv
print_message "Downloading and installing pyenv..."
curl -fsSL https://pyenv.run | bash

print_message "Adding pyenv to bashrc..."
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init - bash)"' >> ~/.bashrc

print_message "Adding pyenv to profile..."
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.profile
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.profile
echo 'eval "$(pyenv init - bash)"' >> ~/.profile

print_message "Adding pyenv to bash_profile..."
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
echo 'eval "$(pyenv init - bash)"' >> ~/.bash_profile

print_message "restarting shell..."
exec "$SHELL"

# Install python versions
print_message "Installing python versions..."
pyenv install 3.10.9
pyenv install 3.12

# Install node
print_message "Installing node..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 22

## Install Cuda
print_message "Installing Cuda..."
sudo apt install ubuntu-drivers-common -y
ubuntu-drivers devices
sudo ubuntu-drivers autoinstall
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda-toolkit-12-4

# Create working directory
print_message "Creating working directory..."
mkdir -p /home/flux
cd /home/flux

# Install Server
print_message "Installing Server..."
git clone https://github.com/Alberto-Arias-x64/server-template server
cd server
npm install

# Setup ComfyUI
print_message "Setting up ComfyUI..."
chmod +x /home/flux/server/utils/setup_comfy.sh
/home/flux/server/utils/setup_comfy.sh

# Setup Kohya
print_message "Setting up Kohya..."
chmod +x /home/flux/server/utils/setup_kohya.sh
/home/flux/server/utils/setup_kohya.sh

# Setup Nginx
print_message "Setting up Nginx..."
chmod +x /home/flux/server/utils/setup_nginx.sh
/home/flux/server/utils/setup_nginx.sh

# Download models
print_message "Downloading models..."
mkdir -p /home/flux/models
mkdir -p /home/flux/datasets
cd /home/flux/models
curl -L -O https://https://huggingface.co/OwlMaster/realgg/resolve/main/flux1-dev.safetensors
curl -L -O https://huggingface.co/OwlMaster/realgg/resolve/main/ae.safetensors
curl -L -O https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors
curl -L -O https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors
curl -L -O https://huggingface.co/Comfy-Org/flux1-dev/resolve/main/flux1-dev-fp8.safetensors

#  Install Nvtop
print_message "Installing Nvtop..."
sudo apt install nvtop


print_warning "Please reboot your system."
print_message "Installation complete!"