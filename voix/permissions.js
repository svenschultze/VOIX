// Permissions page script for VOIX extension
console.log('VOIX Permissions page loaded');

let stream = null;

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('grant-permission').addEventListener('click', async () => {
    await grantMicrophonePermission();
  });

  document.getElementById('skip-permission').addEventListener('click', () => {
    skipPermission();
  });
}

async function grantMicrophonePermission() {
  try {
    showStatus('Requesting microphone access...', 'info');
    
    // Request microphone permission
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // Permission granted, stop the stream immediately
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    showStatus('✅ Microphone access granted! Voice input is now available in VOIX.', 'success');
    
    // Disable the grant button and enable the close action
    document.getElementById('grant-permission').disabled = true;
    document.getElementById('grant-permission').textContent = 'Permission Granted';
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      window.close();
    }, 3000);

  } catch (error) {
    console.error('Error requesting microphone access:', error);
    
    let errorMessage = 'Failed to access microphone';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Microphone access denied. Please check your browser settings and try again.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone and try again.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Microphone is already in use by another application.';
    }
    
    showStatus('❌ ' + errorMessage, 'error');
  }
}

function skipPermission() {
  showStatus('Voice input will not be available. You can enable it later in the extension options.', 'info');
  setTimeout(() => {
    window.close();
  }, 2000);
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}