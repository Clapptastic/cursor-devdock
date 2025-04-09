from flask import Flask, request, jsonify
import requests
import json
import os

app = Flask(__name__)
MCP_REST_API_URL = os.environ.get('MCP_REST_API_URL', 'http://mcp-rest-api:8001')

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json
    url = data.get('url')
    selectors = data.get('selectors', {})
    
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    try:
        #
    except Exception as e:
        return jsonify({"error": str(e)}), 500 