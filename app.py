from flask import Flask, request, jsonify, send_file
from flask_cors import CORS  # Import CORS
from werkzeug.utils import secure_filename
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import mysql.connector
import hashlib
import datetime
import socket
import threading

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = 'uploads'
DECRYPTED_FOLDER = 'decrypted'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DECRYPTED_FOLDER, exist_ok=True)

# Database connection
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "Suyash@6395924223",
    "database": "user_authentication_database"
}

# Encryption key
AES_KEY = b'0123456789abcdef'

# Helper functions
def encrypt_file(file_path):
    with open(file_path, 'rb') as f:
        data = f.read()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted_data = encryptor.update(data) + encryptor.finalize()
    return iv + encrypted_data

def decrypt_file(file_path):
    with open(file_path, 'rb') as f:
        data = f.read()
    iv = data[:16]
    encrypted_data = data[16:]
    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    return decryptor.update(encrypted_data) + decryptor.finalize()

# Discovery settings
DISCOVERY_PORT = 5001
DISCOVERY_MESSAGE = "DISCOVER_SECURE_TRANSFER"

# Respond to discovery requests
@app.route('/discover', methods=['GET'])
def discover():
    return jsonify({"success": True, "message": "Receiver is available"})

# Start a UDP server for discovery
def start_discovery_server():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("", DISCOVERY_PORT))
    print(f"Discovery server running on port {DISCOVERY_PORT}...")
    while True:
        data, addr = sock.recvfrom(1024)
        if data.decode() == DISCOVERY_MESSAGE:
            print(f"Discovery request received from {addr}")
            sock.sendto(b"RECEIVER_AVAILABLE", addr)

# Start the discovery server in a separate thread
threading.Thread(target=start_discovery_server, daemon=True).start()

# Routes
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"success": False, "message": "Invalid request"}), 400
        username = data['username']
        password = data['password']
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "Username already exists"}), 400
        cursor.execute(
            "INSERT INTO users (username, password, registration_date) VALUES (%s, %s, %s)",
            (username, password, datetime.datetime.now())
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Registration successful"})
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"success": False, "message": "Database error"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"success": False, "message": "Invalid request"}), 400
        username = data['username']
        password = data['password']
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        conn.close()
        if result and result[0] == password:
            return jsonify({"success": True, "message": "Login successful"})
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"success": False, "message": "Database error"}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    encrypted_data = encrypt_file(file_path)
    encrypted_path = os.path.join(UPLOAD_FOLDER, f"encrypted_{filename}")
    with open(encrypted_path, 'wb') as f:
        f.write(encrypted_data)
    return jsonify({"success": True, "encrypted_file": f"encrypted_{filename}"})

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    encrypted_path = os.path.join(UPLOAD_FOLDER, filename)
    decrypted_data = decrypt_file(encrypted_path)
    decrypted_path = os.path.join(DECRYPTED_FOLDER, f"decrypted_{filename}")
    with open(decrypted_path, 'wb') as f:
        f.write(decrypted_data)
    return send_file(decrypted_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Bind to all network interfaces
