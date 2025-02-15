# jam-oracle
"beat the jam is really good for getting to JB and back. what if we could create congestion graph for any two arbitary places?"

Given a route between two locations commutable by car/bus, it graphs the expected and current delay time added by traffic congestion against time of the day. 

Google Maps API: Historical vs. Predictive Congestion Time
Historical Data:
Google Maps API does not provide direct access to historical traffic data. To obtain historical trends, you’d need to build your own dataset by periodically querying the API and storing the results over time. Not viable for user-facing app but good for regression insights.
Predictive Data:
The Directions API can offer predictive travel times if you supply a future departure time. By using parameters like departure_time (set to a future time) along with the traffic_model (e.g., "best_guess", "optimistic", "pessimistic"), you can get an estimate of congestion-based delays.

