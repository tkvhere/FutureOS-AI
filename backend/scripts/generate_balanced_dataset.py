import csv, random
random.seed(42)
import numpy as np
out_path='backend/datasets/user_behavior.csv'
N=5000
moods=['very_low','low','neutral','high','very_high']
counts=[N//5]*5
for i in range(N - sum(counts)):
    counts[i]+=1
rows=[]
min_days=30
max_days=365
w_study=0.4; w_sleep=0.2; w_screen=0.2; w_mood=0.2
for mood_idx, mood in enumerate(moods):
    for _ in range(counts[mood_idx]):
        study = random.uniform(0,10)
        sleep = random.uniform(4,10)
        screen = random.uniform(0,10)
        s_n = study/10.0
        sl_n = (sleep-4.0)/6.0
        sc_n = screen/10.0
        m_n = mood_idx/4.0
        difficulty = w_study*(1.0 - s_n) + w_sleep*(1.0 - sl_n) + w_screen*(sc_n) + w_mood*(1.0 - m_n)
        days = difficulty*(max_days - min_days) + min_days
        noise = random.gauss(0,10)
        days = max(min_days, min(max_days, days + noise))
        rows.append({'study_hours':f"{study:.2f}",'sleep_hours':f"{sleep:.2f}",'screen_time_hours':f"{screen:.2f}",'mood':mood,'days_to_goal':f"{days:.2f}"})
import random as _r
_r.shuffle(rows)
with open(out_path,'w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=['study_hours','sleep_hours','screen_time_hours','mood','days_to_goal'])
    writer.writeheader()
    writer.writerows(rows)
print('wrote',len(rows),'rows to',out_path)
