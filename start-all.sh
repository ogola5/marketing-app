#!/bin/bash

# Start backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001 &
BACK_PID=$!

# Start frontend
cd ../frontend
yarn start &

# Wait for both to finish
wait $BACK_PID
