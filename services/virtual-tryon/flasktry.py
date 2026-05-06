from flask import Flask, render_template, request, send_from_directory, jsonify, redirect, url_for
import json
import requests
from flask_cors import CORS
import numpy as np
import cv2                              # Library for image processing
from math import floor
import os
import uuid
from werkzeug.utils import secure_filename
import base64
from datetime import datetime
import random  # For simulating blockchain and rewards data
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import SkinToneClassifier
try:
    from skin_tone_classifier import SkinToneClassifier
    print("Successfully imported local SkinToneClassifier")
    SKIN_TONE_AVAILABLE = True
except ImportError as e:
    print(f"Import error: {str(e)}")
    SKIN_TONE_AVAILABLE = False
    print("SkinToneClassifier not available. Install with: pip install skin-tone-classifier")

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Path to React app build directory
REACT_APP_BUILD_DIR = os.path.join('static', 'react-app')

# Path for user uploads
USER_UPLOADS_DIR = os.path.join('static', 'user-uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Path for catalog data
CATALOG_FILE = os.path.join('static', 'catalog.json')

# Create user uploads directory if it doesn't exist
os.makedirs(os.path.join(app.root_path, USER_UPLOADS_DIR), exist_ok=True)

# Simulated blockchain and rewards data
BLOCKCHAIN_DATA = {
    'transactions': 0,
    'active_nodes': 120,
    'block_height': 1000000
}

REWARDS_DATA = {
    'tokens': 340,
    'level': 2,
    'progress': 65,
    'achievements': [
        {
            'title': 'Fashion Explorer',
            'description': 'Try on 10 different items',
            'progress': 7,
            'total': 10,
            'reward': 50
        },
        {
            'title': 'Social Butterfly',
            'description': 'Share 5 try-on results',
            'progress': 3,
            'total': 5,
            'reward': 30
        }
    ]
}

REWARDS_FILE = os.path.join(os.path.dirname(__file__), 'rewards.json')
REWARD_ACTIONS = {
    'daily_login': {'tokens': 2, 'achievement': None},
    'try_on': {'tokens': 8, 'achievement': 'fashion-explorer'},
    'share': {'tokens': 15, 'achievement': 'social-butterfly'},
    'review': {'tokens': 10, 'achievement': 'voice-of-style'},
    'save_item': {'tokens': 5, 'achievement': 'curator'},
    'color_analysis': {'tokens': 25, 'achievement': 'chromatch-starter'},
    'add_to_cart': {'tokens': 3, 'achievement': None},
    'checkout': {'tokens': 50, 'achievement': 'confident-shopper'},
    'style_chat': {'tokens': 6, 'achievement': 'style-expert'},
}

DEFAULT_REWARD_ACHIEVEMENTS = [
    {'id': 'chromatch-starter', 'title': 'Chromatch Starter', 'description': 'Complete your first color analysis', 'progress': 0, 'total': 1, 'reward': 40, 'claimed': False},
    {'id': 'fashion-explorer', 'title': 'Fashion Explorer', 'description': 'Try on 10 different outfits', 'progress': 0, 'total': 10, 'reward': 50, 'claimed': False},
    {'id': 'social-butterfly', 'title': 'Social Butterfly', 'description': 'Share 5 try-on results', 'progress': 0, 'total': 5, 'reward': 30, 'claimed': False},
    {'id': 'curator', 'title': 'Style Curator', 'description': 'Save 5 marketplace items', 'progress': 0, 'total': 5, 'reward': 35, 'claimed': False},
    {'id': 'voice-of-style', 'title': 'Voice of Style', 'description': 'Leave 2 product reviews', 'progress': 0, 'total': 2, 'reward': 45, 'claimed': False},
    {'id': 'confident-shopper', 'title': 'Confident Shopper', 'description': 'Complete your first checkout', 'progress': 0, 'total': 1, 'reward': 75, 'claimed': False},
    {'id': 'style-expert', 'title': 'Style Expert', 'description': 'Ask the AI stylist 5 fashion questions', 'progress': 0, 'total': 5, 'reward': 100, 'claimed': False},
]

def _fresh_reward_profile():
    return {
        'tokens': 0,
        'lifetimeTokens': 0,
        'level': 1,
        'progress': 0,
        'achievements': [dict(a) for a in DEFAULT_REWARD_ACHIEVEMENTS],
        'claimedRewards': [],
        'activity': [],
        'completedActions': {},
    }

def _load_reward_store():
    if os.path.exists(REWARDS_FILE):
        try:
            with open(REWARDS_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_reward_store(store):
    with open(REWARDS_FILE, 'w') as f:
        json.dump(store, f, indent=2)

def _reward_profile_for(user_id):
    store = _load_reward_store()
    profile = store.get(user_id) or _fresh_reward_profile()
    profile.setdefault('achievements', [dict(a) for a in DEFAULT_REWARD_ACHIEVEMENTS])
    profile.setdefault('claimedRewards', [])
    profile.setdefault('activity', [])
    profile.setdefault('completedActions', {})
    profile['level'] = int(profile.get('lifetimeTokens', 0) / 100) + 1
    profile['progress'] = int(profile.get('lifetimeTokens', 0) % 100)
    return store, profile

def _add_reward_activity(profile, action, label, tokens):
    profile['activity'] = [{
        'id': f"{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}",
        'action': action,
        'label': label,
        'tokens': tokens,
        'createdAt': datetime.now().isoformat(),
    }] + profile.get('activity', [])[:29]

def _add_reward_tokens(profile, tokens):
    profile['tokens'] = profile.get('tokens', 0) + tokens
    profile['lifetimeTokens'] = profile.get('lifetimeTokens', 0) + tokens
    profile['level'] = int(profile['lifetimeTokens'] / 100) + 1
    profile['progress'] = int(profile['lifetimeTokens'] % 100)

# Demo try-on images for different combinations
DEMO_IMAGES = {
    '1_1': '/static/assets/bg1.jpg',  # Blue tshirt + white pant
    '2_1': '/static/assets/bg.jpg',   # Blue shirt + white pant
    '3_2': '/static/assets/background.jpg',  # Black tshirt + blue pant
    '4_2': '/static/assets/bg.jpeg',  # Grey tshirt + blue pant
    'default': '/static/assets/leftimage-removebg-preview.png'  # Default image
}

# Default catalog items
default_catalog = {
    'shirts': [
        {'id': '1', 'name': 'Blue T-shirt', 'image': '/static/assets/shirt1.png', 'type': 'default'},
        {'id': '2', 'name': 'Blue Shirt', 'image': '/static/assets/shirt2.png', 'type': 'default'},
        {'id': '3', 'name': 'Black T-shirt', 'image': '/static/assets/shirt51.jpg', 'type': 'default'},
        {'id': '4', 'name': 'Grey T-shirt', 'image': '/static/assets/shirt6.png', 'type': 'default'},
        {'id': '5', 'name': 'Emerald Anarkali', 'image': '/static/assets/emerald_anarkali.jpg', 'type': 'default'},
        {'id': '6', 'name': 'Ruby Lehenga', 'image': '/static/assets/ruby_lehenga.jpg', 'type': 'default'},
        {'id': '7', 'name': 'White Kurti', 'image': '/static/assets/white_kurti.jpg', 'type': 'default'}
    ],
    'pants': [
        {'id': '1', 'name': 'White Pants', 'image': '/static/assets/pant7.jpg', 'type': 'default'},
        {'id': '2', 'name': 'Blue Pants', 'image': '/static/assets/pant21.png', 'type': 'default'},
        {'id': '3', 'name': 'Pink Palazzo', 'image': '/static/assets/pink_palazzo.jpg', 'type': 'default'}
    ]
}

# Load catalog from file or use default
def load_catalog():
    try:
        if os.path.exists(os.path.join(app.root_path, CATALOG_FILE)):
            with open(os.path.join(app.root_path, CATALOG_FILE), 'r') as f:
                return json.load(f)
        return default_catalog
    except Exception as e:
        print(f"Error loading catalog: {str(e)}")
        return default_catalog

# Save catalog to file
def save_catalog(catalog_data):
    try:
        with open(os.path.join(app.root_path, CATALOG_FILE), 'w') as f:
            json.dump(catalog_data, f, indent=4)
    except Exception as e:
        print(f"Error saving catalog: {str(e)}")

# Initialize catalog
catalog = load_catalog()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def remove_background(input_path, output_path):
    """
    Remove background from an image and save with transparent background
    Using improved techniques for better results with custom uploads
    """
    try:
        # Read the image
        img = cv2.imread(input_path)
        if img is None:
            print(f"Error: Could not read image at {input_path}")
            return False
            
        # Convert to RGB for processing
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Create a mask with multiple methods and combine them
        # Method 1: Simple thresholding on grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh1 = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        
        # Method 2: Color-based segmentation
        # Convert to HSV color space
        img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define range for background colors (assuming white/light background)
        lower_white = np.array([0, 0, 180])
        upper_white = np.array([180, 30, 255])
        
        # Create mask for white/light background
        thresh2 = cv2.inRange(img_hsv, lower_white, upper_white)
        thresh2 = cv2.bitwise_not(thresh2)
        
        # Method 3: Adaptive thresholding for better handling of dark items
        adaptive_thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Combine masks
        combined_mask = cv2.bitwise_or(thresh1, thresh2)
        combined_mask = cv2.bitwise_or(combined_mask, adaptive_thresh)
        
        # Apply morphological operations to improve the mask
        kernel = np.ones((5, 5), np.uint8)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
        
        # Find the largest contour (assumed to be the clothing item)
        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # If contours found, use the largest one
        if contours:
            # Create a new mask with only the largest contour
            refined_mask = np.zeros_like(combined_mask)
            largest_contour = max(contours, key=cv2.contourArea)
            cv2.drawContours(refined_mask, [largest_contour], 0, 255, -1)
            
            # Fill holes in the contour
            # First invert the mask to make holes white
            mask_inv = cv2.bitwise_not(refined_mask)
            # Find all contours in the inverted mask
            hole_contours, _ = cv2.findContours(mask_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            # Fill all but the largest contour (which is the outer boundary)
            for contour in hole_contours:
                if cv2.contourArea(contour) < cv2.contourArea(largest_contour):
                    cv2.drawContours(refined_mask, [contour], 0, 255, -1)
            
            # Dilate to ensure we don't crop the clothing too tightly
            refined_mask = cv2.dilate(refined_mask, kernel, iterations=2)
        else:
            refined_mask = combined_mask
        
        # Final cleanup
        refined_mask = cv2.GaussianBlur(refined_mask, (5, 5), 0)
        _, refined_mask = cv2.threshold(refined_mask, 127, 255, cv2.THRESH_BINARY)
        
        # Create alpha channel from mask
        alpha = refined_mask
        
        # Convert image to BGRA (add alpha channel)
        bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
        # Set alpha channel in BGRA image
        bgra[:, :, 3] = alpha
        
        # Save the image with transparency
        cv2.imwrite(output_path, bgra)
        
        # Verification check
        result = cv2.imread(output_path, cv2.IMREAD_UNCHANGED)
        if result is None or result.shape[2] < 4:  # Check if alpha channel exists
            print(f"Warning: Failed to create transparent image. Saving with fallback method.")
            # Fallback method: just save the original with very basic background removal
            _, simple_mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)
            bgra[:, :, 3] = simple_mask
            cv2.imwrite(output_path, bgra)
        
        return True
    except Exception as e:
        print(f"Error removing background: {str(e)}")
        return False

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, 'react-app', path)):
        return send_from_directory(os.path.join(app.static_folder, 'react-app'), path)
    else:
        return send_from_directory(os.path.join(app.static_folder, 'react-app'), 'index.html')

# Add explicit route to serve static assets
@app.route('/static/assets/<path:filename>')
def serve_static_assets(filename):
    response = send_from_directory(os.path.join(app.static_folder, 'assets'), filename)
    # Set Cache-Control header to prevent caching issues
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# New API endpoint for rewards system
@app.route('/api/rewards/status', methods=['GET'])
def rewards_status():
    user_id = request.args.get('user_id', 'guest')
    _, profile = _reward_profile_for(user_id)
    return jsonify({
        'success': True,
        'data': profile
    })

# New API endpoint to update rewards
@app.route('/api/rewards/update', methods=['POST'])
def update_rewards():
    try:
        data = request.get_json()
        action = data.get('action', '')
        user_id = data.get('user_id', 'guest')
        dedupe_key = data.get('dedupe_key')

        if action not in REWARD_ACTIONS:
            return jsonify({'success': False, 'error': f'Unknown reward action: {action}'}), 400

        store, profile = _reward_profile_for(user_id)
        action_key = f"{action}:{datetime.now().date()}" if action == 'daily_login' else f"{action}:{dedupe_key}" if dedupe_key else None

        if action_key and action_key in profile['completedActions']:
            return jsonify({'success': True, 'skipped': True, 'message': 'Reward already claimed for this action.', 'data': profile})

        config = REWARD_ACTIONS[action]
        tokens = config['tokens']
        _add_reward_tokens(profile, tokens)
        _add_reward_activity(profile, action, action.replace('_', ' ').title(), tokens)

        if action_key:
            profile['completedActions'][action_key] = datetime.now().isoformat()

        achievement_id = config.get('achievement')
        if achievement_id:
            for achievement in profile['achievements']:
                if achievement['id'] == achievement_id and achievement['progress'] < achievement['total']:
                    achievement['progress'] += 1
                    achievement['completed'] = achievement['progress'] >= achievement['total']
                    break

        store[user_id] = profile
        _save_reward_store(store)

        return jsonify({
            'success': True,
            'tokensEarned': tokens,
            'data': profile
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Enhanced try-on API with rewards integration
@app.route('/api/tryon', methods=['POST'])
def tryon_api():
    try:
        data = request.get_json()
        shirt_id = data.get('shirt', '0')
        pant_id = data.get('pant', '0')
        
        # Always use camera mode, ignoring the use_camera flag
        # Redirect to the camera-based try-on experience
        return jsonify({
            'success': True,
            'redirect': True,
            'url': f'/api/predict?shirt={shirt_id}&pant={pant_id}'
        })
        
        # The code below will never be reached since we're always redirecting
        # For demo purposes, return a static image based on the selection
        image_key = f"{shirt_id}_{pant_id}"
        image_url = DEMO_IMAGES.get(image_key, DEMO_IMAGES['default'])
        
        # Update rewards for try-on action
        update_rewards({'action': 'try_on'})
        
        # Simulate processing time
        import time
        time.sleep(1)
        
        result = {
            'success': True,
            'message': f'Try-on successful with shirt {shirt_id} and pant {pant_id}',
            'image_url': image_url,
            'rewards': {
                'tokens_earned': 5,
                'current_tokens': REWARDS_DATA['tokens']
            }
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# API endpoint for catalog
@app.route('/api/catalog', methods=['GET'])
def get_catalog():
    global catalog
    catalog = load_catalog()  # Reload catalog on each request to ensure freshness
    return jsonify(catalog)

# API endpoint to upload new clothing items
@app.route('/api/catalog/upload', methods=['POST'])
def upload_item():
    global catalog
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})
    
    file = request.files['file']
    item_type = request.form.get('type', 'shirt')
    name = request.form.get('name', f'Custom {item_type.capitalize()}')
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})
    
    if file and allowed_file(file.filename):
        try:
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())
            file_ext = os.path.splitext(filename)[1]
            new_filename = f"{item_type}_{unique_id}{file_ext}"
            
            # Create directories if they don't exist
            os.makedirs(os.path.join(app.root_path, USER_UPLOADS_DIR), exist_ok=True)
            
            # Save original file
            original_path = os.path.join(app.root_path, USER_UPLOADS_DIR, f"original_{new_filename}")
            file.save(original_path)
            
            # Process image to remove background
            processed_filename = f"processed_{new_filename}"
            processed_path = os.path.join(app.root_path, USER_UPLOADS_DIR, processed_filename)
            
            print(f"Processing image: {original_path} -> {processed_path}")
            success = remove_background(original_path, processed_path)
            
            if not success:
                return jsonify({
                    'success': False, 
                    'error': 'Failed to process image. Please ensure the image has good contrast with its background.'
                })
            
            # Add to catalog
            current_catalog = load_catalog()
            
            if item_type == 'shirt':
                collection = 'shirts'
                new_id = str(len(current_catalog[collection]) + 1)
            elif item_type == 'pant':
                collection = 'pants'
                new_id = str(len(current_catalog[collection]) + 1)
            else:
                collection = f"{item_type}s"
                new_id = unique_id
            
            item = {
                'id': new_id,
                'name': name,
                'image': f'/{USER_UPLOADS_DIR}/{processed_filename}',
                'type': 'user'
            }
            
            current_catalog[collection].append(item)
            save_catalog(current_catalog)
            catalog = current_catalog
            
            return jsonify({
                'success': True,
                'message': f'{item_type.capitalize()} uploaded and processed successfully',
                'item': item
            })
        except Exception as e:
            print(f"Error in upload process: {str(e)}")
            return jsonify({
                'success': False, 
                'error': f'An error occurred while processing your upload: {str(e)}'
            })
    
    return jsonify({'success': False, 'error': 'File type not allowed. Please upload a JPG, JPEG, or PNG image.'})

