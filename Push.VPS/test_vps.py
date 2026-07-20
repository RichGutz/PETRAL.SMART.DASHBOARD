import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@')
cmd = '''python3 -c "import sys, os; sys.path.append('/opt/geeksoft_engine'); from backend.engine_universal import calculate_voyage_pnl_universal; inputs = {'quantity': 10000, 'freight_rate': 20, 'route_distance': 69, 'vessel_speed': 11.0, 'is_round_trip': True}; res = calculate_voyage_pnl_universal(inputs); print('TOTAL_DIST:', res.get('total_distance'))"'''
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
