const backendUrl = 'http://172.20.10.2:5000'; // Replace with the correct IP addressss

function login() {
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
    const discoveryPort = 5000;
    const discoveryMessage = "DISCOVER_SECURE_TRANSFER";
    const devicesList = document.getElementById('devices-list');

    devicesList.innerHTML = "Searching for devices...";

    fetch(`http://172.20.10.2:5000/discover`)
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
            devicesList.innerHTML = "Error discovering devices.";
        });
}

function downloadFile() {
    const filename = document.getElementById('download-filename').value.trim();
    if (!filename) {
        alert('Please enter the encrypted filename.');
        return;
    }
    window.open(`${backendUrl}/download/${filename}`, '_blank');
}