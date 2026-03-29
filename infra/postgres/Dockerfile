FROM timescale/timescaledb:latest-pg17

RUN apk add --no-cache postgis \
    && cp /usr/share/postgresql/extension/postgis* /usr/local/share/postgresql/extension/ \
    && cp /usr/share/postgresql/extension/address_standardizer* /usr/local/share/postgresql/extension/ \
    && cp /usr/lib/postgresql17/*.so /usr/local/lib/postgresql/

COPY init.sh /docker-entrypoint-initdb.d/init.sh
RUN chmod +x /docker-entrypoint-initdb.d/init.sh
