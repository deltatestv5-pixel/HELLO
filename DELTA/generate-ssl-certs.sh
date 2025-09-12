#!/bin/bash

# Script to generate self-signed SSL certificates for HTTPS
# This is for development/testing only - use proper certificates for production

echo "Generating self-signed SSL certificates for HTTPS..."

# Create certs directory if it doesn't exist
mkdir -p ./certs

# Generate private key
openssl genrsa -out ./certs/private-key.pem 2048

# Generate certificate signing request
openssl req -new -key ./certs/private-key.pem -out ./certs/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ./certs/csr.pem -signkey ./certs/private-key.pem -out ./certs/certificate.pem

# Set permissions
chmod 600 ./certs/private-key.pem
chmod 600 ./certs/certificate.pem

# Update .env file with certificate paths
CERTS_DIR=$(pwd)/certs
sed -i "s|HTTPS_KEY_PATH=.*|HTTPS_KEY_PATH=${CERTS_DIR}/private-key.pem|g" .env
sed -i "s|HTTPS_CERT_PATH=.*|HTTPS_CERT_PATH=${CERTS_DIR}/certificate.pem|g" .env

echo "SSL certificates generated successfully!"
echo "Private key: ${CERTS_DIR}/private-key.pem"
echo "Certificate: ${CERTS_DIR}/certificate.pem"
echo ""
echo "The .env file has been updated with the certificate paths."
echo "You can now start the server with HTTPS enabled."