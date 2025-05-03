import os
import requests
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from datetime import datetime, timedelta
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, CallbackContext


from scipy.interpolate import make_interp_spline
import numpy as np
import shlex

# TOOOs: Credit system and image caching on Replit DB. Then deploy.

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Ensure the 'graphpics' folder exists
GRAPH_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "graphpics")
if not os.path.exists(GRAPH_FOLDER):
    os.makedirs(GRAPH_FOLDER)

async def start(update: Update, context: CallbackContext) -> None:
    await update.message.reply_text('Hello! Send the command: \n\n/traffic \"origin address\" \"destination address\" \n\nto get traffic details. Make sure your origin and destination are valid addresses, encased in inverted commas!')

def validate_address(address):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_MAPS_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

    print(data)

    results = data.get("results", [])
    if data.get("status") == "OK" and results:
        best_match = results[0]["formatted_address"]
        return True, best_match
    else:
        return False, None

def suggest_address(address): # if miss, we're going to try to suggest a place
    url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    params = {
        "input": address,
        "key": GOOGLE_MAPS_API_KEY,
        "types": "geocode"  # Restrict results to addresses
    }
    response = requests.get(url, params=params)
    data = response.json()

    print(data)

    if data.get("status") == "OK" and data.get("predictions"): # if there are suggestions, and there are predictions,
        suggestions = [p["description"] for p in data["predictions"][:3]]
        # Return top suggestion as the "best match"
        return True, suggestions
    else:
        return False, []

def generate_graph(start, end):
    times = []
    route_durations = [[] for _ in range(3)]
    now = datetime.now()

    for hour in range(24):
        departure_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        if departure_time < now:
            departure_time += timedelta(days=1)

        departure_timestamp = int(departure_time.timestamp())

        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": start,
            "destination": end,
            "key": GOOGLE_MAPS_API_KEY,
            "mode": "driving",
            "departure_time": departure_timestamp,
            "traffic_model": "best_guess",
            "alternatives": "true"
        }
        response = requests.get(url, params=params)
        data = response.json()

        if data.get("routes"):
            routes = data["routes"]
            times.append(departure_time.strftime("%H:%M"))

            for i in range(3):
                if i < len(routes):
                    leg = routes[i]["legs"][0]
                    duration = leg.get("duration_in_traffic", leg["duration"])["value"] / 60
                    route_durations[i].append(duration)
                else:
                    route_durations[i].append(None)

    # Convert time strings to numeric x values for interpolation
    x_numeric = np.arange(len(times))
    x_labels = times

    plt.figure(figsize=(12, 6))
    colors = ['blue', 'green', 'red']

    for i in range(3):
        y = route_durations[i]
        if any(y) and len(y) >= 4:  # Ensure enough points for smoothing
            y_array = np.array([val if val is not None else np.nan for val in y])
            mask = ~np.isnan(y_array)
            x_masked = x_numeric[mask]
            y_masked = y_array[mask]

            # Smooth the line using cubic spline
            spline = make_interp_spline(x_masked, y_masked, k=3)
            x_smooth = np.linspace(x_masked.min(), x_masked.max(), 200)
            y_smooth = spline(x_smooth)

            plt.plot(x_smooth, y_smooth, label=f"Route {i + 1}", color=colors[i])
        elif any(y):
            plt.plot(x_numeric, y, label=f"Route {i + 1}", color=colors[i], marker="o")

    plt.xlabel("Time of Day")
    plt.ylabel("Duration in Traffic (minutes)")
    plt.title(f"Traffic Duration from {start} to {end} (3 Routes)")
    plt.xticks(x_numeric, x_labels, rotation=45)
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    graph_filename = f"{start}_to_{end}_all_routes.png".replace("/", "_")
    graph_path = os.path.join(GRAPH_FOLDER, graph_filename)
    plt.savefig(graph_path)
    plt.close()

    return graph_path

def get_routes_and_graphs(start, end):
    print("Received request for get-routes-and-graphs")

    # Fetch route information from Google Maps API
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": start,
        "destination": end,
        "key": GOOGLE_MAPS_API_KEY,
        "mode": "driving",
        "departure_time": "now",
        "traffic_model": "best_guess",
        "alternatives": "true"  # Request multiple routes
    }
    response = requests.get(url, params=params)
    data = response.json()

    if "routes" not in data or not data["routes"]: # find out how to return the error gracefully TODO
        return "No commutable driving routes found.", False

    # Extract route information and generate graphs
    routes = []
    for i, route in enumerate(data["routes"]):
        leg = route["legs"][0]
        route_info = {
            "distance": leg["distance"]["text"],
            "duration_considering_traffic": leg.get("duration_in_traffic", leg["duration"])["text"],
            "duration_typical": leg["duration"]["text"],
            "summary": route["summary"],
        }
        routes.append(route_info)

        # Generate the graph for this route
        graph_path = generate_graph(start, end)

    print(routes)

    route_summaries = []
    for i, route in enumerate(routes, start=1):
        summary_line = f"Route {i}: {route['summary']}, {route['duration_considering_traffic']}, {route['distance']}"
        route_summaries.append(summary_line)
    
    route_summaries = "\n".join(route_summaries)

    # Return route information and graph URLs
    return route_summaries, graph_path

async def check_and_respond_address(label, user_input, update):
    is_valid, resolved = validate_address(user_input)

    if is_valid:
        await update.message.reply_text(
            f"✅ {label} Address Resolution:\n*{resolved}*",
            parse_mode="Markdown"
        )
        return True, resolved
    else:
        await update.message.reply_text(
            f"❌ Couldn't find the {label.lower()}: *{user_input}*",
            parse_mode="Markdown"
        )
        status, suggestions = suggest_address(user_input)
        if status and suggestions:
            suggestion_text = "\n".join(suggestions)
            await update.message.reply_text(f"Did you mean:\n{suggestion_text}")
        else:
            await update.message.reply_text(f"❌ No address suggestions found.")
        return False, None

async def traffic(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text

    # Remove the "/traffic" part and format inv commas for preprocessing
    command_removed = text[len('/traffic'):].strip()
    command_removed = command_removed.replace("“", "\"").replace("”", "\"")
    command_removed = command_removed.replace("‘", "'").replace("’", "'")

    try:
        # Use shlex to allow users to enter quoted arguments like: /traffic "New York City" "Los Angeles"
        args = shlex.split(command_removed)
    except ValueError as e:
        await update.message.reply_text(f"Error parsing arguments: {str(e)}")
        return

    if len(args) < 2:
        await update.message.reply_text("Usage: /traffic \"origin address\" \"destination address\"")
        return

    start = args[0]
    end = args[1]

    print("START: ", start)
    print("END: ", end)

    # poor refactoring
    # Validate origin
    is_start_valid, resolved_start_address = await check_and_respond_address("Start", start, update)

    is_end_valid, resolved_end_address = await check_and_respond_address("End", end, update)

    print("start valid: ", is_start_valid)
    print("end valid: ", is_end_valid)

    
    if not is_start_valid or not is_end_valid: # if either didnt hit, dont bother to find the route between them
        return

    try:
        routes, graph_path = get_routes_and_graphs(start, end)
    except Exception as e:
        await update.message.reply_text(f"Error retrieving routes: {str(e)}")
        return

    await update.message.reply_text(routes)

    if graph_path: 
        try:
            with open(graph_path, 'rb') as photo:
                await update.message.reply_photo(photo)
        except FileNotFoundError:
            await update.message.reply_text("Graph image not found.")

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("traffic", traffic))
    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
