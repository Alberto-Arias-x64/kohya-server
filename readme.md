# Start up codes

## Pod configurations
* **Graphic card:** `ANY of Nvidia (4090RTX recommended)`
* **Template:** `Community -> Ubuntu:latest`
* **Container disk:** `100Gb`
* **Volume disk:** `0Gb`
* **Check SSH Terminal Access:** `True`
* **Setup time:** *~12min*

## How to set up a pod

### 1. Connect by ssh or web console
Conect to de pot for web console or SSH *(You need generate and add your public key in Runpod to conect by SSH)*
``` bash
ssh root@123.456.7.89 -p 40121 -i ~/.ssh/id_ed25519
```

### 2. Download server
``` bash
# CHANGE THIS URL
wget https://raw.githubusercontent.com/Alberto-Arias-x64/kohya-server/refs/heads/main/utils/setup_server.sh -O setup.sh
source setup.sh
```

### 3. Await the restart of the server and reconnect
Once the script has finished running, the pod must be restarted through the runpod interface to apply the changes to the controllers.

### 4. Start server
``` bash
pm2 start /home/flux/server/utils/ecosystem.config.json
pm2 logs
```
* Kohya server is running on port 7865
* ComfyUI is running on port 7860
* Training server is running on port 3000