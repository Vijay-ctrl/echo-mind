import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in .env")

client = AsyncIOMotorClient(MONGODB_URI)

database = client["gemini_assistant"]

users_collection = database["users"]
chats_collection = database["chats"]
messages_collection = database["messages"]


async def test_database_connection():
    try:
        await client.admin.command("ping")
        print("✅ MongoDB connection successful")
    except Exception as error:
        print("❌ MongoDB connection failed:", error)