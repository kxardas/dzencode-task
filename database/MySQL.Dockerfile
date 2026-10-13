FROM mysql:8.4.11

COPY --chmod=0644 init-shadow.sh /docker-entrypoint-initdb.d/init-shadow.sh
