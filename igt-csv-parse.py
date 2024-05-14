import pandas as pd
import numpy as np
import orjson
import os, sys
import time  
import PySimpleGUI as sg
from datetime import datetime
from dateutil import parser
import pytz

UNHASHABLE_COLUMNS = ["failed_images", "failed_audio", "failed_video", "view_history", "connectivity"]

def __main__():
    print("hello world")
    data = {}
    with open("cognitive-games-a282b-default-rtdb-igt-export.json", "rb") as f:
        data = orjson.loads(f.read())
    df = process_records(data)
    subset = [item for item in df.columns if item not in UNHASHABLE_COLUMNS]
    df = df.drop_duplicates(subset=subset)
    df = filter_trials(df)
    df = sort_cogtask(df)
    df = df[df.subject_id != 7789]
    df = df[df.subject_id != "7789"]
    # df.to_csv("out.csv", index=False)
    print(df)
    df_list = [pd.DataFrame(i) for i in df.groupby(df.subject_id.values).agg(list).to_dict('records')]
    print(df.subject_id.values)
    for i in range(len(df_list)):
        curr_df = df_list[i]
        print(np.unique(curr_df.subject_id.values))
        subject_id = np.unique(curr_df.subject_id.values)[0]
        curr_df.to_csv(f"data/participant_{subject_id}.csv", index=False)
    print("done loading")

def process_records(records):
    '''Return dataframes containing all records from a file and keeps only unique values for each game
    '''

    igt = []   
    for user_id in records:
        igt = parse_record(records[user_id], igt)
    igt_df = pd.concat(igt) if len(igt) > 0 else None
    return igt_df

def parse_record(records, igt):
    utc = pytz.UTC
    for record in records:
        record = records[record]
        if('data_json' in record.keys() and len(record['data_json']) != 0):
            # print(record['data_json'][0]['day'], record['timestamp_start'])
            dt = parser.parse(record['timestamp_start'])
            if(record['data_json'][0]['day'] == "7"):
                #due to hiccup in links, some day 7 data was actually day 8...
                # need to adjust depending on the time they started
                if (dt > datetime(2024,5,6,12,tzinfo=utc)):
                    for row in record['data_json']:
                        row['day'] = "8"
            df = pd.DataFrame(record['data_json'])
            igt.append(df)
            
    return igt

def sort_cogtask(df):
    df[['subject_id','day']] = df[['subject_id','day']].apply(pd.to_numeric)
    df = df.sort_values(by=['subject_id', 'day','session_uuid','trial_index'], kind='mergesort')
    return df

def filter_trials(df):
    #Probably a better way to check for trial type, but all three games have different column names...
    values = ['instructions', 'None', 'call-function']
    df = df[~df['trial_type'].isin(values)]
    if 'trialType' in df.columns:
        df = df[df['trialType'].notnull()]
    if 'TrialType' in df.columns:
        df = df[df['TrialType'].notnull()]    
    df = df[df['DeckA'].notnull()]
    return df

if __name__ == "__main__":
    __main__()