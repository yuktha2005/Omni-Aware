from database.connection import engine


def test_database_connection():
    with engine.connect() as connection:
        assert connection is not None
        print("Database connection successful!")


if __name__ == "__main__":
    try:
        test_database_connection()
    except Exception as e:
        print("Database connection failed!")
        print(e)