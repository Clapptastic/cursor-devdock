# Use Nginx for serving static content
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple index.html file
RUN echo '<!DOCTYPE html>\n\
<html lang="en">\n\
<head>\n\
    <meta charset="UTF-8">\n\
    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n\
    <title>Customer Survey Platform</title>\n\
    <style>\n\
        body {\n\
            font-family: Arial, sans-serif;\n\
            line-height: 1.6;\n\
            margin: 0;\n\
            padding: 20px;\n\
            color: #333;\n\
            max-width: 1200px;\n\
            margin: 0 auto;\n\
        }\n\
        header {\n\
            background-color: #4a90e2;\n\
            color: white;\n\
            padding: 20px;\n\
            text-align: center;\n\
            border-radius: 5px;\n\
            margin-bottom: 20px;\n\
        }\n\
        .service {\n\
            background-color: #f9f9f9;\n\
            border: 1px solid #ddd;\n\
            padding: 20px;\n\
            margin-bottom: 20px;\n\
            border-radius: 5px;\n\
        }\n\
        h1, h2, h3 {\n\
            color: #4a90e2;\n\
        }\n\
        .endpoint {\n\
            background-color: #eee;\n\
            padding: 10px;\n\
            margin: 10px 0;\n\
            border-radius: 3px;\n\
            font-family: monospace;\n\
        }\n\
    </style>\n\
</head>\n\
<body>\n\
    <header>\n\
        <h1>Customer Survey Platform</h1>\n\
        <p>A microservices-based platform for creating, distributing, and analyzing customer surveys</p>\n\
    </header>\n\
    <main>\n\
        <div class="service">\n\
            <h2>Kong API Gateway</h2>\n\
            <p>The Kong API Gateway is available at:</p>\n\
            <div class="endpoint">http://localhost:8000</div>\n\
            <p>Try the health check endpoint:</p>\n\
            <div class="endpoint">http://localhost:8000/health</div>\n\
            <p>Kong Admin API:</p>\n\
            <div class="endpoint">http://localhost:8001</div>\n\
        </div>\n\
        <div class="service">\n\
            <h2>Available Services via Kong</h2>\n\
            <ul>\n\
                <li>\n\
                    <h3>Survey Service</h3>\n\
                    <p>Endpoint: <span class="endpoint">/api/surveys</span></p>\n\
                    <p>Public surveys: <span class="endpoint">/survey</span></p>\n\
                </li>\n\
                <li>\n\
                    <h3>Response Service</h3>\n\
                    <p>Endpoint: <span class="endpoint">/api/responses</span></p>\n\
                </li>\n\
                <li>\n\
                    <h3>AI Service</h3>\n\
                    <p>Endpoint: <span class="endpoint">/api/ai</span></p>\n\
                </li>\n\
            </ul>\n\
        </div>\n\
    </main>\n\
    <footer>\n\
        <p>&copy; 2025 Customer Survey Platform</p>\n\
    </footer>\n\
</body>\n\
</html>' > index.html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 