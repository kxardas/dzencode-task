FROM mysql:8.4.11

# Execute in a separate shell so set -eu does not change MySQL's entrypoint.
COPY --chmod=0755 init-shadow.sh /docker-entrypoint-initdb.d/init-shadow.sh
