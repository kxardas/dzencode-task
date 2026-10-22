#!/bin/sh
set -eu

npm run db:deploy
exec "$@"
