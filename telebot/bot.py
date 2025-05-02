import os
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackContext

# Load your bot token (replace 'YOUR_BOT_TOKEN' with the actual token)
BACKEND_URL = "http://127.0.0.1:5000"  # Change this if your Flask app runs elsewhere

async def start(update: Update, context: CallbackContext) -> None:
    await update.message.reply_text("Hello! Send /traffic <start> <end> to get traffic details.")

async def get_traffic(update: Update, context: CallbackContext) -> None:
    if len(context.args) < 2:
        await update.message.reply_text("Usage: /traffic <start> <end>")
        return

    start, end = context.args[0], context.args[1]
    print("Input Recieved", start, end)
    api_url = f"{BACKEND_URL}/get-routes-and-graphs?start={start}&end={end}"
    
    response = requests.get(api_url)
    if response.status_code == 200:
        data = response.json()
        if "routes" in data:
            message = "\n".join(
                [f"{r['summary']}: {r['duration_considering_traffic']} ({r['distance']})" for r in data["routes"]]
            )
            await update.message.reply_text(message)
            #graph_url = f"{BACKEND_URL}/get-traffic-graph?start={start}&end={end}&route_index={i}"
            #await update.message.reply_photo(photo=graph_url)
        else:
            await update.message.reply_text("No routes found.")
    else:
        await update.message.reply_text("Failed to fetch traffic data.")

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("traffic", get_traffic))

    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
