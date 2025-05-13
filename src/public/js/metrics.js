let pollingInterval;
const POLLING_INTERVAL = 30000;

async function fetchMetrics() {
  try {
    const response = await fetch('/api/metrics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const metrics = await response.json();

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

  } catch (error) {
    console.error('Error fetching metrics:', error);
    document.getElementById('gpu-info').innerHTML = `
      <div class="error-message">
        Error fetching metrics. Will retry in ${POLLING_INTERVAL/1000} seconds.
      </div>
    `;
  }
}

function startPolling() {
  fetchMetrics();
  pollingInterval = setInterval(fetchMetrics, POLLING_INTERVAL);
}

startPolling();