import sys
import os

# Add the current directory to the path so we can find 'backend'
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from backend.app.main import app