@app.route('/predict', methods=['GET','POST'])
def predict():
    # Support both form data (from legacy HTML) and query parameters (from new React app)
    if request.method == 'POST':
        shirtno = request.form["shirt"]
        pantno = request.form["pant"]
    else:  # GET request
        shirtno = request.args.get("shirt", "1")
        pantno = request.args.get("pant", "1")
    
    # Load the catalog to access all shirt and pant images
    current_catalog = load_catalog()
    
    # Find the selected shirt and pant from the catalog
    selected_shirt = None
    for shirt in current_catalog['shirts']:
        if shirt['id'] == shirtno:
            selected_shirt = shirt
            break
    
    selected_pant = None
    for pant in current_catalog['pants']:
        if pant['id'] == pantno:
            selected_pant = pant
            break
    
    # If shirt or pant not found, use defaults
    if not selected_shirt:
        selected_shirt = current_catalog['shirts'][0]
    if not selected_pant:
        selected_pant = current_catalog['pants'][0]
    
    # Get paths and prepare for processing
    shirt_path = os.path.join(app.root_path, selected_shirt['image'].lstrip('/'))
    pant_path = os.path.join(app.root_path, selected_pant['image'].lstrip('/'))

    cv2.waitKey(1)
    cap = cv2.VideoCapture(0)
    
    while True:
        # Read the selected shirt
        imgshirt = cv2.imread(shirt_path, 1)  # original img in bgr
        if imgshirt is None:
            print(f"Error: Could not read shirt image at {shirt_path}")
            # Use a default shirt as fallback
            imgshirt = cv2.imread(os.path.join(app.root_path, 'static/assets/shirt1.png'), 1)
        
        # Process shirt mask
        shirtgray = cv2.cvtColor(imgshirt, cv2.COLOR_BGR2GRAY)
        
        # Check if it's a custom uploaded shirt
        if 'user-uploads' in shirt_path:
            # Custom uploaded shirts should already have transparency from our processing
            # Check if the image has an alpha channel
            if imgshirt.shape[2] == 4:  # BGRA format
                # Use alpha channel directly
                _, orig_masks = cv2.threshold(imgshirt[:,:,3], 127, 255, cv2.THRESH_BINARY)
                orig_masks_inv = cv2.bitwise_not(orig_masks)
            else:
                # Fall back to regular processing
                ret, orig_masks = cv2.threshold(shirtgray, 240, 255, cv2.THRESH_BINARY_INV)
                orig_masks_inv = cv2.bitwise_not(orig_masks)
        elif 'shirt51.jpg' in shirt_path:  # Special case for shirt3
            ret, orig_masks_inv = cv2.threshold(shirtgray, 200, 255, cv2.THRESH_BINARY)
            orig_masks = cv2.bitwise_not(orig_masks_inv)
        else:
            ret, orig_masks = cv2.threshold(shirtgray, 0, 255, cv2.THRESH_BINARY)
            orig_masks_inv = cv2.bitwise_not(orig_masks)
        
        origshirtHeight, origshirtWidth = imgshirt.shape[:2]
        
        # Read the selected pant
        imgpant = cv2.imread(pant_path, 1)
        if imgpant is None:
            print(f"Error: Could not read pant image at {pant_path}")
            # Use a default pant as fallback
            imgpant = cv2.imread(os.path.join(app.root_path, 'static/assets/pant7.jpg'), 1)
        
        imgpant = imgpant[:,:,0:3]
        pantgray = cv2.cvtColor(imgpant, cv2.COLOR_BGR2GRAY)
        
        # Process pant mask - adjust threshold based on the pant type
        if 'pant7.jpg' in pant_path:  # White pants
            ret, orig_mask = cv2.threshold(pantgray, 100, 255, cv2.THRESH_BINARY)
        else:  # Default for other pants
            ret, orig_mask = cv2.threshold(pantgray, 50, 255, cv2.THRESH_BINARY)
        
        # Create inverse mask
        orig_mask_inv = cv2.bitwise_not(orig_mask)
        origpantHeight, origpantWidth = imgpant.shape[:2]

        face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

        ret, img = cap.read()
       
        height = img.shape[0]
        width = img.shape[1]
        resizewidth = int(width*3/2)
        resizeheight = int(height*3/2)
        
        # cv2.namedWindow("img", cv2.WINDOW_NORMAL)
        # cv2.resizeWindow("img", (int(width*3/2), int(height*3/2)))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            # Pants processing
            pantWidth = 3 * w
            pantHeight = pantWidth * origpantHeight / origpantWidth
            
            # Default positioning for pants
            x1 = x - w
            x2 = x1 + 3*w
            y1 = y + 5*h
            y2 = y + h*10
            
            # Adjust position for specific pants if needed
            if 'pant21.png' in pant_path:  # Blue pants
                x1 = x - w/2
                x2 = x1 + 2*w
                y1 = y + 4*h
                y2 = y + h*9
            
            # Boundary checks
            if x1 < 0:
                x1 = 0
            if x2 > img.shape[1]:
                x2 = img.shape[1]
            if y2 > img.shape[0]:
                y2 = img.shape[0]
            if y1 > img.shape[0]:
                y1 = img.shape[0]
            if y1 == y2:
                y1 = 0
                
            temp = 0
            if y1 > y2:
                temp = y1
                y1 = y2
                y2 = temp
                
            pantWidth = int(abs(x2 - x1))
            pantHeight = int(abs(y2 - y1))
            x1 = int(x1)
            x2 = int(x2)
            y1 = int(y1)
            y2 = int(y2)
            
            pant = cv2.resize(imgpant, (pantWidth, pantHeight), interpolation=cv2.INTER_AREA)
            mask = cv2.resize(orig_mask, (pantWidth, pantHeight), interpolation=cv2.INTER_AREA)
            mask_inv = cv2.resize(orig_mask_inv, (pantWidth, pantHeight), interpolation=cv2.INTER_AREA)
            
            roi = img[y1:y2, x1:x2]
            
            # Ensure mask_inv is the right size and type
            if mask_inv.shape[:2] != roi.shape[:2]:
                mask_inv = cv2.resize(mask_inv, (roi.shape[1], roi.shape[0]), interpolation=cv2.INTER_AREA)
            if len(mask_inv.shape) > 2:
                mask_inv = cv2.cvtColor(mask_inv, cv2.COLOR_BGR2GRAY)
                
            roi_bg = cv2.bitwise_and(roi, roi, mask=mask_inv)
                
            # Ensure mask is the right size and type
            if mask.shape[:2] != pant.shape[:2]:
                mask = cv2.resize(mask, (pant.shape[1], pant.shape[0]), interpolation=cv2.INTER_AREA)
            if len(mask.shape) > 2:
                mask = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
                
            roi_fg = cv2.bitwise_and(pant, pant, mask=mask)
            
            # Initialize roi_fgs and roi_bgs
            roi_fgs = roi_fg
            roi_bgs = roi_bg
            
            # Ensure roi_fgs and roi_bgs have the same shape and channels
            if roi_fgs.shape != roi_bgs.shape:
                roi_fgs = cv2.resize(roi_fgs, (roi_bgs.shape[1], roi_bgs.shape[0]), interpolation=cv2.INTER_AREA)
                
            # Make sure they have the same number of channels
            if len(roi_fgs.shape) != len(roi_bgs.shape):
                if len(roi_fgs.shape) > len(roi_bgs.shape):
                    roi_bgs = cv2.cvtColor(roi_bgs, cv2.COLOR_GRAY2BGR)
                else:
                    roi_fgs = cv2.cvtColor(roi_fgs, cv2.COLOR_GRAY2BGR)
                    
            dsts = cv2.add(roi_bgs, roi_fgs)
            
            # Apply blur effect to the rest of the image
            top = img[0:y, 0:resizewidth]
            bottom = img[y+h:resizeheight, 0:resizewidth]
            midleft = img[y:y+h, 0:x]
            midright = img[y:y+h, x+w:resizewidth]
            blurvalue = 5
            top = cv2.GaussianBlur(top, (blurvalue, blurvalue), 0)
            bottom = cv2.GaussianBlur(bottom, (blurvalue, blurvalue), 0)
            midright = cv2.GaussianBlur(midright, (blurvalue, blurvalue), 0)
            midleft = cv2.GaussianBlur(midleft, (blurvalue, blurvalue), 0)
            img[0:y, 0:resizewidth] = top
            img[y+h:resizeheight, 0:resizewidth] = bottom
            img[y:y+h, 0:x] = midleft
            img[y:y+h, x+w:resizewidth] = midright
            img[y1:y2, x1:x2] = dsts

            # Shirt processing
            shirtWidth = 3 * w
            shirtHeight = shirtWidth * origshirtHeight / origshirtWidth
            
            x1s = x - w
            x2s = x1s + 3*w
            y1s = y + h
            y2s = y1s + h*4
            
            # Boundary checks
            if x1s < 0:
                x1s = 0
            if x2s > img.shape[1]:
                x2s = img.shape[1]
            if y2s > img.shape[0]:
                y2s = img.shape[0]
                
            temp = 0
            if y1s > y2s:
                temp = y1s
                y1s = y2s
                y2s = temp
                
            shirtWidth = int(abs(x2s - x1s))
            shirtHeight = int(abs(y2s - y1s))
            y1s = int(y1s)
            y2s = int(y2s)
            x1s = int(x1s)
            x2s = int(x2s)
            
            shirt = cv2.resize(imgshirt, (shirtWidth, shirtHeight), interpolation=cv2.INTER_AREA)
            mask = cv2.resize(orig_masks, (shirtWidth, shirtHeight), interpolation=cv2.INTER_AREA)
            masks_inv = cv2.resize(orig_masks_inv, (shirtWidth, shirtHeight), interpolation=cv2.INTER_AREA)
            
            rois = img[y1s:y2s, x1s:x2s]
            
            # Ensure masks_inv is the right size and type
            if masks_inv.shape[:2] != rois.shape[:2]:
                masks_inv = cv2.resize(masks_inv, (rois.shape[1], rois.shape[0]), interpolation=cv2.INTER_AREA)
            if len(masks_inv.shape) > 2:
                masks_inv = cv2.cvtColor(masks_inv, cv2.COLOR_BGR2GRAY)
                
            roi_bgs = cv2.bitwise_and(rois, rois, mask=masks_inv)
            
            # Ensure mask is the right size and type
            if mask.shape[:2] != shirt.shape[:2]:
                mask = cv2.resize(mask, (shirt.shape[1], shirt.shape[0]), interpolation=cv2.INTER_AREA)
            if len(mask.shape) > 2:
                mask = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
                
            roi_fgs = cv2.bitwise_and(shirt, shirt, mask=mask)
            
            # Ensure roi_fgs and roi_bgs have the same shape and channels
            if roi_fgs.shape != roi_bgs.shape:
                roi_fgs = cv2.resize(roi_fgs, (roi_bgs.shape[1], roi_bgs.shape[0]), interpolation=cv2.INTER_AREA)
                
            # Make sure they have the same number of channels
            if len(roi_fgs.shape) != len(roi_bgs.shape):
                if len(roi_fgs.shape) > len(roi_bgs.shape):
                    roi_bgs = cv2.cvtColor(roi_bgs, cv2.COLOR_GRAY2BGR)
                else:
                    roi_fgs = cv2.cvtColor(roi_fgs, cv2.COLOR_GRAY2BGR)
                    
            dsts = cv2.add(roi_bgs, roi_fgs)
            img[y1s:y2s, x1s:x2s] = dsts
            
            break
            
        # cv2.imshow("img", img)
        # if cv2.waitKey(100) == ord('q'):
        #     break
        
        # For web server safety, we'll break after one frame or a timeout
        # instead of a blocking GUI loop.
        break

    cap.release()
    # cv2.destroyAllWindows()

    # Redirect back to the React app
    return redirect('/')

