import sqlite3

# Connect to the database
conn = sqlite3.connect('publicaciones.db')
cursor = conn.cursor()

# Get column info for publicaciones table
cursor.execute("PRAGMA table_info(publicaciones)")
columns = cursor.fetchall()

print("Columns in publicaciones table:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.close()
