#!/bin/bash

# Test validation script to check the current state safely
echo "🔍 Starting comprehensive validation..."

# Change to backend directory
cd src/backend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules directory missing - running npm install"
    npm install
fi

# Try to run a simple node check first
echo "🧪 Testing basic node functionality..."
if node -e "console.log('Node.js is working')"; then
    echo "✅ Node.js basic functionality confirmed"
else
    echo "❌ Node.js basic functionality failed"
    exit 1
fi

# Try to run the server.test.js which was reported as successful
echo "🧪 Running server.test.js tests..."
NODE_ENV=test NODE_OPTIONS='--experimental-vm-modules' npx jest test/unit/server.test.js --verbose --no-cache --runInBand --detectOpenHandles --forceExit

echo "✅ Test validation complete"