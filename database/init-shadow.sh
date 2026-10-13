#!/bin/sh
set -eu

# A separate database lets Prisma Migrate use the application user locally.
case "$MYSQL_DATABASE" in
  ''|*[!a-zA-Z0-9_]*) echo "MYSQL_DATABASE must contain only letters, digits, and underscores." >&2; exit 1 ;;
esac
case "$MYSQL_USER" in
  ''|*[!a-zA-Z0-9_]*) echo "MYSQL_USER must contain only letters, digits, and underscores." >&2; exit 1 ;;
esac

export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
shadow_database="${MYSQL_DATABASE}_shadow"
shadow_grant="$(printf '%s' "$shadow_database" | sed 's/_/\\_/g')"
mysql --protocol=socket --user=root <<SQL
CREATE DATABASE IF NOT EXISTS \`$shadow_database\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`$shadow_grant\`.* TO '${MYSQL_USER}'@'%';
SQL
