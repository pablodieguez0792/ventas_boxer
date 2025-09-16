#!/usr/bin/env python3
"""
Migration script to add observations column to chatbot_questions table
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL

def add_observations_column():
    """Add observations column to chatbot_questions table"""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("PRAGMA table_info(chatbot_questions)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'observations' not in columns:
                # Add the observations column
                conn.execute(text("ALTER TABLE chatbot_questions ADD COLUMN observations TEXT"))
                conn.commit()
                print("Successfully added observations column to chatbot_questions table")
            else:
                print("Observations column already exists")
                
    except Exception as e:
        print(f"Error adding observations column: {e}")

if __name__ == "__main__":
    add_observations_column()
