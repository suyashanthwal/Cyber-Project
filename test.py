import mysql.connector

try:
    print("Starting connection test...")
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Suyash@6395924223",
        database="schoolsystem"
    )
    print("Connected to database!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses;")
    results = cursor.fetchall()
    
    print("Fetched users:")
    for row in results:
        print(row)
    
    conn.close()
except mysql.connector.Error as err:
    print("Database error:", err)
except Exception as e:
    print("Other error:", e)
