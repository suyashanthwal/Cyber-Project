import socket
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import hashlib

class CryptoManager:
    def __init__(self):
        self.key = b'0123456789abcdef'  # 16-byte AES key; replace with securely generated key

    def decrypt(self, data):
        from cryptography.hazmat.primitives import padding
        iv = data[:16]
        ct = data[16:]

        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(ct) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        return unpadder.update(padded_data) + unpadder.finalize()

class FileIntegrity:
    @staticmethod
    def get_hash(file_path):
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(4096):
                hasher.update(chunk)
        return hasher.hexdigest()

class FileReceiver:
    def __init__(self, crypto_manager):
        self.crypto = crypto_manager

    def receive_file(self, host, port, save_path):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((host, port))
            s.listen(1)
            print(f"Waiting for connection on {host}:{port}...")
            conn, addr = s.accept()
            print(f"Connection established with {addr}")
            with conn:
                size = int.from_bytes(conn.recv(8), 'big')
                received = b''
                while len(received) < size:
                    chunk = conn.recv(4096)
                    if not chunk:
                        break
                    received += chunk
                decrypted = self.crypto.decrypt(received)
                with open(save_path, 'wb') as f:
                    f.write(decrypted)
                print(f"File received and saved to {save_path}")

if __name__ == "__main__":
    crypto = CryptoManager()
    receiver = FileReceiver(crypto)

    # Receiver configuration
    host = ''  # Listen on all available interfaces
    port = 12345
    save_path = "received_file.txt"  # Default save path

    # Start receiving file
    receiver.receive_file(host, port, save_path)

    # Verify file integrity (optional)
    received_hash = FileIntegrity.get_hash(save_path)
    print(f"SHA-256 hash of received file: {received_hash}")
