#!/bin/bash

# Setup .pgpass file for PostgreSQL authentication
# This is more secure than using environment variables

echo "Setting up .pgpass file for PostgreSQL authentication..."

# Create .pgpass file in home directory
touch ~/.pgpass
chmod 600 ~/.pgpass

# Add connection string to .pgpass
# Format: hostname:port:database:username:password
echo "localhost:5432:jobportal:postgres:your_postgres_password" >> ~/.pgpass

echo "✅ .pgpass file created successfully!"
echo "Now you can run: psql -h localhost -U postgres -d jobportal -f fix-database-permissions.sql"
echo ""
echo "⚠️  IMPORTANT: Replace 'your_postgres_password' with your actual PostgreSQL password"
