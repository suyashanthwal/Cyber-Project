let backendUrl = '';

async function discoverServer() {
    const commonPorts = [5000];
    const commonIPs = [
        '127.0.0.1',
        ...Array.from({ length: 255 }, (_, i) => `192.168.1.${i}`),
        ...Array.from({ length: 255 }, (_, i) => `192.168.0.${i}`),
        ...Array.from({ length: 255 }, (_, i) => `172.20.10.${i}`)
    ];

    for (const ip of commonIPs) {
        for (const port of commonPorts) {
            try {
                const response = await fetch(`http://${ip}:${port}/get-server-info`);
                const data = await response.json();
                if (data.success) {
                    backendUrl = `http://${data.ip}:${data.port}`;
                    console.log('Server found at:', backendUrl);
                    return true;
                }
            } catch (error) {
                console.error(`Failed to connect to ${ip}:${port} -`, error);
            }
        }
    }
    return false;
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


async function uploadFile() {
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

    try {
        const response = await fetch(`${backendUrl}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            alert('File uploaded successfully! Encrypted as: ' + data.encrypted_file);
        } else {
            alert('Upload failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. See console for details.');
    }
}

async function discoverDevices() {
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = 'Searching for devices...';

    if (!backendUrl) {
        devicesList.innerHTML = 'Not connected to server. Please refresh the page or use the Retry Connection button.';
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/discover`);
        const data = await response.json();

        if (data.success) {
            devicesList.innerHTML = `<li>Receiver found: ${data.message}</li>`;
        } else {
            devicesList.innerHTML = 'No devices found.';
        }
    } catch (error) {
        console.error('Error discovering devices:', error);
        devicesList.innerHTML = 'Error discovering devices. Please check if the server is running.';
    }
}
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

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry Connection';
    retryButton.style.marginTop = '15px';
    retryButton.onclick = async (e) => {
        e.preventDefault();
        const found = await discoverServer();
        alert(found ? 'Connected to server!' : 'Could not find server');
    };
    loginForm.appendChild(retryButton);
});

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${backendUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        alert(data.message);

        if (data.success) {
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${backendUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

function showSendFile() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('send-file-page').style.display = 'block';
}

function showReceiveFile() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('receive-file-page').style.display = 'block';
    refreshFileList();
}

async function refreshFileList() {
    const select = document.getElementById('available-files');
    select.innerHTML = '<option value="">Loading files...</option>';

    try {
        const response = await fetch(`${backendUrl}/list-files`);
        const data = await response.json();

        if (data.success) {
            if (data.files.length === 0) {
                select.innerHTML = '<option value="">No files available</option>';
            } else {
                select.innerHTML = '<option value="">Select a file to download</option>';
                data.files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file;
                    option.textContent = file.replace('encrypted_', '');
                    select.appendChild(option);
                });
            }
        } else {
            select.innerHTML = '<option value="">Error loading files</option>';
        }
    } catch (error) {
        console.error('Error loading files:', error);
        select.innerHTML = '<option value="">Error loading files</option>';
    }
}


function goToDashboard() {
    document.getElementById('send-file-page').style.display = 'none';
    document.getElementById('receive-file-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
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

function setManualIP() {
    const ipInput = document.getElementById('server-ip');
    const ip = ipInput.value.trim();
    
    if (!ip) {
        alert('Please enter a server IP address');
        return;
    }
    fetch(`http://${ip}:5000/get-server-info`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                backendUrl = `http://${ip}:5000`;
                alert('Successfully connected to server!');
                const statusElement = document.querySelector('div[style*="position: fixed"]');
                if (statusElement) {
                    statusElement.textContent = 'Connected to server';
                    statusElement.style.backgroundColor = 'rgba(0,255,0,0.7)';
                    setTimeout(() => statusElement.remove(), 3000);
                }
            } else {
                alert('Could not connect to server at this IP');
            }
        })
        .catch(error => {
            console.error('Connection error:', error);
            alert('Could not connect to server at this IP. Please check the IP and try again.');
        });
}