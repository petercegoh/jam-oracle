from flask import Flask, request, jsonify, send_file
import requests
import os
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime, timedelta
from flask_cors import CORS
import matplotlib
matplotlib.use("Agg")  # Set the backend to Agg
import matplotlib.pyplot as plt

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}})

# Fetch the API key from environment variables
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_MAPS_API_KEY:
    raise ValueError("Google Maps API key not found in environment variables.")

# Ensure the 'graphpics' folder exists
GRAPH_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "graphpics")
if not os.path.exists(GRAPH_FOLDER):
    os.makedirs(GRAPH_FOLDER)

def generate_graph(start, end, route_index, route_data):
    # Initialize lists to store data for the graph
    times = []
    durations = []

    # Get the current date and time
    now = datetime.now()

    # Loop through each hour of the day
    for hour in range(24):
        # Calculate the departure time for this hour
        departure_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        if departure_time < now:
            departure_time += timedelta(days=1)  # If the time is in the past, move to the next day

        # Convert departure_time to a timestamp (required by the API)
        departure_timestamp = int(departure_time.timestamp())

        # Make the API request
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": start,
            "destination": end,
            "key": GOOGLE_MAPS_API_KEY,
            "mode": "driving",
            "departure_time": departure_timestamp,
            "traffic_model": "best_guess",
            "alternatives": "true"  # Request multiple routes
        }
        response = requests.get(url, params=params)
        data = response.json()

        # Extract duration_in_traffic for the selected route
        if data.get("routes"):
            route = data["routes"][route_index]  # Use the selected route index
            leg = route["legs"][0]
            duration_in_traffic = leg.get("duration_in_traffic", leg["duration"])["value"]  # Value in seconds
            durations.append(duration_in_traffic / 60)  # Convert to minutes
            times.append(departure_time.strftime("%H:%M"))  # Format time as HH:MM

    # Plot the graph
    plt.figure(figsize=(10, 6))
    plt.plot(times, durations, marker="o")
    plt.xlabel("Time of Day")
    plt.ylabel("Duration in Traffic (minutes)")
    plt.title(f"Traffic Duration from {start} to {end} (Route {route_index + 1})")
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.tight_layout()

    # Save the graph as an image in the 'graphpics' folder
    graph_filename = f"{start}_to_{end}_route_{route_index + 1}.png".replace("/", "_")  # Replace slashes to avoid file path issues
    graph_path = os.path.join(GRAPH_FOLDER, graph_filename)
    plt.savefig(graph_path)
    plt.close()

    return graph_path


# Caching: To improve performance, cache the graph image if the same request is made multiple times.
#Error Handling: Add error handling for cases where the API returns no routes or invalid data.
#Optimization: If the API calls take too long, consider using asynchronous programming (e.g., asyncio or concurrent.futures) to make requests concurrently.
@app.route("/get-routes-and-graphs", methods=["GET"])
def get_routes_and_graphs():
    print("Received request for get-routes-and-graphs")
    start = request.args.get("start")
    end = request.args.get("end")

    if not start or not end:
        return jsonify({"error": "Missing parameters"}), 400

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

    if "routes" not in data or not data["routes"]:
        return jsonify({"error": "No routes found"}), 404

    # Extract route information and generate graphs
    routes = []
    for i, route in enumerate(data["routes"]):
        leg = route["legs"][0]
        route_info = {
            "distance": leg["distance"]["text"],
            "duration_considering_traffic": leg.get("duration_in_traffic", leg["duration"])["text"],
            "duration_typical": leg["duration"]["text"],
            "summary": route["summary"],
            "graph_url": f"/get-traffic-graph?start={start}&end={end}&route_index={i}"
        }
        routes.append(route_info)

        # Generate the graph for this route
        generate_graph(start, end, i, route)

    # Return route information and graph URLs
    return jsonify({"routes": routes})



@app.route("/get-traffic-graph", methods=["GET"]) # just generates one graph for the best route
def get_traffic_graph():
    start = request.args.get("start")
    end = request.args.get("end")
    route_index = int(request.args.get("route_index", 0))  # Default to the first route

    if not start or not end:
        return jsonify({"error": "Missing parameters"}), 400

    # Generate or fetch the cached graph for the selected route
    graph_filename = f"{start}_to_{end}_route_{route_index + 1}.png".replace("/", "_")
    graph_path = os.path.join(GRAPH_FOLDER, graph_filename)
    if not os.path.exists(graph_path):
        generate_graph(start, end, route_index, None)

    # Return the graph image
    return send_file(graph_path, mimetype="image/png")



@app.route("/get-traffic", methods=["GET"]) # just get the routes without graphs
def get_traffic():
    print(GOOGLE_MAPS_API_KEY)
    start = request.args.get("start") # get the start from the request, eventually change to place_id with gelolocation api
    end = request.args.get("end") 
    transportMode = 'DRIVING'


    if not start or not end:
        return jsonify({"error": "Missing parameters"}), 400

    url = "https://maps.googleapis.com/maps/api/directions/json"

    params = {
        "origin": start,
        "destination": end,
        "key": GOOGLE_MAPS_API_KEY,
        "mode": transportMode,
        "departure_time": "now",
        "traffic_model": "best_guess", 
        "alternatives": "true"
    }

    response = requests.get(url, params=params) # sends a get req to google maps API
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch data from Google Maps API", "status_code": response.status_code}), 500
    #response = requests.get(url) # sends a get req to google maps API

    data = response.json() # convert the response to json
    print(data)

    if "routes" not in data or not data["routes"]:
        return jsonify({"error": "No routes found"}), 404

    route_info = []
    for route in data["routes"]:
        leg = route["legs"][0]
        route_info.append({
            "duration_typical": leg["duration"]["text"],
            "distance": leg["distance"]["text"],
            "duration_considering_traffic": leg.get("duration_in_traffic", leg["duration"])["text"],
            "summary": "via " + route["summary"]
            #"path": route["overview_polyline"]["points"]
        })

    print(route_info)

    return jsonify({"routes": route_info})

if __name__ == "__main__":
    app.run(debug=True)