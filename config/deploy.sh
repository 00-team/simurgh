#!/bin/bash

SPACER="======================================"
EG="🔷"

PATH=/root/.nvm/versions/node/v23.5.0/bin:/root/.cargo/bin:$PATH

cd /x/simurgh/

OLD_COMMIT=$(git rev-parse HEAD)

echo "$EG update the source"
git pull
echo $SPACER

NEW_COMMIT=$(git rev-parse HEAD)

function check_diff {
    local file_has_changed=$(git diff --name-only $OLD_COMMIT...$NEW_COMMIT --exit-code $1)
    if [ -z "$file_has_changed" ]; then
        return 1
    else
        return 0
    fi
}

if check_diff "package.json"; then
    echo "$EG install npm packages"
    npm i
    echo $SPACER
fi

if check_diff "app/*"; then
    echo "$EG build the app!"
    npm run build
    echo $SPACER
fi

if check_diff "simple/*"; then
    echo "$EG build the simple!"
    target=sl npm run build
    echo $SPACER
fi

if check_diff "ssr/*"; then
    echo "$EG ssr build"
    npm run ssr
    echo $SPACER
fi

if check_diff "src/*"; then
    echo "$EG cargo build"
    cargo build --release
    systemctl restart simurgh
    echo $SPACER
fi

echo "Deploy is Done! ✅"
