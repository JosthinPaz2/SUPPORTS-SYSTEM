import pymysql

try:
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='ADMIN')
    with conn.cursor() as cur:
        cur.execute("ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ADMIN'")
        cur.execute("FLUSH PRIVILEGES")
    print("✅ Listo")
except Exception as e:
    print(f"❌ {e}")
finally:
    conn.close()