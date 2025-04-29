# Save this as fix_routes_package.py
import os

def fix_routes_package():
    # Create routes directory if it doesn't exist
    if not os.path.exists('routes'):
        os.makedirs('routes')
        print("Created 'routes' directory")
    
    # Create __init__.py file
    init_file = os.path.join('routes', '__init__.py')
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write('# Routes package')
        print("Created '__init__.py' file in routes directory")
    
    # Create visualization_routes.py file
    vis_routes_file = os.path.join('routes', 'visualization_routes.py')
    if not os.path.exists(vis_routes_file):
        with open(vis_routes_file, 'w') as f:
            f.write('''# Visualization routes
from visualization_fix import fix_visualization_routes

def register_visualization_routes(app):
    """Register visualization routes with the Flask app"""
    fix_visualization_routes(app)
''')
        print("Created 'visualization_routes.py' file in routes directory")
    
    print("\nRoutes package setup complete. Now you should be able to import from routes.visualization_routes")

if __name__ == "__main__":
    fix_routes_package()