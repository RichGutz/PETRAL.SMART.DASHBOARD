import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@', timeout=15)

def check(cmd, name):
    print(f'=== {name} ===')
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err: print('ERR:', err)

sql = "CREATE TABLE IF NOT EXISTS audit_logs (id BIGSERIAL PRIMARY KEY, table_name VARCHAR(64) NOT NULL, record_id VARCHAR(64), action VARCHAR(20) NOT NULL, user_email VARCHAR(255) NOT NULL DEFAULT 'SYSTEM', ip_address VARCHAR(64), user_agent TEXT, old_data JSONB, new_data JSONB, diff_data JSONB, metadata JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);"

check(f"""su - postgres -c "psql -d petral_db -c \\"{sql}\\"" """, "CREATE TABLE")
check("""su - postgres -c "psql -d petral_db -c \\"SELECT count(*) FROM audit_logs;\\"" """, "COUNT")

client.close()
