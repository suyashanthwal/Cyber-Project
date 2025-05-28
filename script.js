let backendUrl = '';

// Function to discover the server
async function discoverServer() {
    // Try common local network IP patterns
    const commonPorts = [5000];
    const commonIPs = [
        '127.0.0.1',  // localhost
        ...Array.from({length: 255}, (_, i) => `192.168.1.${i}`),
        ...Array.from({length: 255}, (_, i) => `192.168.0.${i}`),
        ...Array.from({length: 255}, (_, i) => `172.20.10.${i}`)
    ];

    for (const ip of commonIPs) {
        for (const port of commonPorts) {
            try {
                const response = await fetch(`http://${ip}:${port}/get-server-info`, {
                    timeout: 100  // Short timeout to keep the search fast
                });
                const data = await response.json();
                if (data.success) {
                    backendUrl = `http://${data.ip}:${data.port}`;
                    console.log('Server found at:', backendUrl);
                    return true;
                }
            } catch (e) {
                // Ignore errors and continue searching
            }
        }
    }
    return false;
}

// Initialize server discovery when the page loads
window.addEventListener('load', async () => {
    const statusElement = document.createElement('div');
    statusElement.style.position = 'fixed';
    statusElement.style.top = '10px';
    statusElement.style.right = '10px';
    statusElement.style.padding = '10px';
    statusElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    statusElement.style.color = 'white';
    statusElement.style.borderRadius = '5px';
    document.body.appendChild(statusElement);

    statusElement.textContent = 'Searching for server...';
    const found = await discoverServer();
    
    if (found) {
        statusElement.textContent = 'Connected to server';
        setTimeout(() => statusElement.remove(), 3000);
    } else {
        statusElement.textContent = 'Could not find server';
        statusElement.style.backgroundColor = 'rgba(255,0,0,0.7)';
    }
});

// Add retry connection button to the login page
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry Connection';
    retryButton.onclick = async (e) => {
        e.preventDefault();
        const found = await discoverServer();
        alert(found ? 'Connected to server!' : 'Could not find server');
    };
    loginForm.appendChild(retryButton);
});

function login() {
    if (!backendUrl) {
        alert('Not connected to server. Please retry connection.');
        return;
    }
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error:', error));
}

function showSendFile() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('send-file-page').style.display = 'block';
}

function showReceiveFile() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('receive-file-page').style.display = 'block';
    refreshFileList(); // Automatically load the file list when showing the receive page
}

function refreshFileList() {
    const select = document.getElementById('available-files');
    select.innerHTML = '<option value="">Loading files...</option>';

    fetch(`${backendUrl}/list-files`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                select.innerHTML = '<option value="">Select a file to download</option>';
                data.files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file;
                    option.textContent = file.replace('encrypted_', ''); // Show original filename
                    select.appendChild(option);
                });
                if (data.files.length === 0) {
                    select.innerHTML = '<option value="">No files available</option>';
                }
            } else {
                select.innerHTML = '<option value="">Error loading files</option>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            select.innerHTML = '<option value="">Error loading files</option>';
        });
}

function downloadSelectedFile() {
    const select = document.getElementById('available-files');
    const filename = select.value;
    
    if (!filename) {
        alert('Please select a file to download.');
        return;
    }
    
    window.open(`${backendUrl}/download/${filename}`, '_blank');
}

function goToDashboard() {
    document.getElementById('send-file-page').style.display = 'none';
    document.getElementById('receive-file-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const devicesList = document.getElementById('devices-list');
    
    if (!fileInput.files.length) {
        alert('Please select a file.');
        return;
    }
    
    if (!devicesList.innerHTML.includes('Receiver found')) {
        alert('Please discover and select a receiver.');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('File uploaded successfully! Encrypted as: ' + data.encrypted_file);
        } else {
            alert('Upload failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Upload failed. See console for details.');
    });
}


function startReceiving() {
    alert('Listening for incoming files...');
}

function toggleForms() {
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');
    if (loginPage.style.display === 'none') {
        loginPage.style.display = 'block';
        registerPage.style.display = 'none';
    } else {
        loginPage.style.display = 'none';
        registerPage.style.display = 'block';
    }
}

function discoverDevices() {
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = "Searching for devices...";

    if (!backendUrl) {
        devicesList.innerHTML = "Not connected to server. Please refresh the page or use the Retry Connection button.";
        return;
    }

    fetch(`${backendUrl}/discover`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                devicesList.innerHTML = `<li>Receiver found: ${data.message}</li>`;
            } else {
                devicesList.innerHTML = "No devices found.";
            }
        })
        .catch(error => {
            console.error("Error discovering devices:", error);
            devicesList.innerHTML = "Error discovering devices. Please check if the server is running.";
        });
}