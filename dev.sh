#!/bin/sh
case "$1" in
  start) exec node server.js ;;
  test) exec node --test ;;
  *) echo "Uso: ./dev start | ./dev test"; exit 1 ;;
esac