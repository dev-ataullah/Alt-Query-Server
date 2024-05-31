# Alternative Product Information System Backend

Welcome to the backend repository of the Alternative Product Information System project! This repository contains the backend server code built using Node.js, Express.js, and MongoDB.

## Key Features

1. **User Product Posting**: Users can post pictures and details (name, brand, query) of products they do not like.
2. **Recommendations**: Users can receive recommendations for better alternatives based on the products they dislike.
3. **Secure Authentication**: Utilizes JWT tokens for secure user authentication, ensuring only authorized users can access certain features.
4. **CRUD Operations**: Provides endpoints for Create, Read, Update, and Delete operations for managing posts and recommendations.
5. **Data Separation**: Backend API endpoints are structured to handle post data, recommendation data, and user authentication separately.

## Technologies Used

- **Node.js**: JavaScript runtime for server-side development.
- **Express.js**: Web application framework for Node.js, used for building the RESTful API.
- **MongoDB**: NoSQL database for storing user and product data.
- **JWT**: JSON Web Tokens for secure authentication.
- **Other npm Packages**: Used for various functionalities like data validation, error handling, etc.

## Project Structure

The project is structured to ensure clarity and maintainability. Here’s an overview:

- **src/**: Contains all the source code.
  - **index.js**: Entry point of the application.
  - **middleware/**: Middleware functions.
  - **others**
