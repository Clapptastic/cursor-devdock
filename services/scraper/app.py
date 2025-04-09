from flask import Flask, request, jsonify
import requests
import os
import logging
import json
from datetime import datetime
import time
import random
import threading
from urllib.parse import urlparse
import bs4
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Environment variables
MCP_REST_API_URL = os.environ.get('MCP_REST_API_URL', 'http://mcp-rest-api:8001')
PORT = int(os.environ.get('PORT', 8003))

# In-memory storage for scraping tasks
scraping_tasks = {}
task_id_counter = 1

# Supported extraction formats
SUPPORTED_FORMATS = ['text', 'html', 'json', 'links']

class ScrapingTask:
    """Class to represent a scraping task"""
    def __init__(self, url, format='text', selectors=None, pagination=None, max_pages=1, headers=None):
        global task_id_counter
        self.id = str(task_id_counter)
        task_id_counter += 1
        self.url = url
        self.format = format
        self.selectors = selectors or {}
        self.pagination = pagination
        self.max_pages = max_pages
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.status = 'pending'
        self.created_at = datetime.now().isoformat()
        self.started_at = None
        self.completed_at = None
        self.result = None
        self.error = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'UP',
        'version': '1.0.0',
        'tasks_count': len(scraping_tasks)
    })

@app.route('/api/scrape', methods=['POST'])
def scrape():
    """Create a new scraping task"""
    try:
        data = request.json
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
            
        url = data['url']
        format = data.get('format', 'text')
        selectors = data.get('selectors')
        pagination = data.get('pagination')
        max_pages = int(data.get('max_pages', 1))
        headers = data.get('headers')
        
        if format not in SUPPORTED_FORMATS:
            return jsonify({'error': f'Format not supported. Available formats: {", ".join(SUPPORTED_FORMATS)}'}), 400
            
        if max_pages > 10:
            return jsonify({'error': 'Maximum 10 pages allowed for pagination'}), 400
            
        # Create a new task
        task = ScrapingTask(
            url=url,
            format=format,
            selectors=selectors,
            pagination=pagination,
            max_pages=max_pages,
            headers=headers
        )
        
        # Store the task
        scraping_tasks[task.id] = task
        
        # Start scraping in a background thread
        threading.Thread(target=process_scraping_task, args=(task.id,)).start()
        
        return jsonify({
            'task_id': task.id,
            'status': task.status,
            'created_at': task.created_at
        }), 202
        
    except Exception as e:
        logger.error(f"Error creating scraping task: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
def get_all_tasks():
    """Get all scraping tasks"""
    try:
        tasks = []
        for task_id, task in scraping_tasks.items():
            tasks.append({
                'id': task.id,
                'url': task.url,
                'format': task.format,
                'status': task.status,
                'created_at': task.created_at,
                'started_at': task.started_at,
                'completed_at': task.completed_at
            })
        return jsonify(tasks)
    except Exception as e:
        logger.error(f"Error getting all tasks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get a specific scraping task"""
    try:
        if task_id not in scraping_tasks:
            return jsonify({'error': 'Task not found'}), 404
            
        task = scraping_tasks[task_id]
        
        response = {
            'id': task.id,
            'url': task.url,
            'format': task.format,
            'selectors': task.selectors,
            'pagination': task.pagination,
            'max_pages': task.max_pages,
            'status': task.status,
            'created_at': task.created_at,
            'started_at': task.started_at,
            'completed_at': task.completed_at
        }
        
        if task.status == 'completed':
            response['result'] = task.result
        elif task.status == 'failed':
            response['error'] = task.error
            
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting task {task_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/result', methods=['GET'])
def get_task_result(task_id):
    """Get just the result of a specific task"""
    try:
        if task_id not in scraping_tasks:
            return jsonify({'error': 'Task not found'}), 404
            
        task = scraping_tasks[task_id]
        
        if task.status != 'completed':
            return jsonify({'error': f'Task is {task.status}, not completed yet'}), 400
            
        return jsonify({'result': task.result})
        
    except Exception as e:
        logger.error(f"Error getting task result {task_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

def process_scraping_task(task_id):
    """Process a scraping task in the background"""
    if task_id not in scraping_tasks:
        logger.error(f"Task {task_id} not found")
        return
        
    task = scraping_tasks[task_id]
    task.status = 'processing'
    task.started_at = datetime.now().isoformat()
    
    try:
        # Perform the actual scraping
        logger.info(f"Starting scraping task {task_id} for URL: {task.url}")
        
        results = []
        current_url = task.url
        pages_scraped = 0
        
        while current_url and pages_scraped < task.max_pages:
            # Fetch the page
            response = requests.get(current_url, headers=task.headers, timeout=10)
            response.raise_for_status()
            
            # Parse with BeautifulSoup
            soup = bs4.BeautifulSoup(response.text, 'html.parser')
            
            # Extract data based on format
            if task.format == 'text':
                # Extract text content
                if task.selectors and 'content' in task.selectors:
                    elements = soup.select(task.selectors['content'])
                    content = '\n'.join([elem.get_text(strip=True) for elem in elements])
                else:
                    # Just get the main content, removing navigation, header, footer, etc.
                    for element in soup(['script', 'style', 'header', 'footer', 'nav']):
                        element.extract()
                    content = soup.get_text(separator='\n', strip=True)
                
                results.append({
                    'url': current_url,
                    'content': content,
                    'page': pages_scraped + 1
                })
                
            elif task.format == 'html':
                # Extract HTML content
                if task.selectors and 'content' in task.selectors:
                    elements = soup.select(task.selectors['content'])
                    content = ''.join([str(elem) for elem in elements])
                else:
                    content = str(soup.body) if soup.body else str(soup)
                
                results.append({
                    'url': current_url,
                    'html': content,
                    'page': pages_scraped + 1
                })
                
            elif task.format == 'links':
                # Extract links
                links = []
                base_url = "{0.scheme}://{0.netloc}".format(urlparse(current_url))
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    
                    # Make relative URLs absolute
                    if href.startswith('/'):
                        href = base_url + href
                    elif not href.startswith(('http://', 'https://')):
                        href = current_url.rstrip('/') + '/' + href
                    
                    link_text = link.get_text(strip=True)
                    links.append({
                        'url': href,
                        'text': link_text
                    })
                
                results.append({
                    'url': current_url,
                    'links': links,
                    'page': pages_scraped + 1
                })
                
            elif task.format == 'json':
                # Extract structured data based on selectors
                data = {}
                
                if task.selectors:
                    for key, selector in task.selectors.items():
                        elements = soup.select(selector)
                        if len(elements) == 1:
                            data[key] = elements[0].get_text(strip=True)
                        else:
                            data[key] = [elem.get_text(strip=True) for elem in elements]
                else:
                    # Try to find and parse JSON-LD data
                    json_ld = soup.find_all('script', {'type': 'application/ld+json'})
                    if json_ld:
                        try:
                            data = json.loads(json_ld[0].string)
                        except:
                            data = {'error': 'Found JSON-LD data but failed to parse it'}
                
                results.append({
                    'url': current_url,
                    'data': data,
                    'page': pages_scraped + 1
                })
            
            pages_scraped += 1
            
            # Find next page if pagination is enabled
            if task.pagination and pages_scraped < task.max_pages:
                next_page = None
                if 'selector' in task.pagination:
                    next_element = soup.select_one(task.pagination['selector'])
                    if next_element and 'href' in next_element.attrs:
                        next_page = next_element['href']
                elif 'pattern' in task.pagination:
                    current_page_num = int(re.search(r'page=(\d+)', current_url).group(1)) if re.search(r'page=(\d+)', current_url) else 1
                    next_page = re.sub(r'page=\d+', f'page={current_page_num + 1}', current_url)
                    if next_page == current_url:  # If no change, append page parameter
                        separator = '&' if '?' in current_url else '?'
                        next_page = f'{current_url}{separator}page={current_page_num + 1}'
                
                if next_page:
                    # Make relative URLs absolute
                    if next_page.startswith('/'):
                        base_url = "{0.scheme}://{0.netloc}".format(urlparse(current_url))
                        next_page = base_url + next_page
                    elif not next_page.startswith(('http://', 'https://')):
                        next_page = current_url.rstrip('/') + '/' + next_page
                    
                    current_url = next_page
                else:
                    break
            else:
                break
                
        # Add delay between requests to be respectful
        time.sleep(random.uniform(1, 3))
            
        # Update task with results
        task.result = results[0] if len(results) == 1 else results
        task.status = 'completed'
        task.completed_at = datetime.now().isoformat()
        
        logger.info(f"Completed scraping task {task_id}")
        
    except Exception as e:
        logger.error(f"Error in scraping task {task_id}: {str(e)}")
        task.status = 'failed'
        task.error = str(e)
        task.completed_at = datetime.now().isoformat()

def register_with_mcp():
    """Register this service with MCP Konnect"""
    try:
        response = requests.post(f"{MCP_REST_API_URL}/api/services/register", json={
            "name": "Web Scraper",
            "url": f"http://scraper:{PORT}",
            "description": "Service for scraping and extracting data from websites",
            "type": "utility"
        }, timeout=10)
        
        if response.status_code == 201:
            logger.info("Successfully registered with MCP")
        else:
            logger.warning(f"Failed to register with MCP. Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        logger.error(f"Error registering with MCP: {str(e)}")
        # Retry after some delay
        threading.Timer(10.0, register_with_mcp).start()

if __name__ == '__main__':
    # Generate some demo data
    demo_task = ScrapingTask(
        url="https://example.com",
        format="text"
    )
    demo_task.status = "completed"
    demo_task.started_at = demo_task.created_at
    demo_task.completed_at = demo_task.created_at
    demo_task.result = {
        "url": "https://example.com",
        "content": "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
        "page": 1
    }
    scraping_tasks[demo_task.id] = demo_task
    
    # Register with MCP after a short delay to ensure MCP is up
    threading.Timer(5.0, register_with_mcp).start()
    
    # Start the Flask app
    app.run(host='0.0.0.0', port=PORT) 