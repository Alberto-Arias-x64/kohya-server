const MAX_FILES = 10;
const POLLING_INTERVAL = 20000; // 20 seconds

const trainButton = document.getElementById('train-button');
const clearButton = document.getElementById('clear-button');
const fileInput = document.getElementById('photos');
const fileValidation = document.getElementById('file-validation');
const trainingStatus = document.getElementById('training-status');
const queueStatusValue = document.getElementById('queue-status-value');
const queuePendingTasks = document.getElementById('queue-pending-tasks');
const queueCurrentTask = document.getElementById('queue-current-task');
const taskIdElement = document.getElementById('task-id');
const taskLogElement = document.getElementById('task-log');
let trainingId = null;
let pollingInterval = null;
let eventSource = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

function clearForm() {
  fileInput.value = '';
  fileValidation.textContent = '';
  trainingStatus.textContent = '';
  updateTaskId(null);
  trainButton.disabled = true;
  stopTaskStatus();
  trainingId = null;
}

function validateFiles(files) {
  if (files.length === 0) {
    fileValidation.textContent = 'Please select at least one image';
    return false;
  }
  
  if (files.length > MAX_FILES) {
    fileValidation.textContent = `Maximum ${MAX_FILES} images allowed`;
    return false;
  }

  const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
  if (invalidFiles.length > 0) {
    fileValidation.textContent = 'Only image files are allowed';
    return false;
  }

  fileValidation.textContent = '';
  return true;
}

function updateButtonState() {
  trainButton.disabled = fileInput.files.length === 0;
}

function updateQueueStatus(status, queue, currentTask, log) {
  queueStatusValue.textContent = status;
  queuePendingTasks.textContent = queue;
  queueCurrentTask.textContent = currentTask || 'None';
  
  // Update color based on status
  if (status === 'RUNNING') {
    queueStatusValue.style.color = '#10B981'; // green
  } else if (status === 'PAUSED') {
    queueStatusValue.style.color = '#F59E0B'; // yellow
  } else if (status === 'STOPPED') {
    queueStatusValue.style.color = '#EF4444'; // red
  } else {
    queueStatusValue.style.color = '#3B82F6'; // blue
  }

  if (log) taskLogElement.textContent = log;
}

function showQueueError() {
  queueStatusValue.textContent = 'Connection Error';
  queueStatusValue.style.color = '#EF4444';
  queuePendingTasks.textContent = '-';
  queueCurrentTask.textContent = 'Connection lost';
}

function updateTaskId(id) {
  if (id) {
    taskIdElement.textContent = `Task ID: ${id}`;
    taskIdElement.style.display = 'block';
  } else {
    taskIdElement.textContent = '';
    taskIdElement.style.display = 'none';
  }
}

function listenQueueStatus() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/api/kohya/status');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateQueueStatus(data.status, data.queue, data.currentTask, data.log);
    
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
      showQueueError();
      setTimeout(listenQueueStatus, reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      showQueueError();
      queueCurrentTask.textContent = 'Please refresh the page to reconnect';
      clearInterval(pollingInterval);
    }
  };
}

async function checkTask() {
  if (!trainingId) return;

  try {
    const response = await fetch('/api/kohya/taskInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: trainingId }),
    });

    if (!response.ok) throw new Error('Failed to check task status');
    
    const data = await response.json();
    trainingStatus.innerHTML = `Current task status: ${data.info.status}<br><span style='font-size:0.9em;color:#888;'>${data.info.log || ''}</span>`;
    
    if (data.info.status === 'COMPLETED' || data.info.status === 'FAILED') {
      clearInterval(pollingInterval);
      trainButton.disabled = false;
    }
  } catch (error) {
    console.error('Error checking task status:', error);
    clearInterval(pollingInterval);
    trainingStatus.textContent = 'Error checking task status';
  }
}

function checkTaskStatus() {
  // Start task status polling if we have a training ID
  if (trainingId) {
    checkTask();
    pollingInterval = setInterval(checkTask, POLLING_INTERVAL);
  }
}

function stopTaskStatus() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (validateFiles(files)) {
    updateButtonState();
  } else {
    trainButton.disabled = true;
  }
});

document.getElementById('train-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const files = fileInput.files;
  
  if (!validateFiles(files)) return;
  
  trainButton.disabled = true;
  trainingStatus.textContent = 'Uploading files...';
  updateTaskId(null);

  stopTaskStatus();
  
  try {
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) throw new Error('Upload failed');
    
    const uploadData = await uploadResponse.json();
    trainingId = uploadData.id;
    updateTaskId(trainingId);
    
    trainingStatus.textContent = 'Starting training...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const trainResponse = await fetch('/api/kohya/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: trainingId }),
    });

    if (!trainResponse.ok) throw new Error('Training failed to start');
    
    trainingStatus.textContent = 'Training started';
    checkTaskStatus();
    
  } catch (error) {
    console.error('Error:', error);
    trainingStatus.textContent = 'Error: ' + error.message;
    trainButton.disabled = false;
    stopTaskStatus();
    updateTaskId(null);
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Reconnect when page becomes visible again
    reconnectAttempts = 0;
    listenQueueStatus();
  }
});

// Initial connection
listenQueueStatus();

// Add clear button event listener
clearButton.addEventListener('click', clearForm);
