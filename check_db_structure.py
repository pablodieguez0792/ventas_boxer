import sqlite3

# Connect to the database
conn = sqlite3.connect('publicaciones.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

# Get columns for publicaciones table
cursor.execute("PRAGMA table_info(publicaciones);")
columns = cursor.fetchall()
print("\nPublicaciones columns:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Check for ML commission and shipping data
cursor.execute("SELECT * FROM publicaciones LIMIT 1;")
sample_row = cursor.fetchone()
print(f"\nSample row columns: {len(sample_row) if sample_row else 0}")

conn.close()
