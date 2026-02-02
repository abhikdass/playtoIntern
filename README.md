# PlTo - Community Feed Application

## Prerequisites

- Python 3.x
- Node.js and npm
- Django

## Running the Backend

1. Navigate to the project root directory:
    ```bash
    cd InternshipAssessment
    ```

2. Create and activate a virtual environment (recommended):
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # macOS/Linux
    python -m venv venv
    source venv/bin/activate
    ```

3. Install dependencies:
    ```bash
    pip install django djangorestframework
    ```

4. Run migrations:
    ```bash
    python manage.py migrate
    ```

5. Start the Django server:
    ```bash
    python manage.py runserver
    ```

    The backend will be running at `http://127.0.0.1:8000/`


## Running the Frontend

1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the React development server:
    ```bash
    npm start
    ```

    The frontend will be running at `http://localhost:3000/`

## Running Both

Open two terminal windows and run the backend in one and the frontend in the other.