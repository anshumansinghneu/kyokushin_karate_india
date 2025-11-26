#!/bin/bash

# Script to run the full application locally for testing
# This ensures both frontend and backend use the local database with seeded data

echo "🚀 Starting Kyokushin Karate Local Testing Environment"
echo "======================================================"
echo ""

# Check if backend is already running
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend already running on port 5000"
else
    echo "📦 Starting Backend Server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo "✅ Backend started (PID: $BACKEND_PID)"
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if frontend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Frontend already running on port 3000"
else
    echo "🎨 Starting Frontend Server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
fi

echo ""
echo "======================================================"
echo "✅ LOCAL TESTING ENVIRONMENT READY!"
echo "======================================================"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "🔐 Test Credentials:"
echo "   Email:    admin@kyokushin.in"
echo "   Password: password123"
echo ""
echo "👨‍🎓 Student accounts: student1@kyokushin.in to student16@kyokushin.in"
echo "🥋 Instructor accounts: instructor1@kyokushin.in to instructor4@kyokushin.in"
echo ""
echo "📋 All accounts use password: password123"
echo ""
echo "======================================================"
echo "Press Ctrl+C to stop all servers"
echo "======================================================"

# Wait for user interrupt
wait
