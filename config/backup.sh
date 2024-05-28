#!/bin/bash

BASE_URL="https://api.telegram.org/bot$TELOXIDE_TOKEN"
BASE_NAME=simurgh-db-$(date +%s).tgz.
HASH_FILENAME=".ignore.last_hash"

mkdir .dbd

function send_file {
    url="$BASE_URL/sendDocument?chat_id=$TELOXIDE_CHAT_ID"
    curl -s -X POST $url -F "document=@$1" -F "caption=$1" -o /dev/null
}

function send_msg {
    url="$BASE_URL/sendMessage?chat_id=$TELOXIDE_CHAT_ID"
    curl -s -X GET $url --data-urlencode "text=$1" -o /dev/null
}

if [ -f $HASH_FILENAME ]; then
    if [[ $(cat $HASH_FILENAME) == $(sha256sum main.db) ]]; then
        echo "database has not changed 🪐 $(date +'%F %T')"
        exit
    fi
fi

sha256sum main.db > $HASH_FILENAME

send_msg "Starting the backup $(date +'%F %T')"
tar czvf - main.db | split -d -b 40MB - .dbd/$BASE_NAME
cd .dbd
for f in $BASE_NAME*; do
    send_file $f
    sleep 2
done
send_msg "End of Backup 🐧"
cd ..
rm -rf .dbd

