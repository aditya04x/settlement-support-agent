"""
Vercel Serverless Entry Point
Exposes the existing FastAPI application for Vercel's Python runtime.
"""
import sys
import os

# Add the backend directory to the Python path so that 'app.xxx' imports work
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend")
sys.path.insert(0, backend_path)

from backend.app.main import app
