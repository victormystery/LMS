#!/bin/bash
set -e

docker pull victormystery/lms-backend:latest
docker pull victormystery/lms-frontend:latest

cd /opt/lms

docker compose down || true
docker compose up -d
