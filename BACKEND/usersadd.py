import mysql.connector
from mysql.connector import Error

def reset_users_table():
    try:
        # Conexión a la base de datos
        connection = mysql.connector.connect(
            host='localhost',
            user='tu_usuario',      
            password='tu_password',   
            database='supports_system'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            cursor.execute("DELETE FROM users")
            
            users_data = [
                (1, 'Sergio IT', 'itadmin@example.com', '$argon2id$v=19$m=65536,t=3,p=4$+b835pwTYuxdq7XW2puzdg$uUpM19HWiC4jsWLTbvAFeTe+vBER0eDXcfjFgcdfi3E', 1, 'T-Mobile', '2026-03-11 06:41:39', None, None, 0, '2026-03-25 17:10:13', None),
                (2, 'Juan Pablo Bonilla', 'Juanpa1@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$N6YUQiiFsBailDImZOzdmw$3MExlio629x7tkkeAORhp97+r4LqHDq3h7SCV3/BR4o', 1, 'T-Mobile', '2026-03-10 00:09:22', None, None, 0, None, None),
                (3, 'Operador1', 'Operador1@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$k9KaM4ZwzlmLsbbWWguBMA$M39+dpS7rtWDUUDkkDqszXlh0oXCnxObJDQqhfL5MQs', 2, 'ARS', '2026-03-11 23:16:40', None, None, 0, '2026-03-25 02:00:17', None),
                (4, 'Esteban Guapo', 'esteban@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$QshZy9n7H0Po3TsHoLQWQg$g9PuTkSsLQDiO3iyRYSu6VQpSODQNxRdezLCulK+XLY', 2, 'T-Mobile', '2026-03-24 17:05:51', None, None, 0, None, None)
            ]
            
            query = """
                INSERT INTO users 
                (id_user, full_name, institutional_email, password_hash, id_role, campaign, 
                 created_at, recovery_code, recovery_code_expiration, failed_login_attempts, 
                 last_failed_login, locked_until)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.executemany(query, users_data)
            connection.commit()
            print(f"✓ {cursor.rowcount} usuarios insertados correctamente.")
            
    except Error as e:
        print(f"✗ Error: {e}")
        if connection.is_connected():
            connection.rollback()
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("✓ Conexión cerrada.")

if __name__ == "__main__":
    reset_users_table()