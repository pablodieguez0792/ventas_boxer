import sqlite3
import pandas as pd

# Connect to the database
conn = sqlite3.connect('publicaciones.db')

# Get table names
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables in database:")
for table in tables:
    print(f"- {table[0]}")

# For each table, show structure and sample data
for table in tables:
    table_name = table[0]
    print(f"\n=== TABLE: {table_name} ===")
    
    # Get column info
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    
    print("Columns:")
    for col in columns:
        print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
    
    # Get sample data (first 3 rows)
    try:
        df = pd.read_sql_query(f"SELECT * FROM {table_name} LIMIT 3", conn)
        print(f"\nSample data ({len(df)} rows):")
        print(df.to_string())
    except Exception as e:
        print(f"Error reading data: {e}")
    
    # Get total count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"\nTotal records: {count}")

conn.close()
