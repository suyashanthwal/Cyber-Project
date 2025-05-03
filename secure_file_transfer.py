import bcrypt
import socket
import os
import hashlib
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

import mysql.connector
#   <================================ SUYASH PART=================================>
class AuthSystem:
    def __init__(self):
            self.conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="Suyash@6395924223",
                database="user_authentication_database"
            )
            self.cursor = self.conn.cursor()


    def register(self, username, password):
        # Check if user exists
        self.cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        if self.cursor.fetchone():
            return False
        
        # Store plain password (⚠ NOT SECURE)
        self.cursor.execute(
            "INSERT INTO users (username, password, registration_date) VALUES (%s, %s, NOW())",
            (username, password)
        )
        self.conn.commit()
        return True

    def login(self, username, password):
        self.cursor.execute("SELECT password FROM users WHERE username = %s", (username,))
        result = self.cursor.fetchone()
        if not result:
            return False
        stored_password = result[0]
        return stored_password == password
# <================================ SUYASH PART ENDS======================================>


# <====================================BARMOLA PART=========================================>
class CryptoManager:
    def __init__(self):
        self.key = b'0123456789abcdef'  # 16-byte AES key; replace with securely generated key

    def encrypt(self, data):
        from cryptography.hazmat.primitives import padding
        iv = os.urandom(16)
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data) + padder.finalize()

        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        ct = encryptor.update(padded_data) + encryptor.finalize()
        return iv + ct  # Prepend IV

    def decrypt(self, data):
        from cryptography.hazmat.primitives import padding
        iv = data[:16]
        ct = data[16:]

        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(ct) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        return unpadder.update(padded_data) + unpadder.finalize()
# <==========================BARMOLA PART ENDS=====================================>

# <==================================SWASTIKA PART=================================>
class FileTransfer:
    def __init__(self, crypto_manager):
        self.crypto = crypto_manager

    def send_file(self, host, port, file_path):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((host, port))
            with open(file_path, 'rb') as f:
                data = f.read()
                encrypted = self.crypto.encrypt(data)
                s.sendall(len(encrypted).to_bytes(8, 'big') + encrypted)

    def receive_file(self, host, port, save_path):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((host, port))
            s.listen(1)
            conn, addr = s.accept()
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


class FileIntegrity:
    @staticmethod
    def get_hash(file_path):
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(4096):
                hasher.update(chunk)
        return hasher.hexdigest()
 # <======================================SWASTIKA PART ENDS==========================>

#  <========================================GUI PART=============================>
class SecureTransferApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Secure File Transfer")
        self.auth = AuthSystem()
        self.crypto = CryptoManager()
        self.transfer = FileTransfer(self.crypto)
        self.current_file = None
        
        self.create_login_ui()
        
    def create_login_ui(self):
        self.geometry("300x200")
        ttk.Label(self, text="Username:").pack(pady=5)
        self.user_entry = ttk.Entry(self)
        self.user_entry.pack()
        
        ttk.Label(self, text="Password:").pack(pady=5)
        self.pass_entry = ttk.Entry(self, show="*")
        self.pass_entry.pack()
        
        ttk.Button(self, text="Login", command=self.do_login).pack(pady=10)
        ttk.Button(self, text="Register", command=self.do_register).pack()

    def do_login(self):
        username = self.user_entry.get()
        password = self.pass_entry.get()
        
        if self.auth.login(username, password):
            self.create_main_ui()
        else:
            messagebox.showerror("Error", "Invalid credentials")

    def do_register(self):
        username = self.user_entry.get()
        password = self.pass_entry.get()
        
        if len(password) < 8:
            messagebox.showerror("Error", "Password must be 8+ characters")
            return
            
        if self.auth.register(username, password):
            messagebox.showinfo("Success", "Registration successful")
        else:
            messagebox.showerror("Error", "Username already exists")

    def create_main_ui(self):
        self.geometry("500x400")
        for widget in self.winfo_children():
            widget.destroy()
        
        # File selection
        ttk.Button(self, text="Select File", command=self.select_file).pack(pady=10)
        self.file_label = ttk.Label(self, text="No file selected")
        self.file_label.pack()
        
        # Transfer controls
        ttk.Label(self, text="Receiver IP:").pack()
        self.ip_entry = ttk.Entry(self)
        self.ip_entry.insert(0, "localhost")
        self.ip_entry.pack()
        
        ttk.Label(self, text="Port:").pack()
        self.port_entry = ttk.Entry(self)
        self.port_entry.insert(0, "12345")
        self.port_entry.pack()
        
        ttk.Button(self, text="Send File", command=self.start_send).pack(pady=10)
        ttk.Button(self, text="Receive Files", command=self.start_receive).pack()
        
        # Status
        self.progress = ttk.Progressbar(self, mode='determinate')
        self.progress.pack(fill=tk.X, padx=20, pady=10)
        self.status_label = ttk.Label(self, text="Ready")
        self.status_label.pack()

    def select_file(self):
        file_path = filedialog.askopenfilename()
        if file_path:
            self.current_file = file_path
            self.file_label.config(text=os.path.basename(file_path))

    def start_send(self):
        if not self.current_file:
            messagebox.showerror("Error", "No file selected")
            return
            
        host = self.ip_entry.get()
        port = int(self.port_entry.get())
        
        threading.Thread(target=self.send_file, args=(host, port)).start()

    def send_file(self, host, port):
        try:
            self.status_label.config(text="Encrypting...")
            self.transfer.send_file(host, port, self.current_file)
            self.status_label.config(text="File sent successfully")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def start_receive(self):
        port = int(self.port_entry.get())
        save_path = filedialog.asksaveasfilename()
        
        if save_path:
            threading.Thread(target=self.receive_file, args=(port, save_path)).start()

    def receive_file(self, port, save_path):
        try:
            self.status_label.config(text="Waiting for connection...")
            self.transfer.receive_file('', port, save_path)
            
            # Verify integrity
            original_hash = FileIntegrity.get_hash(self.current_file)
            received_hash = FileIntegrity.get_hash(save_path)
            
            if original_hash == received_hash:
                self.status_label.config(text="File received successfully")
            else:
                messagebox.showerror("Error", "File integrity check failed")
        except Exception as e:
            messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    app = SecureTransferApp()
    app.mainloop()
