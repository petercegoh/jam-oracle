# jam-oracle

Have you ever sat in your car, caught in a terrible traffic jam, and asked yourself: **"Could I have avoided this? What time does the rush hour really start? Maybe if I left a little earlier..."**?

Look no futher! **Jam Oracle** is a telegram bot that visualises traffic congestion for your frequently taken routes. 

Given a start and end location, Jam Oracle plots a predictive graph based on historical to **tell you exactly when traffic picks up or subsides** for the top 3 possible routes. After 24 hours, you'll recieve a more accurate graph of **how traffic actually played out that day.** 

See how well our predictors do, and use the information to plan your next trip!


## Ideation

"beat the jam is really good for getting to JB and back. what if we could create congestion graph for any two arbitary places?"

Given a route between two locations commutable by car/bus, can we graph the expected and current delay time added by traffic congestion against time of the day?

Google Maps API Historical Data:
Google Maps API does not provide direct access to historical traffic data. To obtain historical trends, you’d need to build your own dataset by periodically querying the API and storing the results over time. Not viable for user-facing app but good for regression insights.

Google Maps API Predictive Data:
The Directions API can offer predictive travel times if you supply a future departure time. By using parameters like departure_time (set to a future time) along with the traffic_model (e.g., "best_guess", "optimistic", "pessimistic"), you can get an estimate of congestion-based delays.

## Contributors

<table>
	<tbody>
        <tr>
            <td align="center">
                <a href="https://www.linkedin.com/in/gabriel-zmong/">
                    <img src="https://avatars.githubusercontent.com/u/117062305?v=4" width="100;" alt="gongahkia"/>
                    <br />
                    <sub><b>Gabriel Ong</b></sub>
                </a>
                <br />
                <sub><a href="./src/frontend/">Frontend<a></sub>
            </td>
            <td align="center">
                <a href="">
                    <img src="https://avatars.githubusercontent.com/u/128559610?v=4" width="100;" alt="petercegoh"/>
                    <br />
                    <sub><b>Peter Goh</b></sub>
                </a>
                <br />
                <sub><a href="./src/backend/">Backend<a></sub>
            </td>
        </tr>
	</tbody>
</table>
