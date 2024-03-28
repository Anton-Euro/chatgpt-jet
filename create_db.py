import sqlite3

with open('data.db','w'): pass
with open('sql_commands.sql','r') as f:
    sql_script = f.read()

conn = sqlite3.connect('data.db')
cur = conn.cursor()
cur.executescript(sql_script)
conn.commit()
cur.close()
conn.close()