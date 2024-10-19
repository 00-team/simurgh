#!/bin/bash

BASE_URL="https://api.telegram.org/bot$TELOXIDE_TOKEN"
BASE_NAME=simurgh-db-$(date +%s).tgz.
DB_CHANGED=".ignore.db-changed"
RECORD_CHANGED=".ignore.record-changed"
RECORD_NAME=simurgh-record-$(date +%s).tgz.
CHAT_INFO="chat_id=$TELOXIDE_GROUP_ID&message_thread_id=2"


function send_file {
    url="$BASE_URL/sendDocument?$CHAT_INFO"
    curl -s -X POST $url -F "document=@$1" -F "caption=$1" -o /dev/null
}

function send_msg {
    url="$BASE_URL/sendMessage?$CHAT_INFO"
    curl -s -X GET $url --data-urlencode "text=$1" -o /dev/null
}

function backup_db {
    if [ -f $DB_CHANGED ]; then
        if [[ $(cat $DB_CHANGED) == $(sha256sum main.db) ]]; then
            echo "database has not changed 🪐 $(date +'%F %T')"
            return;
        fi
    fi

    mkdir .dbd -p
    sha256sum main.db > $DB_CHANGED
    send_msg "starting the db backup $(date +'%F %T')"
    tar czvf - main.db | split -d -b 40MB - .dbd/$BASE_NAME
    cd .dbd
    for f in $BASE_NAME*; do
        send_file $f
        sleep 1
    done
    send_msg "end of backup 🐧"
    cd ..
    rm -rf .dbd
}

function record_change {
    du -sb recode
    # { ls record; du -sb record; } | sha256sum
}

function backup_record {
    if [ -f $RECORD_CHANGED]; then
        if [[ $(cat $RECORD_CHANGED) == $c ]]; then
            echo "record has not changed 🪐 $(date +'%F %T')"
            return;
        fi
    fi

    mkdir .rbd -p
    record_change > $RECORD_CHANGED
    send_msg "starting the reocrd backup $(date +'%F %T') 📂"
    tar czvf - record | split -d -b 40MB - .rbd/$RECORD_NAME
    cd .rbd
    for f in $RECORD_NAME*; do
        send_file $f
        sleep 1
    done
    send_msg "end of record backup 🐧"
    cd ..
    rm -rf .rbd
}

backup_db;
backup_record;

