import redis
from rq import Worker, Queue, Connection

redis_conn = redis.Redis(host="localhost", port=6379)

listen = ["movie-processing"]

if __name__ == "__main__":
    print("Worker starting...")
    with Connection(redis_conn):
        worker = Worker(map(Queue, listen))
        worker.work()