# Add API endpoint for compatibility with React frontend
@app.route('/api/predict', methods=['GET','POST'])
def api_predict():
    return predict()

# API endpoint for skin tone analysis
@app.route('/api/skin-tone-analysis', methods=['POST'])
def skin_tone_analysis():
    """
    Analyze skin tone using the SkinToneClassifier library
    Expects multiple image file uploads named 'images' (up to 5)
    """
    tone_category = 'Medium'
    if not SKIN_TONE_AVAILABLE:
        return jsonify({'success': False, 'error': 'SkinToneClassifier library is not installed on the server'}), 500
        
    if 'images' not in request.files and 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image files provided'}), 400
        
    # Support both 'images' and legacy 'image'
    files = request.files.getlist('images') if 'images' in request.files else request.files.getlist('image')
    
    # Filter valid files and limit to 5
    valid_files = [f for f in files if f.filename != '' and allowed_file(f.filename)][:5]
    
    if not valid_files:
        return jsonify({'success': False, 'error': 'No valid image files selected'}), 400
    
    saved_filepaths = []
    try:
        total_brightness = 0
        total_r = 0
        total_g = 0
        total_b = 0
        valid_faces = 0
        
        best_report_image_url = None
        dominant_colors_pool = []
        
        # Process each uploaded image
        for idx, file in enumerate(valid_files):
            filename = secure_filename(f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}")
            filepath = os.path.join(app.root_path, USER_UPLOADS_DIR, filename)
            file.save(filepath)
            saved_filepaths.append(filepath)
            
            try:
                result = SkinToneClassifier.analyze(
                    filepath,
                    tone_palette="perla",
                    n_dominant_colors=3,
                    return_report_image=(idx == 0) # Only generate report image for the first valid face
                )
                
                if 'faces' in result and result['faces']:
                    face = result['faces'][0]
                    valid_faces += 1
                    
                    if 'skin_tone' in face:
                        skin_tone_hex = face['skin_tone']
                        r = int(skin_tone_hex[1:3], 16)
                        g = int(skin_tone_hex[3:5], 16)
                        b = int(skin_tone_hex[5:7], 16)
                        
                        total_r += r
                        total_g += g
                        total_b += b
                        total_brightness += (r + g + b) / 3
                        
                    if 'dominant_colors' in face:
                        for color_obj in face['dominant_colors']:
                            if 'color' in color_obj:
                                dominant_colors_pool.append(color_obj['color'])
                    
                    # Save report image if we haven't yet and it's generated
                    if best_report_image_url is None and 'report_images' in result and result['report_images']:
                        if isinstance(result['report_images'], dict):
                            report_image = next(iter(result['report_images'].values()))
                        else:
                            report_image = result['report_images'][0]
                            
                        # Encode straight to Base64 to avoid static file proxy/disk complications
                        success, encoded_image = cv2.imencode('.jpg', report_image)
                        if success:
                            b64_string = base64.b64encode(encoded_image).decode('utf-8')
                            best_report_image_url = f"data:image/jpeg;base64,{b64_string}"
                        
            except Exception as e:
                print(f"Error processing image {idx}: {str(e)}")
        
        if valid_faces == 0:
            return jsonify({'success': False, 'error': 'No faces detected across all uploaded images. Please try clearer lighting.'}), 400
            
        # Aggregate results
        avg_brightness = total_brightness / valid_faces
        
        # Deduplicate and pick top 3 colors
        unique_colors = list(dict.fromkeys(dominant_colors_pool))
        while len(unique_colors) < 3:
            unique_colors.append('#E6B76D')
        top_colors = unique_colors[:3]
        
        seasonal_colors = {
            'Very Light': {
                'season': 'Summer',
                'colors': ['#7EC8E3', '#BFD3C1', '#89CFF0', '#F4C2C2', '#FAF0E6'],
                'description': 'Your skin has cool undertones with very light depth. Colors that complement your tone include pastels, soft blues, and light pinks. Analysis powered by SkinToneClassifier AI framework.'
            },
            'Light': {
                'season': 'Spring',
                'colors': ['#FFDB58', '#98FB98', '#87CEFA', '#F08080', '#FFDAB9'],
                'description': 'Your skin has warm undertones with light depth. Colors that complement your tone include warm yellows, light greens, and coral shades. Analysis powered by SkinToneClassifier AI framework.'
            },
            'Medium Light': {
                'season': 'Spring',
                'colors': ['#FFD700', '#90EE90', '#00BFFF', '#FF6347', '#FFDEAD'],
                'description': 'Your skin has warm undertones with medium light depth. Colors that complement your tone include golden yellows, bright greens, and coral reds. Analysis powered by SkinToneClassifier AI framework.'
            },
            'Medium': {
                'season': 'Autumn',
                'colors': ['#8B5A2B', '#F4A460', '#CD853F', '#006400', '#FF7F50'],
                'description': 'Your skin has warm undertones with medium depth. Colors that complement your tone include earth tones, warm greens, and coral shades. Analysis powered by SkinToneClassifier AI framework.'
            },
            'Medium Dark': {
                'season': 'Autumn',
                'colors': ['#B8860B', '#A0522D', '#556B2F', '#8B0000', '#D2691E'],
                'description': 'Your skin has warm undertones with medium dark depth. Colors that complement your tone include rich golds, olive greens, and brick reds. Analysis powered by SkinToneClassifier AI framework.'
            },
            'Dark': {
                'season': 'Winter',
                'colors': ['#4B0082', '#800000', '#008000', '#000080', '#FF0000'],
                'description': 'Your skin has cool undertones with dark depth. Colors that complement your tone include royal purples, deep reds, and forest greens. Analysis powered by SkinToneClassifier AI framework.'
            },
            'Very Dark': {
                'season': 'Winter',
                'colors': ['#800080', '#8B0000', '#006400', '#000080', '#FF4500'],
                'description': 'Your skin has cool undertones with very dark depth. Colors that complement your tone include bold purples, rich reds, and deep blues. Analysis powered by SkinToneClassifier AI framework.'
            }
        }
        
        # Map brightness to tone categories
        if avg_brightness > 220:
            tone_category = 'Very Light'
        elif avg_brightness > 190:
            tone_category = 'Light'
        elif avg_brightness > 160:
            tone_category = 'Medium Light'
        elif avg_brightness > 130:
            tone_category = 'Medium'
        elif avg_brightness > 100:
            tone_category = 'Medium Dark'
        elif avg_brightness > 70:
            tone_category = 'Dark'
        else:
            tone_category = 'Very Dark'
            
        season_data = seasonal_colors.get(tone_category, seasonal_colors['Medium'])
        
        # Determine aggregate face color for fallback report
        aggregate_hex = '#%02x%02x%02x' % (int(total_r/valid_faces), int(total_g/valid_faces), int(total_b/valid_faces))
        
        if best_report_image_url is None:
            # Fallback report if no images were returned
            fallback_report = np.ones((400, 600, 3), dtype=np.uint8) * 255
            cv2.putText(fallback_report, f"Skin Tone: {tone_category}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
            cv2.putText(fallback_report, f"Aggregate samples: {valid_faces}", (50, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)
            
            for i, color in enumerate(top_colors):
                r_c = int(color[1:3], 16)
                g_c = int(color[3:5], 16)
                b_c = int(color[5:7], 16)
                cv2.rectangle(fallback_report, (50 + i*100, 120), (130 + i*100, 200), (b_c, g_c, r_c), -1)
                
            success, encoded_fallback = cv2.imencode('.jpg', fallback_report)
            if success:
                b64_string = base64.b64encode(encoded_fallback).decode('utf-8')
                best_report_image_url = f"data:image/jpeg;base64,{b64_string}"
        
        return jsonify({
            'success': True,
            'tone': tone_category,
            'season': season_data['season'],
            'colors': top_colors,
            'description': season_data['description'],
            'recommendedColors': season_data['colors'],
            'reportImage': best_report_image_url,
            'photos_analyzed': valid_faces
        })
        
    except Exception as e:
        print(f"Error in multi-image skin tone analysis: {str(e)}")
        fallback_data = {
            'success': True,
            'tone': 'Medium',
            'season': 'Autumn',
            'colors': ['#E6B76D', '#D99559', '#C27A46'],
            'description': 'Analysis fell back to defaults due to an error. Your skin appears to have warm undertones with medium depth. Colors that complement warm medium tones include earth tones, warm greens, and coral shades.',
            'recommendedColors': ['#8B5A2B', '#F4A460', '#CD853F', '#006400', '#FF7F50'],
            'reportImage': '/static/assets/fallback_report.jpg'
        }
        return jsonify(fallback_data)
    finally:
        for p in saved_filepaths:
            if os.path.exists(p):
                try: os.remove(p)
                except: pass

# ============================================================
# AI STYLIST CO-PILOT ENDPOINT
# ============================================================

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '').strip()
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# System prompt that primes SWYF's AI Stylist persona
SWYF_STYLIST_SYSTEM_PROMPT = """You are SWYF's AI Stylist Co-Pilot — an expert personal fashion advisor powered by advanced chromatic pigment analysis and seasonal color theory.

You have deep expertise in:
- Seasonal Color Theory (Spring, Summer, Autumn, Winter archetypes)
- Color Harmonics and outfit coordination
- Fashion psychology and dressing for occasions
- Skin undertone-based garment and accessory selection
- Gender-appropriate styling and silhouette advice (Masculine, Feminine, or Neutral)
- Body proportion styling and silhouette advice
- Fabric textures and their visual effects

Your personality is: Warm, confident, fashion-forward, and encouraging. You give specific, actionable advice — not vague generalities. You reference color theory concepts naturally.

**STRICT ROLE INSTRUCTIONS**:
1. You ONLY answer questions related to fashion, styling, clothing, seasonal color theory, and personal aesthetics.
2. If the user asks something UNRELATED to fashion (e.g., math, coding, general facts, jokes), you MUST politely refuse by saying: "I'm specialized in fashion styling and chromatic analysis, so I'm afraid I can't help with that. But I'd love to help you build the perfect outfit for your skin tone!"
3. When a user provides their skin tone data, you MUST use it to give HIGHLY personalized recommendations.
4. You MUST STRICTLY ADHERE to the user's styling preference (Masculine, Feminine, or Neutral). If a user has a Masculine preference, do NOT suggest skirts, blouses, or dresses unless explicitly asked.
5. When asked for outfit suggestions, always give 3 specific options with color combinations.
6. Keep responses concise but impactful — ideally 3-5 sentences or a small list. Use emojis sparingly for warmth.

Context: You are embedded in the SWYF (See What You Fit) platform — an AI-powered virtual fashion try-on experience.
"""

@app.route('/api/chat', methods=['POST'])
def ai_stylist_chat():
    """
    AI Stylist Co-Pilot endpoint.
    Accepts: { messages: [...], skin_tone_context: {...} }
    Returns: { success: bool, reply: str }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        user_messages = data.get('messages', [])
        skin_tone_context = data.get('skin_tone_context', None)

        if not user_messages:
            return jsonify({'success': False, 'error': 'No messages provided'}), 400

        # Build the system prompt with skin tone context if available
        system_prompt = SWYF_STYLIST_SYSTEM_PROMPT
        gender = 'Not Specified'
        
        if skin_tone_context:
            tone = skin_tone_context.get('tone', 'Unknown')
            season = skin_tone_context.get('season', 'Unknown')
            description = skin_tone_context.get('description', '')
            gender = skin_tone_context.get('gender', 'feminine') # Default to feminine for legacy, but UI now provides it
            recommended_colors = skin_tone_context.get('recommendedColors', [])
            colors_str = ', '.join(recommended_colors) if recommended_colors else 'Not analyzed'

            system_prompt += f"""

USER'S PROFILE (from SWYF Chromatic Analysis Engine):
- Skin Tone Category: {tone}
- Seasonal Color Archetype: {season}
- Styling Preference: {gender.capitalize()}
- Chromatic Profile: {description}
- Recommended Color Palette: {colors_str}

Always reference this profile when giving style advice. Adhere STRICTLY to the {gender} styling preference. Address them by their seasonal archetype (e.g., "As an Autumn type...").
"""

        try:
            groq_key = os.environ.get('GROQ_API_KEY', '').strip()
            if not groq_key:
                return jsonify({
                    'success': True,
                    'reply': "AI Stylist is not configured yet. Add GROQ_API_KEY on the server to enable live styling chat.",
                    'source': 'missing_api_key'
                })

            groq_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "assistant", "content": f"Understood! I'm your SWYF AI Stylist Co-Pilot. I have your chromatic profile and {gender} styling preference loaded. I'm ready to give you personalized fashion advice. What would you like to know? ✨"}
            ]
            for msg in user_messages:
                role = "user" if msg.get('role') == 'user' else "assistant"
                groq_messages.append({"role": role, "content": msg.get('content', '')})
                
            groq_response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": groq_messages,
                    "temperature": 0.8,
                    "max_tokens": 512
                },
                timeout=30
            )
            
            if groq_response.status_code == 200:
                groq_data = groq_response.json()
                reply_text = groq_data['choices'][0]['message']['content']
                return jsonify({'success': True, 'reply': reply_text, 'source': 'groq'})
            else:
                print(f"Groq API failed with {groq_response.status_code}: {groq_response.text}")
                error_msg = "It seems my fashion brain is hitting a limit. Check the server logs for the exact error!"
                return jsonify({
                    'success': True, 
                    'reply': f"⚠️ **AI Stylist Connection Issue** ⚠️\n\n{error_msg}", 
                    'source': 'api_error'
                })
                
        except Exception as groq_err:
            print(f"Chat API exception: {str(groq_err)}")
            return jsonify({'success': False, 'error': str(groq_err)}), 500


    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'AI service timed out. Please try again.'}), 504
    except Exception as e:
        print(f"Error in AI chat endpoint: {str(e)}")
        return jsonify({'success': False, 'error': f'AI service error: {str(e)}'}), 500


def generate_fallback_reply(user_message: str, skin_context: dict) -> str:
    """
    Standard static response when the AI is not reachable.
    """
    return "I'm sorry, I'm having trouble connecting to my AI brain right now. I'm specialized in fashion styling and chromatic analysis, but I need an active connection to help you out! Please check your API key and Internet connection."


# ── Auth: local profile storage ──────────────────────────────────────
AUTH_FILE = os.path.join(os.path.dirname(__file__), 'users.json')

def _load_users():
    if os.path.exists(AUTH_FILE):
        with open(AUTH_FILE, 'r') as f:
            return json.load(f)
    return {}

def _save_users(users):
    with open(AUTH_FILE, 'w') as f:
        json.dump(users, f, indent=2)


@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Register a new user (vendor or admin). Profiles are stored in users.json."""
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'vendor')  # 'vendor' or 'admin'

    if not name or not email or not password:
        return jsonify({'success': False, 'error': 'Name, email and password are required.'}), 400

    users = _load_users()
    if email in users:
        return jsonify({'success': False, 'error': 'An account with this email already exists.'}), 409

    user_id = str(uuid.uuid4())[:8]
    users[email] = {
        'id': user_id,
        'name': name,
        'email': email,
        'password': password,  # plain text for demo only
        'role': role,
        'created_at': datetime.now().isoformat(),
    }
    _save_users(users)

    profile = {k: v for k, v in users[email].items() if k != 'password'}
    return jsonify({'success': True, 'user': profile}), 201


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Login with email + password. Returns user profile on success."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    users = _load_users()
    user = users.get(email)
    if not user or user['password'] != password:
        return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

    profile = {k: v for k, v in user.items() if k != 'password'}
    return jsonify({'success': True, 'user': profile}), 200


@app.route('/api/auth/profile', methods=['GET'])
def auth_profile():
    """Get user profile by email (query param)."""
    email = request.args.get('email', '').strip().lower()
    users = _load_users()
    user = users.get(email)
    if not user:
        return jsonify({'success': False, 'error': 'User not found.'}), 404
    profile = {k: v for k, v in user.items() if k != 'password'}
    return jsonify({'success': True, 'user': profile}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
