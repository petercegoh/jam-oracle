import threading
import subprocess
import time
import sys
import os

def run_flask():
    os.chdir('backend')
    from app import app
    app.run(debug=False, use_reloader=False)

def run_vue():
    os.chdir('frontend')
    subprocess.run(["npm", "run", "serve"], check=True)

if __name__ == "__main__":
    original_dir = os.getcwd()
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()
    time.sleep(2)
    try:
        os.chdir(original_dir)
        run_vue()
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while running the Vue.js server: {e}")
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        os.chdir(original_dir)
        flask_thread.join(timeout=5)
        if flask_thread.is_alive():
            print("Flask server is still running. You may need to terminate it manually.")
        sys.exit(0)