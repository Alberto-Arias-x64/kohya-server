document.addEventListener('DOMContentLoaded', () => {
  let eventSource;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  function connectSSE() {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource('/metrics');
    
    eventSource.onmessage = (event) => {
      const metrics = JSON.parse(event.data);

      // Update CPU metrics
      document.getElementById('cpu-usage').textContent = `${metrics.cpu.usage}%`;
      const coresHtml = metrics.cpu.cores.map((load, index) =>
        `Core ${index}: ${load}%`
      ).join('<br>');
      document.getElementById('cpu-cores').innerHTML = coresHtml;

      // Update Memory metrics
      document.getElementById('memory-usage').textContent = `${metrics.memory.usage}%`;
      document.getElementById('memory-total').textContent = metrics.memory.total;
      document.getElementById('memory-used').textContent = metrics.memory.used;
      document.getElementById('memory-free').textContent = metrics.memory.free;

      // Update GPU metrics
      const gpuHtml = metrics.gpu.map(gpu => `
              <div class="gpu-card">
                  <strong>${gpu.model}</strong>
                  <div class="gpu-metrics">
                      <div>Load: ${gpu.load}%</div>
                      <div>Temperature: ${gpu.temperature}°C</div>
                      <div>VRAM: ${gpu.vram} GB</div>
                      <div>Memory Used: ${gpu.memoryUsed} MB</div>
                      <div>Memory Total: ${gpu.memoryTotal} MB</div>
                      <div>Power Draw: ${gpu.powerDraw} W</div>
                      <div>Fan Speed: ${gpu.fanSpeed}%</div>
                  </div>
              </div>
          `).join('');
      document.getElementById('gpu-info').innerHTML = gpuHtml;

      // Reset reconnect attempts on successful connection
      reconnectAttempts = 0;
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();

      // Attempt to reconnect if under max attempts
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(connectSSE, reconnectDelay);
      } else {
        console.error('Max reconnection attempts reached');
        document.getElementById('gpu-info').innerHTML = `
            <div class="error-message">
                Connection lost. Please refresh the page to reconnect.
            </div>
        `;
      }
    };
  }

  // Initial connection
  connectSSE();

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Reconnect when page becomes visible again
      reconnectAttempts = 0;
      connectSSE();
    }
  });
}); 