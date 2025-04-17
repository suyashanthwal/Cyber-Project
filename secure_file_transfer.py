import tkinter as tk
from tkinter import filedialog


def login():
    login_window.destroy()
    open_dashboard()

def open_dashboard():
    def browse_file():
        filepath = filedialog.askopenfilename()
        file_entry.delete(0, tk.END)
        file_entry.insert(0, filepath)

    dashboard = tk.Tk()
    dashboard.title("Secure File Transfer")
    dashboard.geometry("500x350")

    tk.Label(dashboard, text="Select File to Send:").pack(pady=5)
    file_entry = tk.Entry(dashboard, width=50)
    file_entry.pack()
    tk.Button(dashboard, text="Browse", command=browse_file).pack(pady=5)

    tk.Label(dashboard, text="Enter Key:").pack(pady=5)
    key_entry = tk.Entry(dashboard, width=50)
    key_entry.pack()

    tk.Button(dashboard, text="Encrypt & Send", width=20).pack(pady=20)
    tk.Button(dashboard, text="Receive File", width=20).pack()

    dashboard.mainloop()

login_window = tk.Tk()
login_window.title("Login")
login_window.geometry("300x180")

tk.Label(login_window, text="Username:").pack(pady=5)
username_entry = tk.Entry(login_window)
username_entry.pack()

tk.Label(login_window, text="Password:").pack(pady=5)
password_entry = tk.Entry(login_window, show="*")
password_entry.pack()

tk.Button(login_window, text="Login", command=login).pack(pady=20)

login_window.mainloop()
