import psycopg2
from psycopg2.extras import RealDictCursor
import os

def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def ensure_user(user_id): # retreive user cresits. if not exist, create user. 
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM user_credits WHERE user_id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                cur.execute(
                    "INSERT INTO user_credits (user_id) VALUES (%s)",
                    (user_id,)
                )
                conn.commit()

def has_credits(user_id): # check if a user has credits at all
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT credits FROM user_credits WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            return result and result['credits'] > 0

def use_credit(user_id): # decrement a user's credits while the guy still has credits. 
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE user_credits SET credits = credits - 1 WHERE user_id = %s AND credits > 0",
                (user_id,)
            )
            conn.commit()

def get_credits(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT credits FROM user_credits WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            return result['credits'] if result else 0