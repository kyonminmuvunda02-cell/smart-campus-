import psycopg

def get_users():
    try:
        conn = psycopg.connect("dbname=smartcampus user=postgres password=12345678 host=localhost port=5432")
        cur = conn.cursor()
        
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        with open("users.txt", "w") as f:
            cur.execute("SELECT email FROM appuser WHERE role='Admin' LIMIT 1")
            f.write(f"Admins: {cur.fetchall()}\n")
            cur.execute("SELECT email FROM appuser WHERE role='Student' LIMIT 5")
            f.write(f"Students: {cur.fetchall()}\n")
            cur.execute("SELECT email FROM appuser WHERE role='Lecturer' LIMIT 5")
            f.write(f"Lecturers: {cur.fetchall()}\n")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_users()
