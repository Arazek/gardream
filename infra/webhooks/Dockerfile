FROM python:3.13-alpine

RUN apk add --no-cache docker-cli docker-cli-compose git bash

WORKDIR /app

COPY webhook-server.py .
COPY deploy-gardream.sh .
RUN chmod +x deploy-gardream.sh

EXPOSE 9000

CMD ["python", "webhook-server.py"]
