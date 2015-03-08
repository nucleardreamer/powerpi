#!/bin/bash
# copy file to /etc/init.d/powerpi
# then run
#   sudo su
#   chmod a+x /etc/init.d/powerpi
#   update-rc.d powerpi defaults

NAME="powerpi"
NODE_BIN_DIR="/usr/local/bin"
NODE_PATH="/usr/local/lib/node_modules"
APPLICATION_DIRECTORY="/node/powerpi"
APPLICATION_START="code.js -daemon"
PIDFILE="/var/run/powerpi.pid"
LOGFILE="/var/log/powerpi.log"

PATH=$NODE_BIN_DIR:$PATH
export NODE_PATH=$NODE_PATH

start() {
    echo "Starting $NAME"
    forever --pidFile $PIDFILE --sourceDir $APPLICATION_DIRECTORY \
        -a -l $LOGFILE --minUptime 5000 --spinSleepTime 2000 \
        start $APPLICATION_START &
    RETVAL=$?
}

stop() {
    if [ -f $PIDFILE ]; then
        echo "Shutting down $NAME"
        forever stop $APPLICATION_START
        rm -f $PIDFILE
        RETVAL=$?
    else
        echo "$NAME is not running."
        RETVAL=0
    fi
}

restart() {
    echo "Restarting $NAME"
    stop
    start
}

status() {
    echo "Status for $NAME:"
    forever list
    RETVAL=$?
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage: {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL