# jam-oracle

Have you ever sat in your car, caught in a terrible traffic jam, and asked yourself: **"Could I have avoided this? What time does the rush hour really start? Maybe if I left a little earlier..."**?

Look no futher! **Jam Oracle** is a telegram bot that predicts and visualizes rush-hour congestion on your personal driving commute.

Given a start and end location, Jam Oracle **tells you exactly when traffic picks up or subsides** for the top 3 possible routes. 

See how well our predictors do, and use the information to plan your next trip!


## Inspiration

[Beat The Jam]([/guides/content/editing-an-existing-page](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://apps.apple.com/sg/app/beat-the-jam/id1204898821&ved=2ahUKEwiizLG9pYaNAxU-xTgGHVcCKH8QFnoECBMQAQ&usg=AOvVaw1BCjngzYGpw1JzQ87Uw_VC)), but for arbitary places.

## Extensions

After 24 hours, give users a more accurate graph of **how traffic actually played out that day.** 

Provide app links to google maps navigation for each possible route.

## Local Running Instructions

*@JamOracleBot is deployed as a Render web service (free tier) that sleeps on inactivity. On command, it should take a minute to spin up, but here's how you can run it yourself*

Locally running code on main branch, code for deloyment on branch 03052025

1. Create a new bot using @BotFather on Telegram to get the TELEGRAM_BOT_TOKEN

2. Create a GOOGLE_MAPS_API_KEY on Google Cloud, enabling Places, Geocode, Directions services

3. Put tokens in .env file

4. Create python virtual environment
   
`python3 -m venv myenv`

6. Activate it

`source myenv/bin/activate`

7. Install dependencies

`pip install -r requirements.txt`

8. Navigate back to
   
`python3 bot.py`

Your bot is live and responding to commands!


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
