FROM timescale/timescaledb:latest-pg18

# The TimescaleDB image bundles PG under /usr/local. The `apk add postgis`
# package installs for the Alpine system PG (same major version, but under
# /usr/share/postgresql18 and /usr/lib/postgresql18). Copy into the active
# PG instance. The globs survive Alpine PG version bumps as long as the
# major version matches the TimescaleDB image tag.
RUN apk add --no-cache postgis \
    && for d in /usr/share/postgresql*/extension; do \
         cp "$d"/postgis* /usr/local/share/postgresql/extension/ 2>/dev/null || true; \
         cp "$d"/address_standardizer* /usr/local/share/postgresql/extension/ 2>/dev/null || true; \
       done \
    && for d in /usr/lib/postgresql*; do \
         cp "$d"/postgis*.so /usr/local/lib/postgresql/ 2>/dev/null || true; \
       done

COPY init.sh /docker-entrypoint-initdb.d/init.sh
RUN chmod +x /docker-entrypoint-initdb.d/init.sh
