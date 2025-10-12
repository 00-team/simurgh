#!/bin/bash

BASE_URL="https://iris.00-team.org/api/abzar"
BASE_NAME=simurgh-data-$(date +%s).tgz
OUT_DIR=".ignore.data"


function send_file {
    echo "sending $(du -sb $1) to telegram"
    s="$(du -sb $1)"
    h="$(sha256sum -b $1)"
    h="${h% *}"
    c='`'"$s"'`

`'"$h"'`'
    url="$BASE_URL/send-file/"
    curl -s -X POST $url -F "file=@$1" -F "text=$c" \
        -F "channel=simurgh" -F "pass=$IRIS_PASS" -F "parse_mode=MarkdownV2" -o /dev/null
    echo
}

function send_msg {
    url="$BASE_URL/send-mp/"
    curl -s -X POST $url -F "channel=simurgh" \
        -F "pass=$IRIS_PASS" -F "text=$1" \
        -F "parse_mode=MarkdownV2" -o /dev/null
}


function backup_data {
    mkdir $OUT_DIR -p
    send_msg 'starting the compression: `'"$(du -sh main.db record)"'`
`'"$(date +'%F %T')"'`'
    tar czvf $BASE_NAME main.db record
    send_msg 'spliting and sending the data `'"$(du -sh $BASE_NAME)"'`
`'"$(date +'%F %T')"'`'
    split -d -b 45M $BASE_NAME "$OUT_DIR/$BASE_NAME."

    # tar czvf - data/ | split -d -b 45MB - $OUT_DIR/$BASE_NAME
    cd $OUT_DIR
    for f in $BASE_NAME*; do
        send_file $f
        sleep 1
    done
    send_msg "\=\=\= End of Data backup \=\=\="
    cd ..
    rm -rf $OUT_DIR
    rm -rf $BASE_NAME
}

backup_data;
