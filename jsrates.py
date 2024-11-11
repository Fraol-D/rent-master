import csv
import os
from datetime import datetime
import time

input_csv_path = './rates.csv'  # CSV file path
output_sql_path = './rates.sql'  # Output SQL file path

def parse_date(date_str):
    # Remove quotes and split by /
    month, day, year = date_str.replace('"', '').split('/')
    # Convert to datetime then unix timestamp
    dt = datetime.strptime(f"{year}-{month}-{day}", "%Y-%m-%d")
    return int(time.mktime(dt.timetuple()))

table_name = 'Exchange_RatesUSDtoETB'
sql_header = f"""CREATE TABLE IF NOT EXISTS {table_name} (
    id BIGINT NOT NULL PRIMARY KEY,
    rates INT(11) NOT NULL
);

INSERT INTO {table_name} (id, rates) VALUES
"""

# Write header
with open(output_sql_path, 'w') as f:
    f.write(sql_header)

# Process CSV and append rows
with open(input_csv_path, 'r') as csvfile:
    # Skip the header row since we'll use column indices
    next(csvfile)
    csvreader = csv.reader(csvfile)
    with open(output_sql_path, 'a') as sqlfile:
        first_row = True
        for row in csvreader:
            if len(row) >= 2:  # Ensure row has enough columns
                # Get date from first column and price from second column
                date = parse_date(row[0])
                price = float(row[1].replace('"', ''))
                if first_row:
                    sqlfile.write(f"({date}, {price})")
                    first_row = False
                else:
                    sqlfile.write(f",\n({date}, {price})")
        sqlfile.write(";\n")
