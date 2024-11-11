import csv
import os

input_csv_path = './rates.csv'  # CSV file path
output_sql_path = './rates.sql'  # Output SQL file path

def parse_date(date_str):
    # Remove quotes and split by /
    month, day, year = date_str.replace('"', '').split('/')
    # Create date string in YYYY-MM-DD format
    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

table_name = 'Exchange_RatesUSDtoETB'
sql_header = f"""CREATE TABLE IF NOT EXISTS {table_name} (
    id VARCHAR(100) NOT NULL,
    rates INT(11) NOT NULL
);

INSERT INTO {table_name} (id, date, rates) VALUES
"""

# Write header
with open(output_sql_path, 'w') as f:
    f.write(sql_header)

# Process CSV and append rows
with open(input_csv_path, 'r') as csvfile:
    csvreader = csv.DictReader(csvfile)
    with open(output_sql_path, 'a') as sqlfile:
        for row in csvreader:
            formatted_date = parse_date(row['Date'])
            price = round(float(row['Price']))
            sql_row = f"('{formatted_date}', {price}),\n"
            sqlfile.write(sql_row)

# Add final semicolon
with open(output_sql_path, 'a') as f:
    f.write(';')

print('SQL file generated:', output_sql_path)
