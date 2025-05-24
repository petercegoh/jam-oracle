# jam-oracle

Have you ever sat in your car, caught in a terrible traffic jam, and asked yourself: **"Could I have avoided this? What time does the rush hour really start? Maybe if I left a little earlier..."**?

Look no futher! **Jam Oracle** is a telegram bot that predicts and visualizes traffic congestion on optimal routes for any driving commute.

Given a start and end location, Jam Oracle **tells you exactly when traffic picks up or subsides** for the top 3 possible routes. 

See how well our predictors do, and use the information to plan your next trip!


## Inspiration

[Beat The Jam]([/guides/content/editing-an-existing-page](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://apps.apple.com/sg/app/beat-the-jam/id1204898821&ved=2ahUKEwiizLG9pYaNAxU-xTgGHVcCKH8QFnoECBMQAQ&usg=AOvVaw1BCjngzYGpw1JzQ87Uw_VC)), but for arbitary places.

## Approaches considered 

Google Maps API Historical Data:
Google Maps API does not provide direct access to historical traffic data. To obtain historical trends, you’d need to build your own dataset by periodically querying the API and storing the results over time. Not viable for user-facing app but good for regression insights.

Google Maps API Predictive Data:
The Directions API can offer predictive travel times if you supply a future departure time. By using parameters like departure_time (set to a future time) along with the traffic_model (e.g., "best_guess", "optimistic", "pessimistic"), you can get an estimate of congestion-based delays.

## TODOs

After 24 hours, give users a more accurate graph of **how traffic actually played out that day.** 

Provide app links to google maps navigation for each possible route.

## Local Running Instructions

*to remind myself because im a noob programmer and i dont know how to run a python file*

Create python virtual environment
`python3 -m venv myenv`

Activate it
`source myenv/bin/activate`

Install dependencies
'pip install -r requirements.txt'

Run python
`python3 bot.py`


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
