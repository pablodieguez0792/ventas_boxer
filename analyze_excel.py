import pandas as pd

# Read the Excel file
df = pd.read_excel('Libro1.xlsx')

print("=== ESTRUCTURA DE NIVELES ===\n")

# Get all non-null values from each row
for i in range(len(df)):
    print(f"NIVEL {i+1}:")
    row_values = []
    for col in df.columns:
        val = df.iloc[i][col]
        if pd.notna(val) and str(val).strip() != '':
            if not col.startswith('Unnamed'):
                row_values.append(f"{col}: {val}")
            else:
                row_values.append(str(val))
    
    if row_values:
        print("  " + " | ".join(row_values))
    print()

print("\n=== COLUMNAS PRINCIPALES ===")
main_cols = [col for col in df.columns if not col.startswith('Unnamed')]
print(main_cols)

print("\n=== VALORES ÚNICOS POR COLUMNA PRINCIPAL ===")
for col in main_cols:
    unique_vals = df[col].dropna().unique()
    if len(unique_vals) > 0:
        print(f"{col}: {list(unique_vals)}")
